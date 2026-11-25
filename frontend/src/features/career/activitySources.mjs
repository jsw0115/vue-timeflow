// 커리어 활동의 근거 원본 연결(PR-24): 요청 경로·후보 목록·표시 문구. 서버 ActivitySources와 같은 종류만 다룬다.

export const SOURCE_KINDS = [
  { id: 'schedule', label: '일정' },
  { id: 'actual', label: '실제 기록' },
  { id: 'wbs', label: 'WBS 작업' },
]
export const MAX_SOURCES = 50
export const kindLabel = (id) => SOURCE_KINDS.find((k) => k.id === id)?.label ?? id

const base = (activityId) => `/api/career/activities/${encodeURIComponent(activityId)}/sources`
export function createActivitySourceClient(request) {
  return {
    list: (activityId) => request(base(activityId)),
    add: (activityId, kind, id) => request(base(activityId), { method: 'POST', body: JSON.stringify({ kind, id }) }),
    remove: (activityId, kind, id) => request(`${base(activityId)}/${encodeURIComponent(kind)}/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  }
}

/**
 * 고를 후보. 서버 기록(문자열 ID)만 쓰고, 활동 날짜에 가까운 것부터 최대 50개를 보인다. 이미 연결한 것은 뺀다.
 * date가 없으면 최근 것부터다.
 */
export function candidates(kind, { events = [], recordings = [], wbs = [] }, activityDate = '', linked = []) {
  const taken = new Set(linked.filter((s) => s.kind === kind).map((s) => String(s.id)))
  const distance = (date) => (activityDate && date ? Math.abs(Date.parse(date) - Date.parse(activityDate)) : -Date.parse(date || 0) || 0)
  let rows = []
  if (kind === 'schedule') rows = events.filter((e) => typeof e.id === 'string').map((e) => ({ id: e.id, label: `${e.startDate ?? ''} ${e.title}`.trim(), date: e.startDate ?? '' }))
  if (kind === 'actual') rows = recordings.filter((r) => typeof r.id === 'string' && r.state === 'COMPLETED').map((r) => ({ id: r.id, label: `${String(r.startedAt ?? '').slice(0, 10)} ${r.title ?? '실제 기록'}`.trim(), date: String(r.startedAt ?? '').slice(0, 10) }))
  if (kind === 'wbs') rows = wbs.filter((n) => typeof n.id === 'string').map((n) => ({ id: n.id, label: n.title, date: n.startDate ?? '' }))
  return rows.filter((r) => !taken.has(String(r.id))).sort((a, b) => distance(a.date) - distance(b.date)).slice(0, 50)
}

export function sourceErrorText(error) {
  if (error?.status === 409) return error.message || '근거를 더 연결할 수 없어요.'
  if (error?.status === 404) return '그 기록을 찾을 수 없어요. 목록을 새로 불러와 주세요.'
  if (error?.status == null || error.status === 0) return '서버에 연결하지 못했어요. 연결을 확인하고 다시 시도해 주세요.'
  return '근거를 바꾸지 못했어요. 잠시 뒤 다시 시도해 주세요.'
}
