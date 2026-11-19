const DAY = 86400000
const stamp = value => Date.parse(value + 'T00:00:00Z')
const iso = value => new Date(value).toISOString().slice(0, 10)
const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(stamp(value)) && iso(stamp(value)) === value
// 회차 예외(쉬는 날·회차 변경)는 반복 규칙 JSON 안에 두므로 반복마다 개수를 묶는다. 서버 RecurrenceRule.MAX_EXCEPTIONS와 같다(Q-03).
export const MAX_EXCEPTIONS = 366
// 회차 하나만 바꿀 때 바꿀 수 있는 필드. 서버 RecurrenceRule.OVERRIDE_FIELDS와 같다. 날짜는 바꾸지 않는다(IM-14 2단계).
export const OVERRIDE_FIELDS = ['title', 'startTime', 'endTime']
const validTime = value => typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
const byDate = (a, b) => a.date.localeCompare(b.date)
export function makeRecurrence(value = {}, fallbackDays = []) {
  return { frequency: 'none', interval: 1, weekdays: [...fallbackDays], endMode: 'never', until: '', count: 10, ...value, weekdays: [...(value.weekdays ?? fallbackDays)] }
}
function overrideError(item) {
  const fields = Object.keys(item).filter(key => key !== 'date' && key !== 'action')
  if (!fields.length || fields.some(key => !OVERRIDE_FIELDS.includes(key))) return '회차 변경에는 제목이나 시각만 바꿀 수 있어요.'
  if ('title' in item && (typeof item.title !== 'string' || !item.title.trim() || item.title.trim().length > 200)) return '회차 제목은 1~200자로 입력해주세요.'
  if (['startTime', 'endTime'].some(key => key in item && !validTime(item[key]))) return '회차 시각은 HH:mm 형식으로 입력해주세요.'
  return ''
}
function exceptionsError(exceptions) {
  if (exceptions === undefined) return ''
  if (!Array.isArray(exceptions) || exceptions.length > MAX_EXCEPTIONS) return `쉬는 날·회차 변경은 반복마다 최대 ${MAX_EXCEPTIONS}개까지 정할 수 있어요.`
  const seen = new Set()
  for (const item of exceptions) {
    if (!item || typeof item !== 'object' || !validDate(item.date)) return '쉬는 날 형식을 확인해주세요.'
    if (item.action === 'skip') { if (Object.keys(item).some(key => key !== 'date' && key !== 'action')) return '쉬는 날 형식을 확인해주세요.' }
    else if (item.action === 'override') { const error = overrideError(item); if (error) return error }
    else return '쉬는 날 형식을 확인해주세요.'
    if (seen.has(item.date)) return '한 날짜에는 쉬는 날이나 회차 변경을 하나만 정할 수 있어요.'
    seen.add(item.date)
  }
  return ''
}
/** 쉬는 날로 정한 날짜(YYYY-MM-DD) 집합. 규칙이 없으면 빈 집합이다. */
export function skipDates(rule) {
  return new Set(Array.isArray(rule?.exceptions) ? rule.exceptions.filter(item => item?.action === 'skip').map(item => item.date) : [])
}
/** 쉬는 날을 더한 새 규칙. 같은 날짜의 회차 변경은 쉬는 날로 바뀌고, 다른 예외는 남는다. 날짜순으로 정렬하고 원래 규칙은 바꾸지 않는다. */
export function addSkipDates(rule, dates) {
  const merged = [...new Set([...skipDates(rule), ...dates])]
  const others = (rule?.exceptions ?? []).filter(item => item?.action !== 'skip' && !merged.includes(item.date))
  return { ...(rule ?? { frequency: 'none' }), exceptions: [...others, ...merged.map(date => ({ date, action: 'skip' }))].sort(byDate) }
}
/** 그 날짜의 예외(쉬는 날이든 회차 변경이든)를 지운 새 규칙. 회차가 원래대로 돌아온다. */
export function removeException(rule, date) {
  return { ...rule, exceptions: (rule?.exceptions ?? []).filter(item => item.date !== date) }
}
export const removeSkipDate = removeException
/** 그 날짜의 회차 변경. 없거나 쉬는 날이면 null이다. */
export function overrideFor(rule, date) {
  return (Array.isArray(rule?.exceptions) ? rule.exceptions : []).find(item => item?.action === 'override' && item.date === date) ?? null
}
/** 회차 하나의 변경을 바꾼 새 규칙. patch가 비면 그 날짜의 예외를 지운다(원래 회차로 되돌림). */
export function setOverride(rule, date, patch) {
  const rest = removeException(rule, date)
  const fields = Object.fromEntries(OVERRIDE_FIELDS.filter(key => patch?.[key] !== undefined).map(key => [key, patch[key]]))
  if (!Object.keys(fields).length) return rest
  return { ...rest, exceptions: [...rest.exceptions, { date, action: 'override', ...fields }].sort(byDate) }
}
/** 원본과 다른 필드만 고른다. 원본과 같은 값은 저장하지 않아, 나중에 반복 전체를 바꾸면 그 필드는 따라간다. */
export function changedFields(event, values) {
  const result = {}
  const title = (values.title ?? '').trim()
  if (title !== event.title) result.title = title
  for (const key of ['startTime', 'endTime']) if (values[key] !== event[key]) result[key] = values[key]
  return result
}
/** 일정의 회차 변경이 원본 시간과 합쳐 성립하는지 본다. 종료 시각은 회차 종료일(시작일 + 일정 기간)에 적용된다. */
export function overridesError(event) {
  const span = validDate(event.startDate) && validDate(event.endDate) ? (stamp(event.endDate) - stamp(event.startDate)) / DAY : 0
  for (const item of Array.isArray(event.recurrence?.exceptions) ? event.recurrence.exceptions : []) {
    if (item?.action !== 'override') continue
    const start = item.startTime ?? event.startTime, end = item.endTime ?? event.endTime
    if (span === 0 && end <= start) return `${item.date} 회차의 종료 시각은 시작 이후로 정해주세요.`
  }
  return ''
}
/** 양 끝을 포함한 날짜 목록. 잘못된 기간이나 MAX_EXCEPTIONS일을 넘는 기간은 빈 목록이다. */
export function datesBetween(from, to) {
  if (!validDate(from) || !validDate(to) || to < from || (stamp(to) - stamp(from)) / DAY >= MAX_EXCEPTIONS) return []
  const dates = []
  for (let time = stamp(from); time <= stamp(to); time += DAY) dates.push(iso(time))
  return dates
}
export function recurrenceError(rule, startDate) {
  const exceptions = exceptionsError(rule?.exceptions)
  if (exceptions) return exceptions
  if (!rule || rule.frequency === 'none') return ''
  if (!['daily', 'weekly', 'monthly', 'yearly'].includes(rule.frequency)) return '반복 주기를 선택해주세요.'
  if (!Number.isInteger(rule.interval) || rule.interval < 1 || rule.interval > 99) return '반복 간격은 1~99 사이로 입력해주세요.'
  if (rule.frequency === 'weekly' && (!rule.weekdays?.length || !rule.weekdays.every(day => Number.isInteger(day) && day >= 0 && day <= 6))) return '반복할 요일을 하나 이상 선택해주세요.'
  if (!validDate(startDate)) return '반복 시작일을 입력해주세요.'
  if (!['never', 'until', 'count'].includes(rule.endMode)) return '반복 종료 조건을 선택해주세요.'
  if (rule.endMode === 'until' && (!validDate(rule.until) || rule.until < startDate)) return '종료일은 시작일 이후로 선택해주세요.'
  if (rule.endMode === 'count' && (!Number.isInteger(rule.count) || rule.count < 1 || rule.count > 999)) return '반복 횟수는 1~999 사이로 입력해주세요.'
  return ''
}
// Skipped dates are removed after counting, so a count-limited series does not grow.
export function occurrenceDates(startDate, rule, from, to) {
  const skipped = skipDates(rule)
  return plannedDates(startDate, rule, from, to).filter(date => !skipped.has(date))
}
// Skip directly to the visible period for unbounded series. Calendar dates use UTC
// arithmetic so DST never changes a repetition's date.
function plannedDates(startDate, rule, from, to) {
  if (!validDate(startDate) || !validDate(from) || !validDate(to) || to < from) return []
  if (recurrenceError(rule, startDate)) return []
  if (!rule || rule.frequency === 'none') return startDate >= from && startDate <= to ? [startDate] : []
  const start = stamp(startDate), lower = Math.max(start, stamp(from))
  const upper = Math.min(stamp(to), rule.endMode === 'until' ? stamp(rule.until) : Infinity)
  if (upper < lower) return []
  const date = new Date(start), interval = rule.interval, results = []
  const bounded = rule.endMode === 'count', max = bounded ? rule.count : Infinity
  let seen = 0
  const add = time => { if (time < start || time > upper || seen >= max) return; seen++; if (time >= lower) results.push(iso(time)) }
  if (rule.frequency === 'daily') {
    for (let n = bounded ? 0 : Math.max(0, Math.ceil((lower - start) / (DAY * interval))); start + n * DAY * interval <= upper && seen < max; n++) add(start + n * DAY * interval)
  } else if (rule.frequency === 'weekly') {
    const week = start - date.getUTCDay() * DAY, weekdays = [...new Set(rule.weekdays)].sort()
    for (let n = bounded ? 0 : Math.max(0, Math.floor((lower - week) / (DAY * 7 * interval))); week + n * DAY * 7 * interval <= upper && seen < max; n++) {
      for (const day of weekdays) add(week + (n * 7 * interval + day) * DAY)
    }
  } else {
    const step = interval * (rule.frequency === 'yearly' ? 12 : 1)
    const lowerDate = new Date(lower), months = (lowerDate.getUTCFullYear() - date.getUTCFullYear()) * 12 + lowerDate.getUTCMonth() - date.getUTCMonth()
    for (let n = bounded ? 0 : Math.max(0, Math.floor(months / step)); seen < max; n++) {
      const monthStart = Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + n * step, 1)
      if (monthStart > upper) break
      const time = Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + n * step, date.getUTCDate())
      if (new Date(time).getUTCMonth() === new Date(monthStart).getUTCMonth()) add(time)
    }
  }
  return results
}
export function eventOccurrences(events, from, to) {
  if (!validDate(from) || !validDate(to)) return []
  return events.flatMap(event => {
    const startDate = event.startDate ?? event.date?.slice(0, 10), endDate = event.endDate ?? startDate
    if (!validDate(startDate) || !validDate(endDate)) return []
    const duration = Math.max(0, (stamp(endDate) - stamp(startDate)) / DAY)
    const dates = occurrenceDates(startDate, event.recurrence, iso(stamp(from) - duration * DAY), to)
    return dates.map(date => {
      // 회차 하나만 바꾼 제목·시각은 그 회차에만 적용한다. 서버 /api/schedules/occurrences와 같다
      const changed = overrideFor(event.recurrence, date)
      const fields = changed ? Object.fromEntries(OVERRIDE_FIELDS.filter(key => key in changed).map(key => [key, changed[key]])) : {}
      const startTime = fields.startTime ?? event.startTime ?? event.time ?? ''
      return { ...event, ...fields, ...(fields.startTime ? { time: fields.startTime } : {}), overridden: Boolean(changed), occurrenceKey: `${event.id}:${date}`, startDate: date, endDate: iso(stamp(date) + duration * DAY), date: date + ' ' + startTime, sourceId: event.id }
    })
  })
}
/** 반복 일정이면 그 회차를 연 상태로, 아니면 일정만 연 상태로 일정 화면에 연결한다. */
export function occurrenceLink(occurrence) {
  const repeating = occurrence.recurrence && occurrence.recurrence.frequency !== 'none'
  return `/events?id=${encodeURIComponent(occurrence.sourceId)}` + (repeating ? `&occurrence=${occurrence.startDate}` : '')
}
/**
 * "이 회차부터" 수정. 원래 반복은 회차 전날에 끝내고(head), 그 회차부터는 새 반복(tail)으로 잇는다.
 * 횟수 종료는 쉬는 날을 포함한 앞선 회차 수를 빼고 남은 횟수를 쓴다. 회차 날짜 이후의 예외는 새 반복으로 옮긴다.
 * 앞선 회차가 없거나(첫 회차) 반복에 없는 날짜면 나눌 필요가 없으므로 null을 돌려준다.
 */
export function splitRecurrence(event, date) {
  const rule = event.recurrence
  if (!rule || rule.frequency === 'none' || !validDate(date) || !plannedDates(event.startDate, rule, date, date).length) return null
  const before = plannedDates(event.startDate, rule, event.startDate, iso(stamp(date) - DAY))
  if (!before.length) return null
  const exceptions = Array.isArray(rule.exceptions) ? rule.exceptions : []
  const span = Math.max(0, (stamp(event.endDate ?? event.startDate) - stamp(event.startDate)) / DAY)
  const head = { ...rule, endMode: 'until', until: iso(stamp(date) - DAY), exceptions: exceptions.filter(item => item.date < date) }
  const tailRule = { ...rule, exceptions: exceptions.filter(item => item.date >= date), ...(rule.endMode === 'count' ? { count: rule.count - before.length } : {}) }
  return { head, tail: { startDate: date, endDate: iso(stamp(date) + span * DAY), recurrence: tailRule } }
}
