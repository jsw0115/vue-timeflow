// D-Day의 남은 날 문구와 날짜 문구를 ISO 날짜로 계산하고, 연도 없이 저장된 예전 날짜 문구를 읽는다(PR-07 6단계).
import { localDate } from './postValidation.mjs'

const DAY = 86400000
const ISO = /^(\d{4})-(\d{2})-(\d{2})$/
const dayNumber = (iso) => { const [, y, m, d] = iso.match(ISO); return Date.UTC(+y, +m - 1, +d) / DAY }

/** 오늘(사용자 시간대의 날짜) 기준 남은 날. 날짜가 없으면 D-Day, 읽을 수 없으면 빈 문자열이다. */
export function dDayLabel(iso, today = localDate()) {
  if (!iso) return 'D-Day'
  if (!ISO.test(iso)) return ''
  const diff = dayNumber(iso) - dayNumber(today)
  return diff === 0 ? 'D-Day' : diff > 0 ? `D-${diff}` : `D+${-diff}`
}

export function ddayDateLabel(iso) {
  const match = typeof iso === 'string' ? iso.match(ISO) : null
  return match ? `${Number(match[2])}월 ${Number(match[3])}일` : '날짜 미정'
}

/** 예전 로컬 D-Day는 "8월 31일 · 저녁 식사"처럼 연도 없이 저장했다. 오늘의 연도로 읽고, 읽을 수 없으면 null이다. */
export function legacyIsoDate(text, today = localDate()) {
  const match = typeof text === 'string' ? text.match(/(\d{1,2})월\s*(\d{1,2})일/) : null
  if (!match) return null
  const pad = (value) => String(value).padStart(2, '0')
  return `${today.slice(0, 4)}-${pad(match[1])}-${pad(match[2])}`
}

/** 달력 날짜 칸에 넣을 ISO 날짜. isoDate가 없는 시연·예전 로컬 D-Day는 날짜 문구를 오늘의 연도로 읽는다(ddayKind.prepare와 같은 규칙). */
export const ddayCellDate = (item, today = localDate()) => item?.isoDate || legacyIsoDate(item?.date, today)
