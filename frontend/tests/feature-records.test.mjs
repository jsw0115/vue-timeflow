// 다이어리·메모·D-Day·머니로그의 서버 연결(PR-07 6단계)을 검사한다. 기분 코드(Q-07), 종류별 값 변환, D-Day 날짜, 로컬 기록 이전.
import test from 'node:test'
import assert from 'node:assert/strict'
import { ref } from 'vue'
import { createFeatureStore } from '../src/features/records/featureStore.mjs'
import { diaryKind, memoKind, ddayKind, moneyKind } from '../src/features/records/featureKinds.mjs'
import { moodCode, moodLabel, MOODS } from '../src/utils/mood.mjs'
import { dDayLabel, ddayDateLabel, legacyIsoDate } from '../src/utils/dday.mjs'
import { createLocalMigration } from '../src/features/records/localMigration.mjs'

const settle = () => new Promise((resolve) => setImmediate(resolve))
const ME = '01HZY0000000000000000000ME'
const memoryStorage = () => { const map = new Map(); return { getItem: (k) => map.get(k) ?? null, setItem: (k, v) => map.set(k, String(v)), removeItem: (k) => map.delete(k) } }

function fakeServer() {
  const rows = new Map(), keys = new Map(), sent = []
  let seq = 0
  const request = async (path, options = {}) => {
    const method = options.method ?? 'GET', body = options.body ? JSON.parse(options.body) : undefined
    sent.push({ method, path, body, key: options.headers?.['Idempotency-Key'] })
    const [base, query] = path.split('?'), params = new URLSearchParams(query)
    const prefix = base.split('/').slice(0, -1).join('/'), last = decodeURIComponent(base.split('/').at(-1))
    const listing = method === 'GET' && !rows.has(last)
    if (listing) { const all = [...rows.values()].filter((row) => row.path === base); return { items: all.map(({ path: _, ...row }) => row), page: 0, size: 100, total: all.length } }
    if (method === 'POST') {
      if (body.mood !== undefined && !['good', 'calm', 'tired', 'upset', 'proud'].includes(body.mood)) throw Object.assign(new Error('mood 값을 확인해주세요.'), { status: 400 })
      if ('date' in body && !/^\d{4}-\d{2}-\d{2}$/.test(body.date ?? '')) throw Object.assign(new Error('date 필드가 필요합니다.'), { status: 400 })
      const key = options.headers?.['Idempotency-Key']
      if (key && keys.has(key)) { const { path: _, ...row } = rows.get(keys.get(key)); return row }
      const row = { ...body, id: 'f' + ++seq, version: 1, path: base }
      if (base === '/api/memos' && !row.date) row.date = '2026-11-19'
      rows.set(row.id, row)
      if (key) keys.set(key, row.id)
      const { path: _, ...out } = row
      return out
    }
    const row = rows.get(last)
    const version = Number(params.get('version') ?? body?.version)
    if (version !== row.version) throw Object.assign(new Error('충돌'), { status: 409 })
    if (method === 'DELETE') { rows.delete(last); return null }
    const saved = { ...body, id: last, version: row.version + 1, path: prefix }
    rows.set(last, saved)
    const { path: _, ...out } = saved
    return out
  }
  return { rows, sent, request }
}
const store = (kind, local, server, owner = () => ME) => createFeatureStore({ local, request: server.request, owner, ...kind })

test('Q-07 기분은 코드 5개로 저장하고, 예전 이모지·한국어 값은 코드로 읽는다. 화면 문구는 한국어다', () => {
  assert.deepEqual(MOODS.map((mood) => [mood.code, mood.label]), [['good', '좋음'], ['calm', '평온'], ['tired', '피곤'], ['upset', '속상함'], ['proud', '뿌듯함']])
  assert.deepEqual(['🙂', '😌', '😴', '😤', '🥳'].map(moodCode), ['good', 'calm', 'tired', 'upset', 'proud'])
  assert.deepEqual(['좋음', '평온', '피곤', '속상함', '뿌듯함', 'calm'].map(moodCode), ['good', 'calm', 'tired', 'upset', 'proud', 'calm'])
  assert.equal(moodCode('행복'), null)
  assert.equal(moodLabel('😌'), '평온')
  assert.equal(moodLabel(undefined), '')
})

test('D-Day 날짜: ISO 날짜로 남은 날을 계산하고, 연도 없는 예전 표시 문구는 올해 날짜로 읽는다', () => {
  assert.equal(dDayLabel('2026-11-19', '2026-11-19'), 'D-Day', '오늘은 D-Day다(예전 계산은 시간대 때문에 D-1이었다)')
  assert.equal(dDayLabel('2026-11-26', '2026-11-19'), 'D-7')
  assert.equal(dDayLabel('2026-11-18', '2026-11-19'), 'D+1')
  assert.equal(ddayDateLabel('2026-12-05'), '12월 5일')
  assert.equal(legacyIsoDate('8월 31일 · 저녁 식사', '2026-11-19'), '2026-08-31')
  assert.equal(legacyIsoDate('날짜 미정', '2026-11-19'), null)
})

test('다이어리는 기분 코드를 보내고, 서버의 예전 기분 값도 코드로 읽는다', async () => {
  const server = fakeServer()
  const diaries = store(diaryKind, ref([]), server)
  await settle()
  const saved = await diaries.create({ title: ' 하루 ', body: '본문', date: '2026-11-19', mood: '평온', tags: ['회고'] })
  assert.deepEqual(server.sent.at(-1).body, { title: '하루', body: '본문', date: '2026-11-19', mood: 'calm', tags: ['회고'] })
  assert.equal(saved.mood, 'calm')
  server.rows.get(saved.id).mood = '😴'
  await diaries.reload()
  assert.equal(diaries.list.value[0].mood, 'tired')
  diaries.stop()
})

test('메모는 화면 시각 대신 서버 날짜를 쓰고, D-Day는 ISO 날짜를 보내며 화면에는 날짜 문구와 남은 날을 보인다', async () => {
  const server = fakeServer()
  const memos = store(memoKind, ref([]), server)
  const ddays = store(ddayKind, ref([]), server)
  await settle()
  const memo = await memos.create({ title: '메모', body: '내용', time: '오늘 09:12', color: '', actionable: false })
  assert.equal('time' in server.sent.at(-1).body, false)
  assert.equal(memo.time, '2026-11-19')
  const dday = await ddays.create({ title: '시험', category: '공부', isoDate: '2026-12-05', date: '12월 5일', dday: 'D-16', pinned: false, notifyDays: [1] })
  assert.deepEqual(server.sent.at(-1).body, { title: '시험', category: '공부', date: '2026-12-05', pinned: false, notifyDays: [1] })
  assert.deepEqual([dday.isoDate, dday.date], ['2026-12-05', '12월 5일'])
  assert.match(dday.dday, /^D[-+]\d+$|^D-Day$/)
  const pinned = await ddays.update(dday, { pinned: true })
  assert.deepEqual([server.sent.at(-1).method, server.sent.at(-1).body.date, pinned.pinned], ['PUT', '2026-12-05', true])
  memos.stop(); ddays.stop()
})

test('로컬 기록 이전: 종류별 멱등 키, 시연 기록 제외, 연도 없는 D-Day는 올해 날짜로 옮기고 그 수를 알린다', async () => {
  const server = fakeServer()
  const owner = ref(ME)
  const local = {
    diary: ref([{ id: 1, title: '로그인 전 일기', date: '2026-11-18', mood: '😌', body: '', tags: [] }]),
    memo: ref([{ id: 1, title: '디자인 리뷰 아이디어', body: '색상 토큰을 카테고리별로 분리하면 좋을 듯. 다음 회의 때 제안하기.', time: '오늘 09:12', color: '', actionable: true }, { id: 5, title: '내 메모', body: '본문', time: '2026-11-18', color: '' }]),
    dday: ref([{ id: 6, title: '내 기념일', category: '개인', date: '12월 24일', dday: 'D-35', pinned: false, notifyDays: [] }, { id: 7, title: '새 D-Day', category: '개인', isoDate: '2027-01-02', date: '1월 2일', dday: 'D-44', pinned: true, notifyDays: [1] }]),
    money: ref([{ id: 1, title: '월급', date: '2026-08-25', amount: 3200000, type: 'in', category: '수입' }, { id: 9, title: '커피', date: '2026-11-18', amount: -4500, type: 'out', category: '식비' }]),
  }
  const stores = {
    diary: createFeatureStore({ local: local.diary, request: server.request, owner: () => owner.value, ...diaryKind }),
    memo: createFeatureStore({ local: local.memo, request: server.request, owner: () => owner.value, ...memoKind }),
    dday: createFeatureStore({ local: local.dday, request: server.request, owner: () => owner.value, ...ddayKind }),
    money: createFeatureStore({ local: local.money, request: server.request, owner: () => owner.value, ...moneyKind }),
  }
  const seeds = {
    memo: [{ id: 1, title: '디자인 리뷰 아이디어', body: '색상 토큰을 카테고리별로 분리하면 좋을 듯. 다음 회의 때 제안하기.' }],
    money: [{ id: 1, title: '월급', date: '2026-08-25', amount: 3200000 }],
  }
  const migration = createLocalMigration({ owner: () => owner.value, storage: memoryStorage(), entries: [
    stores.diary.migrationEntry({ label: '다이어리', seeds: [] }),
    stores.memo.migrationEntry({ label: '메모', seeds: seeds.memo }),
    stores.dday.migrationEntry({ label: 'D-Day', seeds: [], today: () => '2026-11-19' }),
    stores.money.migrationEntry({ label: '머니로그', seeds: seeds.money }),
  ] })
  await settle()
  assert.deepEqual(migration.candidates.value.map((group) => [group.label, group.items.length]), [['다이어리', 1], ['메모', 1], ['D-Day', 2], ['머니로그', 1]])
  assert.equal(migration.candidates.value.find((group) => group.kind === 'dday').yearGuessed, 1)
  await migration.run()
  assert.deepEqual([migration.state.moved, migration.state.failed], [5, 0])
  const posts = server.sent.filter((entry) => entry.method === 'POST')
  assert.deepEqual(posts.map((entry) => entry.key), ['local:diary:1', 'local:memo:5', 'local:dday:6', 'local:dday:7', 'local:money:9'])
  assert.equal(posts[0].body.mood, 'calm')
  assert.deepEqual(posts.slice(2, 4).map((entry) => entry.body.date), ['2026-12-24', '2027-01-02'])
  assert.deepEqual([local.diary.value.length, local.memo.value.length, local.dday.value.length, local.money.value.length], [0, 1, 0, 1])
  Object.values(stores).forEach((item) => item.stop()); migration.stop()
})
