// 할 일·일정·실제 기록 연결을 조회하고, 할 일을 일정에 배치하며, 연결된 기록으로 가는 화면 주소를 만든다(PR-08 3단계).
import { apiRequest } from '../auth/apiRequest.js'

export const KIND_LABEL = { task: '할 일', schedule: '일정', actual: '실제 기록' }

/** 연결된 기록을 여는 화면 주소. 일정은 일정 화면에서 그 일정을 연다. */
export function linkRoute(link) {
  if (link.kind === 'task') return { path: '/tasks/' + link.id }
  if (link.kind === 'schedule') return { path: '/events', query: { id: link.id } }
  return { path: '/planner/daily', query: { recording: link.id } }
}

/**
 * 실제 기록의 원본 표시. 원본과의 연결이 남아 있으면 그 기록을, 원본을 지워 연결만 끊겼으면 "삭제된 일정"처럼 알린다(UT-144).
 * 원본 없이 시작한 기록이면 null이다.
 */
export function originOf(record, links) {
  if (!record?.sourceKind) return null
  const live = (links ?? []).find((link) => link.kind === record.sourceKind && link.id === record.sourceId)
  if (live) return { ...live, deleted: false }
  return { kind: record.sourceKind, id: record.sourceId, title: '삭제된 ' + KIND_LABEL[record.sourceKind], deleted: true }
}

export function createLinkClient({ request = apiRequest } = {}) {
  return {
    list: (kind, id) => request('/api/record-links?kind=' + encodeURIComponent(kind) + '&id=' + encodeURIComponent(id)),
    /** 할 일을 일정으로 배치한다. 제목을 비우면 서버가 할 일 제목을 복사한다. 같은 키로 다시 보내면 처음 만든 일정이 돌아온다. */
    placeTask: (taskId, slot, idempotencyKey) => request('/api/tasks/' + encodeURIComponent(taskId) + '/schedules', {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify({ startDate: slot.date, endDate: slot.date, startTime: slot.startTime, endTime: slot.endTime }),
    }),
  }
}
