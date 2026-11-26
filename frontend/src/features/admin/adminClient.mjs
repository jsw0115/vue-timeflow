// 관리자 셸의 서버 권한 확인과 사용자 관리·지표 API를 한곳에 둔다. 권한은 서버 응답으로만 판단한다(PR-10 5단계, UF-117).

export const ADMIN_ACCESS_TEXT = {
  signedOut: '관리자 화면은 관리자 계정으로 로그인해야 볼 수 있어요. 로그인한 뒤 다시 열어 주세요.',
  forbidden: '이 계정에는 관리자 권한이 없어요. 관리자 화면이 필요하면 운영 책임자에게 권한을 요청해 주세요.',
  // 운영 프록시는 바깥에서 들어온 /api/admin 요청을 404로 막는다(infra/deploy/nginx.conf, runbook)
  blocked: '이 주소에서는 관리자 화면을 열 수 없어요. 운영에서는 승인된 내부 접근 경로로 접속해 주세요.',
  error: '관리자 권한을 확인하지 못했어요. 연결을 확인하고 다시 시도해 주세요.',
}

/**
 * 관리자 지표를 불러 권한을 확인한다. 로그인 정보에 적힌 역할은 쓰지 않는다.
 * 돌려주는 state는 allowed·signedOut·forbidden·blocked·error 중 하나다(UT-199).
 */
export async function checkAdminAccess(request, signedIn) {
  if (!signedIn) return { state: 'signedOut' }
  try {
    return { state: 'allowed', metrics: await request('/api/admin/stats') }
  } catch (error) {
    if (error?.status === 401) return { state: 'signedOut' }
    if (error?.status === 403) return { state: 'forbidden' }
    if (error?.status === 404) return { state: 'blocked' }
    return { state: 'error' }
  }
}

/**
 * 사용자 화면의 관리자 콘솔 버튼을 보일지 정한다. 서버가 DB에서 읽은 내 역할(GET /api/auth/me)을 쓰고 로그인 정보에 적힌 역할은 쓰지 않는다.
 * 관리자 지표를 부르지 않아 일반 사용자가 403을 받지 않는다. 콘솔에 들어가면 checkAdminAccess로 다시 확인한다(IMP-021).
 * 돌려주는 값: true(관리자), false(관리자 아님·로그인 만료), null(연결 실패·서버 오류로 확인하지 못함. 다음에 다시 확인한다).
 */
export async function checkAdminRole(request, signedIn) {
  if (!signedIn) return false
  try {
    return (await request('/api/auth/me'))?.role === 'ADMIN'
  } catch (error) {
    return error?.status === 401 || error?.status === 403 || error?.status === 404 ? false : null
  }
}

// 삭제 상태는 '삭제됨'이다. '삭제'는 버튼 이름(영어 "Delete")과 겹친다(PR-32 14단계)
export const USER_STATUS = { ACTIVE: '활성', SUSPENDED: '정지', DELETED: '삭제됨' }
export const USER_ROLE = { USER: '일반', ADMIN: '관리자' }

/** 서버 사용자 행을 화면 행으로 바꾼다. */
export function toUserRow(row) {
  return { ...row, state: USER_STATUS[row.status] ?? row.status, roleLabel: USER_ROLE[row.role] ?? row.role, joined: String(row.createdAt ?? '').slice(0, 10) }
}

export function adminErrorText(error) {
  if (error?.status == null || error.status === 0) return '서버에 연결하지 못했어요. 연결을 확인하고 다시 시도해 주세요.'
  if (error.status === 403) return ADMIN_ACCESS_TEXT.forbidden
  return error.message || '요청을 처리하지 못했어요. 잠시 뒤 다시 시도해 주세요.'
}

/** request는 apiRequest처럼 성공 응답의 data를 돌려주고 실패면 status를 담아 던지는 함수다. */
export function createAdminClient({ request }) {
  const q = encodeURIComponent
  return {
    metrics: () => request('/api/admin/stats'),
    /** 서버는 한 번에 100명까지 준다. 검색이 모든 계정에 닿도록 끝 쪽까지 이어 부른다(최대 maxPages쪽). */
    async allUsers({ maxPages = 50 } = {}) {
      const items = []
      let total = 0
      for (let page = 0; page < maxPages; page += 1) {
        const chunk = await request(`/api/admin/users?page=${page}&size=100`)
        total = chunk?.total ?? 0
        items.push(...(chunk?.items ?? []))
        if (!chunk?.items?.length || items.length >= total) break
      }
      return { items, total }
    },
    setStatus: (user, status) => request(`/api/admin/users/${q(user.id)}`, { method: 'PUT', body: JSON.stringify({ status }) }),
    forceLogout: (user) => request(`/api/admin/users/${q(user.id)}/force-logout`, { method: 'POST' }),
  }
}
