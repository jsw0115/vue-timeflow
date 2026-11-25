// 문서 버전(PR-25): 요청 경로, 문서 이름, 고정본 내용을 화면 행으로 바꾸는 규칙. 서버 DocumentVersions와 같은 문서 종류만 다룬다.
import { EMPLOYMENT_STATUSES, employmentTypeLabel, periodLabel } from './careerPeriods.mjs'

export const DOCUMENTS = [
  { id: 'resume', label: '이력서' },
  { id: 'career', label: '경력기술서' },
  { id: 'portfolio', label: '포트폴리오' },
]
export const MAX_VERSIONS = 100
export const documentLabel = (id) => DOCUMENTS.find((item) => item.id === id)?.label ?? '문서'

const versionsPath = '/api/career/document-versions'
const appPath = (applicationId) => `/api/career/applications/${encodeURIComponent(applicationId)}/documents`
export function createDocumentVersionClient(request) {
  return {
    list: (document) => request(document ? `${versionsPath}?document=${encodeURIComponent(document)}` : versionsPath),
    create: (document, { label = '', note = '' } = {}) => {
      const body = { document }
      if (label.trim()) body.label = label.trim()
      if (note.trim()) body.note = note.trim()
      return request(versionsPath, { method: 'POST', body: JSON.stringify(body) })
    },
    get: (id) => request(`${versionsPath}/${encodeURIComponent(id)}`),
    remove: (id) => request(`${versionsPath}/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    attached: (applicationId) => request(appPath(applicationId)),
    attach: (applicationId, versionId) => request(appPath(applicationId), { method: 'POST', body: JSON.stringify({ versionId }) }),
    detach: (applicationId, versionId) => request(`${appPath(applicationId)}/${encodeURIComponent(versionId)}`, { method: 'DELETE' }),
  }
}

/** 저장 시각을 이 기기 시간으로 "2026-11-25 14:03"처럼 보인다. */
export function savedAt(iso) {
  const date = new Date(iso)
  if (!iso || Number.isNaN(date.getTime())) return ''
  const pad = (value) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** 선택 목록·연결 목록에 쓰는 한 줄 이름. 이름표를 붙였으면 번호도 함께 보인다. */
export function versionName(version) {
  const plain = `${documentLabel(version.document)} v${version.number}`
  return version.title && version.title !== plain ? `${plain} · ${version.title}` : plain
}

const row = (label, value) => [label, value == null ? '' : String(value)]
const filled = (rows) => rows.filter(([, value]) => value.trim() !== '')

/**
 * 고정본 내용을 읽기 전용 화면 묶음으로 바꾼다. maskCompany면 회사명을 가린다(경력 화면의 회사명 비공개 설정과 같다).
 * 반환: [{ heading, rows: [[이름, 값]] }]
 */
export function snapshotSections(version, { maskCompany = false } = {}) {
  const content = version?.content ?? {}
  if (version?.document === 'resume') {
    const r = content.resume ?? {}
    return [{ heading: '기본 정보', rows: filled([row('이름', r.name), row('경력', r.years != null && r.years !== '' ? `${r.years}년` : ''), row('한 줄 소개', r.headline), row('보유 기술', r.skills), row('학력', r.education)]) }]
  }
  const items = Array.isArray(content.items) ? content.items : []
  if (version?.document === 'career') {
    return items.map((item) => ({
      heading: item.title ?? '',
      rows: filled([
        row('기간', periodLabel(item)), row('역할', item.role),
        row('회사', maskCompany && item.company ? '회사명 비공개' : item.company), row('부서', item.department),
        row('고용 형태', employmentTypeLabel(item.employmentType)), row('재직 상태', EMPLOYMENT_STATUSES.find((s) => s.value === item.employmentStatus)?.label),
        row('기술', item.stack), row('성과', (item.achievements ?? []).join('\n')),
      ]),
    }))
  }
  return items.map((item) => ({ heading: item.title ?? '', rows: filled([row('종류', item.kind), row('내용', item.body)]) }))
}

export function versionErrorText(error) {
  if (error?.status === 409) return error.message || '지금은 이 작업을 할 수 없어요.'
  if (error?.status === 404) return '그 버전이나 지원 기록을 찾을 수 없어요. 목록을 새로 불러와 주세요.'
  if (error?.status === 400) return error.message || '입력한 값을 확인해 주세요.'
  if (error?.status == null || error.status === 0) return '서버에 연결하지 못했어요. 연결을 확인하고 다시 시도해 주세요.'
  return '버전 작업을 마치지 못했어요. 잠시 뒤 다시 시도해 주세요.'
}
