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

/** 한국어가 아닌 표시 언어의 상대 시각. "{n}분 전"은 사전에서 '알림 n분 전' 뜻으로 쓰여, 사전 대신 Intl로 만든다(PR-32 16단계). */
export function relativeTimeIn(iso, locale, now = Date.now()) {
  const at = Date.parse(iso ?? '')
  if (!Number.isFinite(at)) return ''
  const minutes = Math.floor((now - at) / 60000)
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  if (minutes < 1) return rtf.format(0, 'second')
  if (minutes < 60) return rtf.format(-minutes, 'minute')
  if (minutes < 1440) return rtf.format(-Math.floor(minutes / 60), 'hour')
  if (minutes < 2880) return rtf.format(-1, 'day')
  return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(new Date(at))
}

/** 저장해 둔 한국어 시각 문구("방금", "12분 전", "3시간 전", "어제")를 다른 언어로 바꾼다. 서버 시각이 없는 시연 알림용이며 모르는 문구는 그대로 둔다. */
export function relativeLabelIn(label, locale) {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  if (label === '방금') return rtf.format(0, 'second')
  if (label === '어제') return rtf.format(-1, 'day')
  const minutes = /^(\d+)분 전$/.exec(label ?? '')
  if (minutes) return rtf.format(-Number(minutes[1]), 'minute')
  const hours = /^(\d+)시간 전$/.exec(label ?? '')
  if (hours) return rtf.format(-Number(hours[1]), 'hour')
  return label ?? ''
}

export const fromServer = (row, now = Date.now()) => ({
  id: row.id, version: row.version, kind: row.kind ?? '알림', title: row.title ?? '', link: row.link || '/notifications', read: row.read === true,
  at: relativeTime(row.createdAt, now), createdAt: row.createdAt ?? '',
  // 알림에서 바로 처리(UF-126): 처리 대상·처리 결과·다시 보일 시각
  action: row.action && typeof row.action === 'object' ? row.action : null, handled: row.handled ?? null, showAfter: row.showAfter ?? null, expiresAt: row.expiresAt ?? null,
})

/** 지금 보일 알림인지. "10분 뒤"로 미룬 알림은 그 시각까지 숨긴다. */
export const isVisible = (n, now = Date.now()) => !n.showAfter || !(Date.parse(n.showAfter) > now)
/** 바로 처리 버튼을 보일지: 할 일 대상이 있고 아직 처리하지 않았고 기간이 남아 있을 때. */
export const canAct = (n, now = Date.now()) => n.action?.kind === 'task' && !n.handled && (!n.expiresAt || Date.parse(n.expiresAt) > now)

export function actionErrorText(error) {
  if (error?.status === 409) return error.message || '이미 처리했거나 기간이 지난 알림이에요.'
  if (error?.status === 404) return '할 일이 지워져 처리하지 않았어요.'
  if (error?.status == null || error.status === 0) return '서버에 연결하지 못했어요. 연결을 확인하고 다시 시도해 주세요.'
  return '처리하지 못했어요. 잠시 뒤 다시 시도해 주세요.'
}

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
    act: (n, action) => request(`${PATH}/${encodeURIComponent(n.id)}/actions/${action}`, { method: 'POST' }),
  }
}
