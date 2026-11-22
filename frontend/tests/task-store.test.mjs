// 할 일 화면의 서버 연결(PR-07 2단계)을 검사한다. 저장 상태, 입력 보존, 충돌, 체크리스트, 비로그인 로컬 저장(UT-122~UT-126, UT-131).
import test from 'node:test'
import assert from 'node:assert/strict'
import { ref } from 'vue'
import { createTaskStore } from '../src/features/records/taskStore.mjs'
import { taskFromServer, taskBody, checklistItemFromServer, syncChecklist } from '../src/features/records/taskRecords.mjs'
import { createSaveState, saveFailureMessage } from '../src/features/records/saveState.mjs'

const settle = () => new Promise((resolve) => setImmediate(resolve))
const failure = (status, message = '실패') => Object.assign(new Error(message), { status })
const ME = '01HZY0000000000000000000ME'

/** 할 일과 체크리스트 API처럼 version을 올리고 오래된 version을 409로 막는 가짜 서버. */
function fakeServer() {
  const tasks = new Map(), items = new Map(), sent = []
  let seq = 0
  const next = (prefix) => prefix + ++seq
  const request = async (path, options = {}) => {
    const method = options.method ?? 'GET', body = options.body ? JSON.parse(options.body) : undefined
    sent.push({ method, path, body })
    const [base, query] = path.split('?'), parts = base.split('/').slice(3).map(decodeURIComponent)
    const version = Number(new URLSearchParams(query).get('version') ?? body?.version)
    const [taskId, sub, itemId, action] = parts
    if (sub === 'checklist-items') {
      const list = items.get(taskId) ?? []
      if (method === 'GET') return list
      if (method === 'POST') { const row = { id: next('c'), title: body.title, completed: false, assigneeId: body.assigneeId ?? null, version: 1 }; items.set(taskId, [...list, row]); return row }
      const row = list.find((entry) => entry.id === itemId)
      if (!row) throw failure(404, '체크리스트 항목을 찾을 수 없습니다.')
      if (version !== row.version) throw failure(409, '다른 곳에서 변경되었습니다.')
      if (method === 'DELETE') { items.set(taskId, list.filter((entry) => entry !== row)); return null }
      Object.assign(row, action === 'completion' ? { completed: body.completed } : { title: body.title, assigneeId: body.assigneeId ?? null }, { version: row.version + 1 })
      return { ...row }
    }
    if (method === 'GET' && !taskId) return [...tasks.values()]
    if (method === 'POST') { const row = { ...body, id: next('t'), status: 'TODO', version: 1 }; tasks.set(row.id, row); return row }
    const row = tasks.get(taskId)
    if (!row) throw failure(404, '할 일을 찾을 수 없습니다.')
    if (method === 'GET') return row
    if (version !== row.version) throw failure(409, '다른 곳에서 변경되었습니다.')
    if (method === 'DELETE') { tasks.delete(taskId); return null }
    const changed = sub === 'status' ? { status: row.status === 'DONE' ? 'TODO' : 'DONE' } : body
    const saved = { ...row, ...changed, version: row.version + 1 }
    tasks.set(taskId, saved)
    return saved
  }
  return { tasks, items, sent, request }
}

test('할 일 서버 값과 화면 값을 서로 바꾸고, 화면에 없는 서버 필드는 수정할 때 그대로 돌려보낸다', () => {
  const row = { id: 't1', title: '보고서', note: '본문', status: 'DONE', priority: 'HIGH', energyLevel: 'LOW', durationMin: 45, due: '2026-11-20', categoryId: 'c9', categoryName: '업무', categoryColor: '#43596b', categoryIcon: null, version: 3 }
  const local = taskFromServer(row)
  assert.deepEqual([local.id, local.version, local.title, local.body, local.date, local.category, local.priority, local.done], ['t1', 3, '보고서', '본문', '2026-11-20', '업무', '높음', true])
  const body = taskBody({ ...local, title: ' 보고서 v2 ', priority: '낮음', date: '' })
  assert.deepEqual(body, { energyLevel: 'LOW', durationMin: 45, categoryId: 'c9', categoryColor: '#43596b', categoryIcon: null, title: '보고서 v2', note: '본문', due: null, dueTime: null, priority: 'LOW', categoryName: '업무' })
  assert.equal('version' in body, false, '본문 version은 어댑터가 붙인다')
  assert.deepEqual(checklistItemFromServer({ id: 'c1', title: '초안', completed: true, assigneeId: ME, version: 2 }, ME), { id: 'c1', version: 2, title: '초안', done: true, assigneeId: 'self' })
})

test('UT-122 응답이 오기 전에는 "저장 중"만 보이고, 서버 성공 응답 뒤에만 "저장됨"이 된다', async () => {
  const saving = createSaveState()
  let release
  const run = saving.run(() => new Promise((resolve) => { release = resolve }))
  assert.equal(saving.state.status, 'saving')
  const again = await saving.run(async () => assert.fail('저장 중에 다시 누른 요청은 보내지 않는다'))
  assert.equal(again.busy, true)
  await settle()
  assert.equal(saving.state.status, 'saving', '응답 전에는 저장됨이 아니다')
  release('ok')
  assert.deepEqual(await run, { ok: true, value: 'ok' })
  assert.equal(saving.state.status, 'saved')
})

test('UT-123·UT-124 실패는 종류별 문구로 알리고, 400은 서버 메시지를 관련 입력란에 붙인다', async () => {
  const saving = createSaveState({ fields: { title: ['제목'], date: ['마감'] } })
  const draft = { title: '' }
  const result = await saving.run(async () => { throw Object.assign(failure(400, '제목을 입력해주세요.'), { kind: 'invalid' }) })
  assert.equal(result.ok, false)
  assert.deepEqual([saving.state.status, saving.state.field, saving.state.fieldMessage], ['failed', 'title', '제목을 입력해주세요.'])
  assert.deepEqual(draft, { title: '' }, '저장 실패가 입력을 지우지 않는다')
  await saving.run(async () => { throw new TypeError('Failed to fetch') })
  assert.deepEqual([saving.state.status, saving.state.message], ['failed', '저장하지 못했어요. 연결을 확인하고 다시 시도해 주세요.'])
  assert.equal(saveFailureMessage(failure(503)), '저장하지 못했어요. 잠시 뒤 다시 시도해 주세요.')
  await saving.run(async () => { throw Object.assign(failure(409), { kind: 'conflict' }) })
  assert.equal(saving.state.status, 'conflict')
})

test('UT-131 로그아웃 상태에서는 로컬 목록에 저장하고 서버를 부르지 않는다', async () => {
  const server = fakeServer()
  const local = ref([{ id: 1, title: '예전 할 일', category: '업무', done: false }])
  const store = createTaskStore({ local, request: server.request, owner: () => '' })
  assert.equal(store.mode.value, 'local')
  const created = await store.createWithChecklist({ title: '새 할 일', body: '', date: '', category: '개인', priority: '보통' }, [{ id: 'x', title: '단계', done: false, assigneeId: 'self' }])
  assert.equal(created.task.id, 2)
  assert.deepEqual(local.value.map((task) => task.title), ['새 할 일', '예전 할 일'])
  assert.deepEqual(local.value[0].subtasks.map((item) => item.assigneeId), ['self'])
  await store.toggle(local.value[0])
  assert.equal(local.value[0].done, true)
  await store.remove(local.value[0])
  assert.deepEqual(local.value.map((task) => task.title), ['예전 할 일'])
  assert.equal(server.sent.length, 0)
  store.stop()
})

test('로그인 상태에서는 서버 목록을 보이고, 만들기·완료·삭제가 서버 성공 뒤에만 목록에 반영된다', async () => {
  const server = fakeServer()
  const local = ref([{ id: 1, title: '이 브라우저의 할 일', done: false }])
  const store = createTaskStore({ local, request: server.request, owner: () => ME })
  await settle()
  assert.equal(store.mode.value, 'server')
  assert.deepEqual(store.list.value, [], '로그인 계정의 목록에는 로컬 할 일이 섞이지 않는다')
  const { task } = await store.createWithChecklist({ title: '서버 할 일', body: '', date: '2026-11-21', category: '업무', priority: '높음' }, [{ id: 'd1', title: '자료 모으기', done: true, assigneeId: 'self' }])
  assert.deepEqual(server.sent.slice(1).map((entry) => `${entry.method} ${entry.path}`), ['POST /api/tasks', 'POST /api/tasks/t1/checklist-items', 'PUT /api/tasks/t1/checklist-items/c2/completion'])
  assert.equal(server.sent[2].body.assigneeId, ME, '"나"는 내 계정 ID로 보낸다')
  assert.equal(store.list.value[0].priority, '높음')
  assert.deepEqual(store.checklist(task).items.map((item) => [item.title, item.done, item.assigneeId]), [['자료 모으기', true, 'self']])
  let release
  const slow = (path, options) => options?.method === 'PATCH' ? new Promise((resolve) => { release = () => resolve(server.request(path, options)) }) : server.request(path, options)
  const toggled = createTaskStore({ local, request: slow, owner: () => ME })
  await settle()
  const pending = toggled.toggle(toggled.list.value[0])
  assert.equal(toggled.list.value[0].done, false, '응답 전에는 완료로 바꾸지 않는다')
  assert.equal(toggled.isPending(toggled.list.value[0]), true)
  release()
  await pending
  assert.equal(toggled.list.value[0].done, true)
  await toggled.remove(toggled.list.value[0])
  assert.equal(server.tasks.size, 0)
  assert.deepEqual(local.value.map((row) => row.title), ['이 브라우저의 할 일'], '서버 저장이 로컬 자료를 지우지 않는다')
  store.stop(); toggled.stop()
})

test('UT-125·UT-126 다른 곳에서 먼저 고쳤으면 비교용 최신 값을 주고, 고르기 전에는 서버 값을 바꾸지 않는다. 다시 저장은 최신 version으로 보낸다', async () => {
  const server = fakeServer()
  const store = createTaskStore({ local: ref([]), request: server.request, owner: () => ME })
  await settle()
  const { task } = await store.createWithChecklist({ title: '처음', body: '', date: '', category: '업무', priority: '보통' }, [])
  await store.loadChecklist(task)
  const other = await server.request(`/api/tasks/${task.id}`, { method: 'PUT', body: JSON.stringify({ ...taskBody(task), title: '다른 탭에서 저장', version: 1 }) })
  const draft = { title: '내 입력', body: '', date: '', category: '업무', priority: '보통', subtasks: [] }
  const conflict = await store.saveDetail(task, draft, []).catch((error) => error)
  assert.equal(conflict.kind, 'conflict')
  assert.equal(conflict.latest.title, '다른 탭에서 저장')
  assert.equal(server.tasks.get(task.id).title, other.title, '자동으로 덮어쓰지 않는다')
  assert.deepEqual(draft.title, '내 입력', '내 입력이 남는다')
  const latest = store.list.value.find((row) => row.id === task.id)
  assert.equal(latest.version, 2, '목록은 최신 서버 값으로 바뀐다')
  const saved = await store.saveDetail(latest, draft, [])
  assert.equal(server.sent.at(-1).body.version, 2, '최신 version으로 다시 보낸다')
  assert.equal(saved.task.title, '내 입력')
  assert.equal(server.tasks.get(task.id).title, '내 입력')
  store.stop()
})

test('체크리스트는 바뀐 항목만 보내고, 중간에 실패하면 성공한 항목을 반영해 남은 항목만 다시 보낸다', async () => {
  const server = fakeServer()
  const { request } = server
  server.items.set('t1', [{ id: 'k1', title: '유지', completed: false, assigneeId: null, version: 1 }, { id: 'k2', title: '이름 바꿀 항목', completed: false, assigneeId: null, version: 1 }, { id: 'k3', title: '지울 항목', completed: false, assigneeId: null, version: 1 }])
  const baseline = server.items.get('t1').map((row) => checklistItemFromServer(row, ME))
  const draft = [{ ...baseline[0] }, { ...baseline[1], title: '바꾼 이름', done: true }, { id: 'new-1', title: '새 항목', done: false, assigneeId: 'self' }]
  let failOnce = true
  const flaky = async (path, options) => {
    if (failOnce && options?.method === 'POST') { failOnce = false; throw new TypeError('Failed to fetch') }
    return request(path, options)
  }
  const first = await syncChecklist({ request: flaky, taskId: 't1', baseline, draft, me: ME })
  assert.equal(first.error.kind, 'network')
  assert.deepEqual(server.sent.map((entry) => `${entry.method} ${entry.path.replace('/api/tasks/t1/checklist-items', '')}`), ['PUT /k2', 'PUT /k2/completion'])
  const second = await syncChecklist({ request: flaky, taskId: 't1', baseline: first.baseline, draft: first.draft, me: ME })
  assert.equal(second.error, null)
  assert.deepEqual(server.sent.slice(2).map((entry) => `${entry.method} ${entry.path.replace('/api/tasks/t1/checklist-items', '')}`), ['POST ', 'DELETE /k3?version=1'])
  assert.deepEqual(server.items.get('t1').map((row) => [row.title, row.completed, row.assigneeId]), [['유지', false, null], ['바꾼 이름', true, null], ['새 항목', false, ME]])
  assert.deepEqual(second.draft.map((item) => item.id), ['k1', 'k2', 'c1'], '새 항목은 서버 ID로 바뀌어 다시 만들지 않는다')
  const none = await syncChecklist({ request, taskId: 't1', baseline: second.baseline, draft: second.draft, me: ME })
  assert.equal(server.sent.length, 4, '바뀐 것이 없으면 요청하지 않는다')
  assert.equal(none.error, null)
})

test('체크리스트가 다른 곳에서 바뀌었으면 최신 목록을 함께 알리고, 새로 만든 할 일의 체크리스트가 실패하면 할 일을 다시 만들지 않는다', async () => {
  const server = fakeServer()
  const store = createTaskStore({ local: ref([]), request: server.request, owner: () => ME })
  await settle()
  const { task } = await store.createWithChecklist({ title: '할 일', body: '', date: '', category: '업무', priority: '보통' }, [{ id: 'd1', title: '항목', done: false, assigneeId: null }])
  const baseline = (await store.loadChecklist(task)).items
  server.items.get(task.id)[0].version = 5
  const draft = { title: '할 일', body: '', date: '', category: '업무', priority: '보통', subtasks: [{ ...baseline[0], title: '내가 고친 항목' }] }
  const conflict = await store.saveDetail(task, draft, baseline).catch((error) => error)
  assert.equal(conflict.kind, 'conflict')
  assert.deepEqual(conflict.latestChecklist.map((item) => item.version), [5])
  let failChecklist = true
  const flaky = async (path, options) => {
    if (failChecklist && path.includes('checklist-items')) { failChecklist = false; throw failure(503) }
    return server.request(path, options)
  }
  const other = createTaskStore({ local: ref([]), request: flaky, owner: () => ME })
  await settle()
  const error = await other.createWithChecklist({ title: '두 번째', body: '', date: '', category: '업무', priority: '보통' }, [{ id: 'd2', title: '단계', done: false, assigneeId: null }]).catch((e) => e)
  assert.equal(error.kind, 'server')
  assert.match(saveFailureMessage(error), /할 일은 저장했지만 체크리스트/)
  const before = server.tasks.size
  await other.createWithChecklist({ title: '두 번째', body: '', date: '', category: '업무', priority: '보통' }, error.progress.subtasks, error.progress)
  assert.equal(server.tasks.size, before, '이어서 저장할 때 할 일을 다시 만들지 않는다')
  assert.deepEqual(server.items.get(error.progress.task.id).map((row) => row.title), ['단계'])
  store.stop(); other.stop()
})
