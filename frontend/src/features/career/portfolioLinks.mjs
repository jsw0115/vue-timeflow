// 포트폴리오 공개 링크(Q-22): 만들기·목록·닫기 요청과 화면 문구. 링크 공개는 주소가 만들 때 한 번만 보이고, 전체 공개는 목록에 남는다.

export const LINK_PATH = '/api/work/portfolio-links'
export const SCOPES = [
  { id: 'link', label: '링크 공개', desc: '링크를 받은 사람만 볼 수 있어요. 기간이 지나면 닫히고, 검색에 나오지 않게 해요.' },
  { id: 'public', label: '전체 공개', desc: '링크를 아는 누구나 볼 수 있고 닫을 때까지 열려 있어요. 검색에 나올 수 있어요.' },
]
export const LINK_DAYS = [1, 7, 30]

export function createPortfolioLinkClient(request) {
  return {
    list: () => request(LINK_PATH),
    create: ({ itemIds, scope, expiresInDays }) => request(LINK_PATH, { method: 'POST', body: JSON.stringify(scope === 'public' ? { itemIds, scope } : { itemIds, scope: 'link', expiresInDays }) }),
    revoke: (id) => request(`${LINK_PATH}/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  }
}

/** 앱 안의 공개 화면 경로. 실제 주소는 화면이 router.resolve로 만든다(해시·기본 경로 차이를 router가 처리). */
export const publicPagePath = (token) => `/p/${token}`
export const scopeLabel = (scope) => SCOPES.find((s) => s.id === scope)?.label ?? '링크 공개'

/** 만료 문구. 전체 공개는 만료가 없다. */
export function expiryText(link, now = Date.now()) {
  if (!link?.expiresAt) return '닫을 때까지 열려 있어요'
  const left = Date.parse(link.expiresAt) - now
  if (!(left > 0)) return '기간이 지났어요'
  const days = Math.ceil(left / 86400000)
  return `${days}일 뒤 닫혀요`
}

export function linkErrorText(error) {
  if (error?.status === 409) return error.message || '열어 둔 공개 링크가 너무 많아요. 쓰지 않는 링크를 먼저 닫아 주세요.'
  if (error?.status === 404) return '항목이나 링크를 찾지 못했어요. 목록을 새로 불러와 주세요.'
  if (error?.status === 400) return error.message || '공개할 항목과 범위를 확인해 주세요.'
  if (error?.status == null || error.status === 0) return '서버에 연결하지 못했어요. 연결을 확인하고 다시 시도해 주세요.'
  return '공개 링크를 바꾸지 못했어요. 잠시 뒤 다시 시도해 주세요.'
}
