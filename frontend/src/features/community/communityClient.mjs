// 커뮤니티 목록·가입·게시글·댓글·좋아요 API를 부르고, 화면이 쓰는 가입 상태 버튼·필터·탭을 한곳에 둔다(PR-10 3단계, UF-114).

export const COMMUNITY_CATEGORIES = ['운동', '공부', '일상', '갓생']

/** 내 가입 상태(membership·role)와 가입 방식으로 화면 버튼을 정한다. action은 화면이 할 일이다. */
export function membershipAction(community) {
  const state = community?.membership ?? 'NONE'
  if (state === 'ACTIVE') return community.role === 'owner' ? { label: '방장', action: 'none', state: '참여 중' } : { label: '나가기', action: 'leave', state: '참여 중' }
  if (state === 'PENDING') return { label: '신청 취소', action: 'cancel', state: '승인 대기' }
  if (state === 'INVITED') return { label: '초대 수락', action: 'join', state: '초대받음' }
  const again = state === 'REJECTED' ? '다시 ' : ''
  return community?.joinPolicy === 'approval' ? { label: again + '가입 신청', action: 'apply', state: state === 'REJECTED' ? '신청이 거절됨' : '' } : { label: '가입하기', action: 'join', state: '' }
}

/** 분류·검색어로 거르고 멤버순·최신순으로 정렬한다. 검색은 이름과 소개에서 찾는다. */
export function filterCommunities(list, { category = '', query = '', sort = 'members' } = {}) {
  const word = query.trim()
  const rows = (list ?? []).filter((c) => (!category || c.category === category) && (!word || String(c.title ?? '').includes(word) || String(c.desc ?? '').includes(word)))
  return rows.sort(sort === 'new' ? (a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')) : (a, b) => (b.members ?? 0) - (a.members ?? 0))
}

/** 커뮤니티 하위 화면 탭. 서버 커뮤니티 ID를 쿼리로 넘기고, 방장에게만 가입 요청함을 보인다. */
export function communityTabs(id, isOwner = false) {
  const q = '?id=' + encodeURIComponent(id)
  return [
    { label: '커뮤니티 홈', path: '/community/home' + q },
    { label: '게시판', path: '/community/board' + q },
    { label: '챌린지', path: '/community/challenge' + q },
    { label: '멤버', path: '/community/members' + q },
    ...(isOwner ? [{ label: '가입 요청함', path: '/community/approvals' + q }] : []),
  ]
}

/** 서버가 준 UTC 시각(ISO)을 기기 시간대의 YYYY-MM-DD HH:mm으로 바꾼다. 읽을 수 없으면 빈 문자열이다. */
export function localTime(iso) {
  const d = new Date(iso ?? '')
  if (!iso || Number.isNaN(d.getTime())) return ''
  const two = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())} ${two(d.getHours())}:${two(d.getMinutes())}`
}

export function communityErrorText(error) {
  if (error?.status == null || error.status === 0) return '서버에 연결하지 못했어요. 연결을 확인하고 다시 시도해 주세요.'
  if (error.status === 403) return '이 커뮤니티 회원만 할 수 있어요. 가입했거나 방장인지 확인해 주세요.'
  if (error.status === 404) return '커뮤니티를 찾을 수 없어요. 비공개이거나 없어진 커뮤니티일 수 있어요.'
  return error.message || '요청을 처리하지 못했어요. 잠시 뒤 다시 시도해 주세요.'
}

/** request는 features/auth/apiRequest.js처럼 성공 응답의 data를 돌려주고 실패면 status를 담아 던지는 함수다. */
export function createCommunityClient({ request }) {
  const q = encodeURIComponent
  const send = (path, method, body) => request(path, { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) })
  const base = (id) => `/api/communities/${q(id)}`
  async function pages(path) {
    const rows = []
    for (let page = 0; ; page++) {
      const result = await request(`${path}${path.includes('?') ? '&' : '?'}page=${page}&size=100`)
      const items = result?.items ?? []
      rows.push(...items)
      if (!items.length || rows.length >= (result?.total ?? 0)) return rows
    }
  }
  return {
    list: () => pages('/api/communities'),
    get: (id) => request(base(id)),
    create: (body) => send('/api/communities', 'POST', body),
    join: (id, message = '') => send(`${base(id)}/join`, 'POST', message ? { message } : {}),
    /** 나가기·신청 취소·내보내기 모두 멤버 행 삭제다. */
    removeMember: (id, userId) => send(`${base(id)}/members/${q(userId)}`, 'DELETE'),
    members: (id) => request(`${base(id)}/members`),
    /** 방장이 계정 ID로 초대한다. 초대받은 사람이 가입하면 가입 방식과 관계없이 바로 회원이 된다. */
    invite: (id, userId) => send(`${base(id)}/members`, 'POST', { userId }),
    requests: (id) => request(`${base(id)}/join-requests`),
    decide: (id, userId, approved, reason = '') => send(`${base(id)}/join-requests/${q(userId)}`, 'PUT', { approved, reason }),
    posts: (id) => pages(`${base(id)}/posts`),
    createPost: (id, body) => send(`${base(id)}/posts`, 'POST', { body }),
    deletePost: (id, post) => send(`${base(id)}/posts/${q(post.id)}?version=${q(post.version)}`, 'DELETE'),
    comments: (id, postId) => request(`${base(id)}/posts/${q(postId)}/comments`),
    comment: (id, postId, body) => send(`${base(id)}/posts/${q(postId)}/comments`, 'POST', { body }),
    like: (id, postId, liked) => send(`${base(id)}/posts/${q(postId)}/like`, 'PUT', { liked }),
  }
}
