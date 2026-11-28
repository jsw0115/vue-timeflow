import { reactive } from 'vue'
import { apiEndpoint } from './apiEndpoint.mjs'

const key = 'timeflow.session.v1'
function restore() {
  try { return JSON.parse(sessionStorage.getItem(key) || 'null') || {} } catch { return {} }
}
export const session = reactive(restore())
/** 서버가 세션을 끝냈을 때(정지·강제 로그아웃·refresh 만료) 화면에 알리기 위한 표시. 사용자가 로그아웃하면 켜지 않는다(BUG-015) */
export const sessionNotice = reactive({ ended: false })
let refreshing
function save(value) {
  // 기록 저장소는 userId를 동기로 감시해 바로 목록을 부른다. 토큰을 먼저 넣고 userId를 마지막에 넣어야 첫 요청에 토큰이 실린다.
  // 같은 계정의 토큰 갱신은 userId를 지웠다 다시 넣지 않아 목록을 비우고 다시 부르지 않는다(BUG-003)
  for (const field of Object.keys(session)) if (!(field in value)) delete session[field]
  const { userId, ...rest } = value
  Object.assign(session, rest)
  if ('userId' in value) session.userId = userId
  if (userId) sessionNotice.ended = false
  sessionStorage.setItem(key, JSON.stringify(value))
}
export function clearSession() { save({}) }
// 같은 기기의 다른 창에도 로그아웃을 알린다. window.open으로 연 관리자 창은 토큰이 든 sessionStorage 사본을 따로 갖고,
// 먼저 갱신했다면 이 창이 모르는 refresh 토큰을 들고 있다. 알림을 받은 창은 자기 토큰을 서버에서 폐기한 뒤 지운다
const authChannel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel('timeflow.auth.v1')
authChannel?.unref?.()
if (authChannel) authChannel.onmessage = ({ data }) => {
  if (data?.type === 'logout' && data.userId && data.userId === session.userId) endSession().catch(() => {})
}
async function publicRequest(path, body) {
  let response
  try {
    response = await fetch(apiEndpoint(`/api/auth/${path}`), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  } catch {
    // 네트워크가 끊겼거나 서버가 꺼져 있다. 브라우저 영문 오류('Failed to fetch')를 그대로 보이지 않는다
    throw new Error('서버에 연결하지 못했습니다. 잠시 후 다시 시도해주세요.')
  }
  const payload = await response.json().catch(() => ({}))
  // 서버가 답했지만 JSON 안내가 없으면(허용되지 않은 출처 403, 프록시 502 등) 연결 실패가 아니라 상태 코드로 알린다
  if (!response.ok || !payload.success) throw new Error(payload.message || `서버가 요청을 처리하지 못했어요(HTTP ${response.status}). 잠시 후 다시 시도해주세요.`)
  return payload.data
}
export async function login(email, password) { save(await publicRequest('login', { email, password })) }
export async function signup(body) { return publicRequest('signup', body) }
async function endSession() {
  try { await authorizedFetch('/api/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken: session.refreshToken }) }) }
  finally { clearSession() }
}
export async function logout() {
  const userId = session.userId
  try { await endSession() }
  finally { authChannel?.postMessage({ type: 'logout', userId }) }
}
async function refresh() {
  if (!session.refreshToken) return false
  if (!refreshing) {
    const original = session.refreshToken
    refreshing = publicRequest('refresh', { refreshToken: original }).then(tokens => {
      if (session.refreshToken !== original) return false
      save({ ...session, ...tokens }); return true
    }).catch(() => { if (session.refreshToken === original) { clearSession(); sessionNotice.ended = true } return false }).finally(() => { refreshing = null })
  }
  return refreshing
}
export async function authorizedFetch(url, options = {}) {
  const contentHeaders = typeof FormData !== 'undefined' && options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }
  const run = () => fetch(apiEndpoint(url), { ...options, headers: { ...contentHeaders, ...options.headers, ...(session.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}) } })
  let response = await run()
  if (response.status === 401 && await refresh()) response = await run()
  return response
}
