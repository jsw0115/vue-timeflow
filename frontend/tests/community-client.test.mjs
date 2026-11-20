// 커뮤니티 화면이 쓰는 API 경로·본문, 가입 상태 버튼, 목록 거르기·정렬, 하위 화면 탭을 검증한다(PR-10 3단계, TS-39).
import test from 'node:test'
import assert from 'node:assert/strict'
import { createCommunityClient, membershipAction, filterCommunities, communityTabs, communityErrorText, localTime } from '../src/features/community/communityClient.mjs'

function recorder(pages = {}) {
  const calls = []
  const client = createCommunityClient({ request: async (path, options = {}) => { calls.push([options.method ?? 'GET', path, options.body ? JSON.parse(options.body) : undefined]); return pages[path] ?? null } })
  return { client, calls }
}

test('목록과 게시글은 100건씩 끝까지 모은다', async () => {
  const { client, calls } = recorder({
    '/api/communities?page=0&size=100': { items: [{ id: 'c1' }], total: 2 },
    '/api/communities?page=1&size=100': { items: [{ id: 'c2' }], total: 2 },
  })
  assert.deepEqual((await client.list()).map((row) => row.id), ['c1', 'c2'])
  assert.deepEqual(calls.map((call) => call[1]), ['/api/communities?page=0&size=100', '/api/communities?page=1&size=100'])
})

test('가입·신청 취소·승인·글·좋아요는 서버 API 경로와 본문을 그대로 쓴다', async () => {
  const { client, calls } = recorder()
  await client.join('c 1', '같이 달려요')
  await client.join('c1')
  await client.removeMember('c1', 'u1')
  await client.decide('c1', 'u2', false, '정원이 찼어요')
  await client.createPost('c1', '5km 완주')
  await client.deletePost('c1', { id: 'p1', version: 2 })
  await client.comment('c1', 'p1', '멋져요')
  await client.like('c1', 'p1', true)
  await client.invite('c1', 'u9')
  assert.deepEqual(calls, [
    ['POST', '/api/communities/c%201/join', { message: '같이 달려요' }],
    ['POST', '/api/communities/c1/join', {}],
    ['DELETE', '/api/communities/c1/members/u1', undefined],
    ['PUT', '/api/communities/c1/join-requests/u2', { approved: false, reason: '정원이 찼어요' }],
    ['POST', '/api/communities/c1/posts', { body: '5km 완주' }],
    ['DELETE', '/api/communities/c1/posts/p1?version=2', undefined],
    ['POST', '/api/communities/c1/posts/p1/comments', { body: '멋져요' }],
    ['PUT', '/api/communities/c1/posts/p1/like', { liked: true }],
    ['POST', '/api/communities/c1/members', { userId: 'u9' }],
  ])
})

test('가입 상태마다 버튼이 다르다', () => {
  const pick = (c) => [membershipAction(c).label, membershipAction(c).action]
  assert.deepEqual(pick({ membership: 'ACTIVE', role: 'owner' }), ['방장', 'none'])
  assert.deepEqual(pick({ membership: 'ACTIVE', role: 'viewer' }), ['나가기', 'leave'])
  assert.deepEqual(pick({ membership: 'PENDING' }), ['신청 취소', 'cancel'])
  assert.deepEqual(pick({ membership: 'INVITED' }), ['초대 수락', 'join'])
  assert.deepEqual(pick({ membership: 'NONE', joinPolicy: 'approval' }), ['가입 신청', 'apply'])
  assert.deepEqual(pick({ membership: 'REJECTED', joinPolicy: 'approval' }), ['다시 가입 신청', 'apply'])
  assert.deepEqual(pick({ membership: 'NONE', joinPolicy: 'open' }), ['가입하기', 'join'])
})

test('분류·검색어로 거르고 멤버순·최신순으로 정렬한다', () => {
  const list = [
    { id: 'a', title: '아침 러닝', desc: '5km', category: '운동', members: 3, createdAt: '2026-11-01T00:00:00Z' },
    { id: 'b', title: '독서 모임', desc: '주 3회', category: '공부', members: 9, createdAt: '2026-11-03T00:00:00Z' },
    { id: 'c', title: '저녁 러닝', desc: '10km', category: '운동', members: 5, createdAt: '2026-11-02T00:00:00Z' },
  ]
  assert.deepEqual(filterCommunities(list).map((c) => c.id), ['b', 'c', 'a'])
  assert.deepEqual(filterCommunities(list, { sort: 'new' }).map((c) => c.id), ['b', 'c', 'a'])
  assert.deepEqual(filterCommunities(list, { category: '운동' }).map((c) => c.id), ['c', 'a'])
  assert.deepEqual(filterCommunities(list, { query: '10km' }).map((c) => c.id), ['c'])
  assert.equal(list[0].id, 'a', '원래 배열은 그대로 둔다')
})

test('하위 화면 탭은 커뮤니티 ID를 넘기고, 가입 요청함은 방장에게만 보인다', () => {
  assert.deepEqual(communityTabs('c/1').map((t) => t.path), ['/community/home?id=c%2F1', '/community/board?id=c%2F1', '/community/challenge?id=c%2F1', '/community/members?id=c%2F1'])
  assert.equal(communityTabs('c1', true).at(-1).label, '가입 요청함')
  assert.match(communityErrorText({ status: 404 }), /찾을 수 없어요/)
  assert.match(communityErrorText({ status: 403 }), /회원만/)
})

test('서버 UTC 시각을 기기 시간대로 보인다', () => {
  const iso = '2026-11-19T23:11:05Z'
  const d = new Date(iso)
  const two = (n) => String(n).padStart(2, '0')
  assert.equal(localTime(iso), `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())} ${two(d.getHours())}:${two(d.getMinutes())}`)
  assert.equal(localTime(''), '')
  assert.equal(localTime('아님'), '')
})
