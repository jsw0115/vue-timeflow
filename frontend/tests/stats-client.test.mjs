// 통계 수치의 기간·시간대·기록 수 문구와 원본 목록 합계를 검사한다(PR-10 6단계, UT-200·UT-201).
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  EMPTY_TEXT, figureSummary, sourceRows, sourceTotal, formatMinutes, zoneText, periodText, sourcePath, createStatsClient,
} from '../src/features/stats/statsClient.mjs'

const week = {
  from: '2026-11-16', to: '2026-11-22', timeZone: 'Asia/Seoul', dayStartHour: 0,
  actualMinutes: 85, plannedMinutes: 90, focusMinutes: 25, completedTasks: 1, totalTasks: 2,
  sources: {
    actual: [
      { kind: 'planner', id: '2', recordId: '2', title: '보고서 작성', date: '2026-11-18', minutes: 45, category: '업무' },
      { kind: 'recording', id: 'a@2026-11-18', recordId: 'a', title: '독서', date: '2026-11-18', minutes: 30, category: '미분류' },
      { kind: 'recording', id: 'b@2026-11-22', recordId: 'b', title: '밤 산책', date: '2026-11-22', minutes: 10, category: '미분류' },
    ],
    planned: [{ kind: 'schedule', id: 's:2026-11-18', recordId: 's', title: '회의', date: '2026-11-18', minutes: 90, category: '업무' }],
    focus: [{ kind: 'focus', id: 'f', recordId: 'f', title: '집중', date: '2026-11-18', minutes: 25, category: '미분류' }],
    tasks: [{ kind: 'task', id: 't1', recordId: 't1', title: '보고', date: '2026-11-18', done: true }, { kind: 'task', id: 't2', recordId: 't2', title: '정리', date: null, done: false }],
  },
}

test('UT-200 실제 시간 수치의 원본 합계가 수치와 같고, 기간·시간대·기록 수가 함께 나온다', () => {
  const figure = figureSummary(week, 'actual')
  assert.equal(figure.text, '1시간 25분')
  assert.equal(figure.count, 3)
  assert.equal(figure.period, '2026-11-16 ~ 2026-11-22')
  assert.equal(figure.zone, 'Asia/Seoul 기준')
  assert.equal(sourceTotal(sourceRows(week, 'actual'), 'actual'), week.actualMinutes)
  for (const key of ['planned', 'focus']) assert.equal(sourceTotal(sourceRows(week, key), key), week[key + 'Minutes'])
})

test('할 일 수치는 완료한 할 일만 원본으로 센다', () => {
  assert.equal(sourceTotal(sourceRows(week, 'tasks'), 'tasks'), week.completedTasks)
  assert.equal(figureSummary(week, 'tasks').text, '1개')
})

test('UT-201 원본이 없는 수치는 0 대신 "기록이 아직 없어요"를 보인다', () => {
  const empty = { ...week, actualMinutes: 0, sources: { actual: [], planned: [], focus: [], tasks: [] } }
  const figure = figureSummary(empty, 'actual')
  assert.equal(figure.empty, true)
  assert.equal(figure.text, EMPTY_TEXT)
  assert.doesNotMatch(figure.text, /0분|약|예상|추정/)
})

test('하루 시작 시각이 0시가 아니면 시간대 문구에 함께 적는다', () => {
  assert.equal(zoneText({ timeZone: 'Asia/Seoul', dayStartHour: 4 }), 'Asia/Seoul 기준 · 하루는 04:00에 시작')
  assert.equal(periodText({ from: '2026-11-18', to: '2026-11-18' }), '2026-11-18')
  assert.equal(formatMinutes(120), '2시간')
  assert.equal(formatMinutes(5), '5분')
})

test('원본 목록 주소와 대시보드 요청은 같은 기간을 가리킨다', async () => {
  assert.equal(sourcePath('actual', 'week', week), '/stats/sources?figure=actual&range=week&date=2026-11-16')
  const paths = []
  const client = createStatsClient({ request: async (path) => { paths.push(path); return week } })
  await client.dashboard('week', '2026-11-16')
  assert.deepEqual(paths, ['/api/stat/dashboard?range=week&date=2026-11-16'])
})
