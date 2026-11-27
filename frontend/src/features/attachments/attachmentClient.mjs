// 공유 첨부 API를 부르고, 업로드 전 크기 확인·보관 기간 표시·화면 행 변환을 한곳에 둔다(PR-10 5단계, UF-116).

import { korean } from '../i18n/translate.mjs'

/** 서버 한도와 같다(records/AttachmentController MAX_BYTES, IM-02). */
export const MAX_FILE_BYTES = 10 * 1024 * 1024
export const FILE_LIMIT_TEXT = '파일당 10 MiB까지 올릴 수 있어요.'

export const RETENTION_PRESETS = [
  { days: 7, label: '7일' },
  { days: 30, label: '30일' },
  { days: 90, label: '90일' },
  { days: 0, label: '무기한' },
]

/** 고른 파일을 보내기 전에 확인한다. 문제가 없으면 빈 문자열이다(UT-198). */
export function fileError(file) {
  if (!file) return '올릴 파일을 골라 주세요.'
  if (file.size > MAX_FILE_BYTES) return FILE_LIMIT_TEXT + ' 더 작은 파일을 골라 주세요.'
  if (file.size === 0) return '빈 파일은 올릴 수 없어요. 내용이 있는 파일을 골라 주세요.'
  return ''
}

export function formatBytes(bytes) {
  const n = Number(bytes) || 0
  if (n < 1024) return n + ' B'
  if (n < 1024 * 1024) return Math.ceil(n / 1024) + ' KB'
  return (n / 1024 / 1024).toFixed(1) + ' MB'
}

const IMAGE = /\.(png|jpe?g|gif|webp|bmp|svg|heic|avif)$/i
const VIDEO = /\.(mp4|mov|webm|avi|mkv|m4v)$/i
export function fileKind(name) {
  if (IMAGE.test(name ?? '')) return 'image'
  if (VIDEO.test(name ?? '')) return 'video'
  return 'doc'
}

const localDate = (value) => {
  const d = new Date(value)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const dayNumber = (text) => Date.UTC(Number(text.slice(0, 4)), Number(text.slice(5, 7)) - 1, Number(text.slice(8, 10))) / 86400000

/** 서버는 만료 시각(UTC)을 준다. 시각이 지나면 받을 수 없다. */
export function isExpired(row, now = Date.now()) {
  return Boolean(row.expiresAt) && Date.parse(row.expiresAt) <= now
}
/** 이 기기 날짜로 만료일까지 남은 일수. 무기한이면 null이다. */
export function daysLeft(row, now = Date.now()) {
  if (!row.expiresAt) return null
  if (isExpired(row, now)) return -1
  return dayNumber(localDate(row.expiresAt)) - dayNumber(localDate(now))
}
/** 남은 기간 문구. t는 화면 표시용 번역(기본 한국어)이다. */
export function expiryLabel(row, now = Date.now(), t = korean) {
  const d = daysLeft(row, now)
  if (d === null) return t('무기한')
  if (d < 0) return t('만료됨')
  if (d === 0) return t('오늘까지')
  return d === 1 ? t('1일 남음') : t('{n}일 남음', { n: d })
}
export const expiryDate = (row) => (row.expiresAt ? localDate(row.expiresAt) : '')

/** 서버 행을 화면 행으로 바꾼다. groups는 그룹 ID → 이름이다. */
export function toFileRow(row, { me, groups = {} } = {}) {
  const mine = row.ownerId === me
  return {
    ...row,
    mine,
    kind: fileKind(row.name),
    from: mine ? '나' : row.ownerName || '그룹 멤버',
    source: row.groupId ? groups[row.groupId] ?? '그룹' : '나만 보기',
    sourceKind: row.groupId ? '캘린더 그룹' : '내 파일',
    at: row.createdAt ? localDate(row.createdAt) : '',
  }
}

/** 내 파일과 그룹 파일을 합친다. 내가 그룹에 올린 파일은 두 목록에 다 있으므로 한 번만 둔다. 최근 것이 먼저다. */
export function mergeFiles(lists) {
  const seen = new Map()
  for (const row of lists.flat()) if (!seen.has(row.id)) seen.set(row.id, row)
  return [...seen.values()].sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')))
}

/** 실패를 화면 문구로 바꾼다. 프록시가 본문 없이 413을 돌려줘도 한도 문구를 보인다. */
export function attachmentErrorText(error) {
  if (error?.status == null || error.status === 0) return '서버에 연결하지 못했어요. 연결을 확인하고 다시 시도해 주세요.'
  if (error.status === 413) return FILE_LIMIT_TEXT
  if (error.status === 404) return '파일을 찾지 못했어요. 보관 기간이 지났거나 삭제된 파일일 수 있어요.'
  if (error.status === 403) return '이 파일을 다룰 권한이 없어요. 그룹에서 빠졌을 수 있어요.'
  return error.message || '요청을 처리하지 못했어요. 잠시 뒤 다시 시도해 주세요.'
}

/**
 * request는 성공 응답의 data를 돌려주고 실패면 status를 담아 던지는 함수(apiRequest), fetcher는 토큰을 붙인 fetch(authorizedFetch)다.
 * 업로드는 크기를 먼저 확인하고, 한도를 넘으면 요청을 보내지 않는다(UT-198).
 */
export function createAttachmentClient({ request, fetcher }) {
  const q = encodeURIComponent
  const file = (id) => `/api/attachments/${q(id)}`
  return {
    list: (groupId) => request(groupId ? `/api/attachments?groupId=${q(groupId)}` : '/api/attachments'),
    async upload(picked, { retentionDays = 30, groupId = '' } = {}) {
      const problem = fileError(picked)
      if (problem) throw Object.assign(new Error(problem), { status: 400, local: true })
      const form = new FormData()
      form.append('file', picked)
      const params = new URLSearchParams({ retentionDays: String(retentionDays) })
      if (groupId) params.set('groupId', groupId)
      return request(`/api/attachments?${params}`, { method: 'POST', body: form })
    },
    async download(row) {
      const response = await fetcher(`${file(row.id)}/download`)
      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw Object.assign(new Error(payload?.message || '파일을 내려받지 못했어요.'), { status: response.status })
      }
      return response.blob()
    },
    setRetention: (row, days) => request(`${file(row.id)}/retention`, { method: 'PUT', body: JSON.stringify({ days }) }),
    remove: (row) => request(file(row.id), { method: 'DELETE' }),
    purgeExpired: () => request('/api/attachments/purge-expired', { method: 'POST' }),
  }
}
