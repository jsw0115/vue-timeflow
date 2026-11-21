// 게시글 신고 요청과 관리자 신고 처리의 상태·요청 본문, 화면 연결을 검사한다(PR-10 UF-117 7-7).
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createModerationClient, decisionLabel, isPending } from '../src/features/admin/moderation.mjs'
import { createCommunityClient } from '../src/features/community/communityClient.mjs'

test('처리 전 신고는 대기이고, 결정 값은 화면 이름으로 보인다', () => {
  assert.equal(isPending({}), true)
  assert.equal(isPending({ decision: 'IGNORE' }), false)
  assert.equal(decisionLabel({ decision: 'REMOVE' }), '게시글 삭제')
  assert.equal(decisionLabel({}), '처리 대기')
})

test('회원 신고는 다듬은 사유만, 관리자 처리는 신고자·version·결정을 보낸다', async () => {
  const sent = []
  const request = async (path, options = {}) => { sent.push([options.method ?? 'GET', path, options.body && JSON.parse(options.body)]); return {} }
  await createCommunityClient({ request }).report('c/1', 'p1', ' 광고 ')
  await createModerationClient({ request }).decide({ id: 'r1', ownerId: 'u9', version: 1 }, 'REMOVE')
  assert.deepEqual(sent, [
    ['POST', '/api/communities/c%2F1/posts/p1/report', { reason: '광고' }],
    ['PUT', '/api/admin/moderation/r1', { userId: 'u9', version: 1, action: 'REMOVE' }],
  ])
})

test('게시판에는 다른 사람 글에만 신고가 있고, 관리자 신고 화면은 서버를 쓰며 시연 탭이 없다', () => {
  const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8')
  assert.match(read('../src/views/community/CommunityBoardView.vue'), /v-if="p\.authorId !== session\.userId"[^>]*@click="openReport\(p\)"/)
  const view = read('../src/views/admin/AdminModerationView.vue')
  assert.match(view, /createModerationClient/)
  assert.doesNotMatch(view, />금칙어 관리<|>매니저 관리<|tab === '금칙어'/)
  assert.match(read('../src/AdminApp.vue'), /'\/admin\/moderation'/)
})
