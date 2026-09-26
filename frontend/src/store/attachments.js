import { computed, ref } from 'vue'

/**
 * 공유 첨부파일 — 일정·커뮤니티·채팅에 올라온 파일을 한곳에서 확인한다.
 * 각 파일마다 다운로드 가능 기간(만료일)을 따로 걸 수 있고, 기간이 지나면 내려받을 수 없다.
 */
const TODAY = '2026-09-06'

export const RETENTION_PRESETS = [
  { days: 7, label: '7일' },
  { days: 30, label: '30일' },
  { days: 90, label: '90일' },
  { days: 0, label: '무기한' },
]

/** 기본 보관 기간 — 새로 올라오는 파일에 적용된다 */
export const defaultRetentionDays = ref(30)

export const attachments = ref([
  { id: 1, name: '스터디_자료_1주차.pdf', kind: 'doc', sizeKb: 2480, from: '이서연', source: '스터디 크루', sourceKind: '캘린더 그룹', at: '2026-09-05', expiresAt: '2026-10-05', downloads: 4 },
  { id: 2, name: '러닝인증_0905.jpg', kind: 'image', sizeKb: 1820, from: '박민준', source: '운동 갓생방', sourceKind: '커뮤니티', at: '2026-09-05', expiresAt: '2026-09-12', downloads: 12 },
  { id: 3, name: '회의록_0903.docx', kind: 'doc', sizeKb: 96, from: '김지수', source: '팀 회의', sourceKind: '일정', at: '2026-09-03', expiresAt: '', downloads: 2 },
  { id: 4, name: '가족사진.png', kind: 'image', sizeKb: 4320, from: '아빠', source: '가족 일정', sourceKind: '캘린더 그룹', at: '2026-08-30', expiresAt: '2026-09-04', downloads: 7 },
  { id: 5, name: '독서노트_8월.md', kind: 'doc', sizeKb: 18, from: '최지우', source: '고요한 독서방', sourceKind: '커뮤니티', at: '2026-08-28', expiresAt: '2026-09-27', downloads: 1 },
  { id: 6, name: '스트레칭_영상.mp4', kind: 'video', sizeKb: 15200, from: '한소율', source: '저녁 스트레칭', sourceKind: '커뮤니티', at: '2026-08-25', expiresAt: '2026-09-01', downloads: 22 },
])

export function isExpired(file) {
  return Boolean(file.expiresAt) && file.expiresAt < TODAY
}
/** 만료까지 남은 일수 — 무기한이면 null */
export function daysLeft(file) {
  if (!file.expiresAt) return null
  return Math.round((new Date(file.expiresAt).getTime() - new Date(TODAY).getTime()) / 86400000)
}
export function expiryLabel(file) {
  if (!file.expiresAt) return '무기한'
  const d = daysLeft(file)
  if (d < 0) return '만료됨'
  if (d === 0) return '오늘까지'
  return d + '일 남음'
}
export function formatSize(kb) {
  return kb >= 1024 ? (kb / 1024).toFixed(1) + ' MB' : kb + ' KB'
}

export const images = computed(() => attachments.value.filter((f) => f.kind === 'image'))
export const expiringSoon = computed(() =>
  attachments.value.filter((f) => {
    const d = daysLeft(f)
    return d !== null && d >= 0 && d <= 7
  }),
)
export const expiredCount = computed(() => attachments.value.filter(isExpired).length)
export const totalSizeKb = computed(() => attachments.value.reduce((a, f) => a + f.sizeKb, 0))

/** 만료일을 오늘 기준 N일 뒤로 다시 설정한다. days가 0이면 무기한. */
export function setRetention(file, days) {
  if (!days) {
    file.expiresAt = ''
    return
  }
  const d = new Date(TODAY)
  d.setDate(d.getDate() + days)
  file.expiresAt = d.toISOString().slice(0, 10)
}
export function applyRetentionToAll(days) {
  attachments.value.forEach((f) => setRetention(f, days))
}
/** 만료된 파일은 내려받을 수 없다 */
export function download(file) {
  if (isExpired(file)) return { ok: false, reason: '다운로드 기간이 지난 파일이에요. 올린 사람에게 다시 요청해주세요.' }
  file.downloads += 1
  return { ok: true }
}
export function removeAttachment(id) {
  attachments.value = attachments.value.filter((f) => f.id !== id)
}
export function purgeExpired() {
  const before = attachments.value.length
  attachments.value = attachments.value.filter((f) => !isExpired(f))
  return before - attachments.value.length
}
