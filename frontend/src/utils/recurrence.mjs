const DAY = 86400000
const stamp = value => Date.parse(value + 'T00:00:00Z')
const iso = value => new Date(value).toISOString().slice(0, 10)
const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(stamp(value)) && iso(stamp(value)) === value
// 쉬는 날 예외는 반복 규칙 JSON 안에 두므로 반복마다 개수를 묶는다. 서버 RecurrenceRule.MAX_EXCEPTIONS와 같다(Q-03).
export const MAX_EXCEPTIONS = 366
export function makeRecurrence(value = {}, fallbackDays = []) {
  return { frequency: 'none', interval: 1, weekdays: [...fallbackDays], endMode: 'never', until: '', count: 10, ...value, weekdays: [...(value.weekdays ?? fallbackDays)] }
}
function exceptionsError(exceptions) {
  if (exceptions === undefined) return ''
  if (!Array.isArray(exceptions) || exceptions.length > MAX_EXCEPTIONS) return `쉬는 날은 반복마다 최대 ${MAX_EXCEPTIONS}일까지 정할 수 있어요.`
  const seen = new Set()
  for (const item of exceptions) {
    if (!item || typeof item !== 'object' || Object.keys(item).some(key => key !== 'date' && key !== 'action') || item.action !== 'skip' || !validDate(item.date)) return '쉬는 날 형식을 확인해주세요.'
    if (seen.has(item.date)) return '같은 날짜를 쉬는 날로 두 번 정할 수 없어요.'
    seen.add(item.date)
  }
  return ''
}
/** 쉬는 날로 정한 날짜(YYYY-MM-DD) 집합. 규칙이 없으면 빈 집합이다. */
export function skipDates(rule) {
  return new Set(Array.isArray(rule?.exceptions) ? rule.exceptions.filter(item => item?.action === 'skip').map(item => item.date) : [])
}
/** 쉬는 날을 더한 새 규칙. 같은 날짜는 한 번만 두고 날짜순으로 정렬한다. 원래 규칙은 바꾸지 않는다. */
export function addSkipDates(rule, dates) {
  const merged = [...new Set([...skipDates(rule), ...dates])].sort()
  return { ...(rule ?? { frequency: 'none' }), exceptions: merged.map(date => ({ date, action: 'skip' })) }
}
export function removeSkipDate(rule, date) {
  return { ...rule, exceptions: (rule?.exceptions ?? []).filter(item => item.date !== date) }
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
    return dates.map(date => ({ ...event, occurrenceKey: `${event.id}:${date}`, startDate: date, endDate: iso(stamp(date) + duration * DAY), date: date + ' ' + (event.startTime ?? event.time ?? ''), sourceId: event.id }))
  })
}
