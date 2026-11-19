// 일정 화면의 서버 연결(PR-07 4단계)을 검사한다. 값 변환, 페이지 목록, "이 회차부터" 분할의 두 요청, 400 입력란, 로컬 일정 이전(UT-124).
import test from 'node:test'
import assert from 'node:assert/strict'
import { ref } from 'vue'
import { createScheduleStore, scheduleFromServer, scheduleBody } from '../src/features/records/scheduleStore.mjs'
import { createRecordClient } from '../src/features/records/recordClient.mjs'
import { createLocalMigration } from '../src/features/records/localMigration.mjs'
import { createSaveState } from '../src/features/records/saveState.mjs'
import { makeRecurrence, splitRecurrence } from '../src/utils/recurrence.mjs'

const settle = () => new Promise((resolve) => setImmediate(resolve))
const failure = (status, message = '실패') => Object.assign(new Error(message), { status })
const ME = '01HZY0000000000000000000ME'
const memoryStorage = () => { const map = new Map(); return { getItem: (k) => map.get(k) ?? null, setItem: (k, v) => map.set(k, String(v)), removeItem: (k) => map.delete(k) } }

/** feature_record API처럼 목록은 페이지, 생성은 멱등 키, 수정·삭제는 version을 검사하는 가짜 서버. */
function fakeServer({ fail = () => null } = {}) {
  const rows = new Map(), keys = new Map(), sent = []
  let seq = 0
  const request = async (path, options = {}) => {
    const method = options.method ?? 'GET', body = options.body ? JSON.parse(options.body) : undefined
    sent.push({ method, path, body, key: options.headers?.['Idempotency-Key'] })
    const forced = fail({ method, path, body, count: sent.length })
    if (forced) throw forced
    const [base, query] = path.split('?'), params = new URLSearchParams(query), id = decodeURIComponent(base.split('/')[3] ?? '')
    if (method === 'GET' && !id) {
      const page = Number(params.get('page') ?? 0), size = Number(params.get('size') ?? 20), all = [...rows.values()]
      return { items: all.slice(page * size, page * size + size), page, size, total: all.length }
    }
    if (method === 'POST') {
      const key = options.headers?.['Idempotency-Key']
      if (key && keys.has(key)) return { ...rows.get(keys.get(key)) }
      const row = { ...body, id: 's' + ++seq, version: 1 }
      rows.set(row.id, row)
      if (key) keys.set(key, row.id)
      return { ...row }
    }
    const row = rows.get(id)
    if (!row) throw failure(404)
    if (method === 'GET') return { ...row }
    const version = Number(params.get('version') ?? body?.version)
    if (version !== row.version) throw failure(409)
    if (method === 'DELETE') { rows.delete(id); return null }
    const saved = { ...body, id, version: row.version + 1 }
    delete saved.version; saved.version = row.version + 1
    rows.set(id, saved)
    return { ...saved }
  }
  return { rows, sent, request }
}
const weekly = () => makeRecurrence({ frequency: 'daily', count: 10 })
const schedule = (extra = {}) => ({ title: '회의', body: '', category: '업무', startDate: '2026-11-20', endDate: '2026-11-20', startTime: '10:00', endTime: '11:00', color: '#2f5d46', attendeeIds: [], recurrence: weekly(), ...extra })

test('일정 서버 값은 화면이 쓰는 파생 값(time·date·tag·state)을 갖고, 요청 본문은 서버 허용 필드만 보낸다', () => {
  const local = scheduleFromServer({ id: 's1', version: 2, ...schedule({ attendeeIds: ['01ACCOUNT'] }), createdAt: 'x', updatedAt: 'y' })
  assert.deepEqual([local.time, local.date, local.tag, local.state], ['10:00', '2026-11-20 10:00', '업무', '예정'])
  const body = scheduleBody({ ...local, title: ' 회의 v2 ', attendeeIds: ['01ACCOUNT', 7] })
  assert.deepEqual(Object.keys(body).sort(), ['attendeeIds', 'body', 'category', 'color', 'endDate', 'endTime', 'recurrence', 'startDate', 'startTime', 'title'])
  assert.equal(body.title, '회의 v2')
  assert.deepEqual(body.attendeeIds, ['01ACCOUNT'], '주소록 연락처(숫자 ID)는 계정이 아니라 보내지 않는다')
})

test('페이지로 나뉜 목록은 끝까지 모아 한 목록으로 돌려준다', async () => {
  const server = fakeServer()
  for (let i = 0; i < 150; i++) await server.request('/api/schedules', { method: 'POST', body: JSON.stringify(schedule({ title: '일정 ' + i })) })
  server.sent.length = 0
  const rows = await createRecordClient({ request: server.request, path: '/api/schedules', paged: true }).list()
  assert.equal(rows.length, 150)
  assert.deepEqual(server.sent.map((entry) => entry.path), ['/api/schedules?page=0&size=100', '/api/schedules?page=1&size=100'])
})

test('"이 회차부터" 분할은 새 일정을 먼저 만들고 원래 일정을 고친다', async () => {
  const server = fakeServer()
  const store = createScheduleStore({ local: ref([]), request: server.request, owner: () => ME })
  await settle()
  const original = await store.create(schedule())
  const split = splitRecurrence(original, '2026-11-23')
  const created = await store.split(original, split.head, { ...original, ...split.tail, title: '바뀐 회의' })
  assert.deepEqual(server.sent.slice(-2).map((entry) => entry.method), ['POST', 'PUT'])
  assert.equal(server.rows.size, 2)
  assert.equal(server.rows.get(original.id).recurrence.until ?? server.rows.get(original.id).recurrence.count, split.head.until ?? split.head.count)
  assert.equal(created.title, '바뀐 회의')
  assert.deepEqual(store.list.value.map((row) => row.title).sort(), ['바뀐 회의', '회의'])
  store.stop()
})

test('분할에서 원래 일정 수정이 실패하면 만든 일정을 지워 회차가 겹치지 않게 하고, 지우지도 못하면 알린다', async () => {
  let failPut = true
  const server = fakeServer({ fail: ({ method }) => (method === 'PUT' && failPut ? failure(409) : null) })
  const store = createScheduleStore({ local: ref([]), request: server.request, owner: () => ME })
  await settle()
  const original = await store.create(schedule())
  const split = splitRecurrence(original, '2026-11-23')
  const error = await store.split(original, split.head, { ...original, ...split.tail }).catch((e) => e)
  assert.equal(error.kind, 'conflict')
  assert.equal(server.rows.size, 1, '만든 일정을 지웠다')
  assert.equal(error.orphan, undefined)
  assert.deepEqual(store.list.value.map((row) => row.id), [original.id])
  const stuck = fakeServer({ fail: ({ method }) => (method === 'PUT' ? failure(503) : method === 'DELETE' ? new TypeError('Failed to fetch') : null) })
  const other = createScheduleStore({ local: ref([]), request: stuck.request, owner: () => ME })
  await settle()
  const base = await other.create(schedule())
  const parts = splitRecurrence(base, '2026-11-23')
  const orphaned = await other.split(base, parts.head, { ...base, ...parts.tail }).catch((e) => e)
  assert.equal(orphaned.kind, 'server')
  assert.ok(orphaned.orphan, '지우지 못한 새 일정을 알린다')
  failPut = false
  store.stop(); other.stop()
})

test('로그아웃 상태 분할은 지금처럼 이 브라우저 목록에서 한 번에 바꾼다', async () => {
  const local = ref([{ id: 1, ...schedule(), time: '10:00', date: '2026-11-20 10:00', tag: '업무', state: '예정' }])
  const store = createScheduleStore({ local, request: async () => assert.fail('서버를 부르지 않는다'), owner: () => '' })
  const split = splitRecurrence(local.value[0], '2026-11-23')
  const created = await store.split(local.value[0], split.head, { ...local.value[0], ...split.tail, title: '바뀐 회의' })
  assert.equal(created.id, 2)
  assert.deepEqual(local.value.map((row) => row.title), ['바뀐 회의', '회의'])
  assert.deepEqual(local.value[1].recurrence, split.head)
  store.stop()
})

test('UT-124 종료가 시작보다 빠른 일정을 서버가 400으로 거절하면 메시지를 종료 입력란 옆에 붙이고 입력을 남긴다', async () => {
  const server = fakeServer({ fail: ({ method }) => (method === 'PUT' ? failure(400, '일정 종료는 시작 이후, 최대 366일입니다.') : null) })
  const store = createScheduleStore({ local: ref([]), request: server.request, owner: () => ME })
  await settle()
  const original = await store.create(schedule())
  const draft = { ...original, endTime: '09:00' }
  const saving = createSaveState({ fields: { title: ['제목'], end: ['종료'] } })
  const result = await saving.run(() => store.update(original, draft))
  assert.equal(result.ok, false)
  assert.deepEqual([saving.state.field, saving.state.fieldMessage], ['end', '일정 종료는 시작 이후, 최대 366일입니다.'])
  assert.equal(draft.endTime, '09:00')
  assert.equal(server.rows.get(original.id).endTime, '11:00')
  store.stop()
})

test('로컬 일정 이전: 시연 일정은 날짜가 달라도 제목·시각이 같으면 빼고, 주소록 참석자는 빼고 수를 알린다', async () => {
  const server = fakeServer()
  const seeds = [{ id: 1, title: '디자인 싱크 미팅', startDate: '2026-11-01', startTime: '11:00', endTime: '12:00' }]
  const local = ref([
    { id: 1, ...schedule({ title: '디자인 싱크 미팅', startDate: '2026-11-18', endDate: '2026-11-18', startTime: '11:00', endTime: '12:00' }) },
    { id: 3, ...schedule({ title: '내 일정', attendeeIds: [2, 5] }) },
  ])
  const owner = ref(ME)
  const store = createScheduleStore({ local, request: server.request, owner: () => owner.value })
  const migration = createLocalMigration({ owner: () => owner.value, storage: memoryStorage(), entries: [store.migrationEntry({ label: '일정', seeds })] })
  await settle()
  assert.deepEqual(migration.candidates.value.map((group) => [group.label, group.items.length, group.droppedAttendees]), [['일정', 1, 2]])
  await migration.run()
  assert.equal(migration.state.moved, 1)
  const [row] = server.rows.values()
  assert.deepEqual([row.title, row.attendeeIds], ['내 일정', []])
  assert.equal(server.sent.find((entry) => entry.method === 'POST').key, 'local:event:3')
  assert.deepEqual(local.value.map((item) => item.id), [1])
  store.stop(); migration.stop()
})
