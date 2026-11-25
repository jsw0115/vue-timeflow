// 재배치 제안(PR-19 UF-137, Q-36)과 플래너 계획 블록: 요청 경로, 시각 정리, 고른 항목만 보내는 적용 본문, 되돌리기 본문.
// 서버 Rescheduler가 안을 만들고 version을 확인한다. 일정(SCHEDULE)은 언제나 고정이라 보내지 않는다.

export const MIN_DELAY = 5
export const MAX_DELAY = 480

export function createRescheduleClient(request) {
  return {
    /** 그날의 플래너 계획 블록(템플릿 적용 등으로 만든 항목). */
    blocks: (date) => request(`/api/planner/items?date=${encodeURIComponent(date)}`),
    preview: ({ date, from, delayMinutes }) => request('/api/planner/reschedule/preview', { method: 'POST', body: JSON.stringify({ date, from, delayMinutes }) }),
    apply: (moves) => request('/api/planner/reschedule/apply', { method: 'POST', body: JSON.stringify({ moves }) }),
  }
}

/** 서버 LocalTime("11:00:00" 또는 "11:00")을 "11:00"으로. 형식이 다르면 빈 값이다. */
export const hhmm = (value) => (/^\d{2}:\d{2}/.test(String(value ?? '')) ? String(value).slice(0, 5) : '')

/** 시간이 있는 열린 계획 블록만 타임바에 그린다. 끝낸·취소한 블록은 그리지 않는다. */
export function timedBlocks(items, date) {
  return (items ?? [])
    .filter((item) => item?.date === date && hhmm(item.startTime) && hhmm(item.endTime) && !['DONE', 'CANCELLED'].includes(item.status))
    .map((item) => ({ id: item.id, title: item.title, startTime: hhmm(item.startTime), endTime: hhmm(item.endTime) }))
}

/** 기본 "언제부터 밀렸나요" 값: 지금 시각을 5분 단위로 내림. */
export function defaultFrom(now = new Date()) {
  const minutes = Math.floor((now.getHours() * 60 + now.getMinutes()) / 5) * 5
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

/** 고른 항목만 적용 본문으로. 제안 때 받은 version을 그대로 보낸다. */
export const applyBody = (moves, chosen) => moves.filter((m) => chosen.has(m.kind + ':' + m.id)).map((m) => ({ kind: m.kind, id: m.id, version: m.version, ...m.after }))
/** 되돌리기 본문: 옮긴 뒤 version으로 원래 시각을 보낸다. 그사이 바뀌었으면 서버가 충돌로 돌려준다. */
export const undoBody = (moved) => moved.map((m) => ({ kind: m.kind, id: m.id, version: m.version, ...m.before }))

export function moveText(move) {
  if (move.kind === 'task') return `마감 ${move.before.dueTime} → ${move.after.dueTime}`
  return `${move.before.startTime}–${move.before.endTime} → ${move.after.startTime}–${move.after.endTime}`
}
export const kindLabel = (kind) => (kind === 'task' ? '할 일' : '계획 블록')

export function rescheduleErrorText(error) {
  if (error?.status === 400) return error.message || '입력한 시각과 시간을 확인해 주세요.'
  if (error?.status === 409) return '다른 곳에서 동시에 바뀌었어요. 재배치안을 다시 만들어 주세요.'
  if (error?.status == null || error.status === 0) return '서버에 연결하지 못했어요. 연결을 확인하고 다시 시도해 주세요.'
  return '재배치를 마치지 못했어요. 잠시 뒤 다시 시도해 주세요.'
}
