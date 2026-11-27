// 전체 화면 점검에서 찾은 버그·개선(2026-11-26 BUG-007~BUG-011·IMP-015~IMP-018, 2026-11-27 BUG-012~BUG-017·IMP-019~IMP-025)이 되돌아가지 않는지 검사한다.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { EN, STORED_DEFAULTS_EN, UNITS_EN, UNITS_EN_ONE } from '../src/features/i18n/dictionary.mjs'
import { listFailed, listLoading, listPending } from '../src/features/records/listLoadState.mjs'

const read = (file) => readFileSync(new URL('../src/' + file, import.meta.url), 'utf8')
const store = (mode, state) => ({ mode: { value: mode }, state: { loaded: false, loading: false, error: null, ...state } })

test('BUG-007 목록 상태: 로그인 상태에서 아직 받지 못한 목록만 불러오는 중·실패로 본다', () => {
  assert.equal(listLoading(store('server', { loading: true })), true)
  assert.equal(listFailed(store('server', { error: new Error('x') })), true)
  assert.equal(listFailed(store('server', { loading: true, error: new Error('x') })), false)
  assert.equal(listPending(store('server', { loaded: true, error: new Error('x') })), false)
  assert.equal(listPending(store('local', { error: new Error('x') })), false)
  assert.equal(listPending(store('server', {})), false)
})

test('BUG-007 화면: D-Day·D-Day 관리·메모·다이어리·머니로그가 불러오기 실패를 알리고, 그동안 빈 목록 문구를 숨긴다', () => {
  const screens = [
    ['views/home/DdayView.vue', 'ddayStore'],
    ['views/events/DdayManageView.vue', 'ddayStore'],
    ['views/memo/MemoInboxView.vue', 'memoStore'],
    ['views/diary/DiaryListView.vue', 'diaryStore'],
    ['views/money/MoneyLogView.vue', 'moneyStore'],
  ]
  for (const [file, name] of screens) {
    const source = read(file)
    const used = [...source.matchAll(new RegExp(`<ListLoadState :store="${name}" loading="([^"]+)" failed="([^"]+)" />`, 'g'))]
    assert.ok(used.length > 0, file)
    for (const [, loading, failed] of used) {
      assert.ok(loading in EN, loading)
      assert.ok(failed in EN, failed)
    }
    assert.match(source, new RegExp(`!listPending\\(${name}\\)`), file)
  }
  assert.ok('다시 시도' in EN)
})

test('BUG-008 업무 히스토리의 고정 예시 값에 시연 표시가 있다', () => {
  const source = read('views/work/WorkHistoryView.vue')
  const label = source.match(/<p class="sample-label">\{\{ tr\('([^']+)'\) \}\}<\/p>/)
  assert.ok(label, '시연 표시가 있어야 한다')
  assert.match(label[1], /시연용 예시/)
  assert.ok(label[1] in EN)
})

test('BUG-009 입력칸 7곳에 이름(aria-label)이 있다', () => {
  const checks = [
    ['views/work/LaborReportView.vue', ["'{name} 인원'", "'{name} 기간(일)'", "'{name} 투입률'", "'{name} 실제 MD'"]],
    ['views/work/WbsView.vue', ["'{name} 공수(MD)'"]],
    ['views/money/MoneyLogView.vue', ["'조회할 달'"]],
    ['views/auth/PasswordResetView.vue', ["'이메일 주소'"]],
    ['views/diary/DiaryEntryView.vue', ["'태그 추가'"]],
    ['views/settings/SettingsWidgetsView.vue', ["'위젯 검색'"]],
    ['views/ScreenDirectory.vue', ["'화면 검색'"]],
  ]
  for (const [file, names] of checks) {
    const source = read(file)
    for (const name of names) {
      assert.ok(source.includes(`:aria-label="tr(${name}`), file + ' ' + name)
      assert.ok(name.slice(1, -1) in EN, name)
    }
  }
  assert.doesNotMatch(read('views/work/LaborReportView.vue'), /<input class="labor-input"(?![^>]*aria-label)[^>]*>/)
})

test('BUG-010 글양식 설정 스위치가 켜짐·꺼짐을 role="switch"와 aria-checked로 알린다', () => {
  const source = read('views/settings/SettingsFormStyleView.vue')
  assert.match(source, /class="switch"\s+role="switch"\s+:aria-checked="f\.locked \|\| isOn\(editingDomain, f\.key\) \? 'true' : 'false'"/)
})

test('BUG-011 약관 뷰어의 뒤로 가기는 이름 있는 버튼이다', () => {
  const source = read('views/legal/LegalViewerView.vue')
  assert.match(source, /<button type="button" class="icon" :aria-label="tr\('뒤로 가기'\)" :title="tr\('뒤로 가기'\)" @click="close">←<\/button>/)
  assert.doesNotMatch(source, /<span[^>]*@click="router\.back\(\)"/)
  assert.ok('뒤로 가기' in EN)
})

test('IMP-015 소셜 연동 "G" 글자는 기본 글자색 토큰을 쓴다', () => {
  const source = read('views/auth/SocialLoginView.vue')
  assert.doesNotMatch(source, /#[0-9a-fA-F]{6}/)
  assert.match(source, /color: var\(--color-foreground\); font-weight: 700; display: flex; align-items: center; justify-content: center; font-style: normal">G</)
})

test('IMP-016 일정 템플릿·공수 계산의 고정 예시 값에 시연 표시가 있다', () => {
  for (const file of ['views/events/EventTemplatesView.vue', 'views/work/LaborReportView.vue']) {
    const label = read(file).match(/<p class="sample-label">\{\{ tr\('([^']+)'\) \}\}<\/p>/)
    assert.ok(label, file)
    assert.match(label[1], /시연용 예시/)
    assert.match(label[1], /저장되지 않아/)
    assert.ok(label[1] in EN, label[1])
  }
})

test('IMP-017 캔버스 열 이름과 루틴 단위 "회"는 처음 값일 때만 화면에서 번역한다', () => {
  assert.deepEqual(Object.keys(STORED_DEFAULTS_EN), ['할 일', '진행중', '검토', '완료'])
  assert.equal(UNITS_EN['회'], ' times')
  assert.equal(UNITS_EN_ONE['회'], ' time')
  const locale = read('store/locale.js')
  assert.match(locale, /export const storedDefault = \(value\) => \(bodyLocale\.value === 'ko' \? value : STORED_DEFAULTS_EN\[value\] \?\? value\)/)
  const canvas = read('views/planner/ProjectCanvasView.vue')
  assert.doesNotMatch(canvas, /\{\{ col\.title \}\}/)
  assert.match(canvas, /\{\{ storedDefault\(col\.title\) \}\}/)
  assert.match(canvas, /:value="c\.id">\{\{ storedDefault\(c\.title\) \}\}<\/option>/)
  assert.match(canvas, /<input :value="storedDefault\(col\.title\)" @change="renameColumn\(col\.id, \$event\.target\.value\)" \/>/)
  // 저장값은 바꾸지 않는다: 처음 값은 한국어 그대로다
  assert.match(read('store/canvas.js'), /\{ id: 'todo', title: '할 일', wip: 0 \}/)
  const routine = read('views/routines/RoutineListView.vue')
  assert.match(routine, /u === '회' \? count \+ unit\('회', Number\(count\)\) : count \+ u/)
  assert.doesNotMatch(routine, /\{\{ r\.goal\?\.count \}\}\{\{ r\.goal\?\.unit \}\}/)
  assert.match(routine, /goalUnit: '회'/)
})

test('IMP-018 점검 안내에 "공지 자세히 보기" 버튼이 없다', () => {
  const source = read('views/system/MaintenanceView.vue')
  assert.doesNotMatch(source, /공지 자세히 보기/)
  assert.doesNotMatch(source, /useRouter|router\./)
})

test('BUG-012 문장 속 RouterLink는 .inline-link로 accent 색을 쓰고, 화면 카드는 글자색 토큰을 쓴다', () => {
  const css = read('styles.css')
  // 전역 규칙은 그대로 둔다. 넓히면 class=""인 탭·태그 링크까지 accent로 바뀐다
  assert.match(css, /\na:not\(\[class\]\)\{color:var\(--color-accent\)/)
  assert.match(css, /\.screen-card\{[^}]*color:var\(--color-foreground\)/)
  assert.match(read('design-system/components.css'), /\.inline-link \{ color: var\(--color-accent\)/)
  const links = [
    ['components/DayRecords.vue', 2], ['views/admin/AdminSettingsView.vue', 2], ['components/LinkedRecords.vue', 2],
    ['views/focus/FocusView.vue', 1], ['views/tasks/TaskDetailView.vue', 1], ['views/events/EventListView.vue', 1],
  ]
  for (const [file, n] of links) assert.equal([...read(file).matchAll(/<(?:RouterLink|router-link)[^>]*class="inline-link"/g)].length, n, file)
})

test('BUG-013 사용자·관리자 화면 맨 앞에 본문 바로가기가 있고 본문으로 초점을 옮긴다', () => {
  for (const file of ['App.vue', 'AdminApp.vue']) {
    const source = read(file)
    assert.ok(source.indexOf('class="skip-link"') < source.indexOf('<aside'), file)
    assert.match(source, /<main id="main-content" tabindex="-1"/, file)
    assert.match(source, /const skipToMain = \(\) => document\.getElementById\('main-content'\)\?\.focus\(\)/, file)
    assert.match(source, /href="#main-content"[^>]*@click\.prevent="skipToMain"/, file)
  }
  assert.match(read('styles.css'), /\.skip-link:focus\{transform:none\}/)
  assert.equal(EN['본문 바로가기'], 'Skip to main content')
})

test('BUG-014 서버 인증 오류 문구가 영어 사전에 있다', () => {
  for (const ko of ['이메일 또는 비밀번호가 올바르지 않습니다.', '이미 가입된 이메일입니다.', '로그인 시도가 너무 많아 잠시 후 다시 시도해주세요.', '비밀번호는 8~72자여야 합니다.', '접근 권한이 없습니다.']) assert.ok(ko in EN, ko)
  assert.match(read('views/auth/LoginView.vue'), /\{\{ tr\(notice\) \}\}/)
  assert.match(read('features/auth/views/SignupView.vue'), /\{\{ tr\(serverError\) \}\}/)
})

test('IMP-019 메모 카드에서 수정 창을 열고, 저장은 version을 담아 고치고 삭제는 확인 뒤 지운다', () => {
  const source = read('views/memo/MemoInboxView.vue')
  assert.match(source, /class="memo-open"[^>]*@click="openEdit\(m\)"/)
  assert.match(source, /memoStore\.update\(editing\.value, \{ title: editDraft\.value\.title\.trim\(\), body: editDraft\.value\.body \}\)/)
  assert.match(source, /window\.confirm\(tr\('‘\{title\}’ 메모를 삭제할까요\?'/)
  assert.match(source, /memoStore\.remove\(editing\.value\)/)
  assert.match(source, /<ConflictCompare v-if="conflict"/)
  for (const key of ['메모 수정', '‘{title}’ 메모 수정', '‘{title}’ 메모를 삭제할까요?', '메모 저장']) assert.ok(key in EN, key)
})

test('IMP-021 관리자 버튼은 /api/auth/me의 역할로 정하고 실패하면 숨긴다', async () => {
  const { checkAdminRole } = await import('../src/features/admin/adminClient.mjs')
  const calls = []
  const reply = (value) => async (path) => { calls.push(path); if (value instanceof Error) throw value; return value }
  assert.equal(await checkAdminRole(reply({ role: 'ADMIN' }), true), true)
  assert.equal(await checkAdminRole(reply({ role: 'USER' }), true), false)
  assert.equal(await checkAdminRole(reply(Object.assign(new Error('x'), { status: 401 })), true), false)
  assert.equal(await checkAdminRole(reply({ role: 'ADMIN' }), false), false)
  assert.deepEqual(calls, ['/api/auth/me', '/api/auth/me', '/api/auth/me'])
  // 연결 실패·서버 오류는 확인하지 못한 것(null)이라 다음 화면 이동 때 다시 묻는다
  assert.equal(await checkAdminRole(reply(new TypeError('Failed to fetch')), true), null)
  assert.equal(await checkAdminRole(reply(Object.assign(new Error('x'), { status: 503 })), true), null)
  const admin = read('features/admin/admin.js')
  assert.match(admin, /adminButton\.visible = result === true\n  if \(result === null\) roleFor = undefined/)
  assert.match(read('App.vue'), /watch\(\[\(\) => session\.userId, \(\) => route\.path\], \(\[id\]\) => refreshAdminButton\(id\)/)
})

test('IMP-022 알림 설정에 없는 LMS 대체 발송을 사실처럼 적지 않는다', () => {
  assert.doesNotMatch(read('views/settings/SettingsNotificationsView.vue'), /LMS/)
})

test('BUG-015 서버가 세션을 끝내면(갱신 실패) 안내를 켜고, 다시 로그인하면 끈다. 사용자가 로그아웃하면 켜지 않는다', () => {
  const session = read('features/auth/session.js')
  assert.match(session, /export const sessionNotice = reactive\(\{ ended: false \}\)/)
  assert.match(session, /\.catch\(\(\) => \{ if \(session\.refreshToken === original\) \{ clearSession\(\); sessionNotice\.ended = true \} return false \}\)/)
  assert.match(session, /if \(userId\) sessionNotice\.ended = false/)
  assert.doesNotMatch(session.match(/export async function logout[\s\S]*?\n\}/)?.[0] ?? '', /sessionNotice/)
  const app = read('App.vue')
  assert.match(app, /v-if="sessionNotice\.ended && !session\.userId" class="callout session-ended" role="alert"/)
  assert.match(read('views/auth/LoginView.vue'), /v-if="sessionNotice\.ended"/)
  assert.ok('로그인이 끝났어요. 지금 보이는 기록은 이 브라우저에 있는 것이에요. 계정 기록을 보려면 다시 로그인해 주세요.' in EN)
})

test('BUG-016 사용자·관리자 화면 모두 화면 이름을 탭 제목에 붙인다', () => {
  assert.match(read('App.vue'), /document\.title = pageName\.value \? `\$\{pageName\.value\} · Timebar Diary`/)
  assert.match(read('AdminApp.vue'), /document\.title = `\$\{adminAccess\.state === 'allowed' && route\.name \? tr\(route\.name\) : tr\('관리자 화면'\)\} · Timebar Diary`/)
})

test('BUG-017 미리보기 시험은 의존성 탐색을 꺼서 vite.close()가 멈추지 않는다', () => {
  assert.match(readFileSync(new URL('./device-preview.test.mjs', import.meta.url), 'utf8'), /optimizeDeps: \{ noDiscovery: true, include: \[\] \}/)
})

test('IMP-023 앱 셸 밖 화면도 main 안에 있고, 안내 화면 3곳은 h1, 떠 있는 채팅 창 제목은 다른 화면 위에서 h2다', () => {
  const app = read('App.vue')
  assert.match(app, /<main v-if="isBare" class="bare-main"><router-view \/><\/main>/)
  const css = read('styles.css')
  assert.match(css, /main\.bare-main\{width:auto;height:auto;padding:0;margin:0;overflow:visible;flex:none\}/)
  assert.match(css, /main:not\(\.chat-shell,\.bare-main\)>\*\{max-width:var\(--content-max\)/)
  // 앱 셸 밖 화면에 main이 둘이 되지 않게 공개 포트폴리오는 div로 바꿨다
  assert.doesNotMatch(read('views/share/PublicPortfolioView.vue'), /<main/)
  assert.match(read('views/system/MaintenanceView.vue'), /<h1 class="heading-title-lg">/)
  assert.match(read('views/system/PermissionRequestView.vue'), /<h1 class="heading-title-lg"/)
  assert.match(read('views/auth/PasswordResetView.vue'), /<h1 class="heading-title-md">/)
  assert.match(read('features/chat/views/ChatWorkspace.vue'), /:is="embedded && route\.path !== '\/chat' \? 'h2' : 'h1'" class="chat-title"/)
  assert.match(read('features/chat/styles/chat.css'), /\.chat-page-head :is\(h1, \.chat-title\) \{ font-size: var\(--type-display-size\)/)
})

test('IMP-024 작은 아이콘 버튼은 44×44, 한 줄 글자 버튼은 높이 44로 누르는 영역만 넓히고, 검색칸 지우기·캔버스 이동 버튼은 넓히지 않는다', () => {
  const css = read('styles.css')
  assert.ok(css.includes('.person-info:not(.list-search > .person-info, .kanban-card-move > .person-info)::after{content:"";position:absolute;left:50%;top:50%;width:44px;height:44px;transform:translate(-50%,-50%)}'))
  assert.ok(css.includes(':is(.chat-inbox-actions :is(a,button),.wbs-caret,.head>button:not([class]),.wiki-crumb,label.start-apply)::after{content:"";position:absolute;left:0;right:0;top:50%;height:max(100%,44px);transform:translateY(-50%)}'))
})

test('IMP-025 앱 셸 창은 화면이 바뀌면 쓴 내용이 없을 때만 닫고, 주소로 여는 창은 주소를 옮긴 뒤 연다', () => {
  const composer = read('components/PostComposer.vue')
  assert.match(composer, /const pristine = JSON\.stringify\(drafts\)/)
  assert.match(composer, /watch\(\(\) => route\.path, \(\) => \{ if \(JSON\.stringify\(drafts\) === pristine\) composer\.value = false \}\)/)
  assert.match(read('components/CommunityCreateModal.vue'), /watch\(\(\) => route\.path, \(\) => \{ if \(JSON\.stringify\(draft\.value\) === pristine\) emit\('close'\) \}\)/)
  assert.match(read('components/ProfileModal.vue'), /watch\(\(\) => route\.path, \(\) => \{ if \(profileModal\.open\) closeProfile\(\) \}\)/)
  assert.match(read('views/community/CommunityCreateView.vue'), /await router\.replace\('\/community'\); communityComposer\.value = true/)
  assert.match(read('views/address/ProfileCardView.vue'), /await router\.replace\('\/address'\)\n  openProfile\('이서연'\)/)
})
