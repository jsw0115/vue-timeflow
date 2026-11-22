// 계정 알림함(/api/notifications)과 마감 알림 계산 요청(Q-32). 서버 알림 행을 알림함 화면 모양으로 바꾼다.

const PATH = '/api/notifications'

/** "방금", "12분 전", "3시간 전", "어제", "11월 20일" 같은 표시. */
export function relativeTime(iso, now = Date.now()) {
  const at = Date.parse(iso ?? '')
  if (!Number.isFinite(at)) return ''
  const minutes = Math.floor((now - at) / 60000)
  if (minutes < 1) return '방금'
  if (minutes < 60) return `${minutes}분 전`
  if (minutes < 1440) return `${Math.floor(minutes / 60)}시간 전`
  if (minutes < 2880) return '어제'
  const d = new Date(at)
  return `${d.getMonth() + 1}월 ${d.getDate()}일`
}

export const fromServer = (row, now = Date.now()) => ({ id: row.id, version: row.version, kind: row.kind ?? '알림', title: row.title ?? '', link: row.link || '/notifications', read: row.read === true, at: relativeTime(row.createdAt, now), createdAt: row.createdAt ?? '' })

export function createNotificationClient(request) {
  return {
    /** 마감 알림을 먼저 계산하게 한 뒤(서버가 5분에 한 번만 계산) 최근 알림 100개를 읽는다. 계산이 실패해도 목록은 읽는다. */
    async load() {
      try { await request(`${PATH}/due-refresh`, { method: 'POST' }) } catch { /* 계산 실패는 목록 표시를 막지 않는다 */ }
      const page = await request(`${PATH}?page=0&size=100`)
      return (page?.items ?? []).map((row) => fromServer(row)).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    },
    read: (n) => request(`${PATH}/${encodeURIComponent(n.id)}/read`, { method: 'PUT' }),
    readAll: () => request(`${PATH}/read-all`, { method: 'PUT' }),
    remove: (n) => request(`${PATH}/${encodeURIComponent(n.id)}?version=${encodeURIComponent(n.version)}`, { method: 'DELETE' }),
  }
}
