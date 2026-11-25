// 커리어 활동 근거 원본(PR-24): 종류는 서버와 같고, 후보는 서버 기록만·이미 이은 것 제외·활동 날짜에 가까운 순이며, 화면은 지워진 원본을 표시한다.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { MAX_SOURCES, SOURCE_KINDS, candidates, createActivitySourceClient, kindLabel } from '../src/features/career/activitySources.mjs'

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8')

test('종류·한도가 서버 ActivitySources와 같다', () => {
  const java = read('../../backend/src/main/java/kr/timebar/diary/career/ActivitySources.java')
  assert.match(java, /KINDS = List\.of\(RecordLinks\.SCHEDULE, RecordLinks\.ACTUAL, RecordLinks\.WBS\)/)
  assert.deepEqual(SOURCE_KINDS.map((k) => k.id), ['schedule', 'actual', 'wbs'])
  assert.match(java, new RegExp(`MAX_SOURCES = ${MAX_SOURCES};`))
  assert.equal(kindLabel('wbs'), 'WBS 작업')
})

test('요청 경로', async () => {
  const calls = []
  const client = createActivitySourceClient(async (path, options = {}) => { calls.push([options.method ?? 'GET', path, options.body]); return [] })
  await client.list('a/1'); await client.add('a1', 'wbs', 'w1'); await client.remove('a1', 'schedule', 's 1')
  assert.deepEqual(calls, [
    ['GET', '/api/career/activities/a%2F1/sources', undefined],
    ['POST', '/api/career/activities/a1/sources', '{"kind":"wbs","id":"w1"}'],
    ['DELETE', '/api/career/activities/a1/sources/schedule/s%201', undefined],
  ])
})

test('후보: 서버 기록(문자열 ID)만, 이미 이은 것 제외, 끝난 실제 기록만, 활동 날짜에 가까운 순', () => {
  const data = {
    events: [{ id: 1, title: '시연 일정', startDate: '2026-11-02' }, { id: 'e1', title: '먼 회의', startDate: '2026-10-01' }, { id: 'e2', title: '가까운 회의', startDate: '2026-11-03' }, { id: 'e3', title: '이은 회의', startDate: '2026-11-02' }],
    recordings: [{ id: 'r1', title: '진행 중', state: 'RUNNING', startedAt: '2026-11-02T01:00:00Z' }, { id: 'r2', title: '끝난 작업', state: 'COMPLETED', startedAt: '2026-11-02T01:00:00Z' }],
    wbs: [{ id: 'w1', title: '결제 리뉴얼' }],
  }
  assert.deepEqual(candidates('schedule', data, '2026-11-02', [{ kind: 'schedule', id: 'e3' }]).map((o) => o.id), ['e2', 'e1'])
  assert.deepEqual(candidates('actual', data, '2026-11-02', []).map((o) => o.label), ['2026-11-02 끝난 작업'])
  assert.deepEqual(candidates('wbs', data, '', []).map((o) => o.label), ['결제 리뉴얼'])
})

test('화면: 저장한 활동에만 근거 구역, 지워진 원본 표시', () => {
  assert.match(read('../src/views/career/CareerActivitiesView.vue'), /<ActivitySourcePanel v-if="editor\.base\?\.id && typeof editor\.base\.id === 'string'"/)
  const panel = read('../src/components/ActivitySourcePanel.vue')
  assert.match(panel, /s\.broken \? tr\('지워진 원본'\) : s\.title/)
  assert.doesNotMatch(panel, /v-html/)
})
