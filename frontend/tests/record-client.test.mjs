// 공통 저장 어댑터의 version 보관·오류 구분과 계정 전환 시 늦은 응답 폐기를 검사한다(PR-07 1단계, UT-120·UT-127).
import test from 'node:test'
import assert from 'node:assert/strict'
import { effectScope, ref } from 'vue'
import { createRecordClient, errorKind } from '../src/features/records/recordClient.mjs'
import { useRecordCollection } from '../src/features/records/useRecordCollection.mjs'
import { apiRequest } from '../src/features/auth/apiRequest.js'

const settle = () => new Promise((resolve) => setImmediate(resolve))
const failure = (status, message = '실패') => Object.assign(new Error(message), { status })

/** 서버처럼 version을 올리고 오래된 version을 409로 거절하는 가짜 요청. 보낸 요청을 기록한다. */
function fakeServer() {
  const rows = new Map(), sent = []
  let seq = 0
  const request = async (path, options = {}) => {
    const method = options.method ?? 'GET', body = options.body ? JSON.parse(options.body) : undefined
    sent.push({ method, path, body })
    const [base, query] = path.split('?'), id = decodeURIComponent(base.split('/')[3] ?? '')
    const version = Number(new URLSearchParams(query).get('version') ?? body?.version)
    if (method === 'GET' && !id) return [...rows.values()]
    if (method === 'POST') { const row = { ...body, id: 't' + ++seq, version: 1 }; rows.set(row.id, row); return row }
    const row = rows.get(id)
    if (!row) throw failure(404, '할 일을 찾을 수 없습니다.')
    if (method === 'GET') return row
    if (version !== row.version) throw failure(409, '다른 곳에서 변경되었습니다.')
    if (method === 'DELETE') { rows.delete(id); return null }
    const next = { ...row, ...(body ?? {}), ...(base.endsWith('/status') ? { status: row.status === 'DONE' ? 'TODO' : 'DONE' } : {}), version: row.version + 1 }
    rows.set(id, next)
    return next
  }
  return { rows, sent, request }
}

test('UT-120 생성 응답의 version을 보관해 수정·삭제에 그대로 보낸다', async () => {
  const server = fakeServer()
  const client = createRecordClient({ request: server.request, path: '/api/tasks' })
  const created = await client.create({ title: '보고서', version: 7 })
  assert.equal(created.version, 1)
  assert.equal('version' in server.sent[0].body, false, '생성 요청에는 version을 보내지 않는다')
  const updated = await client.update(created, { title: '보고서 v2' })
  assert.deepEqual(server.sent[1], { method: 'PUT', path: '/api/tasks/t1', body: { title: '보고서 v2', version: 1 } })
  assert.equal(updated.version, 2)
  const toggled = await client.command(updated, 'status')
  assert.deepEqual(server.sent[2], { method: 'PATCH', path: '/api/tasks/t1/status?version=2', body: undefined })
  assert.equal(toggled.version, 3)
  await client.remove(toggled)
  assert.deepEqual(server.sent[3], { method: 'DELETE', path: '/api/tasks/t1?version=3', body: undefined })
  assert.equal(server.rows.size, 0)
})

test('오류를 충돌·입력·없음·네트워크·서버로 구분하고, 충돌이면 최신 서버 값을 함께 준다', async () => {
  assert.equal(errorKind(failure(409)), 'conflict')
  assert.equal(errorKind(failure(400)), 'invalid')
  assert.equal(errorKind(failure(404)), 'notFound')
  assert.equal(errorKind(new TypeError('fetch failed')), 'network')
  assert.equal(errorKind(failure(503)), 'server')
  const server = fakeServer()
  const client = createRecordClient({ request: server.request, path: '/api/tasks' })
  const created = await client.create({ title: '처음' })
  const latest = await client.update(created, { title: '다른 탭에서 저장' })
  const conflict = await client.update(created, { title: '내 입력' }).catch((error) => error)
  assert.equal(conflict.kind, 'conflict')
  assert.deepEqual(conflict.latest, latest, '최신 서버 값을 비교 화면에 쓸 수 있다')
  assert.equal(server.rows.get('t1').title, '다른 탭에서 저장', '자동으로 덮어쓰지 않는다')
  const invalid = await createRecordClient({ request: async () => { throw failure(400, '제목을 입력해주세요.') }, path: '/api/tasks' }).create({ title: '' }).catch((error) => error)
  assert.deepEqual([invalid.kind, invalid.message], ['invalid', '제목을 입력해주세요.'])
  const offline = await createRecordClient({ request: async () => { throw new TypeError('fetch failed') }, path: '/api/tasks' }).list().catch((error) => error)
  assert.equal(offline.kind, 'network')
})

test('UT-127 계정이 바뀌면 목록을 비우고, 이전 계정의 늦은 응답은 반영하지 않는다', async () => {
  const pending = []
  const client = { list: () => new Promise((resolve) => pending.push(resolve)) }
  const owner = ref('A')
  const scope = effectScope()
  const tasks = scope.run(() => useRecordCollection(client, { owner: () => owner.value }))
  assert.equal(tasks.state.loading, true)
  owner.value = 'B'
  assert.deepEqual(tasks.state.items, [])
  pending[0]([{ id: 'a1', title: 'A의 할 일', version: 1 }])
  await settle()
  assert.deepEqual(tasks.state.items, [], 'A 응답은 B 화면에 들어오지 않는다')
  pending[1]([{ id: 'b1', title: 'B의 할 일', version: 1 }])
  await settle()
  assert.deepEqual(tasks.state.items.map((row) => row.id), ['b1'])
  owner.value = ''
  assert.deepEqual(tasks.state.items, [], '로그아웃하면 비운다')
  assert.equal(pending.length, 2, '로그아웃 상태에서는 서버를 부르지 않는다')
  scope.stop()
})

test('UT-127 저장 중에 계정이 바뀌면 저장 결과를 새 계정 목록에 넣지 않고 오래된 응답으로 알린다', async () => {
  let release
  const client = { list: async () => [], create: () => new Promise((resolve) => { release = resolve }) }
  const owner = ref('A')
  const scope = effectScope()
  const tasks = scope.run(() => useRecordCollection(client, { owner: () => owner.value }))
  await settle()
  const saving = tasks.create({ title: 'A가 쓴 할 일' })
  owner.value = 'B'
  release({ id: 'a1', title: 'A가 쓴 할 일', version: 1 })
  const error = await saving.catch((e) => e)
  assert.equal(error.kind, 'stale')
  await settle()
  assert.deepEqual(tasks.state.items, [])
  scope.stop()
})

test('목록은 저장·수정·삭제·명령 결과로 갱신하고, 충돌이면 최신 값으로, 없어졌으면 목록에서 뺀다', async () => {
  const server = fakeServer()
  const client = createRecordClient({ request: server.request, path: '/api/tasks' })
  const scope = effectScope()
  const tasks = scope.run(() => useRecordCollection(client, { owner: () => 'A', toLocal: (row) => ({ ...row, done: row.status === 'DONE' }) }))
  await settle()
  const first = await tasks.create({ title: '하나' })
  const second = await tasks.create({ title: '둘' })
  assert.deepEqual(tasks.state.items.map((row) => row.title), ['둘', '하나'], '새 항목은 맨 앞')
  const done = await tasks.command(first, 'status')
  assert.equal(done.done, true)
  assert.equal(tasks.state.items.find((row) => row.id === first.id).version, 2)
  await client.update(done, { title: '다른 곳에서 바꿈' })
  const conflict = await tasks.update(done, { title: '내 입력' }).catch((error) => error)
  assert.equal(conflict.kind, 'conflict')
  assert.equal(conflict.latest.done, true, '최신 값도 화면 모양으로 바꿔 준다')
  assert.equal(tasks.state.items.find((row) => row.id === first.id).title, '다른 곳에서 바꿈')
  server.rows.delete(second.id)
  const gone = await tasks.remove(second).catch((error) => error)
  assert.equal(gone.kind, 'notFound')
  assert.deepEqual(tasks.state.items.map((row) => row.id), [first.id])
  await tasks.remove(tasks.state.items[0])
  assert.deepEqual(tasks.state.items, [])
  scope.stop()
})

test('본문이 없는 성공 응답(204 삭제)은 null로 끝나고, 실패 응답은 상태 코드를 담는다', async () => {
  const original = globalThis.fetch
  try {
    globalThis.fetch = async () => new Response(null, { status: 204 })
    assert.equal(await apiRequest('/api/memos/m1?version=1', { method: 'DELETE' }), null)
    globalThis.fetch = async () => new Response(JSON.stringify({ success: true, data: { id: 'm1' } }), { status: 200 })
    assert.deepEqual(await apiRequest('/api/memos/m1'), { id: 'm1' })
    globalThis.fetch = async () => new Response(JSON.stringify({ success: false, data: null, message: '다른 곳에서 변경되었습니다.' }), { status: 409 })
    const error = await apiRequest('/api/memos/m1', { method: 'PUT', body: '{}' }).catch((e) => e)
    assert.deepEqual([error.status, error.message], [409, '다른 곳에서 변경되었습니다.'])
  } finally { globalThis.fetch = original }
})
