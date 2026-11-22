// 로그인 계정의 서버 주소록(/api/contacts) 규칙과 계정 연결 요청(Q-21). 연결 값(accountId·accountNickname)은 서버만 정하므로 일반 저장에 보내지 않는다.

export const CONTACT_PATH = '/api/contacts'
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** 화면 값 → 서버 본문. 빈 관계·이메일은 보내지 않는다. */
export function contactBody(fields) {
  const body = { name: String(fields.name ?? '').trim() }
  for (const key of ['relation', 'email']) { const value = String(fields[key] ?? '').trim(); if (value) body[key] = value }
  if (typeof fields.favorite === 'boolean') body.favorite = fields.favorite
  return body
}

export function contactDraftError(draft) {
  if (!String(draft.name ?? '').trim()) return '이름을 입력해 주세요.'
  const email = String(draft.email ?? '').trim()
  if (email && !EMAIL.test(email)) return '이메일 형식을 확인해 주세요.'
  return ''
}

/** 담당자로 고를 수 있는 사람: 계정에 연결된 연락처만. 값은 계정 ID다. */
export const assignablePeople = (contacts) => (contacts ?? []).filter((c) => c.accountId).map((c) => ({ id: c.accountId, name: c.name, nickname: c.accountNickname ?? '' }))

export function linkAccount(request, contact) {
  return request(`${CONTACT_PATH}/${encodeURIComponent(contact.id)}/account`, { method: 'POST', body: JSON.stringify({ version: contact.version }) })
}
export function unlinkAccount(request, contact) {
  return request(`${CONTACT_PATH}/${encodeURIComponent(contact.id)}/account?version=${encodeURIComponent(contact.version)}`, { method: 'DELETE' })
}

export function linkErrorText(error) {
  if (error?.status === 404) return '그 이메일로 가입한 사람을 찾지 못했어요. 이메일을 확인해 주세요.'
  if (error?.status === 429) return '사람 찾기를 너무 자주 했어요. 1분 뒤에 다시 해 주세요.'
  if (error?.status === 409) return '다른 곳에서 먼저 바뀌었어요. 목록을 새로 불러왔으니 다시 시도해 주세요.'
  if (error?.status === 400) return error.message || '연락처에 이메일이 있어야 계정과 연결할 수 있어요.'
  if (error?.status == null || error.status === 0) return '서버에 연결하지 못했어요. 연결을 확인하고 다시 시도해 주세요.'
  return '계정 연결을 바꾸지 못했어요. 잠시 뒤 다시 시도해 주세요.'
}
