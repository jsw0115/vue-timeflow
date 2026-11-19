// 공유 화면이 쓰는 API 경로·본문, 친구 목록 나누기, 이번 주 범위, 오류 문구를 검증한다(PR-10 2단계, TS-38).
import test from 'node:test'
import assert from 'node:assert/strict'
import { createShareClient, splitFriends, weekRange, shareErrorText, levelLabel, SHARE_LEVELS } from '../src/features/share/shareClient.mjs'

function recorder() {
  const calls = []
  const client = createShareClient({ request: async (path, options = {}) => { calls.push([options.method ?? 'GET', path, options.body ? JSON.parse(options.body) : undefined]); return null } })
  return { client, calls }
}

test('공유 범위와 미리보기, 초대 확인은 1단계 서버 API를 그대로 부른다', async () => {
  const { client, calls } = recorder()
  await client.setLevel('g 1', 'busy')
  await client.schedules('g1', { from: '2026-11-16', to: '2026-11-22' })
  await client.preview('g1', 'u/2', { from: '2026-11-16', to: '2026-11-22' })
  await client.invited('g1')
  await client.findPerson('  a+b@example.test ')
  assert.deepEqual(calls, [
    ['PUT', '/api/share/groups/g%201/share-level', { level: 'busy' }],
    ['GET', '/api/share/groups/g1/schedules?from=2026-11-16&to=2026-11-22', undefined],
    ['GET', '/api/share/groups/g1/preview?viewerId=u%2F2&from=2026-11-16&to=2026-11-22', undefined],
    ['GET', '/api/share/groups/g1/members?status=invited', undefined],
    ['GET', '/api/share/people?email=a%2Bb%40example.test', undefined],
  ])
})

test('그룹 삭제는 version을, 초대·차단은 계정 ID를 보낸다', async () => {
  const { client, calls } = recorder()
  await client.deleteGroup({ id: 'g1', version: 3 })
  await client.inviteMember('g1', 'u2')
  await client.removeMember('g1', 'u2')
  await client.block('u3')
  await client.inviteFriend('u4')
  assert.deepEqual(calls, [
    ['DELETE', '/api/share/groups/g1?version=3', undefined],
    ['POST', '/api/share/groups/g1/members', { userId: 'u2' }],
    ['DELETE', '/api/share/groups/g1/members/u2', undefined],
    ['PUT', '/api/share/blocks/u3', undefined],
    ['POST', '/api/share/friends/invite', { userId: 'u4' }],
  ])
})

test('친구 행은 수락한 친구, 내가 받은 요청, 내가 보낸 요청으로 나뉜다', () => {
  const rows = [
    { id: 'f1', senderId: 'me', recipientId: 'a', status: 'ACCEPTED', friendName: 'A' },
    { id: 'f2', senderId: 'b', recipientId: 'me', status: 'PENDING', friendName: 'B' },
    { id: 'f3', senderId: 'me', recipientId: 'c', status: 'PENDING', friendName: 'C' },
  ]
  const split = splitFriends(rows, 'me')
  assert.deepEqual([split.friends, split.received, split.sent].map((list) => list.map((row) => row.id)), [['f1'], ['f2'], ['f3']])
})

test('이번 주는 월요일부터 일요일까지다', () => {
  assert.deepEqual(weekRange(new Date(2026, 10, 19)), { from: '2026-11-16', to: '2026-11-22' })
  assert.deepEqual(weekRange(new Date(2026, 10, 22)), { from: '2026-11-16', to: '2026-11-22' }, '일요일은 그 주의 끝이다')
  assert.deepEqual(weekRange(new Date(2026, 10, 30)), { from: '2026-11-30', to: '2026-12-06' })
})

test('공유 범위 이름과 오류 문구', () => {
  assert.deepEqual(SHARE_LEVELS.map((level) => level.id), ['none', 'busy', 'title', 'detail'])
  assert.equal(levelLabel('busy'), '바쁜 시간만')
  assert.equal(levelLabel(undefined), '공유 안 함')
  assert.match(shareErrorText(new TypeError('Failed to fetch')), /연결/)
  assert.match(shareErrorText({ status: 403 }), /권한/)
  assert.equal(shareErrorText({ status: 404, message: '그 이메일로 찾은 사람이 없어요.' }), '그 이메일로 찾은 사람이 없어요.')
})
