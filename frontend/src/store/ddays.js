import { localCollection } from './localCollection'

export const ddays = localCollection('ddays', [
  { id: 1, title: '엄마 생신', category: '가족', date: '8월 31일 · 저녁 식사', dday: 'D-7', pinned: true, notifyDays: [7, 1] },
  { id: 2, title: '분기 보고서 제출', category: '업무', date: '9월 5일 · 마감', dday: 'D-12', pinned: true, notifyDays: [3, 1, 0] },
  { id: 3, title: '건강검진 예약일', category: '건강', date: '9월 12일 · 오전 10시', dday: 'D-19', pinned: false, notifyDays: [1] },
  { id: 4, title: '자격증 시험', category: '공부', date: '10월 2일', dday: 'D-39', pinned: false, notifyDays: [30, 7, 1] },
  { id: 5, title: '여행 출발일', category: '개인', date: '10월 18일', dday: 'D-55', pinned: false, notifyDays: [] },
])

export function dDayLabel(dateStr) {
  if (!dateStr) return 'D-Day'
  const diff = Math.ceil((new Date(dateStr) - new Date(new Date().toDateString())) / (1000 * 60 * 60 * 24))
  return diff === 0 ? 'D-Day' : diff > 0 ? `D-${diff}` : `D+${-diff}`
}

export function isPast(dday) {
  return typeof dday === 'string' && dday.startsWith('D+')
}

export function togglePin(item) {
  item.pinned = !item.pinned
}

export function findDday(id) {
  return ddays.value.find((d) => String(d.id) === String(id))
}

/** 알림 시점 프리셋 — 며칠 전에 알릴지 (0 = 당일) */
export const NOTIFY_OPTIONS = [
  { days: 0, label: '당일' },
  { days: 1, label: '1일 전' },
  { days: 3, label: '3일 전' },
  { days: 7, label: '1주 전' },
  { days: 14, label: '2주 전' },
  { days: 30, label: '한 달 전' },
]
export function notifyLabel(item) {
  const list = item?.notifyDays ?? []
  if (!list.length) return '알림 없음'
  return list
    .slice()
    .sort((a, b) => b - a)
    .map((d) => NOTIFY_OPTIONS.find((o) => o.days === d)?.label ?? d + '일 전')
    .join(' · ')
}
export function toggleNotifyDay(item, days) {
  if (!item.notifyDays) item.notifyDays = []
  const i = item.notifyDays.indexOf(days)
  if (i >= 0) item.notifyDays.splice(i, 1)
  else item.notifyDays.push(days)
}

export function addDday({ title, category, date, notifyDays, body = '' }) {
  const id = Math.max(0, ...ddays.value.map((d) => d.id)) + 1
  ddays.value.push({
    id,
    title,
    body,
    category,
    date: date ? new Date(date).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' }) : '날짜 미정',
    dday: dDayLabel(date),
    pinned: false,
    notifyDays: notifyDays ?? [1],
  })
  return id
}

export function updateDday(id, { title, category, date, body }) {
  const item = findDday(id)
  if (!item) return
  item.title = title
  if (body !== undefined) item.body = body
  item.category = category
  if (date) {
    item.date = new Date(date).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
    item.dday = dDayLabel(date)
  }
}

export function removeDday(id) {
  const index = ddays.value.findIndex((d) => String(d.id) === String(id))
  if (index >= 0) ddays.value.splice(index, 1)
}
