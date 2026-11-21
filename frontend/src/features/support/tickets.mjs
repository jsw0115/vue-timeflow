// 1:1 문의의 서버 상태 이름, 경과·48시간 초과 계산, 사용자·관리자 문의 API 호출을 정한다(PR-10 UF-117).

/** 서버 상태(AdminService.reply)와 화면 이름. 사용자가 막 남긴 문의는 상태가 없어 접수(OPEN)로 본다. */
export const TICKET_STATUSES = [
  { id: 'OPEN', label: '접수' },
  { id: 'IN_PROGRESS', label: '처리 중' },
  { id: 'ANSWERED', label: '답변 완료' },
  { id: 'HOLD', label: '보류' },
]
export const statusOf = (ticket) => (TICKET_STATUSES.some((status) => status.id === ticket?.status) ? ticket.status : 'OPEN')
export const statusLabel = (ticket) => TICKET_STATUSES.find((status) => status.id === statusOf(ticket)).label

const HOUR = 3600000
/** 접수 뒤 지난 날수(내림). 접수 시각을 읽지 못하면 null이다. */
export function daysOpen(ticket, now = Date.now()) {
  const created = Date.parse(ticket?.createdAt ?? '')
  return Number.isFinite(created) ? Math.max(0, Math.floor((now - created) / (24 * HOUR))) : null
}
/** 답변 완료가 아닌 문의가 접수 뒤 48시간을 넘었는지. */
export function isOverdue(ticket, now = Date.now()) {
  const created = Date.parse(ticket?.createdAt ?? '')
  return statusOf(ticket) !== 'ANSWERED' && Number.isFinite(created) && now - created > 48 * HOUR
}

/** 관리자 화면 수치. 분모(전체)를 함께 돌려준다. */
export function ticketMetrics(tickets, now = Date.now()) {
  return {
    total: tickets.length,
    open: tickets.filter((ticket) => statusOf(ticket) !== 'ANSWERED').length,
    overdue: tickets.filter((ticket) => isOverdue(ticket, now)).length,
  }
}

/** 오래된 미답변이 위로 오도록: 답변 완료가 아닌 문의 먼저, 그다음 접수 시각 오래된 순. */
export function sortForTriage(tickets) {
  return [...tickets].sort((a, b) => Number(statusOf(a) === 'ANSWERED') - Number(statusOf(b) === 'ANSWERED') || String(a.createdAt ?? '').localeCompare(String(b.createdAt ?? '')))
}

/**
 * 답변 템플릿. 실제로 구현·확인되지 않은 처리(환불 기한, 계정 삭제 유예 등)를 약속하는 문구는 넣지 않는다.
 */
export const REPLY_TEMPLATES = [
  { id: 'received', label: '확인 중', body: '안녕하세요. 문의 내용을 확인하고 있습니다. 확인이 끝나면 이 문의에 다시 답변드리겠습니다.' },
  { id: 'bug', label: '오류 제보', body: '안녕하세요. 알려 주신 내용을 개발 담당자에게 전달했습니다. 확인 후 이 문의에 다시 안내드리겠습니다.' },
]

/** request는 apiRequest처럼 성공 응답의 data를 돌려주고 실패하면 status를 담아 던진다. */
export function createSupportClient({ request }) {
  return {
    /** 내 문의. 서버는 한 쪽에 최대 100건을 준다. */
    async mine() {
      const page = await request('/api/support/tickets?page=0&size=100')
      return page?.items ?? []
    },
    create: ({ title, body, category }) => request('/api/support/tickets', {
      method: 'POST',
      body: JSON.stringify({ title: String(title ?? '').trim(), body: String(body ?? '').trim(), ...(String(category ?? '').trim() ? { category: String(category).trim() } : {}) }),
    }),
    /** 관리자: 모든 계정의 문의(ownerId 포함). */
    all: () => request('/api/admin/tickets'),
    /** 관리자: 답변·상태 저장. 문의 주인(userId)과 받은 version을 함께 보낸다. 답변 완료는 답변이 있어야 한다. */
    reply: (ticket, { reply, status }) => request(`/api/admin/tickets/${encodeURIComponent(ticket.id)}`, {
      method: 'PUT',
      body: JSON.stringify({ userId: ticket.ownerId, version: ticket.version, reply: String(reply ?? ''), status }),
    }),
  }
}
