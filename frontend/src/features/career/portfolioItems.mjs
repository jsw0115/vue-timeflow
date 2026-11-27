// 포트폴리오 항목(PR-26): 구성 칸(개편안 문서 유형 표의 소개·문제·역할·기술·과정·성과·결과물과 4.3의 개인 기여), 결과물 링크, 근거 연결 상태.
import { isWebUrl, listFromText } from './careerModel.mjs'

/** 편집 창·공개 화면·내보내기가 같은 순서로 쓴다. long은 여러 줄 입력이다. 서버 PortfolioLinkController.PUBLIC_FIELDS와 맞춘다. */
export const PORTFOLIO_SECTIONS = [
  { key: 'body', label: '프로젝트 소개', long: true },
  { key: 'problem', label: '문제', long: true },
  { key: 'role', label: '내 역할', long: false },
  { key: 'stack', label: '기술', long: false },
  { key: 'process', label: '과정', long: true },
  { key: 'outcome', label: '성과', long: true },
  { key: 'contribution', label: '개인 기여', long: true },
]
export const MAX_LINKS = 10
export const MAX_ACTIVITIES = 20

/** 결과물 링크 입력(한 줄에 하나). 빈 줄·중복은 빼고, http·https가 아닌 줄은 invalid로 돌려준다. */
export function linksFromText(text) {
  const lines = listFromText(String(text ?? '').replaceAll(',', '\n'))
  return { links: lines.filter(isWebUrl), invalid: lines.filter((line) => !isWebUrl(line)) }
}

/** 편집 창 초기값. 없는 칸은 빈 문자열이다. */
export function portfolioDraft(item = null, defaultKind = '') {
  const draft = { title: item?.title ?? '', kind: item?.kind ?? defaultKind, linksText: (item?.links ?? []).join('\n'), activityIds: [...(item?.activityIds ?? [])], experienceId: item?.experienceId ?? '' }
  for (const s of PORTFOLIO_SECTIONS) draft[s.key] = item?.[s.key] ?? ''
  return draft
}

/** 편집 창 값을 저장 본문으로. 링크는 올바른 것만 넣는다(화면이 먼저 invalid를 알린다). */
export function portfolioValues(draft) {
  const out = { title: draft.title.trim(), kind: draft.kind, links: linksFromText(draft.linksText).links, activityIds: [...draft.activityIds], experienceId: draft.experienceId || '' }
  for (const s of PORTFOLIO_SECTIONS) out[s.key] = String(draft[s.key] ?? '')
  return out
}

/**
 * 근거 연결 상태. activities·experiences는 이 계정의 전체 목록이다(loaded가 거짓이면 아직 모름).
 * 반환: { activities: [{ id, title, broken }], experience: { id, title, broken } | null }
 */
export function evidenceOf(item, { activities = [], experiences = [], loaded = true } = {}) {
  const activityRows = (item?.activityIds ?? []).map((id) => {
    const found = activities.find((a) => a.id === id)
    return { id, title: found?.title ?? '', broken: loaded && !found }
  })
  let experience = null
  if (item?.experienceId) {
    const found = experiences.find((e) => e.id === item.experienceId)
    experience = { id: item.experienceId, title: found?.title ?? '', broken: loaded && !found }
  }
  return { activities: activityRows, experience }
}

/** 공개 화면·내보내기용 칸. 빈 칸은 뺀다. */
export const filledSections = (item) => PORTFOLIO_SECTIONS.filter((s) => String(item?.[s.key] ?? '').trim()).map((s) => ({ ...s, value: String(item[s.key]) }))
/** 공개 화면에서 링크로 만들 주소. 서버도 http·https만 받지만 화면에서 한 번 더 거른다. */
export const safeLinks = (item) => (Array.isArray(item?.links) ? item.links.filter(isWebUrl) : [])
