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
  const pattern = /\/features\/(career|planner)\//.test(file) ? /\b(?:tr|t)\('((?:\\'|[^'])*)'/g : /\btr\('((?:\\'|[^'])*)'/g
  for (const m of source.matchAll(pattern)) used.set(m[1].replaceAll("\\'", "'"), file.slice(root.length))
}
const names = (text) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()

test('tr로 부르는 문구는 모두 영어 사전에 있다', () => {
  assert.ok(used.size > 50)
  assert.deepEqual([...used].filter(([ko]) => !(ko in EN)).map(([ko, file]) => `${file}: ${ko}`), [])
})

test('영어에 한글이 없고 자리표시 이름이 같다', () => {
  assert.deepEqual(Object.entries(EN).filter(([, en]) => !en || /[가-힣]/.test(en)).map(([ko]) => ko), [])
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
  assert.equal(documentLang('en', '/events'), 'ko')
  assert.equal(documentLang('ko', '/career'), 'ko')
})

test('목록에서 이름을 꺼내 tr에 넘기는 값(상태·문서·고용 형태·자기소개서·포트폴리오 항목·공개 범위)도 사전에 있다. 표시 함수는 저장값을 한국어로 둔다', async () => {
  const { ACTIVITY_TYPES, APPLICATION_STATUSES } = await import('../src/features/career/careerModel.mjs')
  const { DOCUMENTS, snapshotSections, versionName, versionTitle } = await import('../src/features/career/documentVersions.mjs')
  const { EMPLOYMENT_TYPES, EMPLOYMENT_STATUSES, careerBody, periodLabel } = await import('../src/features/career/careerPeriods.mjs')
  const { COVER_LETTER_SECTIONS } = await import('../src/features/records/resumeStore.mjs')
  const { PORTFOLIO_SECTIONS } = await import('../src/features/career/portfolioItems.mjs')
  const { SCOPES, expiryText } = await import('../src/features/career/portfolioLinks.mjs')
  const en = (ko, vars) => translate(ko, 'en', vars)
  const labels = [...ACTIVITY_TYPES, ...APPLICATION_STATUSES, ...DOCUMENTS, ...EMPLOYMENT_TYPES, ...EMPLOYMENT_STATUSES, ...COVER_LETTER_SECTIONS, ...PORTFOLIO_SECTIONS, ...SCOPES].map((item) => item.label)
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
