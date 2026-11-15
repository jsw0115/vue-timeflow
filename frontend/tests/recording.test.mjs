// 기록 명령의 응답 유실·새 화면 복구·계정 분리와 경과 시간 계산을 검증한다.
import test from 'node:test'
import assert from 'node:assert/strict'
import { createRecordingClient, recordingSeconds } from '../src/features/recording/recordingClient.mjs'

function storage() { const items = new Map(); return { getItem: k => items.get(k), setItem: (k,v) => items.set(k,v), removeItem: k => items.delete(k) } }
test('lost start response recovers the original server session after a page recreation', async () => {
  const cache = storage(); let saved, calls = 0
  const request = async (url, options) => {
    if (url.endsWith('/current')) return { active: saved, serverTime: '2026-11-15T03:00:00Z' }
    saved = { id: JSON.parse(options.body).requestId, state: 'RUNNING', startedAt: '2026-11-15T03:00:00Z', version: 1 }
    calls++; throw new Error('응답 유실')
  }
  const options = { request, storage: cache, owner: 'one', uuid: () => 'stable-start-request' }
  await assert.rejects(createRecordingClient(options).start('활동', 'Asia/Seoul'), /응답 유실/)
  const restored = createRecordingClient(options)
  assert.equal((await restored.recover()).active.id, saved.id)
  assert.equal(restored.pending(), null); assert.equal(calls, 1)
})
test('lost finish response keeps the exact end timestamp and request ID for retry after reload', async () => {
  const cache = storage(), bodies = []; let lose = true
  const request = async (url, options) => { bodies.push(JSON.parse(options.body)); if (lose) throw new Error('offline'); return { id: 'record', state: 'COMPLETED' } }
  const options = { request, storage: cache, owner: 'one', uuid: () => 'stable-finish-key', now: () => Date.parse('2026-11-15T03:13:00Z') }
  const client = createRecordingClient(options)
  await assert.rejects(client.finish({ id: 'record', version: 1, startedAt: '2026-11-15T03:00:00Z' }), /offline/)
  assert.equal(client.pending().body.endedAt, '2026-11-15T03:13:00.000Z')
  assert.equal(createRecordingClient({ ...options, owner: 'two' }).pending(), null)
  lose = false; await createRecordingClient(options).retryFinish()
  assert.deepEqual(bodies[0], bodies[1]); assert.equal(client.pending(), null)
})
test('storage failure prevents untracked server mutations and elapsed time uses instants', async () => {
  let calls = 0
  const client = createRecordingClient({ request: async () => { calls++ }, owner: 'one', storage: { getItem: () => null, setItem: () => { throw new Error('quota') } }, uuid: () => 'key' })
  await assert.rejects(client.start('활동', 'Asia/Seoul'), /quota/); assert.equal(calls, 0)
  assert.equal(recordingSeconds({ startedAt: '2026-11-15T03:00:00Z', endedAt: '2026-11-15T03:13:00Z' }), 780)
  assert.equal(recordingSeconds({ startedAt: '2026-11-15T03:00:00Z' }, Date.parse('2026-11-15T03:01:30Z')), 90)
})

test('definitively rejected commands do not trap the user in an unfinishable pending start', async () => {
  const cache = storage(); let conflict = true
  const active = { id: 'existing-record', version: 1, startedAt: '2026-11-15T03:00:00Z' }
  const client = createRecordingClient({ storage: cache, owner: 'one', uuid: () => 'new-request-key', now: () => Date.parse('2026-11-15T03:01:00Z'), request: async path => {
    if (conflict) throw Object.assign(new Error('진행 중인 기록'), { status: 409 })
    if (path.endsWith('/current')) return { active }
    return { ...active, state: 'COMPLETED' }
  } })
  await assert.rejects(client.start('새 활동', 'Asia/Seoul'), /진행 중/)
  assert.equal(client.pending(), null)
  conflict = false
  assert.equal((await client.finish((await client.recover()).active)).state, 'COMPLETED')
})

test('API errors preserve the HTTP rejection status for command reconciliation', async () => {
  globalThis.sessionStorage = { getItem: () => null, setItem: () => {} }
  const original = globalThis.fetch
  try {
    globalThis.fetch = async () => ({ status: 400, ok: false, json: async () => ({ success: false, message: '종료 시각 오류' }) })
    const { apiRequest } = await import('../src/features/auth/apiRequest.js')
    await assert.rejects(apiRequest('/api/planner/recordings/test/finish'), e => e.status === 400 && e.message === '종료 시각 오류')
  } finally { globalThis.fetch = original; delete globalThis.sessionStorage }
})
