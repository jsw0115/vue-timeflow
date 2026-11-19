// 기록 연결 화면 모듈의 이동 주소, 삭제된 원본 표시, 배치 요청, 원본에서 시작한 기록 요청을 검증한다(PR-08 3단계, TS-32).
import test from 'node:test'
import assert from 'node:assert/strict'
import { createLinkClient, linkRoute, originOf } from '../src/features/records/recordLinks.mjs'
import { createRecordingClient } from '../src/features/recording/recordingClient.mjs'

function storage() { const items = new Map(); return { getItem: k => items.get(k), setItem: (k, v) => items.set(k, v), removeItem: k => items.delete(k) } }

test('연결된 기록은 종류에 맞는 화면으로 연다', () => {
  assert.deepEqual(linkRoute({ kind: 'task', id: 't1' }), { path: '/tasks/t1' })
  assert.deepEqual(linkRoute({ kind: 'schedule', id: 's1' }), { path: '/events', query: { id: 's1' } })
  assert.deepEqual(linkRoute({ kind: 'actual', id: 'a1' }), { path: '/planner/daily', query: { recording: 'a1' } })
})

test('UT-144: 원본 일정이 지워져 연결만 끊긴 실제 기록은 "삭제된 일정"으로 보인다', () => {
  const record = { id: 'a1', sourceKind: 'schedule', sourceId: 's1' }
  assert.deepEqual(originOf(record, [{ kind: 'schedule', id: 's1', title: '집중 작업', direction: 'source' }]), { kind: 'schedule', id: 's1', title: '집중 작업', direction: 'source', deleted: false })
  assert.deepEqual(originOf(record, []), { kind: 'schedule', id: 's1', title: '삭제된 일정', deleted: true })
  assert.equal(originOf({ ...record, sourceKind: 'task', sourceId: 't1' }, []).title, '삭제된 할 일')
  assert.equal(originOf({ id: 'a2' }, []), null, '원본 없이 시작한 기록은 원본을 보이지 않는다')
})

test('UT-140: 할 일 배치는 날짜·시간과 멱등 키를 보내고, 연결 조회는 종류와 ID를 주소에 담는다', async () => {
  const calls = []
  const client = createLinkClient({ request: async (url, options) => { calls.push({ url, options }); return { id: 's1' } } })
  await client.placeTask('t/1', { date: '2026-11-19', startTime: '14:00', endTime: '15:00' }, 'key-1')
  await client.list('task', 't/1')
  assert.equal(calls[0].url, '/api/tasks/t%2F1/schedules')
  assert.equal(calls[0].options.method, 'POST')
  assert.equal(calls[0].options.headers['Idempotency-Key'], 'key-1')
  assert.deepEqual(JSON.parse(calls[0].options.body), { startDate: '2026-11-19', endDate: '2026-11-19', startTime: '14:00', endTime: '15:00' })
  assert.equal(calls[1].url, '/api/record-links?kind=task&id=t%2F1')
})

test('UT-142: 원본에서 시작한 기록은 원본 종류·ID를 보내고, 응답이 끊겨 다시 보내도 같은 요청이다', async () => {
  const bodies = []; let lose = true
  const request = async (url, options) => { bodies.push(JSON.parse(options.body)); if (lose) throw new Error('응답 유실'); return { id: bodies[0].requestId, state: 'RUNNING' } }
  const options = { request, storage: storage(), owner: 'one', uuid: () => 'stable-start-request' }
  await assert.rejects(createRecordingClient(options).start('집중 작업', 'Asia/Seoul', { kind: 'schedule', id: 's1' }), /응답 유실/)
  lose = false
  await createRecordingClient(options).start('다른 제목', 'Asia/Seoul')
  assert.deepEqual(bodies[0], { requestId: 'stable-start-request', title: '집중 작업', timeZone: 'Asia/Seoul', sourceKind: 'schedule', sourceId: 's1' })
  assert.deepEqual(bodies[1], bodies[0], '보관한 시작 요청을 그대로 다시 보낸다')
  const plain = []
  await createRecordingClient({ request: async (url, o) => { plain.push(JSON.parse(o.body)); return { state: 'RUNNING' } }, storage: storage(), owner: 'two', uuid: () => 'plain-start-request-1' }).start('그냥 기록', 'Asia/Seoul')
  assert.equal('sourceKind' in plain[0], false, '원본 없이 시작하면 원본 필드를 보내지 않는다')
})
