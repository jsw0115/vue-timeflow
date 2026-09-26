import { ref } from 'vue'
import { localCollection } from './localCollection'
import { localDate } from '../utils/postValidation.mjs'

export const composer = ref(false)

export const tasks = localCollection('tasks', [
  { id: 1, title: '서비스 API 명세 검토', category: '업무', done: false },
  { id: 2, title: 'Spring Security 인증 흐름 설계', category: '공부', done: false },
  { id: 3, title: '헬스장 예약하기', category: '건강', done: true },
])

/**
 * 루틴 — 반복 주기(days), 목표(goal), 연속 기록(streak), 최근 7일 이력(history)을 함께 관리한다.
 * days: 0(일)~6(토). 빈 배열이면 매일로 본다.
 */
export const ROUTINE_DAYS = ['일', '월', '화', '수', '목', '금', '토']

export const routines = localCollection('routines', [
  { id: 1, title: '물 2L 마시기', time: '08:00', done: true, category: '건강', days: [0, 1, 2, 3, 4, 5, 6], goal: { count: 8, unit: '잔' }, streak: 12, best: 31, history: [1, 1, 1, 0, 1, 1, 1], paused: false, notify: true },
  { id: 2, title: '영어 단어 20개', time: '21:00', done: false, category: '공부', days: [1, 2, 3, 4, 5], goal: { count: 20, unit: '개' }, streak: 30, best: 30, history: [1, 1, 1, 1, 1, 0, 0], paused: false, notify: true },
  { id: 3, title: '하루 회고 5분', time: '22:30', done: false, category: '개인', days: [0, 1, 2, 3, 4, 5, 6], goal: { count: 1, unit: '회' }, streak: 3, best: 14, history: [1, 0, 1, 1, 0, 1, 1], paused: false, notify: false },
])

/** 오늘 요일에 해당하는 루틴인지 */
export function isRoutineToday(routine, weekday = new Date().getDay()) {
  if (routine.paused) return false
  if (!routine.days || !routine.days.length) return true
  return routine.days.includes(weekday)
}
/** 최근 7일 달성률 */
export function routineRate(routine) {
  const h = routine.history ?? []
  if (!h.length) return 0
  return Math.round((h.filter(Boolean).length / h.length) * 100)
}
export function dayLabel(routine) {
  const d = routine.days ?? []
  if (!d.length || d.length === 7) return '매일'
  if (d.length === 5 && [1, 2, 3, 4, 5].every((x) => d.includes(x))) return '평일'
  if (d.length === 2 && [0, 6].every((x) => d.includes(x))) return '주말'
  return d.slice().sort().map((x) => ROUTINE_DAYS[x]).join('·')
}
/** 체크할 때 연속 기록도 함께 갱신한다 */
export function toggleRoutine(routine) {
  routine.done = !routine.done
  if (routine.done) {
    routine.streak += 1
    routine.best = Math.max(routine.best ?? 0, routine.streak)
  } else {
    routine.streak = Math.max(0, routine.streak - 1)
  }
}

export const events = localCollection('events', [
  { id: 1, title: '디자인 싱크 미팅', startDate: localDate(), endDate: localDate(), startTime: '11:00', endTime: '12:00', time: '11:00', date: localDate() + ' 11:00', category: '업무', tag: '업무', state: '예정', color: '#2f5d46', body: '', attendeeIds: [] },
  { id: 2, title: '저녁 운동', startDate: localDate(), endDate: localDate(), startTime: '19:00', endTime: '20:00', time: '19:00', date: localDate() + ' 19:00', category: '건강', tag: '건강', state: '예정', color: '#2f5d46', body: '', attendeeIds: [] },
])
export const composerKind = ref('일정')
export const composerSeed = ref('')
export function openPostComposer(kind = '일정', title = '') {
  composerKind.value = kind
  composerSeed.value = title
  composer.value = true
}

export const blocks = [
  { top: 7, height: 12, title: '아침 루틴', color: 'mint' },
  { top: 28, height: 18, title: '기획 집중', color: 'purple' },
  { top: 55, height: 9, title: '점심 산책', color: 'amber' },
  { top: 70, height: 18, title: '개발', color: 'blue' },
]

export function toggle(item) {
  item.done = !item.done
}
