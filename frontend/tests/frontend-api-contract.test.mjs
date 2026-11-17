// 생성된 API 계약의 참조·인증·버전·외부 연동 응답 일관성을 검증한다.
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import test from 'node:test'
const api = JSON.parse(readFileSync(new URL('../../docs/api/frontend-backend-2026-10-10/openapi.json', import.meta.url), 'utf8'))
const operations = JSON.parse(readFileSync(new URL('../../docs/api/frontend-backend-2026-10-10/operations.json', import.meta.url), 'utf8'))

test('OpenAPI references and path parameters resolve and operation IDs are unique', () => {
  const identifiers = new Set()
  function inspect(value) {
    if (!value || typeof value !== 'object') return
    if (value.$ref) assert.ok(api.components.schemas[value.$ref.split('/').at(-1)], value.$ref)
    Object.values(value).forEach(inspect)
  }
  inspect(api)
  for (const [route, methods] of Object.entries(api.paths)) for (const operation of Object.values(methods)) {
    assert.ok(!identifiers.has(operation.operationId), operation.operationId)
    identifiers.add(operation.operationId)
    for (const parameter of route.matchAll(/\{([^}]+)\}/g)) assert.ok(operation.parameters.some(item => item.in === 'path' && item.name === parameter[1] && item.required))
  }
  assert.equal(identifiers.size, operations.length)
})
test('Public portfolio and ADMIN boundaries match their security contracts', () => {
  assert.deepEqual(api.paths['/api/public/portfolios/{token}'].get.security, [])
  for (const [route, methods] of Object.entries(api.paths)) if (route.startsWith('/api/admin/')) for (const operation of Object.values(methods)) {
    assert.equal(operation['x-admin-required'], true)
    assert.deepEqual(operation.security, [{ bearerAuth: [] }])
  }
})
test('External provider commands document unavailable responses without a success response', () => {
  const boundary = operations.filter(operation => operation.externalBoundary)
  assert.ok(boundary.length > 0)
  for (const operation of boundary.filter(item => item.method !== 'GET')) {
    const responses = api.paths[operation.route][operation.method.toLowerCase()].responses
    assert.ok(responses['503'])
    assert.ok(Object.keys(responses).every(status => !status.startsWith('2')))
  }
})
test('New record mutations require versions and reject unknown input fields', () => {
  for (const name of ['DIARY', 'SCHEDULE', 'ROUTINE_RECORD', 'MEMO', 'MONEY', 'WORK_RECORD', 'WIKI', 'WBS', 'PORTFOLIO']) {
    const schema = api.components.schemas[name + 'Update']
    assert.equal(schema.additionalProperties, false)
    assert.ok(schema.required.includes('version'))
    assert.equal(schema.properties.version.minimum, 1)
  }
  assert.ok(!api.components.schemas.REVIEWDateUpsert.required.includes('date'))
  assert.equal(api.components.schemas.Attachment.properties.sizeBytes.maximum, 10485760)
})

test('플래너 응답·수정·상태 변경·삭제는 공개 버전을 요구하고 생성 버전은 서버가 정한다', () => {
  const schemas = api.components.schemas
  assert.ok(schemas.PlannerItem.required.includes('version'))
  assert.equal(schemas.PlannerItem.properties.version.minimum, 1)
  assert.ok(schemas.PlannerItemUpdate.required.includes('version'))
  assert.ok(!schemas.PlannerItemCreate.required.includes('version'))
  assert.equal(schemas.PlannerItemCreate.properties.version.maximum, 0)
  for (const operation of [api.paths['/api/planner/items/{id}'].delete, api.paths['/api/planner/items/{id}/status'].patch]) {
    const version = operation.parameters.find(parameter => parameter.name === 'version')
    assert.equal(version.required, true)
    assert.equal(version.schema.minimum, 1)
    assert.ok(operation.responses['409'])
  }
  assert.equal(api.paths['/api/planner/items/{id}'].put.requestBody.content['application/json'].schema.$ref, '#/components/schemas/PlannerItemUpdate')
})
