// 기록 저장소가 연결 실패 때 변경을 대기열에 넣고 목록에 대기 행을 겹쳐 보이며, 순서를 지키고 보낸 뒤 다시 불러오는지 검증한다(PR-12 3단계, TS-36).
import test from 'node:test'
import assert from 'node:assert/strict'
import { nextTick } from 'vue'
import { createSyncedCollection } from '../src/features/records/syncedCollection.mjs'
import { createOutbox, memoryOutboxStorage, isOfflineId } from '../src/features/offline/outbox.mjs'

const networkError = () => Object.assign(new TypeError('Failed to fetch'), { kind: 'network' })
function setup({ offline = true } = {}) {
  const server = [{ id: 'm1', title: '서버 메모', version: 1 }]
  let down = false, lists = 0
  const client = {
    list: async () => { lists++; if (down) throw networkError(); return server.map((row) => ({ ...row })) },
    create: async (body) => { if (down) throw networkError(); if (!body.title) throw Object.assign(new Error('title 필드가 필요합니다.'), { status: 400, kind: 'invalid' }); const row = { ...body, id: 'm' + (server.length + 1), version: 1 }; server.push(row); return { ...row } },
    update: async (record, body) => { if (down) throw networkError(); const row = server.find((r) => r.id === record.id); Object.assign(row, body, { version: row.version + 1 }); return { ...row } },
    command: async () => { throw new Error('보내면 안 된다') },
    remove: async () => { throw new Error('보내면 안 된다') },
  }
  const listeners = []
  const outbox = createOutbox({ storage: memoryOutboxStorage(), request: async () => { throw networkError() }, owner: () => 'u1' })
  const queue = { outbox, onOutboxSent: (fn) => listeners.push(fn), knownOffline: () => false }
  const synced = createSyncedCollection({ local: { value: [] }, client, owner: () => 'u1', offline: offline ? { kind: 'memo', queue } : null })
  return { synced, outbox, server, listeners, setDown: (value) => { down = value }, lists: () => lists }
}
const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

test('UT-180·UT-181 화면 쪽: 연결 실패로 끝난 생성은 목록 맨 위에 전송 대기로 보이고, 기존 서버 기록은 그대로다', async () => {
  const { synced, outbox, setDown } = setup()
  await settle()
  setDown(true)
  const row = await synced.create({ title: '지하철 메모' }, { offline: true })
  await nextTick()
  assert.ok(isOfflineId(row.id))
  assert.equal(row.offline, 'pending')
  assert.deepEqual(synced.list.value.map((item) => [item.title, item.offline ?? null]), [['지하철 메모', 'pending'], ['서버 메모', null]])
  assert.equal(outbox.state.items.length, 1)
})

test('대기 중인 기록을 고치면 서버로 보내지 않고 대기열 뒤에 넣으며, 완료·삭제 같은 다른 변경은 막는다', async () => {
  const { synced, outbox, setDown } = setup()
  await settle()
  setDown(true)
  const created = await synced.create({ title: '초안' }, { offline: true })
  setDown(false)
  const edited = await synced.update(created, { title: '고친 초안' }, { offline: true })
  assert.equal(edited.title, '고친 초안')
  assert.deepEqual(outbox.state.items.map((item) => [item.op, item.ref]), [['create', created.ref ?? created.id], ['update', created.id]])
  await assert.rejects(synced.command(edited, 'status', (row) => row), (error) => error.kind === 'offline')
  await assert.rejects(synced.remove(edited), (error) => error.kind === 'offline')
  await assert.rejects(synced.update(edited, { title: 'x' }), (error) => error.kind === 'offline', '대기열을 고르지 않은 수정도 막는다')
})

test('서버 기록의 수정이 연결 실패로 끝나면 기준 version과 함께 대기열에 넣고 목록에는 고친 내용이 보인다', async () => {
  const { synced, outbox, setDown } = setup()
  await settle()
  const record = synced.list.value[0]
  setDown(true)
  const shown = await synced.update(record, { title: '오프라인 수정' }, { offline: true })
  assert.equal(shown.id, 'm1')
  assert.equal(shown.title, '오프라인 수정')
  assert.equal(shown.offline, 'pending')
  assert.deepEqual([outbox.state.items[0].op, outbox.state.items[0].ref, outbox.state.items[0].baseVersion], ['update', 'm1', 1])
})

test('연결 실패가 아닌 오류(400)와 대기열을 고르지 않은 저장은 대기열에 넣지 않는다', async () => {
  const { synced, outbox, setDown } = setup()
  await settle()
  await assert.rejects(synced.create({ title: '' }, { offline: true }), (error) => error.kind === 'invalid')
  setDown(true)
  await assert.rejects(synced.create({ title: '체크리스트 있는 할 일' }), (error) => error.kind === 'network')
  assert.equal(outbox.state.items.length, 0)
})

test('대기열이 보낸 뒤에는 서버 목록을 다시 불러온다', async () => {
  const { listeners, lists } = setup()
  await settle()
  const before = lists()
  for (const fn of listeners) fn([{ item: { kind: 'task' } }])
  assert.equal(lists(), before, '다른 종류를 보냈으면 다시 부르지 않는다')
  for (const fn of listeners) fn([{ item: { kind: 'memo' } }])
  await settle()
  assert.equal(lists(), before + 1)
})
