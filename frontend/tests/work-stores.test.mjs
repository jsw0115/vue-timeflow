// 업무 기록·WBS·위키의 서버 연결(PR-10 4단계)을 검사한다. 종류별 요청 본문, 부모 ID 정리, 부모를 먼저 옮기는 로컬 자료 이전.
import test from 'node:test'
import assert from 'node:assert/strict'
import { ref } from 'vue'
import { createFeatureStore } from '../src/features/records/featureStore.mjs'
import { workRecordKind, wbsKind, wikiKind, WORK_TYPES } from '../src/features/records/featureKinds.mjs'

const settle = () => new Promise((resolve) => setImmediate(resolve))
const ME = '01HZY0000000000000000000ME'
const base = { title: ' 기록 ', body: '', owner: '나', status: '예정', projectId: '', startDate: '2026-11-20', endDate: '2026-11-20', startTime: '09:00', endTime: '18:00', half: '오전', leaveDays: 1, location: '부산', partner: '고객사', transport: 'KTX', expense: 120000, fromCompany: '이전 회사', toCompany: '새 회사', role: '개발', handover: '인수인계' }

test('업무 기록 종류는 서버가 받는 다섯 가지다', () => {
  assert.deepEqual(WORK_TYPES, ['연차', '반차', '외근', '출장', '이직'])
})

test('업무 기록은 종류에 필요한 필드만 보낸다', () => {
  const body = (type, extra = {}) => workRecordKind.toBody({ ...base, type, ...extra }, () => ({}))
  const common = { title: ' 기록 ', owner: '나', status: '예정', startDate: '2026-11-20', endDate: '2026-11-20', startTime: '09:00', endTime: '18:00' }
  assert.deepEqual(body('연차'), { ...common, type: '연차', leaveDays: 1 })
  assert.deepEqual(body('반차'), { ...common, type: '반차', half: '오전' })
  assert.deepEqual(body('외근'), { ...common, type: '외근', location: '부산', partner: '고객사' })
  assert.deepEqual(body('출장'), { ...common, type: '출장', location: '부산', partner: '고객사', transport: 'KTX', expense: 120000 })
  assert.deepEqual(body('이직'), { ...common, type: '이직', fromCompany: '이전 회사', toCompany: '새 회사', role: '개발', handover: '인수인계' })
  assert.deepEqual(body('연차', { body: '여름 휴가', projectId: 7 }), { ...common, type: '연차', leaveDays: 1, body: '여름 휴가', projectId: '7' })
})

test('WBS·위키는 부모 ID를 문자열이나 null로 보내고 빈 날짜는 빼며, 서버 시각을 날짜로 보인다', () => {
  const pick = (fields) => (item) => Object.fromEntries(fields.filter((key) => item[key] !== undefined).map((key) => [key, item[key]]))
  assert.deepEqual(wbsKind.toBody({ title: '설계', md: 2, progress: 50, parentId: 3, owner: '', startDate: '', endDate: '', open: true }, pick(wbsKind.fields)), { title: '설계', md: 2, progress: 50, parentId: '3', open: true })
  assert.deepEqual(wbsKind.toBody({ title: '루트', md: 0, progress: 0, parentId: null }, pick(wbsKind.fields)), { title: '루트', md: 0, progress: 0, parentId: null })
  assert.deepEqual(wikiKind.toBody({ title: '배포', space: '개발', body: '내용', parentId: '', pinned: false, history: [] }, pick(wikiKind.fields)), { title: '배포', space: '개발', body: '내용', parentId: null, pinned: false })
  const row = wikiKind.toLocal({ id: 'w1', title: '배포', space: '개발', updatedAt: '2026-11-20T03:00:00Z', version: 2 })
  assert.equal(row.updatedAt, '2026-11-20')
})

function server() {
  const sent = []
  let next = 0
  const request = async (path, options = {}) => {
    const method = options.method ?? 'GET'
    if (method === 'GET') return { items: [], total: 0 }
    const body = JSON.parse(options.body)
    sent.push({ path, method, body, key: options.headers?.['Idempotency-Key'] })
    return { ...body, id: 'S' + ++next, version: 1 }
  }
  return { sent, request }
}

test('WBS 로컬 자료 이전은 부모를 먼저 옮기고 부모 ID를 새 서버 ID로 바꾼다. 시연 부모 아래 기록은 최상위로 옮긴다', async () => {
  const { sent, request } = server()
  const seeds = [{ id: 9, parentId: null, title: '시연 프로젝트', md: 0, progress: 0 }]
  const local = ref([
    { id: 3, parentId: 2, title: '손자', md: 1, progress: 0 },
    { id: 1, parentId: null, title: '루트', md: 0, progress: 0 },
    { id: 2, parentId: 1, title: '자식', md: 0, progress: 0 },
    { ...seeds[0] },
    { id: 10, parentId: 9, title: '시연 아래 내 작업', md: 2, progress: 50 },
  ])
  const store = createFeatureStore({ local, request, owner: () => ME, ...wbsKind })
  await settle()
  const entry = store.migrationEntry({ label: 'WBS', seeds })
  await entry.adopt(local.value[0])
  assert.deepEqual(sent.map((call) => [call.body.title, call.body.parentId, call.key]), [
    ['루트', null, 'local:wbs:1'],
    ['자식', 'S1', 'local:wbs:2'],
    ['손자', 'S2', 'local:wbs:3'],
  ])
  // 이전 목록에 남아 있던 부모 차례가 와도 다시 보내지 않는다
  await entry.adopt({ id: 1, parentId: null, title: '루트', md: 0, progress: 0 })
  assert.equal(sent.length, 3)
  await entry.adopt(local.value.find((item) => item.id === 10))
  assert.deepEqual(sent.at(-1).body.parentId, null)
  assert.deepEqual(local.value.map((item) => item.id), [9])
  store.stop()
})

test('계정이 바뀌면 이전 계정에서 옮긴 부모 ID를 쓰지 않는다', async () => {
  const { sent, request } = server()
  const owner = ref(ME)
  const local = ref([{ id: 1, parentId: null, title: '루트', space: '개발' }, { id: 2, parentId: 1, title: '자식', space: '개발' }])
  const store = createFeatureStore({ local, request, owner: () => owner.value, ...wikiKind })
  await settle()
  const entry = store.migrationEntry({ label: '업무 위키', seeds: [] })
  await entry.adopt(local.value[0])
  owner.value = '01HZY000000000000000OTHER'
  await settle()
  local.value.push({ id: 1, parentId: null, title: '루트', space: '개발' })
  await entry.adopt(local.value.find((item) => item.id === 2))
  assert.deepEqual(sent.map((call) => [call.body.title, call.body.parentId]), [['루트', null], ['루트', null], ['자식', 'S2']])
  store.stop()
})
