// 관리자 콘텐츠의 입력 검사·요청 본문과, 사용자 화면에 아직 보이지 않는다는 안내를 검사한다(PR-10 UF-117 7-3).
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { CONTENT_KINDS, contentBody, contentError, createContentClient } from '../src/features/admin/contentClient.mjs'

test('이름·내용·종류가 있어야 하고, 빈 위치 메모는 보내지 않는다', () => {
  assert.match(contentError({ title: '', body: 'x', kind: '명언' }), /이름/)
  assert.match(contentError({ title: 'x', body: ' ', kind: '명언' }), /내용/)
  assert.match(contentError({ title: 'x', body: 'y', kind: '기타' }), /종류/)
  assert.equal(contentError({ title: 'x', body: 'y', kind: CONTENT_KINDS[2] }), '')
  assert.deepEqual(contentBody({ title: ' 문장 ', body: ' 진전 ', kind: '명언', where: ' ', live: 'true' }), { title: '문장', body: '진전', kind: '명언', live: false })
})

test('수정·삭제는 받은 version을 보낸다', async () => {
  const sent = []
  const client = createContentClient({ request: async (path, options = {}) => { sent.push([options.method ?? 'GET', path, options.body && JSON.parse(options.body)]); return { items: [], total: 0 } } })
  await client.all()
  await client.update({ id: 'c1', version: 4 }, { title: 't', body: 'b', kind: '명언', live: true, where: '홈' })
  await client.remove({ id: 'c1', version: 5 })
  assert.deepEqual(sent, [
    ['GET', '/api/admin/content?page=0&size=100', undefined],
    ['PUT', '/api/admin/content/c1', { title: 't', body: 'b', kind: '명언', live: true, where: '홈', version: 4 }],
    ['DELETE', '/api/admin/content/c1?version=5', undefined],
  ])
})

test('콘텐츠 화면은 서버를 쓰고, 공개로 바꿔도 사용자에게 아직 보이지 않는다고 알린다', () => {
  const view = readFileSync(new URL('../src/views/admin/AdminContentView.vue', import.meta.url), 'utf8')
  assert.match(view, /createContentClient/)
  assert.doesNotMatch(view, /store\/adminOps/)
  assert.match(view, /사용자에게 보이지 않아요/)
})

test('/api/content는 공용 콘텐츠 모듈 하나만 읽고, 그 모듈은 홈·템플릿 관리만 쓴다(바뀌면 콘텐츠 화면 안내도 고친다, Q-29)', () => {
  const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((entry) => (entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]))
  const src = fileURLToPath(new URL('../src/', import.meta.url))
  const files = walk(src).filter((file) => /\.(vue|js|mjs)$/.test(file))
  const rel = (file) => path.relative(src, file).split(path.sep).join('/')
  const readers = files.filter((file) => /['"`]\/api\/content['"`?]/.test(readFileSync(file, 'utf8'))).map(rel)
  assert.deepEqual(readers, ['features/content/publicContent.mjs'])
  const users = files.filter((file) => /features\/content\/publicContent\.mjs/.test(readFileSync(file, 'utf8'))).map(rel).sort()
  assert.deepEqual(users, ['views/home/HomeView.vue', 'views/planner/PlannerTemplatesView.vue'])
})
