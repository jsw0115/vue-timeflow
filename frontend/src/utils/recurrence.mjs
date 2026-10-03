const DAY = 86400000
const stamp = value => Date.parse(value + 'T00:00:00Z')
const iso = value => new Date(value).toISOString().slice(0, 10)
const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(stamp(value)) && iso(stamp(value)) === value
export function makeRecurrence(value = {}, fallbackDays = []) {
  return { frequency: 'none', interval: 1, weekdays: [...fallbackDays], endMode: 'never', until: '', count: 10, ...value, weekdays: [...(value.weekdays ?? fallbackDays)] }
}
export function recurrenceError(rule, startDate) {
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
// Skip directly to the visible period for unbounded series. Calendar dates use UTC
// arithmetic so DST never changes a repetition's date.
export function occurrenceDates(startDate, rule, from, to) {
  if (!validDate(startDate) || !validDate(from) || !validDate(to) || to < from) return []
  if (!rule || rule.frequency === 'none') return startDate >= from && startDate <= to ? [startDate] : []
  if (recurrenceError(rule, startDate)) return []
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
