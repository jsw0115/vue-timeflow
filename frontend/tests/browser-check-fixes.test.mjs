// 2026-11-26 전체 화면 점검에서 찾은 버그(BUG-007~BUG-011)와 개선(IMP-015~IMP-018, docs/quality/browser-test-2026-11-26.md)이 되돌아가지 않는지 검사한다.
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
