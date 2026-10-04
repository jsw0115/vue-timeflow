import { reactive } from 'vue'
import { apiEndpoint } from './apiEndpoint.mjs'

const key = 'timeflow.session.v1'
function restore() {
  try { return JSON.parse(sessionStorage.getItem(key) || 'null') || {} } catch { return {} }
}
export const session = reactive(restore())
let refreshing
function save(value) {
  for (const field of Object.keys(session)) delete session[field]
  Object.assign(session, value)
  sessionStorage.setItem(key, JSON.stringify(value))
}
export function clearSession() { save({}) }
async function publicRequest(path, body) {
  const response = await fetch(apiEndpoint(`/api/auth/${path}`), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok || !payload.success) throw new Error(payload.message || '서버에 연결하지 못했습니다. 잠시 후 다시 시도해주세요.')
  return payload.data
}
export async function login(email, password) { save(await publicRequest('login', { email, password })) }
export async function signup(body) { return publicRequest('signup', body) }
export async function logout() {
  try { await authorizedFetch('/api/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken: session.refreshToken }) }) }
  finally { clearSession() }
}
async function refresh() {
  if (!session.refreshToken) return false
  if (!refreshing) {
    const original = session.refreshToken
    refreshing = publicRequest('refresh', { refreshToken: original }).then(tokens => {
      if (session.refreshToken !== original) return false
      save({ ...session, ...tokens }); return true
    }).catch(() => { if (session.refreshToken === original) clearSession(); return false }).finally(() => { refreshing = null })
  }
  return refreshing
}
export async function authorizedFetch(url, options = {}) {
  const run = () => fetch(apiEndpoint(url), { ...options, headers: { 'Content-Type': 'application/json', ...options.headers, ...(session.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}) } })
  let response = await run()
  if (response.status === 401 && await refresh()) response = await run()
  return response
}
