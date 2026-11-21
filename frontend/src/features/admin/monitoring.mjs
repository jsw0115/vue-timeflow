// 관리자 모니터링 값(AdminService.monitoring: uptimeMs·heapUsedBytes·heapMaxBytes·processors)을 화면 값으로 바꾼다(PR-10 UF-117 7-6).
// 서버가 모으지 않는 값(API 성공률·응답 시간·오류 수·장애 기록·알림 규칙)은 만들지 않는다.

/** 가동 시간을 "3일 4시간 5분" 형식으로. */
export function uptimeLabel(ms) {
  if (!Number.isFinite(ms) || ms < 0) return '—'
  const minutes = Math.floor(ms / 60000)
  const days = Math.floor(minutes / 1440), hours = Math.floor((minutes % 1440) / 60), rest = minutes % 60
  return [days ? `${days}일` : '', days || hours ? `${hours}시간` : '', `${rest}분`].filter(Boolean).join(' ')
}

/** 바이트를 MiB(소수 첫째 자리)로. */
export const mib = (bytes) => (Number.isFinite(bytes) && bytes >= 0 ? (bytes / 1048576).toFixed(1) : '—')

/** 힙 사용률(%). 최대값을 모르면 null. */
export function heapPercent(used, max) {
  return Number.isFinite(used) && Number.isFinite(max) && max > 0 ? Math.round((used / max) * 100) : null
}

export const loadMonitoring = (request) => request('/api/admin/monitoring')
