export const API_DOCUMENT_DATE = '2026-10-03'

export const API_STATUS = Object.freeze({
  completed: '구현 완료 · 단위/HTTP 계약 검증',
  connected: '기존 구현 · 서비스 연결',
  stub: '미구현 · stub',
  memory: '시연 · 메모리',
})

const VERIFIED_OPERATIONS = new Set([
  'GET /api/tasks/{taskId}/checklist-items',
  'POST /api/tasks/{taskId}/checklist-items',
  'PUT /api/tasks/{taskId}/checklist-items/{itemId}',
  'PUT /api/tasks/{taskId}/checklist-items/{itemId}/completion',
  'DELETE /api/tasks/{taskId}/checklist-items/{itemId}',
  'GET /api/tasks/{taskId}/assignees',
  'PUT /api/tasks/{taskId}/assignees/{userId}',
  'DELETE /api/tasks/{taskId}/assignees/{userId}',
  'GET /api/planner/preferences',
  'PUT /api/planner/preferences',
])

// A Service call alone is not evidence that a route passed HTTP or DB tests.
// Keep this allowlist aligned with dated verification evidence; a future route
// in the same package must not inherit completion without its own tests.
export function implementationStatus(controller, source, method, route, stub) {
  if (stub ?? source.includes('ContractResponses.stub')) return API_STATUS.stub
  if (controller === 'PlannerController') return API_STATUS.memory
  if (VERIFIED_OPERATIONS.has(`${method} ${route}`) &&
      /package kr\.timebar\.diary\.(?:task\.checklist|planner\.preferences)(?:\.|;)/.test(source)) {
    return API_STATUS.completed
  }
  return API_STATUS.connected
}

export function statusSummary(operations, field = 'implementationStatus') {
  return Object.fromEntries(Object.entries(API_STATUS).map(([name, status]) => [
    name, operations.filter(operation => operation[field] === status).length,
  ]))
}
