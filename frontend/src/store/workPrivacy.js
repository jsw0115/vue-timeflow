import { reactive, watch } from 'vue'

/**
 * 업무·경력 데이터 보호 정책.
 *
 * 요구사항: 업무 카테고리와 경력기술서·이력서·포트폴리오는 다른 사용자에게 절대 노출되지 않아야 한다.
 * 그래서 이 저장소는 "공개 가능 여부"를 데이터가 아니라 정책으로 강제한다.
 *   - PRIVATE_DOMAINS 에 속한 기록은 공유·랭킹·커뮤니티 어디에도 올라가지 않는다.
 *   - 공유 페이로드를 만들 때는 반드시 sanitizeForShare()를 거치게 해서, 실수로 넘겨도 걸러지게 한다.
 *   - 포트폴리오만 예외적으로 "링크를 아는 사람"에게 공개할 수 있고, 그때도 항목 단위로 사용자가 고른다.
 */
const STORAGE_KEY = 'timeflow.workPrivacy.v1'

/** 어떤 경우에도 타 사용자에게 노출하지 않는 도메인 */
export const PRIVATE_DOMAINS = ['work', 'wbs', 'career', 'resume', 'portfolio']

export const VISIBILITY = {
  private: { label: '나만 보기', desc: '어디에도 공개되지 않아요' },
  link: { label: '링크가 있는 사람', desc: '링크를 받은 사람만 볼 수 있어요' },
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export const workPrivacy = reactive(
  load() ?? {
    // 업무·경력 기록은 기본이 비공개이고, UI에서 바꿀 수 없다(정책 고정)
    portfolioVisibility: 'private',
    portfolioSharedIds: [],
    maskCompanyNames: true,
    excludeFromRanking: true,
    excludeFromAi: true,
    watermarkExports: true,
    accessLog: [
      { id: 1, at: '2026-09-05 21:04', what: '포트폴리오 미리보기', who: '나', from: '이 기기' },
    ],
  },
)

watch(
  workPrivacy,
  (v) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(v))
    } catch {
      // 저장할 수 없는 환경 — 세션 내 상태만 유지
    }
  },
  { deep: true },
)

/** 공유·랭킹·커뮤니티로 나가는 데이터에서 비공개 도메인 항목을 제거한다 */
export function sanitizeForShare(items) {
  return items.filter((item) => !PRIVATE_DOMAINS.includes(item.domain))
}

/** 특정 포트폴리오 항목이 링크 공개 대상인지 */
export function isPortfolioShared(id) {
  return workPrivacy.portfolioVisibility === 'link' && workPrivacy.portfolioSharedIds.includes(id)
}
export function togglePortfolioShared(id) {
  const list = workPrivacy.portfolioSharedIds
  const i = list.indexOf(id)
  if (i >= 0) list.splice(i, 1)
  else list.push(id)
}
export function logAccess(what, who = '나', from = '이 기기') {
  workPrivacy.accessLog.unshift({
    id: Math.max(0, ...workPrivacy.accessLog.map((a) => a.id)) + 1,
    at: new Date().toISOString().slice(0, 16).replace('T', ' '),
    what,
    who,
    from,
  })
}
