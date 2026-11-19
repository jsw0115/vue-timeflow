// 친구·차단·공유 그룹·그룹 캘린더 API를 부르고, 화면이 쓰는 공유 범위 이름과 목록 나누기를 한곳에 둔다(PR-10 2단계, UF-110~UF-113).

/** 공유 범위. 서버 값(none·busy·title·detail)과 화면 이름을 잇는다. 범위 밖 내용은 서버가 보내지 않는다(UF-112). */
export const SHARE_LEVELS = [
  { id: 'none', label: '공유 안 함', desc: '이 그룹에 내 일정을 보이지 않아요.' },
  { id: 'busy', label: '바쁜 시간만', desc: '시간만 보이고 제목과 내용은 보내지 않아요.' },
  { id: 'title', label: '제목 포함', desc: '시간과 제목이 보여요.' },
  { id: 'detail', label: '상세 포함', desc: '시간, 제목, 내용, 분류, 색이 보여요.' },
]
export const levelLabel = (id) => SHARE_LEVELS.find((level) => level.id === id)?.label ?? '공유 안 함'

/** 친구 행을 친구·받은 요청·보낸 요청으로 나눈다. 서버 행의 friendId·friendName이 상대방이다. */
export function splitFriends(rows, me) {
  const result = { friends: [], received: [], sent: [] }
  for (const row of rows ?? []) {
    if (row.status === 'ACCEPTED') result.friends.push(row)
    else if (row.recipientId === me) result.received.push(row)
    else result.sent.push(row)
  }
  return result
}

/** 날짜가 든 주의 월요일부터 일요일까지를 YYYY-MM-DD로 돌려준다(기기 시간 기준). */
export function weekRange(today = new Date()) {
  const day = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const monday = new Date(day)
  monday.setDate(day.getDate() - ((day.getDay() + 6) % 7))
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const text = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return { from: text(monday), to: text(sunday) }
}

/** 실패를 화면 문구로 바꾼다. 서버가 준 문구가 있으면 그대로 쓰고, 연결 실패면 다시 해 보라고 알린다. */
export function shareErrorText(error) {
  if (error?.status == null || error.status === 0) return '서버에 연결하지 못했어요. 연결을 확인하고 다시 시도해 주세요.'
  if (error.status === 403) return '이 작업을 할 권한이 없어요. 그룹에서 빠졌거나 차단된 사이일 수 있어요.'
  return error.message || '요청을 처리하지 못했어요. 잠시 뒤 다시 시도해 주세요.'
}

/** request는 features/auth/apiRequest.js처럼 성공 응답의 data를 돌려주고 실패면 status를 담아 던지는 함수다. */
export function createShareClient({ request }) {
  const q = encodeURIComponent
  const send = (path, method, body) => request(path, { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) })
  const group = (id) => `/api/share/groups/${q(id)}`
  return {
    findPerson: (email) => request(`/api/share/people?email=${q(email.trim())}`),
    friends: () => request('/api/share/friends'),
    inviteFriend: (userId) => send('/api/share/friends/invite', 'POST', { userId }),
    acceptFriend: (id) => send(`/api/share/friends/${q(id)}/accept`, 'POST'),
    rejectFriend: (id) => send(`/api/share/friends/${q(id)}/reject`, 'POST'),
    removeFriend: (id) => send(`/api/share/friends/${q(id)}`, 'DELETE'),
    blocks: () => request('/api/share/blocks'),
    block: (userId) => send(`/api/share/blocks/${q(userId)}`, 'PUT'),
    unblock: (userId) => send(`/api/share/blocks/${q(userId)}`, 'DELETE'),
    groups: () => request('/api/share/groups'),
    group: (id) => request(group(id)),
    createGroup: ({ title, description }) => send('/api/share/groups', 'POST', { title, description }),
    deleteGroup: (row) => send(`${group(row.id)}?version=${q(row.version)}`, 'DELETE'),
    members: (id) => request(`${group(id)}/members`),
    invited: (id) => request(`${group(id)}/members?status=invited`),
    inviteMember: (id, userId) => send(`${group(id)}/members`, 'POST', { userId }),
    removeMember: (id, userId) => send(`${group(id)}/members/${q(userId)}`, 'DELETE'),
    join: (id) => send(`${group(id)}/join`, 'POST'),
    setLevel: (id, level) => send(`${group(id)}/share-level`, 'PUT', { level }),
    schedules: (id, { from, to }) => request(`${group(id)}/schedules?from=${q(from)}&to=${q(to)}`),
    preview: (id, viewerId, { from, to }) => request(`${group(id)}/preview?viewerId=${q(viewerId)}&from=${q(from)}&to=${q(to)}`),
  }
}
