// 계획 실행률(PR-19 UF-136, 09 Q-40) 화면 규칙: 요청 경로, 히트맵 단계, 기간, 최고 달성일. 서버 ExecutionRate가 계산한다.

export const fetchExecution = (request, from, to) => request(`/api/stat/execution?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)

/** 히트맵 단계. 계획이 없는 날(rate null)은 0이고 실패가 아니다. 1/3·2/3 경계는 원문에 없는 제안값이다. */
export const LEVELS = ['계획 없음', '낮음', '보통', '높음']
export function rateLevel(rate) {
  if (rate == null) return 0
  if (rate < 34) return 1
  if (rate < 67) return 2
  return 3
}

const pad = (n) => String(n).padStart(2, '0')
export const monthRange = (year, month) => ({ from: `${year}-${pad(month + 1)}-01`, to: `${year}-${pad(month + 1)}-${pad(new Date(Date.UTC(year, month + 1, 0)).getUTCDate())}` })
export const yearRange = (year) => ({ from: `${year}-01-01`, to: `${year}-12-31` })

/** 실행률이 가장 높은 날(계획이 있는 날 중). 같으면 앞 날짜. 없으면 null. */
export function bestDay(days) {
  return (days ?? []).filter((d) => d.rate != null).reduce((best, d) => (!best || d.rate > best.rate ? d : best), null)
}

export const hoursText = (minutes) => { const m = Math.max(0, Math.round(Number(minutes) || 0)); return m < 60 ? `${m}분` : `${Math.floor(m / 60)}시간${m % 60 ? ` ${m % 60}분` : ''}` }
