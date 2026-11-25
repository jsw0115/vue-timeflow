// 경력 상세 필드(PR-24, REQ-F25)의 허용값·기간 표시·요청 본문과, 저장을 막지 않는 기간 겹침·공백 안내를 정한다.
import { translate } from '../i18n/translate.mjs'

/** 화면 문구 번역 함수의 기본값. 한국어 원문 그대로다. */
export const korean = (ko, vars) => translate(ko, 'ko', vars)

/** 서버 FeatureInput.EMPLOYMENT_TYPES와 같은 순서다. */
export const EMPLOYMENT_TYPES = [
  { value: 'full-time', label: '정규직' },
  { value: 'contract', label: '계약직' },
  { value: 'intern', label: '인턴' },
  { value: 'part-time', label: '아르바이트' },
  { value: 'freelance', label: '프리랜서' },
  { value: 'other', label: '기타' },
]
export const EMPLOYMENT_STATUSES = [
  { value: 'current', label: '재직 중' },
  { value: 'ended', label: '종료' },
]
/** 공백 안내 기준(일). 원문에는 기준 일수가 없어 정한 제안값이다. */
export const GAP_NOTICE_DAYS = 31

const DETAIL_FIELDS = ['employmentType', 'department', 'startDate', 'endDate', 'employmentStatus', 'duties']
const ISO = /^\d{4}-\d{2}-\d{2}$/

export const employmentTypeLabel = (value) => EMPLOYMENT_TYPES.find((item) => item.value === value)?.label ?? ''
const month = (iso) => iso.slice(0, 7).replace('-', '.')

/** 시작일이 있으면 날짜로, 없으면 예전에 적은 기간 문구를 보인다. t는 화면 표시용 번역이고, 저장 본문(careerBody)은 늘 한국어다. */
export function periodLabel(item, t = korean) {
  const start = String(item?.startDate ?? '')
  if (!ISO.test(start)) return String(item?.period ?? '')
  const end = String(item.endDate ?? '')
  if (ISO.test(end)) return month(start) + ' ~ ' + month(end)
  return item.employmentStatus === 'current' ? month(start) + ' ~ ' + t('재직 중') : month(start) + ' ~'
}

/**
 * 화면 입력을 서버 본문으로 바꾼다. 빈 상세 값은 보내지 않는다(서버는 수정 때 본문 전체를 바꾸므로 빈 값은 지워진다).
 * 재직 중이면 종료일을 비우고, 시작일이 있으면 기간 문구를 날짜에서 다시 만든다(다른 화면이 기간 문구를 읽는다).
 */
export function careerBody(item, pick) {
  const out = pick(item)
  for (const key of DETAIL_FIELDS) {
    const value = typeof out[key] === 'string' ? out[key].trim() : out[key]
    if (value === undefined || value === null || value === '') delete out[key]
    else out[key] = value
  }
  if (out.employmentStatus === 'current') delete out.endDate
  if (out.startDate) out.period = periodLabel(out)
  return out
}

/** 저장 전에 화면에서 먼저 보여 줄 입력 오류. 서버 검사와 같은 규칙이다. */
export function careerDetailError(draft) {
  const start = String(draft.startDate ?? ''), end = String(draft.endDate ?? '')
  if (start && end && end < start) return '종료일은 시작일과 같거나 뒤여야 해요.'
  if (draft.employmentStatus === 'ended' && !end) return '종료한 경력은 종료일을 넣어 주세요.'
  return ''
}

const DAY = 86400000
const toTime = (iso) => Date.parse(iso + 'T00:00:00Z')

/** 시작일과 끝(종료일, 재직 중이면 오늘)이 모두 있는 경력만 비교한다. */
function spans(items, today) {
  return items.flatMap((item) => {
    const start = String(item.startDate ?? '')
    if (!ISO.test(start)) return []
    const end = item.employmentStatus === 'current' ? today : String(item.endDate ?? '')
    if (!ISO.test(end) || end < start) return []
    return [{ item, start, end }]
  }).sort((a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end))
}

/**
 * 기간 겹침과 공백 안내. 겸직·동시 프로젝트도 있으므로 저장은 막지 않는다.
 * overlaps: 기간이 하루라도 겹치는 두 경력. gaps: 앞선 경력이 모두 끝난 뒤 GAP_NOTICE_DAYS일보다 길게 비는 구간.
 */
export function careerPeriodNotes(items, today) {
  const list = spans(items ?? [], today)
  const overlaps = []
  for (let i = 0; i < list.length; i += 1) {
    for (let j = i + 1; j < list.length && list[j].start <= list[i].end; j += 1) overlaps.push([list[i].item, list[j].item])
  }
  const gaps = []
  let reach = null
  for (const span of list) {
    if (reach) {
      const days = Math.round((toTime(span.start) - toTime(reach.end)) / DAY) - 1
      if (days > GAP_NOTICE_DAYS) gaps.push({ after: reach.item, before: span.item, days })
    }
    if (!reach || span.end > reach.end) reach = span
  }
  return { overlaps, gaps, compared: list.length }
}
