// 관리자 셸이 서버 응답으로만 권한을 판단하는지 검사한다(PR-10 5단계, UT-199).
import test from 'node:test'
import assert from 'node:assert/strict'
import { ADMIN_ACCESS_TEXT, checkAdminAccess, toUserRow, adminErrorText, createAdminClient } from '../src/features/admin/adminClient.mjs'

const failing = (status) => async () => { throw Object.assign(new Error('x'), { status }) }

test('UT-199 일반 계정은 서버가 403을 주므로 권한 없음 상태가 된다', async () => {
  assert.deepEqual(await checkAdminAccess(failing(403), true), { state: 'forbidden' })
  assert.match(ADMIN_ACCESS_TEXT.forbidden, /관리자 권한이 없어요/)
})

test('로그아웃 상태는 요청을 보내지 않고 로그인 안내를 보인다. 만료된 토큰(401)도 같다', async () => {
  let calls = 0
  assert.deepEqual(await checkAdminAccess(async () => { calls += 1 }, false), { state: 'signedOut' })
  assert.equal(calls, 0)
  assert.deepEqual(await checkAdminAccess(failing(401), true), { state: 'signedOut' })
})

test('관리자는 지표를 함께 받고, 연결 실패는 오류 상태다', async () => {
  const metrics = { users: 3, activeUsers: 2, tickets: 0, communities: 1 }
  assert.deepEqual(await checkAdminAccess(async (path) => { assert.equal(path, '/api/admin/stats'); return metrics }, true), { state: 'allowed', metrics })
  assert.deepEqual(await checkAdminAccess(failing(0), true), { state: 'error' })
  // 운영 프록시가 바깥 요청을 404로 막으면 내부 경로 안내를 보인다
  assert.deepEqual(await checkAdminAccess(failing(404), true), { state: 'blocked' })
  assert.match(ADMIN_ACCESS_TEXT.blocked, /내부 접근 경로/)
  assert.match(adminErrorText({ status: 0 }), /연결/)
})

test('사용자 행의 상태·역할을 화면 이름으로 바꾼다', () => {
  const row = toUserRow({ id: 'u1', name: '김', email: 'a@b.c', role: 'ADMIN', status: 'SUSPENDED', createdAt: '2026-11-20T01:02:03' })
  assert.equal(row.state, '정지')
  assert.equal(row.roleLabel, '관리자')
  assert.equal(row.joined, '2026-11-20')
})

test('사용자 목록은 100명이 넘어도 끝 쪽까지 이어 부른다', async () => {
  const everyone = Array.from({ length: 106 }, (_, i) => ({ id: 'u' + i }))
  const paths = []
  const client = createAdminClient({ request: async (path) => {
    paths.push(path)
    const page = Number(new URL(path, 'http://x').searchParams.get('page'))
    return { items: everyone.slice(page * 100, page * 100 + 100), total: everyone.length }
  } })
  const result = await client.allUsers()
  assert.equal(result.items.length, 106)
  assert.deepEqual(paths, ['/api/admin/users?page=0&size=100', '/api/admin/users?page=1&size=100'])
})
