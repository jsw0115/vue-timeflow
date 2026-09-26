import { reactive } from 'vue'

/**
 * 역할(role) × 편집 범위(scope) 2축 공유 권한 모델.
 * 편집자(editor)는 자신이 가진 권한보다 높은 권한을 다른 사람에게 부여할 수 없다 —
 * clampRole/clampScope가 항상 "요청값과 내 최대 권한 중 더 낮은 쪽"으로 깎아낸다.
 */
export const ROLE_ORDER = ['viewer', 'editor', 'owner']
export const SCOPE_ORDER = ['none', 'single', 'future', 'all']

export const ROLE_LABEL = { viewer: '보기만', editor: '편집 가능', owner: '소유자' }
export const SCOPE_LABEL = { none: '권한 없음', single: '이 일정만', future: '이후 전체', all: '전체 반복' }

export function clampRole(requestedRole, maxRole) {
  const requested = ROLE_ORDER.indexOf(requestedRole)
  const max = ROLE_ORDER.indexOf(maxRole)
  if (requested === -1) return maxRole
  if (max === -1) return requestedRole
  return ROLE_ORDER[Math.min(requested, max)]
}

export function clampScope(requestedScope, maxScope) {
  const requested = SCOPE_ORDER.indexOf(requestedScope)
  const max = SCOPE_ORDER.indexOf(maxScope)
  if (requested === -1) return maxScope
  if (max === -1) return requestedScope
  return SCOPE_ORDER[Math.min(requested, max)]
}

/** 현재 사용자가 다른 사람에게 부여할 수 있는 최대 role/scope. owner만 owner를 부여할 수 있다. */
export function grantableRoles(myRole) {
  if (myRole === 'owner') return ROLE_ORDER.filter((r) => r !== 'owner')
  return ROLE_ORDER.slice(0, ROLE_ORDER.indexOf(myRole) + 1)
}

export const currentUser = { name: '지수', role: 'owner' }

export const sharedUsers = reactive([
  { name: '김지수', role: 'owner', editScope: 'all', deleteScope: 'all' },
  { name: '박민준', role: 'editor', editScope: 'future', deleteScope: 'single' },
  { name: '이서연', role: 'viewer', editScope: 'none', deleteScope: 'none' },
])

export function inviteUser(name, requestedRole, requestedEditScope, requestedDeleteScope) {
  const role = clampRole(requestedRole, currentUser.role)
  const editScope = clampScope(requestedEditScope, role === 'viewer' ? 'none' : 'all')
  const deleteScope = clampScope(requestedDeleteScope, role === 'owner' ? 'all' : 'single')
  sharedUsers.push({ name, role, editScope, deleteScope })
  return { role, editScope, deleteScope }
}

export function removeUser(name) {
  const index = sharedUsers.findIndex((u) => u.name === name)
  if (index >= 0) sharedUsers.splice(index, 1)
}
