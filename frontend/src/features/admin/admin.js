// 관리자 화면이 함께 쓰는 서버 클라이언트와 권한 확인 상태. 로그인 토큰을 붙이는 apiRequest로 부른다(PR-10 5단계).
import { reactive } from 'vue'
import { apiRequest } from '../auth/apiRequest.js'
import { checkAdminAccess, checkAdminRole, createAdminClient } from './adminClient.mjs'

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

/**
 * 사용자 화면의 관리자 콘솔 버튼 표시. 같은 계정이면 다시 묻지 않는다(IMP-021).
 * 확인하지 못했으면(연결 실패·서버 오류) 버튼을 숨기고, 다음 화면 이동 때 다시 확인한다.
 */
export const adminButton = reactive({ visible: false })
let roleFor
let roleTicket = 0
export async function refreshAdminButton(userId) {
  if (userId === roleFor) return
  roleFor = userId
  const ticket = ++roleTicket
  adminButton.visible = false
  const result = await checkAdminRole(apiRequest, Boolean(userId))
  if (ticket !== roleTicket) return
  adminButton.visible = result === true
  if (result === null) roleFor = undefined
}
