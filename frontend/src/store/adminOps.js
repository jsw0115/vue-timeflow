import { computed, reactive, ref } from 'vue'

/**
 * 관리자 운영 데이터 — CS 문의, 결제/환불, 콘텐츠, 모니터링, 감사 로그를 한 저장소에서 다룬다.
 * 핵심 규칙: 관리자가 상태를 바꾸는 모든 행위는 반드시 audit()를 거쳐 감사 로그에 남는다.
 */

export const CURRENT_ADMIN = '운영자A'

/* ---------------- 감사 로그 ---------------- */
export const AUDIT_CATEGORIES = ['권한 변경', '제재', '결제', 'CS', '콘텐츠', '공지', '시스템']

export const auditLogs = ref([
  { id: 4, at: '2026-09-05 14:12', admin: '운영자A', category: '제재', action: '사용자 정지', target: '정우진 (신고 3건 누적)', memo: '' },
  { id: 3, at: '2026-09-05 13:40', admin: '운영자B', category: '제재', action: '게시글 제재', target: '운동 갓생방 · 광고성 게시물', memo: '' },
  { id: 2, at: '2026-09-05 11:05', admin: '운영자A', category: '결제', action: '환불 승인', target: '이서연 · 6,900원', memo: '' },
  { id: 1, at: '2026-09-05 09:20', admin: '운영자B', category: '공지', action: '공지 등록', target: '추석 연휴 서버 점검 안내', memo: '' },
])

function stamp() {
  return new Date().toISOString().slice(0, 16).replace('T', ' ')
}

/** 관리자 행위를 감사 로그에 남긴다. 상태를 바꾸는 함수는 예외 없이 이걸 호출한다. */
export function audit(category, action, target, memo = '') {
  auditLogs.value.unshift({
    id: Math.max(0, ...auditLogs.value.map((l) => l.id)) + 1,
    at: stamp(),
    admin: CURRENT_ADMIN,
    category,
    action,
    target,
    memo,
  })
}

/* ---------------- CS 문의 ---------------- */
export const CS_STATES = ['답변 대기', '처리중', '답변 완료', '보류']
export const CS_TEMPLATES = [
  { id: 'pay', label: '결제 관련', body: '안녕하세요. 결제 내역을 확인했습니다. 중복 결제 건은 영업일 3일 이내 환불 처리됩니다.' },
  { id: 'delete', label: '계정 삭제', body: '안녕하세요. 계정 삭제는 신청 후 7일간 보류되며, 그 사이 언제든 취소할 수 있습니다.' },
  { id: 'bug', label: '버그 제보', body: '안녕하세요. 제보해주신 내용을 개발팀에 전달했습니다. 확인 후 다시 안내드리겠습니다.' },
]

export const tickets = ref([
  { id: 1, name: '최지우', title: '결제가 중복으로 됐어요', date: '2026-09-04', state: '답변 대기', priority: '높음', replies: [] },
  { id: 2, name: '한소율', title: '루틴 알림이 안 와요', date: '2026-09-03', state: '답변 대기', priority: '보통', replies: [] },
  { id: 3, name: '정우진', title: '계정 삭제 요청', date: '2026-08-31', state: '답변 완료', priority: '보통', replies: [{ at: '2026-09-01 10:12', admin: '운영자B', body: '삭제 절차를 안내드렸습니다.' }] },
])

export function replyTicket(ticket, body) {
  const text = body.trim()
  if (!text) return false
  ticket.replies.push({ at: stamp(), admin: CURRENT_ADMIN, body: text })
  ticket.state = '답변 완료'
  audit('CS', '문의 답변', ticket.name + ' · ' + ticket.title, text.slice(0, 40))
  return true
}
export function setTicketState(ticket, state) {
  const before = ticket.state
  ticket.state = state
  audit('CS', '문의 상태 변경', ticket.name + ' · ' + ticket.title, before + ' → ' + state)
}

/** SLA — 답변 대기가 오래된 문의를 놓치지 않도록 집계 */
export const csMetrics = computed(() => {
  const open = tickets.value.filter((t) => t.state !== '답변 완료')
  const overdue = open.filter((t) => {
    const days = (Date.now() - new Date(t.date).getTime()) / 86400000
    return days > 2
  })
  return { total: tickets.value.length, open: open.length, overdue: overdue.length }
})

/* ---------------- 구독 · 결제 ---------------- */
export const payments = ref([
  { id: 1, name: '박민준', plan: '프리미엄 연간', date: '2026-08-22', amount: 59900, state: '결제완료', refundReason: '' },
  { id: 2, name: '이서연', plan: '프리미엄 월간', date: '2026-08-20', amount: 6900, state: '환불 요청', refundReason: '중복 결제' },
  { id: 3, name: '최지우', plan: '프리미엄 월간', date: '2026-08-18', amount: 6900, state: '결제완료', refundReason: '' },
  { id: 4, name: '한소율', plan: '프리미엄 월간', date: '2026-08-15', amount: 6900, state: '결제실패', refundReason: '' },
])

export function approveRefund(p) {
  p.state = '환불완료'
  audit('결제', '환불 승인', p.name + ' · ' + p.amount.toLocaleString('ko-KR') + '원', p.refundReason)
}
export function rejectRefund(p, reason) {
  p.state = '환불거절'
  p.refundReason = reason
  audit('결제', '환불 거절', p.name + ' · ' + p.amount.toLocaleString('ko-KR') + '원', reason)
}
export function retryPayment(p) {
  p.state = '결제완료'
  audit('결제', '재결제 처리', p.name + ' · ' + p.amount.toLocaleString('ko-KR') + '원')
}

export const billingMetrics = computed(() => {
  const paid = payments.value.filter((p) => p.state === '결제완료')
  return {
    subscribers: 2140,
    revenue: paid.reduce((a, p) => a + p.amount, 0),
    churn: 3.2,
    refundRequests: payments.value.filter((p) => p.state === '환불 요청').length,
    failed: payments.value.filter((p) => p.state === '결제실패').length,
  }
})

/* ---------------- 콘텐츠 ---------------- */
export const CONTENT_TABS = ['명언', '플래너 템플릿', '스티커팩']
export const contents = ref([
  { id: 1, kind: '명언', body: '작지만 확실한 진전이 큰 변화를 만든다', where: '홈 대시보드', date: '2026-08-10', live: true },
  { id: 2, kind: '명언', body: '오늘의 계획이 내일의 나를 만든다', where: '온보딩', date: '2026-07-22', live: true },
  { id: 3, kind: '플래너 템플릿', body: '주간 회고 템플릿', where: '플래너 · 주간', date: '2026-08-02', live: true },
  { id: 4, kind: '스티커팩', body: '동물 스티커 12종', where: '다이어리', date: '2026-06-30', live: false },
])

export function addContent({ kind, body, where }) {
  const item = {
    id: Math.max(0, ...contents.value.map((c) => c.id)) + 1,
    kind,
    body: body.trim(),
    where: where.trim() || '미지정',
    date: stamp().slice(0, 10),
    live: false,
  }
  contents.value.unshift(item)
  audit('콘텐츠', '콘텐츠 등록', kind + ' · ' + item.body.slice(0, 30))
  return item
}
export function toggleContentLive(c) {
  c.live = !c.live
  audit('콘텐츠', c.live ? '콘텐츠 노출' : '콘텐츠 숨김', c.kind + ' · ' + c.body.slice(0, 30))
}
export function removeContent(c) {
  contents.value = contents.value.filter((x) => x.id !== c.id)
  audit('콘텐츠', '콘텐츠 삭제', c.kind + ' · ' + c.body.slice(0, 30))
}

/* ---------------- 모니터링 ---------------- */
export const monitoring = reactive({
  apiSuccess: 99.94,
  latencyMs: 142,
  errorsToday: 7,
  status: '정상',
  incidents: [
    { id: 1, at: '2026-09-05 14:02:11', level: 'danger', label: 'ERROR', msg: 'DB connection timeout', api: '/api/planner/items', ack: false },
    { id: 2, at: '2026-09-05 13:58:40', level: 'warn', label: 'WARN', msg: 'Rate limit approaching', api: '/api/auth/login', ack: false },
    { id: 3, at: '2026-09-05 13:55:02', level: 'info', label: 'INFO', msg: 'Backup completed', api: 'system', ack: true },
  ],
  alertRules: [
    { id: 'err-rate', label: '에러율 1% 초과', channel: '슬랙', on: true },
    { id: 'latency', label: '평균 응답 500ms 초과', channel: '슬랙', on: true },
    { id: 'payment-fail', label: '결제 실패 5건 초과', channel: '이메일', on: false },
    { id: 'cs-sla', label: 'CS 미답변 48시간 초과', channel: '이메일', on: true },
  ],
})

export function ackIncident(inc) {
  inc.ack = true
  audit('시스템', '장애 확인 처리', inc.label + ' · ' + inc.msg)
}
export function toggleAlertRule(rule) {
  rule.on = !rule.on
  audit('시스템', rule.on ? '알림 규칙 켜기' : '알림 규칙 끄기', rule.label)
}
