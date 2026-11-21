// 1:1 문의의 상태 이름·48시간 초과 계산·요청 본문과, 사용자·관리자 화면의 서버 연결을 검사한다(PR-10 UF-117).
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { REPLY_TEMPLATES, createSupportClient, daysOpen, isOverdue, sortForTriage, statusLabel, statusOf, ticketMetrics } from '../src/features/support/tickets.mjs'

const NOW = Date.parse('2026-11-21T12:00:00Z')
const at = (hoursAgo) => new Date(NOW - hoursAgo * 3600000).toISOString()

test('상태가 없는 새 문의는 접수로 보고, 48시간을 넘긴 미답변만 초과로 센다', () => {
  assert.equal(statusOf({}), 'OPEN')
  assert.equal(statusLabel({ status: 'ANSWERED' }), '답변 완료')
  assert.equal(statusLabel({ status: 'weird' }), '접수')
  assert.equal(isOverdue({ createdAt: at(48) }, NOW), false)
  assert.equal(isOverdue({ createdAt: at(49) }, NOW), true)
  assert.equal(isOverdue({ createdAt: at(100), status: 'ANSWERED' }, NOW), false)
  assert.equal(daysOpen({ createdAt: at(49) }, NOW), 2)
  assert.equal(daysOpen({ createdAt: 'x' }, NOW), null)
  const list = [{ id: 'a', createdAt: at(10), status: 'ANSWERED' }, { id: 'b', createdAt: at(60) }, { id: 'c', createdAt: at(5), status: 'HOLD' }]
  assert.deepEqual(ticketMetrics(list, NOW), { total: 3, open: 2, overdue: 1 })
  assert.deepEqual(sortForTriage(list).map((t) => t.id), ['b', 'c', 'a'])
})

test('사용자 문의는 다듬은 제목·내용만 보내고, 관리자 답변은 문의 주인·version·상태를 함께 보낸다', async () => {
  const sent = []
  const client = createSupportClient({ request: async (path, options = {}) => { sent.push({ path, method: options.method ?? 'GET', body: options.body && JSON.parse(options.body) }); return { items: [{ id: 't1' }] } } })
  assert.deepEqual(await client.mine(), [{ id: 't1' }])
  await client.create({ title: ' 알림 ', body: ' 안 와요 ', category: ' ' })
  await client.reply({ id: 't/1', ownerId: 'u1', version: 3 }, { reply: '확인 중', status: 'IN_PROGRESS' })
  assert.deepEqual(sent, [
    { path: '/api/support/tickets?page=0&size=100', method: 'GET', body: undefined },
    { path: '/api/support/tickets', method: 'POST', body: { title: '알림', body: '안 와요' } },
    { path: '/api/admin/tickets/t%2F1', method: 'PUT', body: { userId: 'u1', version: 3, reply: '확인 중', status: 'IN_PROGRESS' } },
  ])
})

test('답변 템플릿은 확인되지 않은 처리 기한·환불을 약속하지 않는다', () => {
  for (const template of REPLY_TEMPLATES) assert.doesNotMatch(template.body, /환불|영업일|\d+\s*일\s*(이내|간)|보장/)
})

test('고객지원·CS 관리 화면은 서버 문의 API를 쓰고 관리 화면 시연 표시에서 빠진다', () => {
  const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8')
  assert.match(read('../src/views/settings/SettingsSupportView.vue'), /createSupportClient/)
  const cs = read('../src/views/admin/AdminCsView.vue')
  assert.match(cs, /createSupportClient/)
  assert.doesNotMatch(cs, /store\/adminOps/)
  assert.match(read('../src/AdminApp.vue'), /SERVER_PATHS = new Set\(\[[^\]]*'\/admin\/cs'/)
})
