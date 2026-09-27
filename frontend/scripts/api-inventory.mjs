import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
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
  const status = file.includes(path.sep + 'contract' + path.sep) ? '계약 stub' :
    controller === 'PlannerController' ? '공용 메모리 시연' : '서비스 연결'
  for (const match of java.matchAll(/@(Get|Post|Put|Patch|Delete)Mapping(?:\(([^\r\n]*?)\))?/g)) {
    const route = prefix + (match[2]?.match(/"([^"]*)"/)?.[1] || '')
    const method = match[1].toUpperCase()
    const publicRoute = ['/api/auth/signup', '/api/auth/login', '/api/auth/refresh'].includes(route)
    rows.push({ method, route, status, controller, auth: publicRoute ? '공개' : 'JWT' })
  }
}
const keys = rows.map(row => row.method + ' ' + row.route)
if (new Set(keys).size !== keys.length) throw new Error('Duplicate endpoint mappings')
const output = '# 현재 API 목록 — 소스 자동 대조\n\n' +
  '생성 명령: frontend에서 npm run docs:api. 현재 컨트롤러의 단일 문자열 매핑 형식에 한정된 생성기입니다.\n\n' +
  '총 ' + rows.length + '개. 서비스 연결 ' + rows.filter(r => r.status === '서비스 연결').length +
  ', 계약 stub ' + rows.filter(r => r.status === '계약 stub').length +
  ', 공용 메모리 시연 ' + rows.filter(r => r.status === '공용 메모리 시연').length + '.\n\n' +
  '서비스 연결은 코드의 Service 호출을 뜻하며 DB 통합 검증 완료를 의미하지 않습니다. 계약 stub은 실제 저장을 하지 않습니다.\n' +
  'ChatController의 15개 경로는 CHAT_ENABLED=true일 때 등록됩니다. [채팅 계약](../chat/api/catalog.md) · [Redis 목록](../chat/redis/api-catalog.md). SSE는 JSON envelope 대신 text/event-stream을 반환합니다.\n' +
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
