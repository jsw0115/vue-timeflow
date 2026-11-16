// 기능 상태 조회의 오류·재시도·계정 전환·화면 종료 후 응답을 검증한다.
import test from 'node:test'
import assert from 'node:assert/strict'
import { effectScope, ref } from 'vue'
import { useCapabilityStatus } from '../src/features/integrations/useCapabilityStatus.mjs'

const settle = () => new Promise(resolve => setImmediate(resolve))
function setup(request) {
  const owner = ref('첫 계정'), feature = ref('billing'), scope = effectScope()
  const client = scope.run(() => useCapabilityStatus(() => feature.value, { owner: () => owner.value, request }))
  return { ...client, owner, feature, scope }
}

test('미연결과 제공 가능 상태는 서버의 불리언 값으로만 결정한다', async () => {
  for (const available of [false, true]) {
    const client = setup(async () => [{ feature: 'billing', available }])
    assert.equal(client.state.busy, true)
    await settle()
    assert.equal(client.state.available, available)
    assert.equal(client.state.error, '')
    client.scope.stop()
  }
})

test('응답 누락·중복·잘못된 값·네트워크 오류는 미확인으로 남고 재시도할 수 있다', async () => {
  for (const data of [null, [], [{ feature: 'billing', available: 'true' }], [{ feature: 'ai', available: true }], [{ feature: 'billing', available: false }, { feature: 'billing', available: true }], new Error('offline')]) {
    let retry = false
    const client = setup(async () => { if (retry) return [{ feature: 'billing', available: false }]; if (data instanceof Error) throw data; return data })
    await settle()
    assert.equal(client.state.available, null)
    assert.match(client.state.error, /확인하지 못했습니다/)
    retry = true; await client.refresh()
    assert.equal(client.state.available, false)
    assert.equal(client.state.error, '')
    client.scope.stop()
  }
})

test('계정 전환과 로그아웃 이후 이전 계정의 지연 응답을 버린다', async () => {
  const pending = []
  const client = setup(() => new Promise(resolve => pending.push(resolve)))
  client.owner.value = '다른 계정'
  pending[0]([{ feature: 'billing', available: true }])
  await settle()
  assert.equal(client.state.available, null)
  assert.equal(client.state.busy, true)
  pending[1]([{ feature: 'billing', available: false }])
  await settle()
  assert.equal(client.state.available, false)
  const refresh = client.refresh()
  client.owner.value = ''
  pending[2]([{ feature: 'billing', available: true }]); await refresh
  assert.equal(client.state.available, null)
  assert.match(client.state.error, /로그인/)
  assert.equal(pending.length, 3)
  client.scope.stop()
})

test('화면 종료와 기능 전환 뒤 도착한 응답은 현재 화면을 변경하지 않는다', async () => {
  const pending = []
  const client = setup(() => new Promise(resolve => pending.push(resolve)))
  client.feature.value = 'ai'
  pending[0]([{ feature: 'billing', available: true }]); await settle()
  assert.equal(client.state.available, null)
  client.scope.stop()
  pending[1]([{ feature: 'ai', available: true }]); await settle()
  assert.equal(client.state.available, null)
})
