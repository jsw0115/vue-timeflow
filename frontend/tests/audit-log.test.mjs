// 감사 로그의 동작 이름·분류, CSV 수식 주입 방지, 서버 연결을 검사한다(PR-10 UF-117 7-4).
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { AUDIT_ACTIONS, auditCsv, createAuditClient, csvCell, describeAudit } from '../src/features/admin/auditLog.mjs'

test('화면 동작 이름은 서버가 실제로 남기는 감사 코드와 같다', () => {
  const service = readFileSync(new URL('../../backend/src/main/java/kr/timebar/diary/operations/AdminService.java', import.meta.url), 'utf8')
  const fixed = [...service.matchAll(/audit\("([A-Z_]+)"/g)].map((m) => m[1])
  // create/update/delete는 공지·콘텐츠 종류에 _CREATE·_UPDATE·_DELETE를 붙여 남긴다(AdminController가 부르는 종류만)
  const typed = ['NOTICE', 'CONTENT'].flatMap((type) => ['CREATE', 'UPDATE', 'DELETE'].map((verb) => `${type}_${verb}`))
  assert.deepEqual(Object.keys(AUDIT_ACTIONS).sort(), [...new Set([...fixed, ...typed])].sort())
})

test('행을 화면 값으로 바꾸고 모르는 코드는 그대로 보인다', () => {
  assert.deepEqual(describeAudit({ action: 'USER_UPDATE', detail: { role: 'ADMIN', status: 'SUSPENDED' }, createdAt: '2026-11-21T01:02:03.456Z' }),
    { category: '계정', label: '계정 역할·상태 변경', detail: '역할: 관리자, 상태: 정지', at: '2026-11-21 01:02:03' })
  assert.equal(describeAudit({ action: 'NEW_THING' }).label, 'NEW_THING')
  assert.equal(describeAudit({ action: 'NEW_THING' }).category, '기타')
})

test('CSV는 수식으로 읽힐 수 있는 첫 글자를 막고 따옴표를 이스케이프한다', () => {
  assert.equal(csvCell('=HYPERLINK("x")'), '"\'=HYPERLINK(""x"")"')
  for (const risky of ['+1', '-2', '@SUM', '\tx']) assert.match(csvCell(risky), /^"'/)
  assert.equal(csvCell('안전한 값'), '"안전한 값"')
  const csv = auditCsv([{ action: 'TICKET_REPLY', actor: 'u1', target: '=cmd', detail: { status: 'ANSWERED' }, createdAt: '2026-11-21T00:00:00Z' }], () => '운영자')
  assert.equal(csv.split('\n')[1], '"2026-11-21 00:00:00","운영자","CS","문의 처리","\'=cmd","상태: 답변 완료"')
})

test('목록은 끝 쪽까지 이어 부르고 감사 화면은 서버를 쓴다', async () => {
  const paths = []
  const pages = [{ items: Array.from({ length: 100 }, (_, i) => ({ id: i })), total: 150 }, { items: Array.from({ length: 50 }, (_, i) => ({ id: 100 + i })), total: 150 }]
  const result = await createAuditClient({ request: async (path) => { paths.push(path); return pages.shift() } }).all()
  assert.equal(result.items.length, 150)
  assert.deepEqual(paths, ['/api/admin/audit?page=0&size=100', '/api/admin/audit?page=1&size=100'])
  const view = readFileSync(new URL('../src/views/admin/AdminAuditView.vue', import.meta.url), 'utf8')
  assert.match(view, /createAuditClient/)
  assert.doesNotMatch(view, /store\/adminOps/)
})
