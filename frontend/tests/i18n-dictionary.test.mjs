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
  // features/career의 표시 함수는 번역 함수를 t로 받는다(기본값은 한국어 그대로). App.vue 등의 t('키')는 다른 사전이라 이 폴더만 본다
  const pattern = file.includes('/features/career/') ? /\b(?:tr|t)\('((?:\\'|[^'])*)'/g : /\btr\('((?:\\'|[^'])*)'/g
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
  for (const path of TRANSLATED_PATHS) assert.equal(documentLang('en', path), 'en')
  assert.equal(documentLang('en', '/tasks'), 'ko')
  assert.equal(documentLang('ko', '/career'), 'ko')
})

test('목록에서 이름을 꺼내 tr에 넘기는 값(상태·문서·고용 형태·자기소개서 항목)도 사전에 있다. 표시 함수는 저장값을 한국어로 둔다', async () => {
  const { ACTIVITY_TYPES, APPLICATION_STATUSES } = await import('../src/features/career/careerModel.mjs')
  const { DOCUMENTS, snapshotSections, versionName, versionTitle } = await import('../src/features/career/documentVersions.mjs')
  const { EMPLOYMENT_TYPES, EMPLOYMENT_STATUSES, careerBody, periodLabel } = await import('../src/features/career/careerPeriods.mjs')
  const { COVER_LETTER_SECTIONS } = await import('../src/features/records/resumeStore.mjs')
  const labels = [...ACTIVITY_TYPES, ...APPLICATION_STATUSES, ...DOCUMENTS, ...EMPLOYMENT_TYPES, ...EMPLOYMENT_STATUSES, ...COVER_LETTER_SECTIONS].map((item) => item.label)
  assert.deepEqual(labels.filter((ko) => !(ko in EN)), [])
  const en = (ko, vars) => translate(ko, 'en', vars)
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
