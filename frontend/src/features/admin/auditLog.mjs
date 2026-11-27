// 서버 감사 로그(FeatureType.AUDIT: action·target·actor·detail)의 화면 이름·분류, 조회, CSV 내보내기를 정한다(PR-10 UF-117 7-4).
// 동작 이름은 AdminService가 실제로 남기는 코드만 적는다. 모르는 코드는 원래 코드 그대로 보인다.
import { korean } from '../i18n/translate.mjs'

export const AUDIT_ACTIONS = {
  USER_CREATE: { category: '계정', label: '계정 만들기' },
  USER_UPDATE: { category: '계정', label: '계정 역할·상태 변경' },
  FORCE_LOGOUT: { category: '계정', label: '강제 로그아웃' },
  TICKET_REPLY: { category: 'CS', label: '문의 처리' },
  MODERATION: { category: '신고', label: '신고 처리' },
  NOTICE_CREATE: { category: '공지', label: '공지 등록' },
  NOTICE_UPDATE: { category: '공지', label: '공지 수정' },
  NOTICE_DELETE: { category: '공지', label: '공지 삭제' },
  CONTENT_CREATE: { category: '콘텐츠', label: '콘텐츠 추가' },
  CONTENT_UPDATE: { category: '콘텐츠', label: '콘텐츠 수정' },
  CONTENT_DELETE: { category: '콘텐츠', label: '콘텐츠 삭제' },
  SETTINGS_SAVE: { category: '설정', label: '관리자 설정 저장' },
}
export const AUDIT_CATEGORIES = [...new Set(Object.values(AUDIT_ACTIONS).map((action) => action.category))]

const DETAIL_VALUES = {
  role: { USER: '일반', ADMIN: '관리자' },
  status: { ACTIVE: '사용 중', SUSPENDED: '정지', DELETED: '삭제됨', OPEN: '접수', IN_PROGRESS: '처리 중', ANSWERED: '답변 완료', HOLD: '보류' },
  action: { REMOVE: '게시글 삭제', IGNORE: '문제없음' },
}
const DETAIL_NAMES = { role: '역할', status: '상태', action: '처리' }

/** 한 행을 화면 값으로 바꾼다. t는 상세(detail) 문구의 번역(기본 한국어)이다. 분류·동작 이름은 필터·CSV가 쓰는 한국어 값 그대로 두고 화면에서 옮긴다. */
export function describeAudit(row, t = korean) {
  const known = AUDIT_ACTIONS[row?.action]
  const detail = row?.detail && typeof row.detail === 'object' && !Array.isArray(row.detail)
    ? Object.entries(row.detail).map(([key, value]) => `${t(DETAIL_NAMES[key] ?? key)}: ${t(DETAIL_VALUES[key]?.[value] ?? String(value))}`).join(', ')
    : ''
  return { category: known?.category ?? '기타', label: known?.label ?? String(row?.action ?? ''), detail, at: String(row?.createdAt ?? '').replace('T', ' ').slice(0, 19) }
}

/** 스프레드시트가 수식으로 읽는 첫 글자(=, +, -, @, 탭, CR)를 막고 따옴표를 이스케이프한다. */
export function csvCell(value) {
  let text = String(value ?? '')
  if (/^[=+\-@\t\r]/.test(text)) text = "'" + text
  return '"' + text.replace(/"/g, '""') + '"'
}

export function auditCsv(rows, nameOf = (id) => id) {
  const header = ['시각(UTC)', '관리자', '분류', '동작', '대상 ID', '내용'].map(csvCell).join(',')
  const lines = rows.map((row) => {
    const view = describeAudit(row)
    return [view.at, nameOf(row.actor), view.category, view.label, row.target, view.detail].map(csvCell).join(',')
  })
  return [header, ...lines].join('\n')
}

/** request는 apiRequest처럼 성공 응답의 data를 돌려주고 실패하면 status를 담아 던진다. 서버는 최신 순으로 준다. */
export function createAuditClient({ request }) {
  return {
    async all({ maxPages = 50 } = {}) {
      const items = []
      let total = 0
      for (let page = 0; page < maxPages; page += 1) {
        const chunk = await request(`/api/admin/audit?page=${page}&size=100`)
        total = chunk?.total ?? 0
        items.push(...(chunk?.items ?? []))
        if (!chunk?.items?.length || items.length >= total) break
      }
      return { items, total }
    },
  }
}
