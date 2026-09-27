import test, { before, after } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'
import { nextTick } from 'vue'
import { filterEntries, matchesKind, normalizeTag } from '../src/features/inbox/model/entries.mjs'
let server
const cache = new Map()
before(async () => {
  globalThis.localStorage = { getItem: key => cache.get(key) ?? null, setItem: (key, value) => cache.set(key, value) }
  server = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), configFile: false, plugins: [vue()], optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true }, appType: 'custom' })
})
after(async () => { await server.close(); delete globalThis.localStorage })
const load = path => server.ssrLoadModule('/src/' + path)

test('플래너는 원본 일정·할 일·루틴을 중복 생성하지 않고 필터링한다', () => {
  assert.ok(matchesKind('일정', '플래너'))
  assert.ok(matchesKind('할 일', '플래너'))
  assert.ok(!matchesKind('채팅', '플래너'))
  assert.equal(normalizeTag('#ＰＬＡＮ'), 'plan')
  const rows = [{ key: 'event:1', kind: '일정', title: '회의', body: '준비', author: '지수', read: false, at: '2026-09-27' }, { key: 'chat:1', kind: '채팅', title: '회의', at: '2026-09-26', read: true }]
  assert.equal(filterEntries(rows, { kind: '플래너', query: '준비', unread: true }).length, 1)
})
test('모든 글 저장소가 제목·본문 태그와 수신 멘션을 등록하고 원본 수정·삭제를 반영한다', async () => {
  await load('store/postIndex.js')
  const { posts, mentions, markMentionRead } = await load('store/tagging.js')
  const { events, tasks, routines } = await load('store/appState.js')
  const { diaries, memos } = await load('store/writing.js')
  const { communities, challenges } = await load('store/communities.js')
  const { ddays } = await load('store/ddays.js')
  const { communityPosts } = await load('store/communityPosts.js')
  const { plannerReviews } = await load('store/plannerReviews.js')
  const sources = { event: events, task: tasks, routine: routines, diary: diaries, memo: memos, community: communities, challenge: challenges, dday: ddays, board: communityPosts, planner: plannerReviews }
  for (const [source, list] of Object.entries(sources)) {
    list.value.push({ id: 'inbox-test', title: `${source} #통합`, body: '@김지수 확인해주세요 #Plan', author: '이서연' })
  }
  await nextTick()
  assert.equal(posts.value.filter(p => p.sourceKey?.endsWith(':inbox-test')).length, 10)
  assert.equal(mentions.value.filter(p => p.id.endsWith(':inbox-test')).length, 10)
  markMentionRead(mentions.value.find(p => p.id === 'dday:inbox-test'))
  assert.ok(mentions.value.find(p => p.id === 'dday:inbox-test').read)
  assert.ok(JSON.parse(cache.get('timeflow.demo.v1.mention-states')).find(item => item.id === 'dday:inbox-test').read)
  const dday = ddays.value.find(item => item.id === 'inbox-test')
  dday.body = '언급 제거 #수정'; dday.title = '날짜 변경'
  await nextTick()
  assert.ok(!mentions.value.some(p => p.id === 'dday:inbox-test'))
  assert.equal(posts.value.filter(p => p.sourceKey === 'dday:inbox-test').length, 1)
  assert.match(posts.value.find(p => p.sourceKey === 'dday:inbox-test').body, /#수정/)
  ddays.value = ddays.value.filter(item => item.id !== 'inbox-test')
  await nextTick()
  assert.ok(!posts.value.some(p => p.sourceKey === 'dday:inbox-test'))
})
test('내가 쓴 글의 자기 멘션은 받은 멘션으로 만들지 않는다', async () => {
  const { addPost, mentions, ME } = await load('store/tagging.js')
  const post = addPost({ kind: '메모', title: '자기 기록', body: '@김지수 #회고', author: ME })
  assert.ok(!mentions.value.some(item => item.postId === post.id))
})
