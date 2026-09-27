import { authorizedFetch, session } from '../../auth/session'
import { demoChatApi } from './demoChatApi'

async function request(path, method = 'GET', body) {
  const response = await authorizedFetch(`/api/chat${path}`, { method, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) })
  if (response.status === 204) return null
  const payload = await response.json().catch(() => ({}))
  if (!response.ok || !payload.success) {
    const error = new Error(payload.message || (response.status === 401 ? '로그인 후 대화를 이어갈 수 있어요.' : '채팅에 연결하지 못했습니다. 다시 시도해주세요.'))
    error.status = response.status
    throw error
  }
  return payload.data
}
const id = encodeURIComponent
const liveChatApi = {
  rooms: before => request(`/rooms${before ? `?before=${id(before)}` : ''}`),
  room: room => request(`/rooms/${id(room)}`),
  person: email => request(`/people?email=${id(email)}`),
  create: data => request('/rooms', 'POST', data),
  messages: (room, query = {}) => request(`/rooms/${id(room)}/messages?${new URLSearchParams(query)}`),
  send: (room, message) => request(`/rooms/${id(room)}/messages`, 'POST', message),
  read: (room, sequence) => request(`/rooms/${id(room)}/read`, 'PUT', { sequence }),
  typing: room => request(`/rooms/${id(room)}/typing`, 'POST'),
  leave: room => request(`/rooms/${id(room)}/members/me`, 'DELETE'),
  transfer: (room, userId) => request(`/rooms/${id(room)}/owner`, 'PUT', { userId }),
  mentions: query => request(`/mentions?${new URLSearchParams(query)}`),
  readMention: message => request(`/mentions/${id(message)}/read`, 'PUT'),
  tags: after => request(`/tags${after ? `?after=${id(after)}` : ''}`),
  tagged: query => request(`/tagged-messages?${new URLSearchParams(query)}`),
}
export const chatApi = Object.fromEntries(Object.entries(liveChatApi).map(([name, live]) => [name, (...args) => session.accessToken ? live(...args) : Promise.resolve().then(() => demoChatApi[name](...args))]))
