// AI 설정이 브라우저에 API 키를 남기지 않고, AI 준비 여부를 서버 제공 상태로만 판단하는지 검사한다(PR-05, UT-110~UT-117).
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { effectScope, nextTick } from 'vue'
import { useCapabilityStatus } from '../src/features/integrations/useCapabilityStatus.mjs'

const KEY = 'timeflow.ai.v1'
const ALLOWED = ['allowSensitive', 'enabled', 'keepHistory', 'provider', 'redactNames', 'scope']
const store = new Map()
const originalStorage = globalThis.localStorage
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
}
test.after(() => {
  if (originalStorage === undefined) delete globalThis.localStorage
  else globalThis.localStorage = originalStorage
})

// 모듈은 불러올 때 저장소를 읽으므로, 경우마다 새 인스턴스로 불러온다
let seq = 0
async function loadWith(raw) {
  store.clear()
  if (raw !== undefined) store.set(KEY, raw)
  return import('../src/store/aiSettings.js?case=' + ++seq)
}
const reload = () => import('../src/store/aiSettings.js?case=' + ++seq)
const saved = () => JSON.parse(store.get(KEY))
const source = (path) => readFileSync(new URL('../src/' + path, import.meta.url), 'utf8')

test('UT-110 저장된 BYOK 키는 불러오자마자 저장소와 상태에서 지우고, 나머지 설정은 유지한다', async () => {
  const m = await loadWith(JSON.stringify({ provider: 'byok', apiKey: 'sk-test', scope: 'summary', allowSensitive: true }))
  assert.equal(store.get(KEY).includes('sk-test'), false)
  assert.equal('apiKey' in saved(), false)
  assert.equal('apiKey' in m.aiSettings, false)
  assert.equal(m.aiSettings.provider, 'none')
  assert.equal(saved().provider, 'none')
  assert.equal(m.aiSettings.scope, 'summary')
  assert.equal(m.aiSettings.allowSensitive, true)
  assert.equal(m.takeClearedKeyNotice(), true)
  assert.equal(m.takeClearedKeyNotice(), false, '안내는 한 번만 보인다')
})

test('UT-111 키가 없던 설정은 그대로 두고 지운 사실도 알리지 않는다', async () => {
  const before = { provider: 'builtin', scope: 'full', enabled: { 'wbs-draft': true }, allowSensitive: false, redactNames: false, keepHistory: true }
  const m = await loadWith(JSON.stringify(before))
  assert.equal(m.takeClearedKeyNotice(), false)
  assert.deepEqual({ ...m.aiSettings, enabled: { ...m.aiSettings.enabled } }, before)
  // 예전 기본값은 빈 apiKey를 함께 저장했다. 빈 값은 키가 아니므로 안내하지 않고 필드만 지운다
  const old = await loadWith(JSON.stringify({ ...before, apiKey: '' }))
  assert.equal(old.takeClearedKeyNotice(), false)
  assert.equal('apiKey' in saved(), false)
})

test('UT-117 키를 지운 뒤 다시 불러오면 안내가 나오지 않는다', async () => {
  const first = await loadWith(JSON.stringify({ provider: 'byok', apiKey: 'sk-test' }))
  assert.equal(first.takeClearedKeyNotice(), true)
  const second = await reload()
  assert.equal(second.takeClearedKeyNotice(), false)
})

test('UT-112 깨진 값·형식이 다른 값·저장소 오류에서도 기본 설정으로 시작하고 키 문자열을 남기지 않는다', async () => {
  const m = await loadWith('{"provider":"byok","apiKey":"sk-broken')
  assert.equal(m.aiSettings.provider, 'none')
  assert.equal(m.aiSettings.scope, 'titles')
  assert.equal(store.get(KEY).includes('sk-broken'), false)
  for (const raw of ['null', '[1,2]', '"text"', '42']) {
    const d = await loadWith(raw)
    assert.equal(d.aiSettings.provider, 'none', raw)
    assert.deepEqual(Object.keys(saved()).sort(), ALLOWED, raw)
  }
  const odd = await loadWith(JSON.stringify({ provider: 'gpt', scope: 'all', enabled: [1], allowSensitive: 'yes', redactNames: 0, keepHistory: null }))
  assert.equal(odd.aiSettings.provider, 'none')
  assert.equal(odd.aiSettings.scope, 'titles', '목록에 없는 범위는 화면 설명을 찾지 못하므로 기본값으로 바꾼다')
  assert.deepEqual({ ...odd.aiSettings.enabled }, {})
  assert.equal(odd.aiSettings.allowSensitive, false)
  assert.equal(odd.aiSettings.redactNames, true)
  assert.equal(odd.aiSettings.keepHistory, false)
  const saveStorage = globalThis.localStorage
  globalThis.localStorage = { getItem() { throw new Error('blocked') }, setItem() { throw new Error('blocked') } }
  try {
    const blocked = await reload()
    assert.equal(blocked.aiSettings.provider, 'none')
    assert.equal(blocked.takeClearedKeyNotice(), false)
  } finally {
    globalThis.localStorage = saveStorage
  }
})

test('UT-113 설정을 여러 번 바꿔도 허용 필드 6개만 저장하고 키는 다시 들어가지 않는다', async () => {
  const m = await loadWith(undefined)
  m.aiSettings.provider = 'builtin'
  m.aiSettings.scope = 'full'
  m.setAllowSensitive(true)
  m.toggleFeature('career-doc')
  m.aiSettings.apiKey = 'sk-sneaky'
  await nextTick()
  assert.deepEqual(Object.keys(saved()).sort(), ALLOWED)
  assert.equal(store.get(KEY).includes('sk-sneaky'), false)
  assert.equal(saved().provider, 'builtin')
  assert.equal(saved().enabled['career-doc'], true)
  m.aiSettings.provider = 'byok'
  await nextTick()
  assert.equal(saved().provider, 'none', '준비 중인 BYOK는 저장하지 않는다')
})

test('UT-114 BYOK 선택지는 준비 중이고 키를 받는 입력과 저장 안내가 없다', async () => {
  const m = await loadWith(undefined)
  const byok = m.AI_PROVIDERS.find((p) => p.id === 'byok')
  assert.equal(byok.disabled, true)
  assert.match(byok.note, /준비 중/)
  assert.doesNotMatch(byok.note, /이 기기에만 저장/)
  assert.deepEqual(m.AI_PROVIDERS.filter((p) => p.disabled).map((p) => p.id), ['byok'])
  const view = source('views/settings/SettingsAutomationView.vue')
  assert.doesNotMatch(view, /type="password"/)
  assert.doesNotMatch(view, /apiKey/)
  assert.doesNotMatch(view, /서버로 보내지 않아요/)
  assert.match(view, /:disabled="p\.disabled"/)
  assert.match(view, /:aria-disabled=/)
})

test('UT-115 서버 AI 제공 상태가 true가 아니면 AI 준비·기능 켜짐으로 보지 않는다(BUG-002)', async () => {
  const m = await loadWith(JSON.stringify({ provider: 'builtin', enabled: { 'wbs-draft': true } }))
  for (const available of [false, null, undefined, 'true', 1]) {
    assert.equal(m.isAiReady(available), false, String(available))
    assert.equal(m.isFeatureOn('wbs-draft', available), false, String(available))
  }
  assert.equal(m.isAiReady(true), true)
  assert.equal(m.isFeatureOn('wbs-draft', true), true)
  assert.equal(m.isFeatureOn('weekly-report', true), false, '사용자가 켜지 않은 기능')
  m.aiSettings.provider = 'none'
  assert.equal(m.isAiReady(true), false)
  m.aiSettings.provider = 'byok'
  assert.equal(m.isAiReady(true), false, 'BYOK는 호출 경로가 없어 준비된 것으로 보지 않는다')
})

test('UT-115 세 화면은 서버 제공 상태를 받아 판단하고 "연동됨"을 직접 쓰지 않는다', () => {
  for (const path of ['views/settings/SettingsAutomationView.vue', 'views/work/WbsView.vue', 'views/work/CareerDocsView.vue']) {
    const view = source(path)
    assert.match(view, /useCapabilityStatus\(\(\) => 'ai'\)/, path)
    assert.doesNotMatch(view, /isFeatureOn\(\s*[\w.'-]+\s*\)/, path + ': 제공 상태 없이 기능 켜짐을 판단한다')
    assert.doesNotMatch(view, /isAiReady\(\s*\)/, path)
    assert.doesNotMatch(view, /AI 연동됨/, path)
  }
  for (const path of ['views/work/WbsView.vue', 'views/work/CareerDocsView.vue']) {
    assert.match(source(path), /AI 기능은 준비 중이에요/, path)
  }
})

test('UT-116 제공 상태 조회가 실패하면 실패를 알리고, 다시 확인에 성공하면 서버 값에 맞는 배지를 보인다', async () => {
  const m = await loadWith(JSON.stringify({ provider: 'builtin' }))
  assert.deepEqual(m.aiStatusBadge({ available: null, busy: true, error: '' }), { text: '제공 상태 확인 중', ok: false })
  let fail = true
  const scope = effectScope()
  const { state, refresh } = scope.run(() => useCapabilityStatus(() => 'ai', {
    owner: () => '계정',
    request: async () => { if (fail) throw new Error('offline'); return [{ feature: 'ai', available: false }] },
  }))
  await new Promise((resolve) => setImmediate(resolve))
  assert.deepEqual(m.aiStatusBadge(state), { text: '제공 상태를 확인하지 못했어요', ok: false })
  fail = false
  await refresh()
  assert.deepEqual(m.aiStatusBadge(state), { text: 'AI 준비 중', ok: false })
  scope.stop()
  assert.deepEqual(m.aiStatusBadge({ available: true, busy: false, error: '' }), { text: '사용 가능', ok: true })
  m.aiSettings.provider = 'none'
  assert.deepEqual(m.aiStatusBadge({ available: true, busy: false, error: '' }), { text: 'AI 사용 안 함', ok: false })
})

test('UT-117 설정 화면은 지운 키 안내를 한 번 받아 보여 준다', () => {
  const view = source('views/settings/SettingsAutomationView.vue')
  assert.match(view, /takeClearedKeyNotice\(\)/)
  assert.match(view, /보안을 위해 이 브라우저에 저장된 API 키를 지웠어요\./)
})
