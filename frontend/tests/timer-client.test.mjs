// 집중 타이머의 서버 요청(모드·목표·일시정지·재개·취소)과 일시정지를 뺀 시간·남은 시간·목표 도달 시각 계산을 검증한다(PR-09 2단계).
import test from 'node:test'
import assert from 'node:assert/strict'
import { createRecordingClient, recordingSeconds, remainingSeconds, targetEndAt } from '../src/features/recording/recordingClient.mjs'
import { MODES, POMODORO_MINUTES, minutesError, clockText, timerStatus, todayTimerRecords } from '../src/features/recording/timer.mjs'

function storage() { const items = new Map(); return { getItem: k => items.get(k), setItem: (k, v) => items.set(k, v), removeItem: k => items.delete(k) } }
const T = '2026-11-18T01:00:00Z', at = (minutes) => Date.parse(T) + minutes * 60000
const iso = (minutes) => new Date(at(minutes)).toISOString()

test('일시정지 구간은 기록 시간에서 빼고, 끝나지 않은 일시정지는 지금까지로 본다', () => {
  const closed = { startedAt: T, endedAt: iso(35), pauses: [{ from: iso(20), to: iso(25) }] }
  assert.equal(recordingSeconds(closed), 30 * 60)
  const paused = { startedAt: T, state: 'PAUSED', pauses: [{ from: iso(10) }] }
  assert.equal(recordingSeconds(paused, at(40)), 10 * 60, '일시정지 중에는 시간이 늘지 않는다')
  assert.equal(recordingSeconds({ startedAt: T, pauses: [{ from: iso(10) }] }, at(5)), 10 * 60, '이 기기 시계가 일시정지 시각보다 일러도 서버 일시정지 시각까지 센다')
  assert.equal(recordingSeconds({ startedAt: T, pauses: [{ from: iso(1), to: iso(3) }] }, at(2)), 60, '시계가 재개 시각보다 일러도 음수를 만들지 않는다')
})

test('목표가 있는 타이머는 남은 시간과 목표 도달 서버 시각을 계산하고, 스톱워치는 계산하지 않는다', () => {
  const running = { startedAt: T, state: 'RUNNING', mode: 'countdown', targetMinutes: 30, pauses: [{ from: iso(10), to: iso(15) }] }
  assert.equal(remainingSeconds(running, at(20)), 15 * 60)
  assert.equal(remainingSeconds(running, at(60)), 0)
  assert.equal(targetEndAt(running), iso(35), '시작 + 목표 30분 + 일시정지 5분')
  assert.equal(targetEndAt({ ...running, state: 'PAUSED' }), null)
  assert.equal(remainingSeconds({ startedAt: T, state: 'RUNNING', mode: 'stopwatch' }, at(5)), null)
  assert.equal(targetEndAt({ startedAt: T, state: 'RUNNING', mode: 'stopwatch' }), null)
})

test('시작 요청에 모드·목표를 담고, 스톱워치에는 목표를 담지 않는다', async () => {
  const bodies = []
  const client = createRecordingClient({ storage: storage(), owner: 'one', uuid: () => 'timer-request-0001', request: async (path, options) => { bodies.push(JSON.parse(options.body)); return { id: 'r', state: 'RUNNING' } } })
  await client.start('보고서', 'Asia/Seoul', undefined, { mode: 'countdown', targetMinutes: 45 })
  await client.start('보고서', 'Asia/Seoul', undefined, { mode: 'stopwatch', targetMinutes: 45 })
  assert.equal(bodies[0].mode, 'countdown'); assert.equal(bodies[0].targetMinutes, 45)
  assert.equal(bodies[1].mode, 'stopwatch'); assert.equal('targetMinutes' in bodies[1], false)
})

test('일시정지·재개·취소는 version만 보내고, 저장하지 못한 종료가 남아 있으면 보내지 않는다', async () => {
  const cache = storage(), calls = []
  let lose = false
  const request = async (path, options) => {
    calls.push({ path, body: JSON.parse(options.body) })
    if (lose) throw new Error('offline')
    return path.endsWith('/cancel') ? null : { id: 'r', state: path.endsWith('/pause') ? 'PAUSED' : 'RUNNING', version: 2 }
  }
  const client = createRecordingClient({ storage: cache, owner: 'one', uuid: () => 'finish-request-001', now: () => at(10), request })
  const active = { id: 'r', version: 1, startedAt: T, state: 'RUNNING' }
  assert.equal((await client.pause(active)).state, 'PAUSED')
  assert.equal((await client.resume({ ...active, state: 'PAUSED' })).state, 'RUNNING')
  assert.equal(await client.cancel(active), null)
  assert.deepEqual(calls.map(c => c.path), ['/api/planner/recordings/r/pause', '/api/planner/recordings/r/resume', '/api/planner/recordings/r/cancel'])
  assert.deepEqual(calls.map(c => c.body), [{ version: 1 }, { version: 1 }, { version: 1 }])
  lose = true
  await assert.rejects(client.finish(active), /offline/)
  const before = calls.length
  await assert.rejects(client.pause(active), /종료 요청/)
  await assert.rejects(client.cancel(active), /종료 요청/)
  assert.equal(calls.length, before)
})

test('종료 시각은 정한 값(목표 도달)을 쓰고, 아니면 마지막 일시정지·재개보다 이르지 않게 한다', async () => {
  const bodies = []
  const request = async (path, options) => { bodies.push(JSON.parse(options.body)); return { id: 'r', state: 'COMPLETED' } }
  const client = createRecordingClient({ storage: storage(), owner: 'one', uuid: () => 'finish-request-002', now: () => at(14), request })
  await client.finish({ id: 'r', version: 3, startedAt: T, state: 'RUNNING' }, 0, iso(13))
  assert.equal(bodies[0].endedAt, iso(13))
  // 이 기기 시계가 서버보다 늦어 재개 시각보다 이른 종료가 되지 않게 한다
  await client.finish({ id: 'r', version: 3, startedAt: T, state: 'RUNNING', pauses: [{ from: iso(5), to: iso(20) }] }, 0)
  assert.equal(bodies[1].endedAt, iso(20))
})

test('화면 문구: 모드, 분 입력 검사, 시계, 상태, 오늘 끝낸 타이머 기록', () => {
  assert.deepEqual(MODES.map(m => m.id), ['pomodoro', 'countdown', 'stopwatch'])
  assert.equal(POMODORO_MINUTES, 25)
  assert.equal(minutesError(1), ''); assert.equal(minutesError(1440), '')
  for (const value of [0, 1441, 2.5, '', null]) assert.notEqual(minutesError(value), '', String(value))
  assert.equal(clockText(65), '01:05'); assert.equal(clockText(3725), '1:02:05'); assert.equal(clockText(-3), '00:00')
  assert.equal(timerStatus(null, null), '집중 대기')
  assert.equal(timerStatus({ state: 'RUNNING' }, null), '집중 중')
  assert.equal(timerStatus({ state: 'PAUSED' }, null), '일시정지')
  assert.equal(timerStatus({ state: 'RUNNING' }, { kind: 'finish' }), '종료 저장 대기')
  const rows = [
    { id: 'a', mode: 'pomodoro', state: 'COMPLETED', startedAt: '2026-11-18T01:00:00Z', elapsedSeconds: 780 },
    { id: 'b', state: 'COMPLETED', startedAt: '2026-11-18T02:00:00Z', elapsedSeconds: 600 },
    { id: 'c', mode: 'stopwatch', state: 'RUNNING', startedAt: '2026-11-18T03:00:00Z' },
    { id: 'd', mode: 'stopwatch', state: 'COMPLETED', startedAt: '2026-11-17T01:00:00Z', elapsedSeconds: 60 },
  ]
  assert.deepEqual(todayTimerRecords(rows, '2026-11-18', 'Asia/Seoul').map(r => r.id), ['a'], '모드 없는 플래너 기록, 진행 중, 다른 날은 뺀다')
})
