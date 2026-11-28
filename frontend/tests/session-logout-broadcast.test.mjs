// 한 창에서 로그아웃하면 같은 계정의 다른 창(관리자 창)도 자기 refresh 토큰을 폐기하고 세션을 지우는지 검증한다.
import test from 'node:test'
import assert from 'node:assert/strict'

const settle = () => new Promise((resolve) => setTimeout(resolve, 50))

test('로그아웃 알림을 받은 같은 계정 창은 자기 토큰을 서버에서 폐기한 뒤 세션을 지우고, 이 창의 로그아웃도 알린다', async () => {
  const stored = new Map()
  globalThis.sessionStorage = { getItem: (k) => stored.get(k) ?? null, setItem: (k, v) => stored.set(k, v) }
  const original = globalThis.fetch
  const logoutBodies = []
  globalThis.fetch = async (url, options = {}) => {
    const json = (status, data) => ({ ok: status < 400, status, json: async () => ({ success: status < 400, data }) })
    if (url.endsWith('/api/auth/login')) return json(200, { userId: 'u1', email: 'a@example.test', nickname: 'a', role: 'ADMIN', accessToken: 'access-1', refreshToken: 'rotated-in-this-window' })
    if (url.endsWith('/api/auth/logout')) logoutBodies.push(JSON.parse(options.body))
    return json(200, {})
  }
  const peer = new BroadcastChannel('timeflow.auth.v1')
  try {
    const { session, login, logout } = await import('../src/features/auth/session.js')
    await login('a@example.test', 'password-1')

    peer.postMessage({ type: 'logout', userId: 'someone-else' })
    await settle()
    assert.equal(session.userId, 'u1', '다른 계정의 로그아웃 알림으로는 세션을 지우지 않는다')

    peer.postMessage({ type: 'logout', userId: 'u1' })
    await settle()
    assert.equal(session.userId, undefined)
    assert.equal(session.refreshToken, undefined)
    assert.deepEqual(logoutBodies, [{ refreshToken: 'rotated-in-this-window' }], '이 창이 들고 있던 refresh 토큰을 서버에서 폐기한다')

    await login('a@example.test', 'password-1')
    const received = new Promise((resolve) => { peer.onmessage = ({ data }) => resolve(data) })
    await logout()
    assert.deepEqual(await received, { type: 'logout', userId: 'u1' })
  } finally {
    peer.close(); globalThis.fetch = original; delete globalThis.sessionStorage
  }
})
