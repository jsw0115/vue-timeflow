import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { API_DOCUMENT_DATE, API_STATUS, implementationStatus, statusSummary } from './api-status.mjs'
const root = fileURLToPath(new URL('../../', import.meta.url))
const source = path.join(root, 'backend/src/main/java/kr/timebar/diary')
function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry =>
    entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)])
}
const rows = []
for (const file of walk(source).filter(name => name.endsWith('Controller.java')).sort()) {
  const java = readFileSync(file, 'utf8')
  const prefix = java.match(/@RequestMapping\("([^"]+)"\)/)?.[1]
  if (!prefix) throw new Error('Unsupported controller mapping: ' + file)
  const controller = path.basename(file, '.java')
  for (const match of java.matchAll(/@(Get|Post|Put|Patch|Delete)Mapping(?:\(([^\r\n]*?)\))?/g)) {
    const route = prefix + (match[2]?.match(/"([^"]*)"/)?.[1] || '')
    const method = match[1].toUpperCase()
    const status = implementationStatus(controller, java, method, route)
    const publicRoute = ['/api/auth/signup', '/api/auth/login', '/api/auth/refresh'].includes(route)
    rows.push({ method, route, status, controller, auth: publicRoute ? '공개' : 'JWT' })
  }
}
const keys = rows.map(row => row.method + ' ' + row.route)
if (new Set(keys).size !== keys.length) throw new Error('Duplicate endpoint mappings')
const counts = statusSummary(rows, 'status')
const chatCount = rows.filter(row => row.controller === 'ChatController').length
const output = '# 현재 API 목록 — 소스 자동 대조\n\n' +
  '기준 ' + API_DOCUMENT_DATE + '. 생성 명령: frontend에서 npm run docs:api. 현재 컨트롤러의 단일 문자열 매핑 형식에 한정된 생성기입니다.\n\n' +
  '총 ' + rows.length + '개. 이번 구현 완료 ' + counts.completed + ', 기존 서비스 연결 ' + counts.connected +
  ', 미구현 stub ' + counts.stub + ', 공용 메모리 시연 ' + counts.memory + '.\n\n' +
  '| 상태 | 의미 |\n|---|---|\n' +
  '| ' + API_STATUS.completed + ' | 이번 체크리스트·담당자·플래너 설정 모듈의 소스와 단위/MockMvc HTTP 계약 테스트 완료. 실제 MySQL·Redis 검증 결과는 별도 복구 기록 참조. 프런트엔드 연결은 별도. |\n' +
  '| ' + API_STATUS.connected + ' | 기존 Service 경로가 존재함. 이번에 모든 기존 API 동작을 재검증했다는 뜻은 아님. |\n' +
  '| ' + API_STATUS.stub + ' | 컨트롤러 계약만 존재하며 실제 조회·저장 기능은 미구현. |\n' +
  '| ' + API_STATUS.memory + ' | 공용 메모리 시연이며 사용자별 영속 데이터 API가 아님. |\n\n' +
  '사전 설계: [구현 계획](implementation-plan-2026-10-03.md). 정확한 신규 입력·응답·권한·버전 계약: [체크리스트·플래너 계약](task-planner-contract.md).\n' +
  '실제 DB 반영·데이터 보존·실서버 검증: [복구 기록](../development/database-recovery-2026-10-03.md).\n' +
  'ChatController의 ' + chatCount + '개 경로는 CHAT_ENABLED=true일 때 등록됩니다. [채팅 계약](../chat/api/catalog.md) · [Redis 목록](../chat/redis/api-catalog.md). SSE는 JSON envelope 대신 text/event-stream을 반환합니다.\n' +
  '현재 관리자 API도 JWT만 검사합니다. 관리자 권한 검사 구현 전 공개 배포 금지.\n\n' +
  '| Method | 전체 경로 | 현재 상태 | 현재 인증 | 컨트롤러 |\n|---|---|---|---|---|\n' +
  rows.map(r => '| ' + r.method + ' | ' + r.route + ' | ' + r.status + ' | ' + r.auth + ' | ' + r.controller + ' |').join('\n') + '\n'
const destination = path.join(root, 'docs/api/current-api-inventory.md')
if (process.argv.includes('--check')) {
  if (readFileSync(destination, 'utf8') !== output) throw new Error('API inventory differs from source')
  console.log('API inventory verified: ' + rows.length + ' routes')
} else {
  writeFileSync(destination, output, 'utf8')
  console.log('Generated ' + rows.length + ' endpoint records')
}
