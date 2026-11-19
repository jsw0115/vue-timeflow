// 오프라인 대기열의 순서·대상 이어받기·멱등 재전송·충돌·검증 실패·계정 격리를 서버 규칙을 흉내 낸 가짜 서버로 검증한다(PR-12 2단계, TS-35).
import test from 'node:test'
import assert from 'node:assert/strict'
import { createOutbox, memoryOutboxStorage, isOfflineId } from '../src/features/offline/outbox.mjs'

/** 서버 규칙: 생성 version 1, 수정마다 +1, 오래된 version은 409, 같은 멱등 키·같은 본문은 처음 결과의 현재 기록, 제목이 비면 400. */
function fakeServer() {
  const records = new Map(), keys = new Map(), calls = []
  let next = 1, loseNext = false, offline = false
  const fail = (status, message) => Object.assign(new Error(message), { status })
  async function request(url, options = {}) {
    if (offline) throw new TypeError('Failed to fetch')
    const method = options.method ?? 'GET', body = options.body ? JSON.parse(options.body) : null, key = options.headers?.['Idempotency-Key']
    calls.push({ method, url, body, key })
    const id = url.split('/')[3] && decodeURIComponent(url.split('/')[3])
    if (method === 'GET') { if (!records.has(id)) throw fail(404, '없음'); return { ...records.get(id) } }
    const hash = JSON.stringify({ url, body })
    if (key && keys.has(key)) {
      if (keys.get(key).hash !== hash) throw fail(409, '같은 요청 키로 다른 내용을 보냈습니다.')
      return { ...records.get(keys.get(key).id) }
    }
    let saved
    if (method === 'POST') {
      if (!body.title) throw fail(400, 'title 필드가 필요합니다.')
      saved = { ...body, id: 'srv-' + next++, version: 1 }
    } else {
      const current = records.get(id)
      if (!current) throw fail(404, '없음')
      if (body.version !== current.version) throw fail(409, '다른 요청에서 변경되었습니다.')
      if (!body.title) throw fail(400, 'title 필드가 필요합니다.')
      const { version, ...rest } = body
      saved = { ...current, ...rest, version: current.version + 1 }
    }
    records.set(saved.id, saved)
    if (key) keys.set(key, { hash, id: saved.id })
    if (loseNext) { loseNext = false; throw new TypeError('응답 유실') }
    return { ...saved }
  }
  return { request, records, calls, loseResponse: () => { loseNext = true }, setOffline: (value) => { offline = value } }
}
function setup(user = 'u1') {
  const server = fakeServer(), owner = { value: user }
  let n = 0
  const outbox = createOutbox({ storage: memoryOutboxStorage(), request: server.request, owner: () => owner.value, uuid: () => 'req-' + ++n })
  return { server, owner, outbox }
}

test('UT-180: 오프라인으로 만든 메모는 대기열에 전송 대기 1건으로 남는다', async () => {
  const { server, outbox } = setup()
  server.setOffline(true)
  const item = await outbox.enqueue({ kind: 'memo', op: 'create', body: { title: '지하철 메모' }, preview: { title: '지하철 메모' } })
  assert.ok(isOfflineId(item.ref))
  assert.equal(outbox.state.items.length, 1)
  assert.equal(outbox.state.items[0].status, 'pending')
  const result = await outbox.flush()
  assert.equal(result.stopped, true, '연결이 없으면 멈추고 다음에 다시 보낸다')
  assert.equal(outbox.state.items.length, 1)
  assert.equal(server.records.size, 0)
})

test('UT-182: 첫 응답을 잃어 같은 요청이 두 번 가도 서버에는 1건이다', async () => {
  const { server, outbox } = setup()
  await outbox.enqueue({ kind: 'memo', op: 'create', body: { title: '한 번만' } })
  server.loseResponse()
  assert.equal((await outbox.flush()).stopped, true)
  assert.equal(outbox.state.items.length, 1, '응답을 받지 못했으니 남겨 둔다')
  await outbox.flush()
  assert.equal(server.records.size, 1)
  assert.equal(outbox.state.items.length, 0)
  assert.equal(server.calls[0].key, server.calls[1].key, '같은 요청 ID로 다시 보낸다')
})

test('UT-183: 오프라인에서 만들고 두 번 고치면 생성→수정→수정 순서로 반영되고 마지막 수정이 남는다', async () => {
  const { server, outbox } = setup()
  server.setOffline(true)
  const created = await outbox.enqueue({ kind: 'memo', op: 'create', body: { title: '메모', body: '초안' } })
  await outbox.enqueue({ kind: 'memo', op: 'update', ref: created.ref, body: { title: '메모', body: '수정 1' } })
  await outbox.enqueue({ kind: 'memo', op: 'update', ref: created.ref, body: { title: '메모', body: '수정 2' } })
  await outbox.flush()
  server.setOffline(false)
  const { sent } = await outbox.flush()
  assert.equal(sent.length, 3)
  assert.deepEqual(server.calls.map((call) => [call.method, call.body.version ?? null]), [['POST', null], ['PUT', 1], ['PUT', 2]])
  const [memo] = server.records.values()
  assert.equal(memo.body, '수정 2')
  assert.equal(memo.version, 3)
  assert.equal(outbox.state.items.length, 0)
})

test('수정 응답을 잃고 다시 보내도 다음 수정은 처음 결과의 version으로 이어서 보낸다', async () => {
  const { server, outbox } = setup()
  const created = await outbox.enqueue({ kind: 'task', op: 'create', body: { title: '할 일' } })
  await outbox.enqueue({ kind: 'task', op: 'update', ref: created.ref, body: { title: '할 일', note: '1' } })
  await outbox.enqueue({ kind: 'task', op: 'update', ref: created.ref, body: { title: '할 일', note: '2' } })
  await outbox.flush() // 생성은 보내고 수정 둘은 이어서 보낸다
  assert.equal(outbox.state.items.length, 0)
  await outbox.enqueue({ kind: 'task', op: 'update', ref: 'srv-1', baseVersion: 3, body: { title: '할 일', note: '3' } })
  await outbox.enqueue({ kind: 'task', op: 'update', ref: 'srv-1', baseVersion: 3, body: { title: '할 일', note: '4' } })
  server.loseResponse()
  await outbox.flush()
  await outbox.flush()
  assert.equal(server.records.get('srv-1').note, '4')
  assert.equal(server.records.get('srv-1').version, 5)
})

test('UT-185 원리: 다른 기기가 먼저 고치면 확인 필요로 멈추고 서버 값을 덮지 않는다. 내 내용으로 다시 보내기를 고르면 최신 version 위에 보낸다', async () => {
  const { server, outbox } = setup()
  await outbox.enqueue({ kind: 'memo', op: 'create', body: { title: '공유 메모', body: '처음' } })
  await outbox.flush()
  await outbox.enqueue({ kind: 'memo', op: 'update', ref: 'srv-1', baseVersion: 1, body: { title: '공유 메모', body: '기기 1' } })
  await server.request('/api/memos/srv-1', { method: 'PUT', body: JSON.stringify({ title: '공유 메모', body: '기기 2', version: 1 }) })
  await outbox.flush()
  const [item] = outbox.state.items
  assert.equal(item.status, 'review')
  assert.equal(item.error.kind, 'conflict')
  assert.equal(item.latest.body, '기기 2')
  assert.equal(server.records.get('srv-1').body, '기기 2', '자동으로 덮어쓰지 않는다')
  await outbox.keepMine(item)
  await outbox.flush()
  assert.equal(server.records.get('srv-1').body, '기기 1')
  assert.notEqual(server.calls.at(-1).key, item.id, '본문 version이 바뀌었으니 새 요청 ID로 보낸다')
})

test('다시 보낸 수정의 응답이 그 사이 다른 곳에서 바뀐 값이면 다음 수정은 확인 필요로 멈춘다', async () => {
  const { server, outbox } = setup()
  await outbox.enqueue({ kind: 'memo', op: 'create', body: { title: '메모', body: '처음' } })
  await outbox.flush()
  await outbox.enqueue({ kind: 'memo', op: 'update', ref: 'srv-1', baseVersion: 1, body: { title: '메모', body: '내 수정 1' } })
  await outbox.enqueue({ kind: 'memo', op: 'update', ref: 'srv-1', body: { title: '메모', body: '내 수정 2' } })
  server.loseResponse()
  await outbox.flush() // 첫 수정은 서버에 반영됐지만 응답을 잃었다
  await server.request('/api/memos/srv-1', { method: 'PUT', body: JSON.stringify({ title: '메모', body: '다른 기기', version: 2 }) })
  await outbox.flush() // 같은 키로 다시 보내면 지금 값(version 3)이 온다
  assert.equal(outbox.state.items.length, 1)
  assert.equal(outbox.state.items[0].status, 'review')
  assert.equal(outbox.state.items[0].latest.body, '다른 기기')
  assert.equal(server.records.get('srv-1').body, '다른 기기', '두 번째 수정이 다른 기기의 수정을 덮지 않는다')
})

test('UT-186: A 계정의 대기 항목은 B 계정으로 로그인한 뒤 보이지도 보내지지도 않는다', async () => {
  const storage = memoryOutboxStorage(), server = fakeServer(), owner = { value: 'A' }
  let n = 0
  const outbox = createOutbox({ storage, request: server.request, owner: () => owner.value, uuid: () => 'k' + ++n })
  server.setOffline(true)
  await outbox.enqueue({ kind: 'memo', op: 'create', body: { title: 'A의 메모' } })
  owner.value = 'B'
  server.setOffline(false)
  await outbox.refresh()
  assert.equal(outbox.state.items.length, 0)
  await outbox.flush()
  assert.equal(server.records.size, 0)
  owner.value = 'A'
  await outbox.refresh()
  assert.equal(outbox.state.items.length, 1, 'A로 다시 로그인하면 A의 항목이 남아 있다')
})

test('UT-188: 서버 검증에서 400을 받은 항목은 확인 필요로 남고 다른 항목은 계속 보낸다', async () => {
  const { server, outbox } = setup()
  await outbox.enqueue({ kind: 'memo', op: 'create', body: { title: '' } })
  await outbox.enqueue({ kind: 'task', op: 'create', body: { title: '보낼 할 일' } })
  await outbox.flush()
  assert.equal(server.records.size, 1)
  assert.equal(outbox.state.items.length, 1)
  assert.equal(outbox.state.items[0].status, 'review')
  assert.equal(outbox.state.items[0].error.kind, 'invalid')
  await outbox.discard(outbox.state.items[0])
  assert.equal(outbox.state.items.length, 0)
})

test('계정이 바뀌면 보내던 중에도 멈추고, 로그아웃 상태에서는 넣을 수 없다', async () => {
  const { server, owner, outbox } = setup()
  const original = server.request
  let first = true
  const switching = createOutbox({ storage: memoryOutboxStorage(), request: async (...args) => { const out = await original(...args); if (first) { first = false; owner.value = 'B' } return out }, owner: () => owner.value })
  await switching.enqueue({ kind: 'memo', op: 'create', body: { title: '첫째' } })
  await switching.enqueue({ kind: 'memo', op: 'create', body: { title: '둘째' } })
  const result = await switching.flush()
  assert.equal(result.stopped, true)
  assert.equal(result.sent.length, 1, '계정이 바뀐 뒤 남은 항목은 보내지 않는다')
  owner.value = null
  await assert.rejects(outbox.enqueue({ kind: 'memo', op: 'create', body: { title: 'x' } }), /로그인한 뒤에/)
})

test('지우기는 지금 계정의 항목만 모두 지운다(로그아웃 안내의 "지우기")', async () => {
  const storage = memoryOutboxStorage(), server = fakeServer(), owner = { value: 'A' }
  const outbox = createOutbox({ storage, request: server.request, owner: () => owner.value })
  await outbox.enqueue({ kind: 'memo', op: 'create', body: { title: 'A' } })
  owner.value = 'B'
  await outbox.enqueue({ kind: 'memo', op: 'create', body: { title: 'B' } })
  await outbox.clear()
  assert.equal((await storage.list('B')).length, 0)
  assert.equal((await storage.list('A')).length, 1)
})
