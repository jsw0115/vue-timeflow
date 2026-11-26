// 다국어 사전(PR-32): 화면 코드에서 tr 함수로 부르는 한국어 원문이 모두 영어 사전에 있고, 영어에 한글이 섞이지 않으며, 자리표시 이름이 양쪽에 같은지 검사한다.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { EN } from '../src/features/i18n/dictionary.mjs'
import { translate } from '../src/features/i18n/translate.mjs'
import { TRANSLATED_PATHS, documentLang } from '../src/features/i18n/translatedRoutes.mjs'

const root = new URL('../src/', import.meta.url).pathname
const files = (dir) => readdirSync(dir).flatMap((name) => { const p = join(dir, name); return statSync(p).isDirectory() ? files(p) : /\.(vue|js|mjs)$/.test(name) ? [p] : [] })
const used = new Map()
for (const file of files(root)) {
  const source = readFileSync(file, 'utf8')
  // features/career·planner의 표시 함수는 번역 함수를 t로 받는다(기본값은 한국어 그대로). App.vue 등의 t('키')는 다른 사전이라 이 폴더만 본다
  const pattern = /\/features\/(career|planner|stats)\//.test(file) ? /\b(?:tr|t)\('((?:\\'|[^'])*)'/g : /\btr\('((?:\\'|[^'])*)'/g
  for (const m of source.matchAll(pattern)) used.set(m[1].replaceAll("\\'", "'").replaceAll('\\n', '\n'), file.slice(root.length))
}
const names = (text) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()

test('tr로 부르는 문구는 모두 영어 사전에 있다', () => {
  assert.ok(used.size > 50)
  assert.deepEqual([...used].filter(([ko]) => !(ko in EN)).map(([ko, file]) => `${file}: ${ko}`), [])
})

test('영어에 한글이 없고 자리표시 이름이 같다', () => {
  // 빠른 입력은 한국어 날짜·시간만 읽으므로, 이 두 안내는 영어 문장 안에 한국어 입력 예시를 그대로 보인다
  const koreanExamples = new Set(['일정은 날짜와 시간이 필요해요. "내일 오후 3시"처럼 적거나 자세히 쓰기로 열어 주세요.', '"내일 오후 3시 치과"처럼 적으면 날짜·시간을 찾아 미리 보여 줘요. 확인하고 저장하세요.'])
  assert.deepEqual(Object.entries(EN).filter(([ko, en]) => !en || (/[가-힣]/.test(en) && !koreanExamples.has(ko))).map(([ko]) => ko), [])
  assert.deepEqual(Object.entries(EN).filter(([ko, en]) => names(ko).join() !== names(en).join()).map(([ko]) => ko), [])
})

test('영어가 없으면 한국어 원문, 자리표시를 채운다. 본문까지 옮긴 화면에서만 문서 언어가 en이다', () => {
  assert.equal(translate('없는 문구 {n}', 'en', { n: 2 }), '없는 문구 2')
  assert.equal(translate('전체 {n}', 'en', { n: 3 }), 'All 3')
  assert.equal(translate('전체 {n}', 'ko', { n: 3 }), '전체 3')
  assert.equal(translate(undefined, 'en'), '')
  assert.equal(translate(7, 'en'), '7')
  assert.equal(translate('내 분류 {x}', 'en'), '내 분류 {x}')
  for (const path of TRANSLATED_PATHS) assert.equal(documentLang('en', path), 'en')
  // 환경설정(12단계)·공유·커뮤니티(13단계)는 옮겼다. 아직 옮기지 않은 채팅 화면은 ko다
  assert.equal(documentLang('en', '/settings/env'), 'en')
  assert.equal(documentLang('en', '/share/groups/7'), 'en')
  assert.equal(documentLang('en', '/chat'), 'ko')
  assert.equal(documentLang('en', '/admin/audit'), 'en')
  assert.equal(documentLang('ko', '/career'), 'ko')
})

test('목록에서 이름을 꺼내 tr에 넘기는 값(상태·문서·고용 형태·자기소개서·포트폴리오 항목·공개 범위)도 사전에 있다. 표시 함수는 저장값을 한국어로 둔다', async () => {
  const { ACTIVITY_TYPES, APPLICATION_STATUSES } = await import('../src/features/career/careerModel.mjs')
  const { DOCUMENTS, LANGUAGES, snapshotSections, versionName, versionTitle } = await import('../src/features/career/documentVersions.mjs')
  const { EMPLOYMENT_TYPES, EMPLOYMENT_STATUSES, careerBody, periodLabel } = await import('../src/features/career/careerPeriods.mjs')
  const { COVER_LETTER_SECTIONS } = await import('../src/features/records/resumeStore.mjs')
  const { PORTFOLIO_SECTIONS } = await import('../src/features/career/portfolioItems.mjs')
  const { SCOPES, expiryText } = await import('../src/features/career/portfolioLinks.mjs')
  const en = (ko, vars) => translate(ko, 'en', vars)
  const labels = [...ACTIVITY_TYPES, ...APPLICATION_STATUSES, ...DOCUMENTS, ...EMPLOYMENT_TYPES, ...EMPLOYMENT_STATUSES, ...COVER_LETTER_SECTIONS, ...PORTFOLIO_SECTIONS, ...SCOPES, ...LANGUAGES].map((item) => item.label)
  const descs = SCOPES.map((item) => item.desc)
  assert.deepEqual([...labels, ...descs].filter((ko) => !(ko in EN)), [])
  // 경력·포트폴리오 화면에서 목록·충돌 비교로 tr에 넘기는 이름(화면 파일 안의 배열·store/workPrivacy의 VISIBILITY)
  const docs = readFileSync(new URL('../src/views/work/CareerDocsView.vue', import.meta.url), 'utf8')
  const listed = [...docs.matchAll(/\{ (?:id: '[\w-]+', )?label: '([^']+)'/g)].map((m) => m[1])
  const kinds = docs.match(/PORTFOLIO_KINDS = \[([^\]]+)\]/)[1].match(/'([^']+)'/g).map((k) => k.slice(1, -1))
  const { VISIBILITY } = await import('../src/store/workPrivacy.js')
  assert.ok(listed.length >= 13)
  assert.deepEqual([...listed, ...kinds].filter((ko) => !(ko in EN)), [])
  assert.deepEqual(Object.values(VISIBILITY).flatMap((v) => [v.label, v.desc]).filter((ko) => !(ko in EN)), [])
  assert.equal(expiryText({ expiresAt: '2026-11-28T00:00:00Z' }, Date.parse('2026-11-25T00:00:00Z'), (ko, vars) => translate(ko, 'en', vars)), 'Closes in 3 days')
  assert.equal(expiryText({}), '닫을 때까지 열려 있어요')
  // 플래너(5단계): 보기 이름·실행률 단계·연결 종류·재배치 종류·시간 문구
  const { plannerViews } = await import('../src/store/plannerPreferences.js')
  const { LEVELS, hoursText } = await import('../src/features/planner/executionRate.mjs')
  const { KIND_LABEL } = await import('../src/features/records/recordLinks.mjs')
  const { kindLabel, moveText } = await import('../src/features/planner/reschedule.mjs')
  const planner = [...plannerViews.map((v) => v.label), ...LEVELS, ...Object.values(KIND_LABEL), kindLabel('task'), kindLabel('block')]
  assert.deepEqual(planner.filter((ko) => !(ko in EN)), [])
  assert.equal(hoursText(90, en), '1 h 30 min')
  assert.equal(hoursText(90), '1시간 30분')
  assert.equal(moveText({ kind: 'task', before: { dueTime: '10:00' }, after: { dueTime: '10:30' } }, en), 'Due 10:00 → 10:30')
  // 기록(6단계): 글 종류·기분·알림 시점·업무 유형·위키 공간·작성 창 분류, 입력 검사 문구
  // postComposer.js는 브라우저 저장소를 불러와 Node에서 직접 읽지 못하므로 소스에서 목록을 꺼낸다
  const postKinds = readFileSync(new URL('../src/store/postComposer.js', import.meta.url), 'utf8').match(/postKinds = \[([^\]]+)\]/)[1].match(/'([^']+)'/g).map((k) => k.slice(1, -1))
  const { MOODS } = await import('../src/utils/mood.mjs')
  const { WORK_TYPES } = await import('../src/features/records/featureKinds.mjs')
  const composer = readFileSync(new URL('../src/components/PostComposer.vue', import.meta.url), 'utf8')
  const categories = [...composer.matchAll(/\['([^\]]+)'\]/g)].flatMap((m) => m[1].split("', '"))
  const records = [...MOODS.map((m) => m.label), ...WORK_TYPES, ...categories, ...postKinds]
  assert.ok(postKinds.length >= 10)
  assert.deepEqual(records.filter((ko) => !(ko in EN)), [])
  for (const file of ['utils/postValidation.mjs', 'utils/recurrence.mjs', 'store/ddays.js', 'store/wiki.js']) {
    const source = readFileSync(new URL('../src/' + file, import.meta.url), 'utf8')
    const shown = [...source.matchAll(/(?:return|label:) '([^']*[가-힣][^']*)'/g)].map((m) => m[1])
    assert.deepEqual(shown.filter((ko) => !(ko in EN)), [], file)
  }
  assert.equal(documentLang('en', '/tasks/12'), 'en')
  // 7단계: 다이어리 템플릿(본문에 넣는 글)·일정 색 이름·수정 범위·메모 거르기
  const diary = readFileSync(new URL('../src/views/diary/DiaryEntryView.vue', import.meta.url), 'utf8')
  const templates = [...diary.matchAll(/\{ label: '([^']+)', text: '([^']+)' \}/g)].flatMap((m) => [m[1], JSON.parse('"' + m[2] + '"')])
  assert.equal(templates.length, 6)
  const events = readFileSync(new URL('../src/views/events/EventListView.vue', import.meta.url), 'utf8')
  const memo = readFileSync(new URL('../src/views/memo/MemoInboxView.vue', import.meta.url), 'utf8')
  const lists = [...events.matchAll(/(?:name|label): '([^']+)'/g), ...memo.matchAll(/label: '([^']+)'/g)].map((m) => m[1])
  assert.deepEqual([...templates, ...lists].filter((ko) => !(ko in EN)), [])
  // 8단계: 루틴·D-Day·머니로그 목록 값, 외부 연동 검토 항목, 반복·알림 이름
  const eight = ['views/routines/RoutineListView.vue', 'views/home/DdayView.vue', 'views/events/DdayManageView.vue', 'views/money/MoneyLogView.vue']
    .flatMap((file) => [...readFileSync(new URL('../src/' + file, import.meta.url), 'utf8').matchAll(/(?:label|name|verdict|detail|risk): '([^']+)'/g)].map((m) => m[1]))
  assert.deepEqual(eight.filter((ko) => !(ko in EN)), [])
  // 9단계: 기간 요약 프리셋, 일정 템플릿 반복, 캔버스 라벨·우선순위
  const nine = ['views/diary/DiarySummaryView.vue', 'views/events/EventTemplatesView.vue', 'views/planner/ProjectCanvasView.vue']
    .flatMap((file) => [...readFileSync(new URL('../src/' + file, import.meta.url), 'utf8').matchAll(/(?:label|repeat): '([^']+)'/g)].map((m) => m[1]))
  const canvas = readFileSync(new URL('../src/store/canvas.js', import.meta.url), 'utf8')
  const canvasValues = [...canvas.match(/LABELS = \[([^\]]+)\]/)[1].matchAll(/'([^']+)'/g), ...canvas.matchAll(/label: '([^']+)'/g)].map((m) => m[1])
  assert.ok(canvasValues.length >= 8)
  assert.deepEqual([...nine, ...canvasValues].filter((ko) => !(ko in EN)), [])
  assert.equal(documentLang('en', '/dday/3'), 'en')
  // 11단계: 통계 수치 문구·단위 표
  const { formatMinutes, figureSummary } = await import('../src/features/stats/statsClient.mjs')
  assert.equal(formatMinutes(90, en), '1 h 30 min')
  assert.equal(formatMinutes(90), '1시간 30분')
  assert.equal(figureSummary({ actualMinutes: 0, sources: {} }, 'actual', en).text, 'No records yet.')
  const { UNITS_EN, UNIT_WORDS_EN } = await import('../src/features/i18n/dictionary.mjs')
  assert.deepEqual(Object.values({ ...UNITS_EN, ...UNIT_WORDS_EN }).filter((v) => /[가-힣]/.test(v)), [])
  const current = { startDate: '2026-01-05', employmentStatus: 'current' }
  assert.equal(periodLabel(current, en), '2026.01 ~ Current')
  assert.equal(periodLabel(current), '2026.01 ~ 재직 중')
  assert.equal(careerBody(current, (item) => ({ ...item })).period, '2026.01 ~ 재직 중')
  assert.equal(versionName({ document: 'resume', number: 3, title: '이력서 v3' }, en), 'Resume v3')
  assert.equal(versionName({ document: 'resume', number: 3, title: '백엔드 지원용' }, en), 'Resume v3 · 백엔드 지원용')
  assert.equal(versionTitle({ document: 'resume', number: 3, title: '이력서 v3' }, en), 'Resume v3')
  assert.equal(versionTitle({ document: 'resume', number: 3, title: '이력서 v3' }), '이력서 v3')
  const [section] = snapshotSections({ document: 'resume', content: { resume: { name: '김하나', years: 4 } } }, { t: en })
  assert.deepEqual(section, { heading: 'Basic information', rows: [['Name', '김하나'], ['Years of experience', '4 years']] })
})

test('용어 목록 문서(docs/dev-docs/12, Q-38 (4))의 영어가 사전과 같다', () => {
  const doc = readFileSync(new URL('../../docs/dev-docs/12-다국어-용어-목록.md', import.meta.url), 'utf8')
  const rows = [...doc.split('## 용어')[1].split('## 변경 이력')[0].matchAll(/^\| ([^|]+) \| ([^|]+) \| [^|]+ \|$/gm)].map((m) => [m[1].trim(), m[2].trim()]).filter(([ko, en]) => !(ko === '한국어' && en === '영어') && ko !== '---')
  assert.equal(rows.length, 29)
  assert.deepEqual(rows.filter(([ko, en]) => EN[ko] !== en), [])
})


test('환경설정(PR-32 12단계)이 저장소에서 꺼내 tr에 넘기는 이름표·안내·오류 문구도 사전에 있다. 시연 예시 제목은 한국어 그대로 둔다', () => {
  const pick = /(?:\b(?:label|desc|title|name|note|unit|domain|text|at|type|message)\s*:\s*|\.value = |return |throw new Error\(|flash\(|row\()'([^'\n]*[가-힣][^'\n]*)'/g
  const demoTitles = new Set(['분기 킥오프 미팅', '디자인 리뷰 아이디어', '세금 신고 준비', '주간 회고 메모', '헬스장 등록하기'])
  const files = [
    'store/theme.js', 'store/appearance.js', 'store/aiSettings.js', 'store/automations.js', 'store/dashboard.js', 'store/statsPortlets.js',
    'features/start/startPresets.mjs', 'features/integrations/integrationStatus.mjs', 'features/integrations/useCapabilityStatus.mjs',
    'features/settings/themeAccount.mjs', 'features/backup/backupClient.mjs', 'features/support/tickets.mjs', 'store/startPreset.js', 'store/locale.js',
    'features/i18n/localeAccount.mjs', 'views/settings/SettingsNotificationsView.vue', 'views/settings/SettingsSecurityView.vue', 'views/settings/SettingsCategoryView.vue',
    'views/settings/SettingsThemeView.vue', 'views/settings/SettingsWidgetsView.vue', 'views/settings/SettingsFormStyleView.vue', 'views/settings/SettingsDataView.vue',
    'views/settings/SettingsSupportView.vue', 'views/trash/TrashView.vue', 'components/DueReminderSettings.vue', 'components/DayBoundarySettings.vue', 'features/notifications/dueSettings.mjs',
  ]
  for (const file of files) {
    const source = readFileSync(new URL('../src/' + file, import.meta.url), 'utf8').split('\n').filter((line) => !/^\s*(\/\/|\*|\/\*)/.test(line)).join('\n')
    const shown = [...new Set([...source.matchAll(pick)].map((m) => m[1]))].filter((ko) => !demoTitles.has(ko))
    assert.deepEqual(shown.filter((ko) => !(ko in EN)), [], file)
  }
  assert.equal(documentLang('en', '/settings/profile'), 'en')
})

test('공유·커뮤니티(PR-32 13단계)가 저장소에서 꺼내 tr에 넘기는 이름표·상태·오류 문구도 사전에 있다', () => {
  const pick = /(?:\b(?:label|desc|title|name|note|unit|domain|text|at|type|message|state|from|source|sourceKind)\s*:\s*|\.value = |return |throw new Error\(|flash\()'([^'\n]*[가-힣][^'\n]*)'/g
  const files = [
    'features/share/shareClient.mjs', 'features/community/communityClient.mjs', 'features/community/challengeClient.mjs', 'features/community/rankingVisibility.mjs',
    'features/attachments/attachmentClient.mjs', 'views/share/SharePreviewView.vue', 'views/share/SharedFilesView.vue', 'views/community/CommunityFeedView.vue', 'components/CommunityCreateModal.vue',
  ]
  for (const file of files) {
    const source = readFileSync(new URL('../src/' + file, import.meta.url), 'utf8').split('\n').filter((line) => !/^\s*(\/\/|\*|\/\*)/.test(line)).join('\n')
    const shown = [...new Set([...source.matchAll(pick)].map((m) => m[1]))]
    assert.deepEqual(shown.filter((ko) => !(ko in EN)), [], file)
  }
  for (const ko of ['운동', '공부', '일상', '갓생', '다시 가입 신청', '승인 대기', '초대받음']) assert.ok(ko in EN, ko)
})

test('관리자(PR-32 14단계)가 저장소에서 꺼내 tr에 넘기는 이름표·상태·오류 문구도 사전에 있다. 시연 결제·문의의 사람 이름과 제목은 한국어 그대로 둔다', () => {
  const pick = /(?:\b(?:label|desc|title|name|note|unit|domain|text|at|type|message|state|category|plan)\s*:\s*|\.value = |return |throw new Error\(|flash\()'([^'\n]*[가-힣][^'\n]*)'/g
  const demo = new Set(['최지우', '한소율', '정우진', '박민준', '이서연', '결제가 중복으로 됐어요', '루틴 알림이 안 와요', '계정 삭제 요청', '에러율 1% 초과', '평균 응답 500ms 초과', '결제 실패 5건 초과', 'CS 미답변 48시간 초과'])
  const files = ['features/admin/adminClient.mjs', 'features/admin/auditLog.mjs', 'features/admin/contentClient.mjs', 'features/admin/policy.mjs', 'features/admin/moderation.mjs', 'features/notices/notices.mjs', 'store/adminOps.js']
  for (const file of files) {
    const source = readFileSync(new URL('../src/' + file, import.meta.url), 'utf8').split('\n').filter((line) => !/^\s*(\/\/|\*|\/\*)/.test(line)).join('\n')
    const shown = [...new Set([...source.matchAll(pick)].map((m) => m[1]))].filter((ko) => !demo.has(ko))
    assert.deepEqual(shown.filter((ko) => !(ko in EN)), [], file)
  }
  for (const ko of ['운영', '콘텐츠', '시스템', '삭제됨', '활성', '정지']) assert.ok(ko in EN, ko)
})
