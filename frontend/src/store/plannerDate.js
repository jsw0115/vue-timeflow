import { computed, ref } from 'vue'
import { localDate } from '../utils/postValidation.mjs'
import { formatDate } from '../features/i18n/locale.mjs'
import { bodyLocale, tr } from './locale'

/**
 * 플래너 기간 이동 — 일/주/월/연 화면이 같은 기준일을 공유한다.
 * 한 화면에서 날짜를 옮기고 다른 화면으로 넘어가도 같은 시점을 이어서 본다.
 */
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

export const cursor = ref(new Date())

function clone(d) {
  return new Date(d.getTime())
}
export function shift(unit, delta) {
  const d = clone(cursor.value)
  if (unit === 'day') d.setDate(d.getDate() + delta)
  else if (unit === 'week') d.setDate(d.getDate() + delta * 7)
  else if (unit === 'month') d.setMonth(d.getMonth() + delta)
  else if (unit === 'year') d.setFullYear(d.getFullYear() + delta)
  cursor.value = d
}
export function goToday() {
  cursor.value = new Date()
}

/** 그 주의 월요일 */
function startOfWeek(d) {
  const s = clone(d)
  const day = s.getDay()
  s.setDate(s.getDate() - (day === 0 ? 6 : day - 1))
  return s
}
function fmt(d) {
  return d.getMonth() + 1 + '.' + d.getDate()
}

// 기간 이름은 본문 언어를 따른다(PR-32). 한국어는 예전 모양 그대로다
const ko = () => bodyLocale.value === 'ko'
const shortDate = (d) => formatDate(d, bodyLocale.value, { month: 'short', day: 'numeric' })
export const dayLabel = computed(() => {
  const d = cursor.value
  if (!ko()) return formatDate(d, bodyLocale.value, { weekday: 'short', month: 'short', day: 'numeric' })
  return d.getMonth() + 1 + '월 ' + d.getDate() + '일 (' + WEEKDAYS[d.getDay()] + ')'
})
export const weekLabel = computed(() => {
  const from = startOfWeek(cursor.value)
  const to = clone(from)
  to.setDate(to.getDate() + 6)
  const nth = Math.ceil(from.getDate() / 7)
  const month = ko() ? from.getMonth() + 1 + '월' : formatDate(from, bodyLocale.value, { month: 'long' })
  return tr('{month} {nth}주차 ({from} ~ {to})', { month, nth, from: ko() ? fmt(from) : shortDate(from), to: ko() ? fmt(to) : shortDate(to) })
})
export const monthLabel = computed(() => (ko() ? cursor.value.getFullYear() + '년 ' + (cursor.value.getMonth() + 1) + '월' : formatDate(cursor.value, bodyLocale.value, { year: 'numeric', month: 'long' })))
export const yearLabel = computed(() => tr('{year}년 로드맵', { year: cursor.value.getFullYear() }))

/** 이 달의 날짜 격자 — 앞뒤 달 날짜는 out으로 표시 */
export const monthGrid = computed(() => {
  const first = new Date(cursor.value.getFullYear(), cursor.value.getMonth(), 1)
  const start = startOfWeek(first)
  const cells = []
  for (let i = 0; i < 42; i += 1) {
    const d = clone(start)
    d.setDate(d.getDate() + i)
    cells.push({
      key: localDate(d),
      date: d.getDate(),
      out: d.getMonth() !== cursor.value.getMonth(),
      // 기록 강도는 날짜에서 결정적으로 만들어 화면이 흔들리지 않게 한다
      level: d.getMonth() !== cursor.value.getMonth() ? 0 : Math.abs(Math.sin(d.getDate() * 1.7)) > 0.55 ? 3 : Math.abs(Math.sin(d.getDate() * 2.3)) > 0.4 ? 2 : 1,
    })
  }
  return cells
})

/** 이번 주 7일 */
export const weekDays = computed(() => {
  const from = startOfWeek(cursor.value)
  return Array.from({ length: 7 }, (_, i) => {
    const d = clone(from)
    d.setDate(d.getDate() + i)
    return { key: localDate(d), label: WEEKDAYS[d.getDay()], date: d.getDate() }
  })
})
