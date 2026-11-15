// 미지원·오류 응답이 연결 또는 동기화 성공으로 표시되지 않는지 검증한다.
import test from 'node:test'
import assert from 'node:assert/strict'
import { loadIntegrationStatus } from '../src/features/integrations/integrationStatus.mjs'
test('unavailable capabilities override stale connected providers and success logs', async () => {
  const state = await loadIntegrationStatus(async url => url.endsWith('capabilities') ? [{ feature: 'calendar-sync', available: false }] : { available: true, providers: [{ id: 'google', connected: true, status: 'SUCCEEDED', lastSync: 'now' }], logs: [{ text: '성공' }], conflicts: [{}] })
  assert.equal(state.available, false); assert.ok(state.providers.every(row => !row.connected && row.lastSync === null)); assert.deepEqual(state.logs, []); assert.deepEqual(state.conflicts, [])
})
test('sync availability and a verified successful result are both required', async () => {
  const request = sync => async url => url.endsWith('capabilities') ? [{ feature: 'calendar-sync', available: true }] : sync
  assert.equal((await loadIntegrationStatus(request({ available: false, providers: [] }))).available, false)
  const state = await loadIntegrationStatus(request({ available: true, providers: [{ id: 'google', connected: true, status: 'FAILED', lastSync: 'fake' }] }))
  assert.equal(state.providers[0].lastSync, null); assert.equal(state.providers[0].label, '연결 확인 필요')
})
test('offline and malformed responses do not fall back to demo success', async () => {
  await assert.rejects(loadIntegrationStatus(async () => { throw new Error('offline') }), /offline/)
  await assert.rejects(loadIntegrationStatus(async () => ({})), /확인하지 못했습니다/)
})
