// 로그인·토큰 갱신 때 계정 감시가 토큰이 갖춰진 세션만 보는지 검증한다(BUG-003).
import test from 'node:test'
import assert from 'node:assert/strict'
import { watch } from 'vue'

test('BUG-003: 로그인하면 userId가 바뀌는 순간 토큰이 이미 있고, 토큰 갱신은 계정 감시를 다시 깨우지 않는다', async () => {
  const stored = new Map()
  globalThis.sessionStorage = { getItem: (k) => stored.get(k) ?? null, setItem: (k, v) => stored.set(k, v) }
  const original = globalThis.fetch
  const tokens = { access: 'access-1', refresh: 'refresh-1' }
  globalThis.fetch = async (url, options = {}) => {
    const json = (status, data) => ({ ok: status < 400, status, json: async () => ({ success: status < 400, data }) })
    if (url.endsWith('/api/auth/login')) return json(200, { userId: 'u1', email: 'a@example.test', nickname: 'a', role: 'USER', accessToken: tokens.access, refreshToken: tokens.refresh })
    if (url.endsWith('/api/auth/refresh')) return json(200, { accessToken: 'access-2', refreshToken: 'refresh-2' })
    // 처음 토큰은 만료된 것으로 보고 401, 갱신한 토큰은 통과
    return json(options.headers?.Authorization === 'Bearer access-2' ? 200 : 401, {})
  }
  try {
    const { session, login, authorizedFetch } = await import('../src/features/auth/session.js')
    // 기록 저장소(useRecordCollection 등)처럼 계정 변경을 동기로 감시한다
    const seen = []
    watch(() => session.userId, (owner) => seen.push({ owner, accessToken: session.accessToken }), { flush: 'sync' })
    await login('a@example.test', 'password-1')
    assert.deepEqual(seen, [{ owner: 'u1', accessToken: 'access-1' }])
    const response = await authorizedFetch('/api/tasks')
    assert.equal(response.status, 200)
    assert.equal(session.accessToken, 'access-2')
    assert.equal(seen.length, 1, '같은 계정의 토큰 갱신으로 목록을 다시 비우고 불러오지 않는다')
  } finally { globalThis.fetch = original; delete globalThis.sessionStorage }
})
