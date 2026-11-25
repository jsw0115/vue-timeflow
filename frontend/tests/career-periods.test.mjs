// 경력 상세 필드(PR-24, REQ-F25)의 요청 본문·기간 표시와, 저장을 막지 않는 기간 겹침·공백 안내를 검사한다.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { EMPLOYMENT_TYPES, GAP_NOTICE_DAYS, careerBody, careerDetailError, careerPeriodNotes, periodLabel } from '../src/features/career/careerPeriods.mjs'
import { careerKind } from '../src/features/records/featureKinds.mjs'

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8')
const pick = (source) => Object.fromEntries(careerKind.fields.filter((key) => source[key] !== undefined).map((key) => [key, source[key]]))

test('고용 형태 허용값은 서버 목록과 같다', () => {
  const server = read('../backend/src/main/java/kr/timebar/diary/feature/FeatureInput.java')
  const list = server.match(/EMPLOYMENT_TYPES = List\.of\(([^)]*)\)/)[1].match(/"([^"]+)"/g).map((value) => value.slice(1, -1))
  assert.deepEqual(EMPLOYMENT_TYPES.map((item) => item.value), list)
  assert.match(read('../backend/src/main/java/kr/timebar/diary/feature/FeatureType.java'), /CAREER\("title period role company stack achievements employmentType department startDate endDate employmentStatus duties"/)
})

test('빈 상세 값은 보내지 않고, 재직 중이면 종료일을 빼며, 시작일이 있으면 기간 문구를 날짜로 다시 만든다', () => {
  const body = careerBody({ title: '결제', role: '개발', period: '옛 기간', employmentType: '', department: ' 결제팀 ', startDate: '2026-01-02', endDate: '2026-05-01', employmentStatus: 'current' }, pick)
  assert.deepEqual(body, { title: '결제', period: '2026.01 ~ 재직 중', role: '개발', department: '결제팀', startDate: '2026-01-02', employmentStatus: 'current' })
  const legacy = careerBody({ title: '근태', role: '백엔드', period: '2025.07 ~ 2025.12', startDate: '', endDate: '' }, pick)
  assert.deepEqual(legacy, { title: '근태', period: '2025.07 ~ 2025.12', role: '백엔드' })
  assert.equal(periodLabel({ startDate: '2025-07-01', endDate: '2025-12-31' }), '2025.07 ~ 2025.12')
  assert.equal(periodLabel({ startDate: '2025-07-01' }), '2025.07 ~')
  assert.equal(periodLabel({ period: '자유 기간' }), '자유 기간')
})

test('화면 입력 오류는 서버 규칙과 같다', () => {
  assert.equal(careerDetailError({ startDate: '2026-03-01', endDate: '2026-02-01' }), '종료일은 시작일과 같거나 뒤여야 해요.')
  assert.equal(careerDetailError({ startDate: '2026-01-01', employmentStatus: 'ended' }), '종료한 경력은 종료일을 넣어 주세요.')
  assert.equal(careerDetailError({ startDate: '2026-01-01', endDate: '2026-01-01', employmentStatus: 'ended' }), '')
  assert.equal(careerDetailError({ startDate: '2026-01-01', employmentStatus: 'current' }), '')
})

test('겹침은 하루라도 겹치면 알리고, 공백은 기준 일수보다 길 때만 알린다. 시작일 없는 경력은 비교하지 않는다', () => {
  const a = { id: 'a', title: 'A', startDate: '2024-01-01', endDate: '2024-06-30' }
  const b = { id: 'b', title: 'B', startDate: '2024-06-30', endDate: '2024-09-30' }
  const c = { id: 'c', title: 'C', startDate: '2024-11-01', endDate: '2024-12-31' } // B 뒤 31일 공백(10/1~10/31)
  const d = { id: 'd', title: 'D', startDate: '2025-03-01', employmentStatus: 'current' } // C 뒤 59일 공백
  const legacy = { id: 'e', title: 'E', period: '2023 ~ 2024' }
  const notes = careerPeriodNotes([d, legacy, c, b, a], '2026-11-25')
  assert.equal(GAP_NOTICE_DAYS, 31)
  assert.deepEqual(notes.overlaps.map(([x, y]) => x.id + y.id), ['ab'])
  assert.deepEqual(notes.gaps.map((gap) => [gap.after.id, gap.before.id, gap.days]), [['c', 'd', 59]])
  assert.equal(notes.compared, 4)
  // 긴 경력 안에 들어간 짧은 경력 뒤에도 긴 경력이 끝나기 전에는 공백이 아니다
  const long = { id: 'l', title: 'L', startDate: '2020-01-01', endDate: '2022-12-31' }
  const inner = { id: 'i', title: 'I', startDate: '2020-03-01', endDate: '2020-04-30' }
  const next = { id: 'n', title: 'N', startDate: '2022-06-01', endDate: '2023-01-31' }
  const nested = careerPeriodNotes([long, inner, next], '2026-11-25')
  assert.deepEqual(nested.gaps, [])
  assert.deepEqual(nested.overlaps.map(([x, y]) => x.id + y.id), ['li', 'ln'])
})

test('경력 화면은 상세 입력·충돌 비교·기간 안내를 갖고, 안내는 저장을 막지 않는다', () => {
  const view = read('src/views/work/CareerDocsView.vue')
  for (const key of ['employmentType', 'department', 'startDate', 'endDate', 'employmentStatus', 'duties']) assert.match(view, new RegExp('v-model="projectEditor\\.draft\\.' + key + '"'))
  assert.match(view, /label: '고용 형태 · 상태'/)
  assert.match(view, /:disabled="projectEditor\.draft\.employmentStatus === 'current'"/)
  assert.match(view, /’, ‘\{b\}’ 기간이 겹쳐요\. 겸직이나 동시 프로젝트라면 그대로 두셔도 돼요/)
  assert.doesNotMatch(view, /’와 ‘|’과 ‘|을\(를\)|와\(과\)/)
  assert.doesNotMatch(view, /projectCanSave = computed\([^\n]*periodNotes/)
})
