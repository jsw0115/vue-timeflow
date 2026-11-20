import { eventStore, taskStore, routineStore } from './appState'
import { diaryStore, memoStore } from './writing'
import { moneyStore } from './money'
import { ddayStore } from './ddays'
import { moodCode } from '../utils/mood.mjs'
import { workRecordStore } from './workRecords'
import { addDday } from './ddays'
import { savePlannerReview } from './plannerReviews'
import { addDoc, WIKI_SPACES, wikiStore } from './wiki'
import { localDate, rangeError, routineError, workRecordError } from '../utils/postValidation.mjs'
import { makeRecurrence, recurrenceError } from '../utils/recurrence.mjs'

// 커뮤니티 글은 서버 게시판(커뮤니티마다 다름)에서 쓴다. 전역 작성 창에서는 뺐다(PR-10 3단계)
export const postKinds = ['일정', '할 일', '루틴', '다이어리', '메모', 'D-Day', '머니로그', '회고', '업무 기록', '업무 위키']
export function makePostDraft(kind) {
  const today = localDate()
  return { title: '', body: '', category: kind === '머니로그' ? '식비' : '개인', date: today, startDate: today, endDate: today,
    startTime: '09:00', endTime: kind === '업무 기록' ? '18:00' : '10:00', priority: '보통', mood: 'calm',
    color: '#2f5d46', attendeeIds: [], time: '19:00', duration: 30, days: [0, 1, 2, 3, 4, 5, 6],
    recurrence: makeRecurrence(kind === '루틴' ? { frequency: 'weekly', weekdays: [0,1,2,3,4,5,6] } : {}), subtasks: [],
    goalCount: 1, goalUnit: '회', notify: true, reminderMinutes: 10, notifyDays: [1],
    amount: 0, type: kind === '업무 기록' ? '연차' : 'out', owner: '나', projectId: '', status: '예정',
    half: '오전', leaveDays: 1, location: '', partner: '', transport: '', expense: 0,
    fromCompany: '', toCompany: '', role: '', handover: '', space: WIKI_SPACES[0], parentId: null }
}
const validDate = date => typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(+new Date(date + 'T12:00:00')) && localDate(new Date(date + 'T12:00:00')) === date
export function postDraftError(kind, draft) {
  if (!postKinds.includes(kind)) return '글 종류를 선택해주세요.'
  if (kind === '회고') {
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
/**
 * 검증한 초안을 저장한다. 서버에 저장하는 종류는 서버 성공 응답 뒤에 true가 되고, 실패하면 오류를 던져 화면이 입력을 남기게 한다.
 * progress는 할 일을 만든 뒤 체크리스트 일부가 실패했을 때 이어서 저장할 진행 상태다(PR-07).
 */
export async function savePostDraft(kind, draft, progress = null) {
  if (postDraftError(kind, draft)) return false
  const title = draft.title.trim(), body = draft.body.trim()
  if (kind === '할 일') {
    await taskStore.createWithChecklist({ title, body, date: draft.date, category: draft.category, priority: draft.priority }, draft.subtasks ?? [], progress)
    return true
  }
  if (kind === '일정') {
    await eventStore.create({ title, body, startDate: draft.startDate, endDate: draft.endDate, startTime: draft.startTime, endTime: draft.endTime, date: draft.startDate + ' ' + draft.startTime, time: draft.startTime, category: draft.category, tag: draft.category, state: '예정', color: draft.color, attendeeIds: [...draft.attendeeIds], recurrence: makeRecurrence(draft.recurrence) })
    return true
  }
  if (kind === '루틴') {
    await routineStore.create({ title, body, category: draft.category, startDate: draft.startDate, recurrence: makeRecurrence(draft.recurrence), time: draft.time, duration: draft.duration, days: [...draft.days].sort(), goal: { count: draft.goalCount, unit: draft.goalUnit }, notify: draft.notify, reminderMinutes: draft.reminderMinutes, done: false, streak: 0, best: 0, history: [0, 0, 0, 0, 0, 0, 0], paused: false })
    return true
  }
  if (kind === '다이어리') { await diaryStore.create({ title, body, date: draft.date, mood: moodCode(draft.mood) ?? undefined }); return true }
  if (kind === '메모') { await memoStore.create({ title, body, time: localDate(), color: '', actionable: false }, { offline: true }); return true }
  if (kind === 'D-Day') { await addDday({ title, body, category: draft.category, date: draft.date, notifyDays: [...draft.notifyDays] }); return true }
  if (kind === '머니로그') { await moneyStore.create({ title, body, date: draft.date, amount: draft.type === 'out' ? -draft.amount : draft.amount, type: draft.type, category: draft.type === 'in' ? '수입' : draft.category }); return true }
  if (kind === '회고') savePlannerReview(draft.date, body)
  if (kind === '업무 위키') { await addDoc({ title, body, space: draft.space, parentId: draft.parentId }); return true }
  if (kind === '업무 기록') {
    const data = { title, body, type: draft.type, owner: draft.owner, projectId: draft.projectId, status: draft.status, startDate: draft.startDate, endDate: draft.endDate, startTime: draft.startTime, endTime: draft.endTime, half: draft.half, leaveDays: draft.type === '반차' ? 0.5 : draft.type === '연차' ? draft.leaveDays : 0 }
    if (['외근', '출장'].includes(draft.type)) Object.assign(data, { location: draft.location, partner: draft.partner })
    if (draft.type === '출장') Object.assign(data, { transport: draft.transport, expense: draft.expense })
    if (draft.type === '이직') Object.assign(data, { fromCompany: draft.fromCompany, toCompany: draft.toCompany, role: draft.role, handover: draft.handover })
    await workRecordStore.create(data)
  }
  return true
}

/** 계정 저장을 지원하는 종류의 지금 저장 방식('server' 또는 'local'). 아직 이 브라우저에만 저장하는 종류는 null이다(PR-07). */
export function postStorageMode(kind) {
  return ({ '할 일': taskStore, '일정': eventStore, '루틴': routineStore, '다이어리': diaryStore, '메모': memoStore, 'D-Day': ddayStore, '머니로그': moneyStore, '업무 기록': workRecordStore, '업무 위키': wikiStore })[kind]?.mode.value ?? null
}
