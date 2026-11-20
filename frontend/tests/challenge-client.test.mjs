// 챌린지 화면이 쓰는 API 경로·본문, 입력 검사, 규칙 문구, 기간 상태, 인증에 쓸 실제 기록 고르기, 순위 매기기를 검증한다(PR-10 3b-2, TS-41).
import test from 'node:test'
import assert from 'node:assert/strict'
import { createChallengeClient, emptyChallengeDraft, challengeDraftError, challengeBody, challengeRule, challengePeriod, checkinState, sessionsForCheckin, rankRows, challengeErrorText } from '../src/features/community/challengeClient.mjs'

function recorder() {
  const calls = []
  const client = createChallengeClient({ request: async (path, options = {}) => { calls.push([options.method ?? 'GET', path, options.body ? JSON.parse(options.body) : undefined]); return null } })
  return { client, calls }
}

test('챌린지 API는 서버 경로와 본문을 그대로 쓴다', async () => {
  const { client, calls } = recorder()
  await client.list('c 1')
  await client.create('c1', { title: '러닝' })
  await client.join('c1', 'h1')
  await client.join('c1', 'h1', true)
  await client.leave('c1', 'h1')
  await client.checkin('c1', 'h1', '2026-11-20')
  await client.checkin('c1', 'h1', '2026-11-20', 's1')
  await client.checkins('c1', 'h1')
  await client.checkins('c1', 'h1', 'u 2')
  await client.ranking('c1', 'h1')
  await client.recordings()
  assert.deepEqual(calls, [
    ['GET', '/api/communities/c%201/challenges', undefined],
    ['POST', '/api/communities/c1/challenges', { title: '러닝' }],
    ['POST', '/api/communities/c1/challenges/h1/join', {}],
    ['POST', '/api/communities/c1/challenges/h1/join', { consent: true }],
    ['DELETE', '/api/communities/c1/challenges/h1/members/me', undefined],
    ['PUT', '/api/communities/c1/challenges/h1/checkins/2026-11-20', {}],
    ['PUT', '/api/communities/c1/challenges/h1/checkins/2026-11-20', { sessionId: 's1' }],
    ['GET', '/api/communities/c1/challenges/h1/checkins', undefined],
    ['GET', '/api/communities/c1/challenges/h1/checkins?userId=u%202', undefined],
    ['GET', '/api/communities/c1/challenges/h1/ranking', undefined],
    ['GET', '/api/planner/recordings', undefined],
  ])
})

test('만들기 입력은 서버와 같은 규칙으로 검사하고, 고른 방식에 필요한 필드만 보낸다', () => {
  const base = { ...emptyChallengeDraft('2026-11-20'), title: ' 아침 러닝 ' }
  assert.equal(challengeDraftError(base), '')
  assert.deepEqual(challengeBody(base), { title: '아침 러닝', startDate: '2026-11-20', days: 21, verify: 'self' })
  for (const bad of [{ title: ' ' }, { startDate: '' }, { days: 2 }, { days: 101 }, { days: 3.5 }, { openRecords: true }]) assert.notEqual(challengeDraftError({ ...base, ...bad }), '', JSON.stringify(bad))
  const record = { ...base, verify: 'record', minMinutes: 30, useWindow: true, windowStart: '06:00', windowEnd: '08:00', openRecords: true, desc: ' 매일 ' }
  assert.equal(challengeDraftError(record), '')
  assert.deepEqual(challengeBody(record), { title: '아침 러닝', startDate: '2026-11-20', days: 21, verify: 'record', desc: '매일', minMinutes: 30, windowStart: '06:00', windowEnd: '08:00', openRecords: true })
  for (const bad of [{ minMinutes: 0 }, { minMinutes: 601 }, { windowStart: '8:00' }, { windowStart: '08:00', windowEnd: '06:00' }, { windowEnd: '06:00' }]) assert.notEqual(challengeDraftError({ ...record, ...bad }), '', JSON.stringify(bad))
  assert.deepEqual(challengeBody({ ...record, useWindow: false, openRecords: false }), { title: '아침 러닝', startDate: '2026-11-20', days: 21, verify: 'record', desc: '매일', minMinutes: 30 })
})

test('규칙 문구와 기간 상태, 오늘 인증할 수 있는지를 정한다', () => {
  assert.equal(challengeRule({ verify: 'self' }), '직접 인증')
  assert.equal(challengeRule({}), '직접 인증')
  assert.equal(challengeRule({ verify: 'record', minMinutes: 20, windowStart: '06:00', windowEnd: '08:00', openRecords: true }), '실제 기록 확인 · 06:00~08:00 · 20분 이상 · 기록 공개')
  const c = { startDate: '2026-11-18', days: 3, joined: true, myLastDate: null }
  assert.deepEqual(challengePeriod(c, '2026-11-17'), { start: '2026-11-18', end: '2026-11-20', state: 'upcoming' })
  assert.equal(challengePeriod(c, '2026-11-20').state, 'ongoing')
  assert.equal(challengePeriod(c, '2026-11-21').state, 'ended')
  assert.equal(checkinState(c, '2026-11-19'), 'ready')
  assert.equal(checkinState({ ...c, myLastDate: '2026-11-19' }, '2026-11-19'), 'done')
  assert.equal(checkinState({ ...c, joined: false }, '2026-11-19'), 'join')
  assert.equal(checkinState(c, '2026-11-17'), 'upcoming')
  assert.equal(checkinState(c, '2026-11-21'), 'ended')
})

test('인증에 쓸 실제 기록은 실시간으로 끝낸 기록만 고르고 서버와 같은 방식으로 분을 센다', () => {
  const at = (date, time) => new Date(`${date}T${time}:00`).toISOString()
  const sessions = [
    { id: 'live', title: '러닝', state: 'COMPLETED', finishKey: 'k', startedAt: at('2026-11-20', '05:40'), endedAt: at('2026-11-20', '06:40') },
    { id: 'short', title: '산책', state: 'COMPLETED', finishKey: 'k', startedAt: at('2026-11-20', '07:50'), endedAt: at('2026-11-20', '08:30') },
    { id: 'restored', title: '복원', state: 'COMPLETED', startedAt: at('2026-11-20', '06:00'), endedAt: at('2026-11-20', '07:00') },
    { id: 'running', title: '진행 중', state: 'RUNNING', finishKey: '', startedAt: at('2026-11-20', '06:00') },
    { id: 'other-day', title: '어제', state: 'COMPLETED', finishKey: 'k', startedAt: at('2026-11-19', '06:00'), endedAt: at('2026-11-19', '07:00') },
  ]
  const windowed = sessionsForCheckin(sessions, { verify: 'record', minMinutes: 20, windowStart: '06:00', windowEnd: '08:00' }, '2026-11-20')
  assert.deepEqual(windowed.map((s) => [s.id, s.minutes, s.eligible]), [['live', 40, true], ['short', 10, false]])
  const allDay = sessionsForCheckin(sessions, { verify: 'self' }, '2026-11-19')
  assert.deepEqual(allDay.map((s) => [s.id, s.minutes, s.eligible]), [['other-day', 60, true]])
})

test('일시정지한 시간은 인증 후보의 분에서 뺀다(서버와 같은 규칙, PR-09)', () => {
  const at = (time) => new Date(`2026-11-20T${time}:00`).toISOString()
  const paused = { id: 'timer', title: '러닝', state: 'COMPLETED', finishKey: 'k', mode: 'stopwatch', startedAt: at('06:30'), endedAt: at('07:00'), pauses: [{ from: at('06:40'), to: at('06:55') }] }
  assert.deepEqual(sessionsForCheckin([paused], { verify: 'record', minMinutes: 20 }, '2026-11-20').map((s) => [s.minutes, s.eligible]), [[15, false]])
  assert.deepEqual(sessionsForCheckin([paused], { verify: 'record', minMinutes: 5, windowStart: '06:00', windowEnd: '06:45' }, '2026-11-20').map((s) => [s.minutes, s.eligible]), [[10, true]])
})

test('순위는 인증 일수, 같으면 기록 확인 일수로 정하고 둘 다 같으면 같은 순위다', () => {
  const rows = rankRows([
    { userId: 'a', nickname: '가', doneDays: 3, verifiedDays: 1 },
    { userId: 'b', nickname: '나', doneDays: 3, verifiedDays: 2 },
    { userId: 'c', nickname: '다', doneDays: 3, verifiedDays: 1 },
    { userId: 'd', nickname: '라', doneDays: 0, verifiedDays: 0 },
  ], 'c')
  assert.deepEqual(rows.map((r) => [r.userId, r.rank, r.me]), [['b', 1, false], ['a', 2, false], ['c', 2, true], ['d', 4, false]])
})

test('오류 문구는 상태 코드별로 다음 행동을 알린다', () => {
  assert.match(challengeErrorText({ status: 0 }), /연결/)
  assert.match(challengeErrorText({ status: 403 }), /참여/)
  assert.match(challengeErrorText({ status: 404 }), /찾을 수 없/)
  assert.equal(challengeErrorText({ status: 400, message: '기록 시간이 20분보다 짧습니다.' }), '기록 시간이 20분보다 짧습니다.')
})
