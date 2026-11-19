// 인증 API의 실제 성공 응답만 반환하고 실패를 사용자에게 전달한다.
import { authorizedFetch } from './session.js'

export async function apiRequest(path, options = {}) {
  const response = await authorizedFetch(path, options)
  // 삭제처럼 본문 없이 끝나는 성공 응답(204)은 null을 돌려준다
  if (response.status === 204) return null
  const payload = await response.json().catch(() => null)
  if (!response.ok || payload?.success !== true) {
    const error = new Error(payload?.message || '서버 응답을 확인하지 못했습니다. 연결 상태를 확인하고 다시 시도해주세요.')
    error.status = response.status
    throw error
  }
  return payload.data
}
