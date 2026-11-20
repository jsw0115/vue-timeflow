// 관리자 화면이 함께 쓰는 서버 클라이언트와 권한 확인 상태. 로그인 토큰을 붙이는 apiRequest로 부른다(PR-10 5단계).
import { reactive } from 'vue'
import { apiRequest } from '../auth/apiRequest.js'
import { checkAdminAccess, createAdminClient } from './adminClient.mjs'

export const adminClient = createAdminClient({ request: apiRequest })

/** 셸이 한 번 확인한 권한 상태. 지표 화면은 확인할 때 받은 지표를 그대로 쓴다. */
export const adminAccess = reactive({ state: 'checking', metrics: null })
let pending = 0
export async function refreshAdminAccess(signedIn) {
  const ticket = ++pending
  adminAccess.state = 'checking'
  const result = await checkAdminAccess(apiRequest, signedIn)
  if (ticket !== pending) return
  adminAccess.state = result.state
  adminAccess.metrics = result.metrics ?? null
}
