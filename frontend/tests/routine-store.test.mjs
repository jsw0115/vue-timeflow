// 루틴 화면의 서버 연결(PR-07 5단계)을 검사한다. 값 변환, 이력에서 만든 최근 4주 달성률(Q-05, IM-14 3단계), 오늘 완료 저장, 로컬 루틴 이전.
import test from 'node:test'
import assert from 'node:assert/strict'
import { ref } from 'vue'
import { createRoutineStore, routineBody, routineDerived } from '../src/features/records/routineStore.mjs'
import { createLocalMigration } from '../src/features/records/localMigration.mjs'

const settle = () => new Promise((resolve) => setTimeout(resolve, 5))
const failure = (status, message = '실패') => Object.assign(new Error(message), { status })
const ME = '01HZY0000000000000000000ME'
const TODAY = '2026-11-19' // 목요일
const iso = (offset) => new Date(Date.parse(TODAY + 'T12:00:00Z') + offset * 86400000).toISOString().slice(0, 10)
const memoryStorage = () => { const map = new Map(); return { getItem: (k) => map.get(k) ?? null, setItem: (k, v) => map.set(k, String(v)), removeItem: (k) => map.delete(k) } }

/** 루틴 정의·이력·수행 기록 API를 흉내 내는 가짜 서버. 모든 날을 회차로 보고, 오늘 이후 미완료는 pending이다. */
function fakeServer({ fail = () => null } = {}) {
  const rows = new Map(), completions = new Map(), keys = new Map(), sent = []
  let seq = 0
  const request = async (path, options = {}) => {
    const method = options.method ?? 'GET', body = options.body ? JSON.parse(options.body) : undefined
    sent.push({ method, path, body, key: options.headers?.['Idempotency-Key'] })
    const forced = fail({ method, path, body })
    if (forced) throw forced
    const [base, query] = path.split('?'), params = new URLSearchParams(query)
    const [, , , id, sub, date] = base.split('/').map(decodeURIComponent)
    if (sub === 'history' && method === 'GET') {
      const items = []
      let done = 0, total = 0, streak = 0, best = 0
      for (let d = params.get('from'); d <= params.get('to'); d = new Date(Date.parse(d + 'T12:00:00Z') + 86400000).toISOString().slice(0, 10)) {
        const log = completions.get(id + '@' + d)
        const completed = Boolean(log?.completed)
        const status = completed ? 'done' : d >= TODAY ? 'pending' : 'missed'
        if (status === 'done') { done++; total++; streak++; best = Math.max(best, streak) } else if (status === 'missed') { total++; streak = 0 }
        items.push({ date: d, completed, status, version: log?.version ?? 0 })
      }
      return { routineId: id, items, done, total, skipped: 0, rate: total ? Math.round(100 * done / total) : 0, streak, best }
    }
    if (sub === 'history' && method === 'PUT') {
      const key = id + '@' + date, previous = completions.get(key)
      if (!previous) { const row = { completed: body.completed, version: 1 }; completions.set(key, row); return { id: key, ...row } }
      if (previous.completed === body.completed) return { id: key, ...previous }
      if (body.version !== previous.version) throw failure(409)
      Object.assign(previous, { completed: body.completed, version: previous.version + 1 })
      return { id: key, ...previous }
    }
    if (method === 'GET' && !id) { const all = [...rows.values()]; return { items: all, page: 0, size: 100, total: all.length } }
    if (method === 'POST') {
      const key = options.headers?.['Idempotency-Key']
      if (key && keys.has(key)) return { ...rows.get(keys.get(key)) }
      const row = { ...body, id: 'r' + ++seq, version: 1 }
      rows.set(row.id, row)
      if (key) keys.set(key, row.id)
      return { ...row }
    }
    const row = rows.get(id)
    if (method === 'GET') return { ...row }
    const version = Number(params.get('version') ?? body?.version)
    if (version !== row.version) throw failure(409)
    if (method === 'DELETE') { rows.delete(id); return null }
    const saved = { ...body, id, version: row.version + 1 }
    rows.set(id, saved)
    return { ...saved }
  }
  return { rows, completions, sent, request }
}
const routine = (extra = {}) => ({ title: '물 마시기', body: '', category: '건강', startDate: iso(-40), time: '08:00', duration: 10, days: [0, 1, 2, 3, 4, 5, 6], goal: { count: 8, unit: '잔' }, notify: true, reminderMinutes: 10, paused: false, ...extra })

test('루틴 요청 본문은 서버 허용 필드만 보내고, 화면 계산 값(완료·연속·이력)은 보내지 않는다', () => {
  const body = routineBody({ ...routine({ title: ' 물 ' }), id: 'r1', version: 3, done: true, streak: 4, best: 9, history: [1, 0, 0, 0, 0, 0, 0], rate4w: 80, historyLoaded: true, todayVersion: 2 })
  assert.deepEqual(Object.keys(body).sort(), ['body', 'category', 'days', 'duration', 'goal', 'notify', 'paused', 'reminderMinutes', 'startDate', 'time', 'title'])
  assert.equal(body.title, '물')
})

test('Q-05 첫 수치는 최근 4주 달성률이다. 쉬는 날과 오늘 미완료는 분모에서 빼고, 연속 기록은 보조로 쓴다', () => {
  const items = []
  for (let offset = -30; offset <= 0; offset++) {
    const date = iso(offset)
    // 4주 안: 20일 완료, 4일 놓침, 3일 쉬는 날, 오늘은 아직
    const inWindow = offset >= -27
    let status = 'done'
    if (offset === 0) status = 'pending'
    else if (inWindow && offset >= -6 && offset <= -3) status = 'missed'
    else if (inWindow && offset >= -27 && offset <= -25) status = 'skipped'
    else if (!inWindow) status = 'missed'
    items.push({ date, completed: status === 'done', status, version: status === 'done' ? 1 : 0 })
  }
  const derived = routineDerived({ items, streak: 2, best: 18 }, TODAY)
  assert.equal(derived.rate4w, Math.round(100 * 20 / 24))
  assert.deepEqual([derived.streak, derived.best, derived.done, derived.todayVersion, derived.historyLoaded], [2, 18, false, 0, true])
  // 최근 7일(금~목)을 요일 자리에 놓는다. 일(0)·월(1)·화(2)·수(3)은 완료, 금(5)·토(6)은 놓침, 목(4)=오늘은 아직
  // 최근 7일(11/13 금 ~ 11/19 목): 화(11/17)·수(11/18)만 완료, 금~월은 놓침, 오늘(목)은 아직
  assert.deepEqual(derived.history, [0, 0, 1, 1, 0, 0, 0])
})

test('로그인 상태 목록을 불러오면 루틴마다 이력을 불러와 오늘 완료·연속·4주 달성률을 채운다', async () => {
  const server = fakeServer()
  const created = await server.request('/api/routine-records', { method: 'POST', body: JSON.stringify(routine()) })
  await server.request(`/api/routine-records/${created.id}/history/${iso(-1)}`, { method: 'PUT', body: JSON.stringify({ completed: true }) })
  const store = createRoutineStore({ local: ref([]), request: server.request, owner: () => ME, today: () => TODAY })
  await store.whenSettled()
  const [row] = store.list.value
  assert.equal(row.historyLoaded, true)
  assert.equal(row.streak, 1, '어제 완료했고 오늘은 아직이라 연속 1일(서버 계산)')
  assert.ok(server.sent.some((entry) => entry.path.startsWith(`/api/routine-records/${created.id}/history?from=`)))
  store.stop()
})

test('오늘 완료는 서버 성공 뒤에만 바뀌고, 취소할 때는 이력의 수행 기록 version을 보낸다', async () => {
  const server = fakeServer()
  const created = await server.request('/api/routine-records', { method: 'POST', body: JSON.stringify(routine()) })
  const store = createRoutineStore({ local: ref([]), request: server.request, owner: () => ME, today: () => TODAY })
  await store.whenSettled()
  const pending = store.toggleToday(store.list.value[0])
  assert.equal(store.list.value[0].done, false, '응답 전에는 완료로 바꾸지 않는다')
  await pending
  assert.equal(store.list.value[0].done, true)
  const put = server.sent.filter((entry) => entry.method === 'PUT')
  assert.deepEqual(put.map((entry) => [entry.path, entry.body]), [[`/api/routine-records/${created.id}/history/${TODAY}`, { completed: true }]])
  await store.toggleToday(store.list.value[0])
  assert.deepEqual(server.sent.filter((entry) => entry.method === 'PUT').at(-1).body, { completed: false, version: 1 })
  assert.equal(store.list.value[0].done, false)
  store.stop()
})

test('다른 곳에서 먼저 바꿨으면 최신 이력으로 바꾸고 알린다. 쉬는 날 같은 400은 서버 메시지를 알린다', async () => {
  const server = fakeServer()
  const created = await server.request('/api/routine-records', { method: 'POST', body: JSON.stringify(routine()) })
  const store = createRoutineStore({ local: ref([]), request: server.request, owner: () => ME, today: () => TODAY })
  await store.whenSettled()
  await store.toggleToday(store.list.value[0])
  // 다른 기기에서 취소하고 다시 완료해 version이 3이 됐다
  server.completions.get(created.id + '@' + TODAY).version = 3
  await store.toggleToday(store.list.value[0])
  assert.match(store.notice.message, /다른 곳에서 먼저 바뀌어/)
  assert.equal(store.list.value[0].todayVersion, 3)
  const restServer = fakeServer({ fail: ({ method, path }) => (method === 'PUT' && path.includes('/history/') ? failure(400, '쉬는 날로 정한 날짜입니다. 쉬는 날을 해제한 뒤 기록해주세요.') : null) })
  await restServer.request('/api/routine-records', { method: 'POST', body: JSON.stringify(routine()) })
  const rest = createRoutineStore({ local: ref([]), request: restServer.request, owner: () => ME, today: () => TODAY })
  await rest.whenSettled()
  await rest.toggleToday(rest.list.value[0])
  assert.equal(rest.notice.message, '쉬는 날로 정한 날짜입니다. 쉬는 날을 해제한 뒤 기록해주세요.')
  assert.equal(rest.list.value[0].done, false)
  store.stop(); rest.stop()
})

test('로그아웃 상태 오늘 완료는 지금처럼 이 브라우저의 연속 기록을 바꾼다', async () => {
  const local = ref([{ id: 1, ...routine(), done: false, streak: 2, best: 5, history: [0, 0, 0, 0, 0, 0, 0] }])
  const store = createRoutineStore({ local, request: async () => assert.fail('서버를 부르지 않는다'), owner: () => '', today: () => TODAY })
  await store.toggleToday(local.value[0])
  assert.deepEqual([local.value[0].done, local.value[0].streak], [true, 3])
  store.stop()
})

test('로컬 루틴 이전: 시연 루틴은 제목·시각으로 빼고, 오늘 완료했으면 오늘 수행 기록도 옮긴다', async () => {
  const server = fakeServer()
  const owner = ref(ME)
  const seeds = [{ id: 1, title: '물 2L 마시기', time: '08:00' }]
  const local = ref([
    { id: 1, ...routine({ title: '물 2L 마시기', time: '08:00' }), done: true, streak: 12, best: 31, history: [1, 1, 1, 0, 1, 1, 1] },
    { id: 4, ...routine({ title: '저녁 독서', time: '21:00', startDate: iso(-3) }), done: true, streak: 1, best: 1, history: [0, 0, 0, 0, 1, 0, 0] },
  ])
  const store = createRoutineStore({ local, request: server.request, owner: () => owner.value, today: () => TODAY })
  const migration = createLocalMigration({ owner: () => owner.value, storage: memoryStorage(), entries: [store.migrationEntry({ label: '루틴', seeds })] })
  await store.whenSettled()
  assert.deepEqual(migration.candidates.value.map((group) => [group.label, group.items.length]), [['루틴', 1]])
  await migration.run()
  assert.equal(migration.state.moved, 1)
  const [row] = server.rows.values()
  assert.equal(row.title, '저녁 독서')
  assert.equal(server.sent.find((entry) => entry.method === 'POST').key, 'local:routine:4')
  assert.equal(server.completions.get(row.id + '@' + TODAY)?.completed, true)
  assert.deepEqual(local.value.map((item) => item.id), [1])
  store.stop(); migration.stop()
})
