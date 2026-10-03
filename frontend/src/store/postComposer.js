import { events, tasks, routines } from './appState'
import { diaries, memos } from './writing'
import { moneyEntries } from './money'
import { communityPosts } from './communityPosts'
import { workRecords } from './workRecords'
import { addDday } from './ddays'
import { savePlannerReview } from './plannerReviews'
import { addDoc, WIKI_SPACES } from './wiki'
import { localDate, rangeError, routineError, workRecordError } from '../utils/postValidation.mjs'
import { makeRecurrence, recurrenceError } from '../utils/recurrence.mjs'

export const postKinds = ['일정', '할 일', '루틴', '다이어리', '메모', 'D-Day', '머니로그', '회고', '커뮤니티 글', '업무 기록', '업무 위키']
export function makePostDraft(kind) {
  const today = localDate()
  return { title: '', body: '', category: kind === '머니로그' ? '식비' : '개인', date: today, startDate: today, endDate: today,
    startTime: '09:00', endTime: kind === '업무 기록' ? '18:00' : '10:00', priority: '보통', mood: '평온',
    color: '#2f5d46', attendeeIds: [], time: '19:00', duration: 30, days: [0, 1, 2, 3, 4, 5, 6],
    recurrence: makeRecurrence(kind === '루틴' ? { frequency: 'weekly', weekdays: [0,1,2,3,4,5,6] } : {}), subtasks: [],
    goalCount: 1, goalUnit: '회', notify: true, reminderMinutes: 10, notifyDays: [1],
    amount: 0, type: kind === '업무 기록' ? '연차' : 'out', owner: '김지수', projectId: '', status: '예정',
    half: '오전', leaveDays: 1, location: '', partner: '', transport: '', expense: 0,
    fromCompany: '', toCompany: '', role: '', handover: '', space: WIKI_SPACES[0], parentId: null }
}
const validDate = date => typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(+new Date(date + 'T12:00:00')) && localDate(new Date(date + 'T12:00:00')) === date
export function postDraftError(kind, draft) {
  if (!postKinds.includes(kind)) return '글 종류를 선택해주세요.'
  if (['커뮤니티 글', '회고'].includes(kind)) {
    if (!draft.body.trim()) return '내용을 입력해주세요.'
  } else if (!draft.title.trim()) return '제목을 입력해주세요.'
  if (kind === '일정') return rangeError(draft.startDate, draft.startTime, draft.endDate, draft.endTime) || recurrenceError(draft.recurrence, draft.startDate)
  if (kind === '루틴') return routineError(draft)
  if (kind === '업무 기록') return workRecordError(draft)
  if (['다이어리', 'D-Day', '머니로그', '회고'].includes(kind) && !validDate(draft.date)) return '올바른 날짜를 입력해주세요.'
  if (kind === '할 일' && draft.date && !validDate(draft.date)) return '올바른 마감일을 입력해주세요.'
  if (kind === '할 일' && draft.subtasks?.some(item => !item.title.trim())) return '체크리스트 항목 이름을 입력해주세요.'
  if (kind === '머니로그' && (!Number.isFinite(draft.amount) || draft.amount <= 0)) return '금액을 0보다 크게 입력해주세요.'
  return ''
}
export function savePostDraft(kind, draft) {
  if (postDraftError(kind, draft)) return false
  const title = draft.title.trim(), body = draft.body.trim()
  const insert = (list, data) => list.value.unshift({ id: list.value.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1, ...data })
  if (kind === '일정') insert(events, { title, body, startDate: draft.startDate, endDate: draft.endDate, startTime: draft.startTime, endTime: draft.endTime, date: draft.startDate + ' ' + draft.startTime, time: draft.startTime, category: draft.category, tag: draft.category, state: '예정', color: draft.color, attendeeIds: [...draft.attendeeIds], recurrence: makeRecurrence(draft.recurrence) })
  if (kind === '할 일') insert(tasks, { title, body, date: draft.date, category: draft.category, priority: draft.priority, done: false, subtasks: (draft.subtasks ?? []).map(item => ({ ...item, title: item.title.trim() })) })
  if (kind === '루틴') insert(routines, { title, body, category: draft.category, startDate: draft.startDate, recurrence: makeRecurrence(draft.recurrence), time: draft.time, duration: draft.duration, days: [...draft.days].sort(), goal: { count: draft.goalCount, unit: draft.goalUnit }, notify: draft.notify, reminderMinutes: draft.reminderMinutes, done: false, streak: 0, best: 0, history: [0, 0, 0, 0, 0, 0, 0], paused: false })
  if (kind === '다이어리') insert(diaries, { title, body, date: draft.date, mood: draft.mood })
  if (kind === '메모') insert(memos, { title, body, time: localDate(), color: '', actionable: false })
  if (kind === 'D-Day') addDday({ title, body, category: draft.category, date: draft.date, notifyDays: [...draft.notifyDays] })
  if (kind === '머니로그') insert(moneyEntries, { title, body, date: draft.date, amount: draft.type === 'out' ? -draft.amount : draft.amount, type: draft.type, category: draft.type === 'in' ? '수입' : draft.category })
  if (kind === '회고') savePlannerReview(draft.date, body)
  if (kind === '커뮤니티 글') insert(communityPosts, { title, body, name: '김지수', time: '방금', auto: false, likes: 0, comments: 0, liked: false })
  if (kind === '업무 위키') addDoc({ title, body, space: draft.space, parentId: draft.parentId })
  if (kind === '업무 기록') {
    const data = { title, body, type: draft.type, owner: draft.owner, projectId: draft.projectId, status: draft.status, startDate: draft.startDate, endDate: draft.endDate, startTime: draft.startTime, endTime: draft.endTime, half: draft.half, leaveDays: draft.type === '반차' ? 0.5 : draft.type === '연차' ? draft.leaveDays : 0 }
    if (['외근', '출장'].includes(draft.type)) Object.assign(data, { location: draft.location, partner: draft.partner })
    if (draft.type === '출장') Object.assign(data, { transport: draft.transport, expense: draft.expense })
    if (draft.type === '이직') Object.assign(data, { fromCompany: draft.fromCompany, toCompany: draft.toCompany, role: draft.role, handover: draft.handover })
    insert(workRecords, data)
  }
  return true
}
