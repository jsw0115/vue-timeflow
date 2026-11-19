// 로그인 전에 이 브라우저에 남긴 기록을 계정으로 옮기는 흐름을 검사한다(PR-07 3단계, UF-86, UT-128~UT-130, Q-11·Q-13).
import test from 'node:test'
import assert from 'node:assert/strict'
import { ref } from 'vue'
import { createTaskStore } from '../src/features/records/taskStore.mjs'
import { createLocalMigration, isDemoRecord } from '../src/features/records/localMigration.mjs'

const settle = () => new Promise((resolve) => setImmediate(resolve))
const ME = '01HZY0000000000000000000ME'
const SEEDS = [
  { id: 1, title: '서비스 API 명세 검토', category: '업무', done: false },
  { id: 2, title: 'Spring Security 인증 흐름 설계', category: '공부', done: false },
  { id: 3, title: '헬스장 예약하기', category: '건강', done: true },
]
const memoryStorage = () => { const map = new Map(); return { getItem: (k) => map.get(k) ?? null, setItem: (k, v) => map.set(k, String(v)), removeItem: (k) => map.delete(k) } }

/** 멱등 키를 서버처럼 처리하는 가짜 서버. loseResponse(n)이면 n번째 POST는 저장한 뒤 응답만 잃는다. */
function fakeServer() {
  const tasks = new Map(), items = new Map(), keys = new Map(), sent = []
  let seq = 0, lose = new Set(), posts = 0
  const request = async (path, options = {}) => {
    const method = options.method ?? 'GET', body = options.body ? JSON.parse(options.body) : undefined
    const key = options.headers?.['Idempotency-Key']
    sent.push({ method, path, key })
    const [base, query] = path.split('?'), [taskId, sub, itemId, action] = base.split('/').slice(3).map(decodeURIComponent)
    const version = Number(new URLSearchParams(query).get('version') ?? body?.version)
    if (sub === 'checklist-items') {
      const list = items.get(taskId) ?? []
      if (method === 'GET') return list.map((row) => ({ ...row }))
      if (method === 'POST') { const row = { id: 'c' + ++seq, title: body.title, completed: false, assigneeId: body.assigneeId ?? null, version: 1 }; items.set(taskId, [...list, row]); return { ...row } }
      const row = list.find((entry) => entry.id === itemId)
      if (version !== row.version) throw Object.assign(new Error('충돌'), { status: 409 })
      Object.assign(row, action === 'completion' ? { completed: body.completed } : { title: body.title, assigneeId: body.assigneeId }, { version: row.version + 1 })
      return { ...row }
    }
    if (method === 'GET' && !taskId) return [...tasks.values()]
    if (method === 'POST') {
      posts++
      if (key && keys.has(key)) {
        const previous = keys.get(key)
        if (previous.body !== options.body) throw Object.assign(new Error('같은 요청 키로 다른 내용을 보냈습니다.'), { status: 409 })
        if (!tasks.has(previous.id)) throw Object.assign(new Error('없음'), { status: 404 })
        return { ...tasks.get(previous.id) }
      }
      const row = { ...body, id: 't' + ++seq, status: 'TODO', version: 1 }
      tasks.set(row.id, row)
      if (key) keys.set(key, { id: row.id, body: options.body })
      if (lose.has(posts)) throw new TypeError('Failed to fetch')
      return { ...row }
    }
    const row = tasks.get(taskId)
    if (method === 'GET') return row
    if (version !== row.version) throw Object.assign(new Error('충돌'), { status: 409 })
    const saved = { ...row, ...(sub === 'status' ? { status: row.status === 'DONE' ? 'TODO' : 'DONE' } : body), version: row.version + 1 }
    tasks.set(taskId, saved)
    return { ...saved }
  }
  return { tasks, items, sent, request, loseResponse: (n) => lose.add(n) }
}

function setup({ owner = ref(ME), local, server = fakeServer(), storage = memoryStorage() } = {}) {
  const tasks = createTaskStore({ local, request: server.request, owner: () => owner.value })
  const migration = createLocalMigration({ owner: () => owner.value, storage, entries: [tasks.migrationEntry({ label: '할 일', seeds: SEEDS })] })
  return { tasks, migration, server, owner, storage }
}

test('Q-11 시연 기록은 origin 표시가 있거나 시드와 ID·내용이 모두 같을 때만 뺀다', () => {
  assert.equal(isDemoRecord({ ...SEEDS[0] }, SEEDS, ['title', 'date']), true, '시드 그대로')
  assert.equal(isDemoRecord({ ...SEEDS[0], title: '고친 시연 할 일' }, SEEDS, ['title', 'date']), false, 'ID만 같고 내용을 고쳤으면 사용자 기록')
  assert.equal(isDemoRecord({ id: 9, title: '아무거나', origin: 'demo' }, SEEDS, ['title', 'date']), true, 'origin 표시')
  assert.equal(isDemoRecord({ id: 4, title: SEEDS[0].title }, SEEDS, ['title', 'date']), false, '내용만 같고 ID가 다르면 사용자 기록')
})

test('UT-128 시연 기록과 사용자가 만든 할 일 2건이 있으면 이전 안내에 할 일 2건만 보인다', async () => {
  const local = ref([...SEEDS.map((row) => ({ ...row })), { id: 4, title: '내가 만든 할 일', category: '개인', done: false }, { id: 5, title: '두 번째', category: '개인', done: false }])
  const { migration, tasks } = setup({ local })
  await settle()
  assert.equal(migration.visible.value, true)
  assert.deepEqual(migration.candidates.value.map((group) => [group.label, group.items.length]), [['할 일', 2]])
  tasks.stop(); migration.stop()
})

test('UT-129 이전 도중 응답이 끊겨 다시 이전해도 서버에는 2건만 있고, 옮긴 로컬 할 일은 이 브라우저에서 빠진다', async () => {
  const server = fakeServer()
  server.loseResponse(2)
  const local = ref([{ id: 4, title: '첫째', category: '개인', done: false }, { id: 5, title: '둘째', category: '개인', done: false }, { ...SEEDS[0] }])
  const { migration, tasks } = setup({ local, server })
  await settle()
  await migration.run()
  assert.deepEqual([migration.state.moved, migration.state.failed], [1, 1])
  assert.equal(server.tasks.size, 2, '응답만 잃었고 서버에는 저장됐다')
  assert.deepEqual(local.value.map((row) => row.id), [5, 1], '응답을 받지 못한 할 일과 시연 기록은 남는다')
  await migration.run()
  assert.deepEqual([migration.state.moved, migration.state.failed], [1, 0])
  assert.equal(server.tasks.size, 2, '같은 멱등 키라 다시 만들지 않는다')
  assert.deepEqual(server.sent.filter((entry) => entry.method === 'POST').map((entry) => entry.key), ['local:task:4', 'local:task:5', 'local:task:5'])
  assert.deepEqual(local.value.map((row) => row.id), [1])
  assert.equal(migration.total.value, 0, '옮길 것이 없다')
  assert.equal(migration.visible.value, true, '결과를 볼 수 있게 닫을 때까지 둔다')
  migration.close()
  assert.equal(migration.visible.value, false)
  assert.deepEqual(tasks.list.value.map((row) => row.title).sort(), ['둘째', '첫째'], '계정 목록에 한 번씩만 보인다')
  tasks.stop(); migration.stop()
})

test('UT-130 "나중에"를 고르면 로컬 자료를 그대로 두고, 다음 로그인 때 다시 묻는다', async () => {
  const owner = ref(ME), storage = memoryStorage()
  const local = ref([{ id: 4, title: '보관', category: '개인', done: false }])
  const { migration, tasks, server } = setup({ owner, local, storage })
  await settle()
  migration.dismiss()
  assert.equal(migration.visible.value, false)
  assert.equal(local.value.length, 1)
  const reloaded = createLocalMigration({ owner: () => owner.value, storage, entries: [tasks.migrationEntry({ label: '할 일', seeds: SEEDS })] })
  assert.equal(reloaded.visible.value, false, '같은 로그인에서 새로고침하면 다시 묻지 않는다')
  owner.value = ''
  await settle()
  owner.value = ME
  await settle()
  assert.equal(migration.visible.value, true, '로그아웃 뒤 다시 로그인하면 묻는다')
  assert.equal(server.sent.filter((entry) => entry.method === 'POST').length, 0)
  tasks.stop(); migration.stop(); reloaded.stop()
})

test('완료 상태와 체크리스트를 함께 옮기고, 주소록 담당자는 계정이 아니어서 빼며 그 수를 알린다', async () => {
  const local = ref([{ id: 6, title: '체크리스트 있는 할 일', category: '업무', priority: '높음', date: '2026-11-25', body: '본문', done: true, subtasks: [
    { id: 'a', title: '내 단계', done: true, assigneeId: 'self' },
    { id: 'b', title: '연락처 단계', done: false, assigneeId: '7' },
    { id: 'c', title: '담당 없음', done: false, assigneeId: null },
  ] }])
  const { migration, tasks, server } = setup({ local })
  await settle()
  assert.equal(migration.candidates.value[0].droppedAssignees, 1)
  await migration.run()
  const [task] = server.tasks.values()
  assert.deepEqual([task.title, task.priority, task.due, task.note, task.status], ['체크리스트 있는 할 일', 'HIGH', '2026-11-25', '본문', 'DONE'])
  assert.deepEqual(server.items.get(task.id).map((row) => [row.title, row.completed, row.assigneeId]), [['내 단계', true, ME], ['연락처 단계', false, null], ['담당 없음', false, null]])
  assert.equal(local.value.length, 0)
  tasks.stop(); migration.stop()
})

test('체크리스트 도중 끊긴 할 일을 다시 옮기면 이미 만든 항목은 다시 만들지 않는다', async () => {
  const server = fakeServer()
  let failChecklist = 2
  const flaky = async (path, options) => {
    if (path.includes('checklist-items') && options?.method === 'POST' && failChecklist-- === 1) throw new TypeError('Failed to fetch')
    return server.request(path, options)
  }
  const owner = ref(ME)
  const local = ref([{ id: 8, title: '단계 둘', category: '개인', done: false, subtasks: [{ id: 'x', title: '하나', done: false, assigneeId: null }, { id: 'y', title: '둘', done: false, assigneeId: null }] }])
  const tasks = createTaskStore({ local, request: flaky, owner: () => owner.value })
  const migration = createLocalMigration({ owner: () => owner.value, storage: memoryStorage(), entries: [tasks.migrationEntry({ label: '할 일', seeds: SEEDS })] })
  await settle()
  await migration.run()
  assert.equal(migration.state.failed, 1)
  await migration.run()
  assert.equal(migration.state.failed, 0)
  const [task] = server.tasks.values()
  assert.equal(server.tasks.size, 1)
  assert.deepEqual(server.items.get(task.id).map((row) => row.title), ['하나', '둘'])
  tasks.stop(); migration.stop()
})

test('이전 중에 계정이 바뀌면 남은 기록을 옮기지 않고 로컬 자료를 지우지 않는다', async () => {
  const server = fakeServer()
  const owner = ref(ME)
  let release
  const slow = (path, options) => (options?.method === 'POST' ? new Promise((resolve, reject) => { release = () => server.request(path, options).then(resolve, reject) }) : server.request(path, options))
  const local = ref([{ id: 4, title: '하나', category: '개인', done: false }, { id: 5, title: '둘', category: '개인', done: false }])
  const tasks = createTaskStore({ local, request: slow, owner: () => owner.value })
  const migration = createLocalMigration({ owner: () => owner.value, storage: memoryStorage(), entries: [tasks.migrationEntry({ label: '할 일', seeds: SEEDS })] })
  await settle()
  const running = migration.run()
  await settle()
  owner.value = 'OTHER'
  release()
  await running
  assert.deepEqual(local.value.map((row) => row.id), [4, 5], '이전 계정으로 옮기던 결과를 반영하지 않는다')
  assert.equal(server.sent.filter((entry) => entry.method === 'POST').length, 1, '남은 기록은 보내지 않는다')
  tasks.stop(); migration.stop()
})
