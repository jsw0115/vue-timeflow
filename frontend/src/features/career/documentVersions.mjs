// 문서 버전(PR-25): 요청 경로, 문서 이름, 고정본 내용을 화면 행으로 바꾸는 규칙. 서버 DocumentVersions와 같은 문서 종류만 다룬다.
import { EMPLOYMENT_STATUSES, employmentTypeLabel, korean, periodLabel } from './careerPeriods.mjs'
import { COVER_LETTER_SECTIONS } from '../records/resumeStore.mjs'

export const DOCUMENTS = [
  { id: 'resume', label: '이력서' },
  { id: 'career', label: '경력기술서' },
  { id: 'portfolio', label: '포트폴리오' },
  { id: 'cover-letter', label: '자기소개서' },
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

/** 선택 목록·연결 목록에 쓰는 한 줄 이름. 이름표를 붙였으면 번호도 함께 보인다. t는 문서 이름 번역이다. */
export function versionName(version, t = korean) {
  const plain = `${t(documentLabel(version.document))} v${version.number}`
  const own = versionTitle(version, t)
  return own !== plain ? `${plain} · ${own}` : plain
}
/** 버전 제목. 서버가 붙인 기본 제목("이력서 v3")이면 고른 언어의 문서 이름으로 바꾸고, 직접 붙인 이름표는 그대로 둔다. */
export function versionTitle(version, t = korean) {
  const plain = `${documentLabel(version.document)} v${version.number}`
  return !version.title || version.title === plain ? `${t(documentLabel(version.document))} v${version.number}` : version.title
}

const row = (label, value) => [label, value == null ? '' : String(value)]
const filled = (rows) => rows.filter(([, value]) => value.trim() !== '')

/**
 * 고정본 내용을 읽기 전용 화면 묶음으로 바꾼다. maskCompany면 회사명을 가린다(경력 화면의 회사명 비공개 설정과 같다).
 * t는 항목 이름·정해진 값(고용 형태 등)의 번역이다. 사용자가 적은 값은 번역하지 않는다.
 * 반환: [{ heading, rows: [[이름, 값]] }]
 */
export function snapshotSections(version, { maskCompany = false, t = korean } = {}) {
  const content = version?.content ?? {}
  if (version?.document === 'resume') {
    const r = content.resume ?? {}
    return [{ heading: t('기본 정보'), rows: filled([row(t('이름'), r.name), row(t('경력'), r.years != null && r.years !== '' ? t('{n}년', { n: r.years }) : ''), row(t('한 줄 소개'), r.headline), row(t('보유 기술'), r.skills), row(t('학력'), r.education)]) }]
  }
  if (version?.document === 'cover-letter') {
    const c = content.coverLetter ?? {}
    return [{ heading: c.title || t('자기소개서'), rows: filled(COVER_LETTER_SECTIONS.map((s) => row(t(s.label), c[s.key]))) }]
  }
  const items = Array.isArray(content.items) ? content.items : []
  if (version?.document === 'career') {
    return items.map((item) => ({
      heading: item.title ?? '',
      rows: filled([
        row(t('기간'), periodLabel(item, t)), row(t('역할'), item.role), row(t('담당 업무'), item.duties),
        row(t('회사'), maskCompany && item.company ? t('회사명 비공개') : item.company), row(t('부서'), item.department),
        row(t('고용 형태'), item.employmentType ? t(employmentTypeLabel(item.employmentType)) : ''), row(t('재직 상태'), item.employmentStatus ? t(EMPLOYMENT_STATUSES.find((s) => s.value === item.employmentStatus)?.label ?? '') : ''),
        row(t('기술'), item.stack), row(t('성과'), (item.achievements ?? []).join('\n')),
      ]),
    }))
  }
  return items.map((item) => ({ heading: item.title ?? '', rows: filled([row(t('종류'), item.kind), row(t('내용'), item.body)]) }))
}

export function versionErrorText(error) {
  if (error?.status === 409) return error.message || '지금은 이 작업을 할 수 없어요.'
  if (error?.status === 404) return '그 버전이나 지원 기록을 찾을 수 없어요. 목록을 새로 불러와 주세요.'
  if (error?.status === 400) return error.message || '입력한 값을 확인해 주세요.'
  if (error?.status == null || error.status === 0) return '서버에 연결하지 못했어요. 연결을 확인하고 다시 시도해 주세요.'
  return '버전 작업을 마치지 못했어요. 잠시 뒤 다시 시도해 주세요.'
}

/** 비교용 항목 목록. 이력서는 하나, 경력기술서·포트폴리오는 원본 기록 ID로 묶는다(ID가 없으면 순서로). */
function entries(version, options) {
  const sections = snapshotSections(version, options)
  if (version?.document === 'resume' || version?.document === 'cover-letter') return sections.map((s) => ({ key: version.document, ...s }))
  const items = Array.isArray(version?.content?.items) ? version.content.items : []
  return sections.map((s, index) => ({ key: items[index]?.id ? 'id:' + items[index].id : 'at:' + index, ...s }))
}

/**
 * 두 버전 비교(PR-25, 개편안 "문서 버전·수정 이력·비교"). base는 기준(이전), target은 비교할 버전이다. 같은 문서끼리만 비교한다.
 * 반환: { added: [{ heading }], removed: [{ heading }], changed: [{ heading, fields: [{ label, before, after }] }], unchanged: 수 }
 */
export function compareVersions(base, target, options = {}) {
  if (base?.document !== target?.document) throw new Error('같은 문서의 버전끼리만 비교할 수 있어요.')
  const before = new Map(entries(base, options).map((e) => [e.key, e]))
  const after = entries(target, options)
  const result = { added: [], removed: [], changed: [], unchanged: 0 }
  for (const entry of after) {
    const old = before.get(entry.key)
    if (!old) { result.added.push({ heading: entry.heading }); continue }
    before.delete(entry.key)
    const oldRows = new Map(old.rows), newRows = new Map(entry.rows)
    const labels = [...new Set([...old.rows.map(([l]) => l), ...entry.rows.map(([l]) => l)])]
    const fields = labels.filter((l) => (oldRows.get(l) ?? '') !== (newRows.get(l) ?? '')).map((l) => ({ label: l, before: oldRows.get(l) ?? '', after: newRows.get(l) ?? '' }))
    if (old.heading !== entry.heading) fields.unshift({ label: (options.t ?? korean)('제목'), before: old.heading, after: entry.heading })
    if (fields.length) result.changed.push({ heading: entry.heading, fields })
    else result.unchanged += 1
  }
  for (const entry of before.values()) result.removed.push({ heading: entry.heading })
  return result
}
