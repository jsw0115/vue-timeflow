// 포트폴리오 공개 링크(Q-22): 만들기·목록·닫기 요청과 화면 문구. 링크 공개는 주소가 만들 때 한 번만 보이고, 전체 공개는 목록에 남는다.

import { korean } from './careerPeriods.mjs'

export const LINK_PATH = '/api/work/portfolio-links'
export const SCOPES = [
  { id: 'link', label: '링크 공개', desc: '링크를 받은 사람만 볼 수 있어요. 기간이 지나면 닫히고, 검색에 나오지 않게 해요.' },
  { id: 'public', label: '전체 공개', desc: '링크를 아는 누구나 볼 수 있고 닫을 때까지 열려 있어요. 검색에 나올 수 있어요.' },
]
export const LINK_DAYS = [1, 7, 30]
/** 링크 공개의 선택 비밀번호 길이(Q-39, 서버 PortfolioLinkController와 같음). */
export const PASSWORD_MIN = 4
export const PASSWORD_MAX = 100

export function createPortfolioLinkClient(request) {
  return {
    list: () => request(LINK_PATH),
    create: ({ itemIds, scope, expiresInDays, password = '' }) => request(LINK_PATH, { method: 'POST', body: JSON.stringify(scope === 'public' ? { itemIds, scope } : { itemIds, scope: 'link', expiresInDays, ...(password ? { password } : {}) }) }),
    revoke: (id) => request(`${LINK_PATH}/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  }
}

/** 앱 안의 공개 화면 경로. 실제 주소는 화면이 router.resolve로 만든다(해시·기본 경로 차이를 router가 처리). */
export const publicPagePath = (token) => `/p/${token}`
export const scopeLabel = (scope) => SCOPES.find((s) => s.id === scope)?.label ?? '링크 공개'

/** 만료 문구. 전체 공개는 만료가 없다. t는 화면 표시용 번역(기본 한국어)이다. */
export function expiryText(link, now = Date.now(), t = korean) {
  if (!link?.expiresAt) return t('닫을 때까지 열려 있어요')
  const left = Date.parse(link.expiresAt) - now
  if (!(left > 0)) return t('기간이 지났어요')
  const days = Math.ceil(left / 86400000)
  return days === 1 ? t('1일 뒤 닫혀요') : t('{n}일 뒤 닫혀요', { n: days })
}

/** 공개 화면: 비밀번호가 걸린 링크 열기(Q-39). 비밀번호는 주소에 넣지 않고 본문으로 보낸다. */
export const unlockPublic = (request, token, password) => request(`/api/public/portfolios/${token}/unlock`, { method: 'POST', body: JSON.stringify({ password }) })
export function unlockErrorText(error) {
  if (error?.status === 401) return '비밀번호가 맞지 않아요. 다시 넣어 주세요.'
  if (error?.status === 403) return error.message || '비밀번호를 여러 번 틀려 이 링크를 잠갔어요. 링크를 보낸 사람에게 새 링크를 받아 주세요.'
  if (error?.status === 404) return '이 링크는 닫혔거나 기간이 지났어요. 링크를 보낸 사람에게 새 링크를 받아 주세요.'
  return '포트폴리오를 열지 못했어요. 잠시 뒤 다시 시도해 주세요.'
}

export function linkErrorText(error) {
  if (error?.status === 409) return error.message || '열어 둔 공개 링크가 너무 많아요. 쓰지 않는 링크를 먼저 닫아 주세요.'
  if (error?.status === 404) return '항목이나 링크를 찾지 못했어요. 목록을 새로 불러와 주세요.'
  if (error?.status === 400) return error.message || '공개할 항목과 범위를 확인해 주세요.'
  if (error?.status == null || error.status === 0) return '서버에 연결하지 못했어요. 연결을 확인하고 다시 시도해 주세요.'
  return '공개 링크를 바꾸지 못했어요. 잠시 뒤 다시 시도해 주세요.'
}
