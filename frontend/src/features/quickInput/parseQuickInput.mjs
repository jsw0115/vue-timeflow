// 한 줄 빠른 입력에서 날짜·시간·제목을 규칙으로 찾는다(PR-09 3단계, UF-123·UF-124). AI 해석은 제공자 연결 뒤로 미룬다.
//
// 해석 규칙(UT-216~UT-219)
// - 날짜: 오늘·내일·모레·글피, "이번 주/다음 주 X요일"(한 주는 월요일 시작), "X요일"(오늘 포함 가장 가까운 날),
//   "월말"(이번 달 마지막 날), "M월 D일", "M/D"(올해. 이미 지났어도 올해로 두고 고치지 않는다), "D일"(이번 달, 지났으면 다음 달).
// - 시간: "오후/저녁/밤 N시"는 오후, "오전/아침/새벽 N시"는 오전, "정오"는 12:00, "HH:MM"·"13시~23시"는 24시간제로 확정한다.
//   오전·오후 표시가 없는 "1시~12시"는 두 후보(오전·오후)만 보이고 자동으로 고르지 않는다(UF-124).
// - 자정: "자정"·"자정까지"·"밤 12시"는 그 날짜가 끝나는 때, 곧 다음 날 00:00이다. 예: 기준 11-18에 "자정까지 보고서" → 11-19 00:00.
//   마감 성격이라 할 일로 제안하고, 할 일(마감 날짜만 저장)로 저장하면 마감 날짜는 그날(11-18)이다.
// - 아무것도 찾지 못하면 원문을 그대로 메모 초안으로 둔다. 원문(raw)은 언제나 바꾸지 않고 함께 돌려준다.

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
const pad = (n) => String(n).padStart(2, '0')
const DAY = 86400000
const toDay = (iso) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10))
const fromDay = (ms) => { const d = new Date(ms); return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}` }
export const addDays = (iso, days) => fromDay(toDay(iso) + days * DAY)
const weekday = (iso) => new Date(toDay(iso)).getUTCDay()
const validDate = (y, m, d) => { const iso = `${y}-${pad(m)}-${pad(d)}`; return m >= 1 && m <= 12 && d >= 1 && fromDay(toDay(iso)) === iso ? iso : null }
const time = (h, m = 0) => `${pad(h)}:${pad(m)}`

/** 계정 시간대·하루 시작 시각(0~6시) 기준 오늘(YYYY-MM-DD). 새벽 2시에 하루 시작이 4시면 어제 날짜다. */
export function accountToday({ timeZone = '', startHour = 0 } = {}, now = new Date()) {
  const shifted = new Date(now.getTime() - (Number(startHour) || 0) * 3600000)
  try { return new Intl.DateTimeFormat('en-CA', { timeZone: timeZone || undefined, year: 'numeric', month: '2-digit', day: '2-digit' }).format(shifted) } catch { return fromDay(Date.UTC(shifted.getFullYear(), shifted.getMonth(), shifted.getDate())) }
}

function findDate(text, today) {
  const rules = [
    [/(오늘|내일|모레|글피)/, (m) => addDays(today, { 오늘: 0, 내일: 1, 모레: 2, 글피: 3 }[m[1]])],
    [/(이번\s*주|다음\s*주|담주)\s*([일월화수목금토])요일/, (m) => {
      const monday = addDays(today, -((weekday(today) + 6) % 7))
      const offset = (WEEKDAYS.indexOf(m[2]) + 6) % 7
      return addDays(monday, offset + (m[1].startsWith('이번') ? 0 : 7))
    }],
    [/월말/, () => { const [y, mo] = today.split('-').map(Number); return addDays(validDate(mo === 12 ? y + 1 : y, mo === 12 ? 1 : mo + 1, 1), -1) }],
    [/(\d{1,2})\s*월\s*(\d{1,2})\s*일/, (m) => validDate(+today.slice(0, 4), +m[1], +m[2])],
    [/(?<![\d:])(\d{1,2})\/(\d{1,2})(?![\d:])/, (m) => validDate(+today.slice(0, 4), +m[1], +m[2])],
    [/(?<![\d월])(\d{1,2})\s*일(?!\s*(?:간|동안))/, (m) => {
      const [y, mo, d] = today.split('-').map(Number)
      return +m[1] >= d ? validDate(y, mo, +m[1]) : validDate(mo === 12 ? y + 1 : y, mo === 12 ? 1 : mo + 1, +m[1])
    }],
    [/([일월화수목금토])요일/, (m) => addDays(today, (WEEKDAYS.indexOf(m[1]) - weekday(today) + 7) % 7)],
  ]
  for (const [pattern, resolve] of rules) {
    const match = pattern.exec(text)
    if (!match) continue
    const date = resolve(match)
    // 적은 날짜가 달력에 없으면(2월 30일 등) 다른 규칙으로 바꿔 읽지 않고 날짜 없음으로 둔다
    return date ? { date, match: match[0] } : null
  }
  return null
}

function findTime(text) {
  let match = /자정(까지)?/.exec(text)
  if (match) return { candidates: [time(0)], nextDay: true, match: match[0], label: '자정' }
  match = /정오/.exec(text)
  if (match) return { candidates: [time(12)], match: match[0] }
  match = /(?<!\d)([01]?\d|2[0-3]):([0-5]\d)(?!\d)/.exec(text)
  if (match) return { candidates: [time(+match[1], +match[2])], match: match[0] }
  match = /(오전|아침|새벽|오후|저녁|밤|낮)?\s*(\d{1,2})\s*시(?:\s*(반|\d{1,2}\s*분))?/.exec(text)
  if (!match) return null
  const hour = +match[2], minute = match[3] === '반' ? 30 : match[3] ? parseInt(match[3], 10) : 0
  if (hour > 23 || minute > 59) return null
  const meridiem = match[1]
  // "밤 12시"는 자정이다(그 날짜가 끝나는 때)
  if (meridiem === '밤' && hour === 12 && minute === 0) return { candidates: [time(0)], nextDay: true, match: match[0], label: '자정' }
  if (hour >= 13 || hour === 0) return { candidates: [time(hour, minute)], match: match[0] }
  if (['오후', '저녁', '밤', '낮'].includes(meridiem)) return { candidates: [time(hour === 12 ? 12 : hour + 12, minute)], match: match[0] }
  if (['오전', '아침', '새벽'].includes(meridiem)) return { candidates: [time(hour === 12 ? 0 : hour, minute)], match: match[0] }
  // 오전·오후가 없으면 두 후보를 보이고 고르게 한다(UT-218)
  return { candidates: [time(hour === 12 ? 0 : hour, minute), time(hour === 12 ? 12 : hour + 12, minute)], match: match[0] }
}

const PARTICLES = /^(?:에|에는|까지|부터|쯤|에서|의)\s*/

/**
 * 결과: { raw, title, date, times, timeChosen, nextDay, suggestedKind, parsed }
 * - times: 시간 후보(0~2개). 후보가 하나면 timeChosen이 그 값이고, 둘이면 null(사용자가 고른다).
 * - suggestedKind: 시간이 있으면 '일정', 날짜만 있으면 '할 일', 아무것도 없으면 '메모'.
 */
export function parseQuickInput(input, today) {
  const raw = String(input ?? '')
  let rest = raw
  const found = findDate(rest, today)
  if (found) rest = rest.replace(found.match, ' ')
  const clock = findTime(rest)
  if (clock) rest = rest.replace(clock.match, ' ')
  let date = found?.date ?? null
  // 자정은 그 날짜가 끝나는 때라 다음 날 00:00으로 둔다. 날짜가 없으면 오늘이 끝나는 때다
  if (clock?.nextDay) date = addDays(date ?? today, 1)
  else if (clock && !date) date = today
  const title = rest.split(/\s+/).map((word) => word.replace(PARTICLES, '')).filter(Boolean).join(' ').replace(/^(?:에|까지|부터)\s*/, '').trim()
  const times = clock?.candidates ?? []
  const parsed = Boolean(found || clock)
  return {
    raw,
    title: parsed && title ? title : raw.trim(),
    date,
    times,
    timeChosen: times.length === 1 ? times[0] : null,
    nextDay: Boolean(clock?.nextDay),
    // 자정은 "그날까지"라는 마감이라 할 일로 제안한다
    suggestedKind: clock?.nextDay ? '할 일' : times.length ? '일정' : date ? '할 일' : '메모',
    parsed,
  }
}

/** "11월 19일 (목)" 같은 표시 문구. */
export function dateLabel(iso) {
  if (!iso) return ''
  return `${+iso.slice(5, 7)}월 ${+iso.slice(8, 10)}일 (${WEEKDAYS[weekday(iso)]})`
}
/** 시간 표시. 오전·오후를 붙인다. */
export function timeLabel(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  return `${h < 12 ? '오전' : '오후'} ${h % 12 === 0 ? 12 : h % 12}시${m ? ` ${m}분` : ''}`
}

/**
 * 고른 종류로 작성 초안 값을 만든다. 일정은 시작 시각부터 1시간(작성 창 기본 길이와 같다).
 * 할 일은 마감 날짜만 서버에 저장된다(시각 필드가 없다). 메모는 원문을 그대로 제목으로 둔다.
 */
export function draftFor(kind, result) {
  if (kind === '메모') return { title: result.raw.trim() }
  // 자정 마감은 그날이 끝나는 때라 할 일 마감 날짜는 그날(다음 날 00:00의 전날)이다
  if (kind === '할 일') return { title: result.title, ...(result.date ? { date: result.nextDay ? addDays(result.date, -1) : result.date } : {}) }
  const start = result.timeChosen
  if (!start || !result.date) return null
  const [h, m] = start.split(':').map(Number)
  const endMinutes = h * 60 + m + 60
  const endDate = endMinutes >= 1440 ? addDays(result.date, 1) : result.date
  return { title: result.title, startDate: result.date, endDate, startTime: start, endTime: time(Math.floor(endMinutes / 60) % 24, endMinutes % 60) }
}
