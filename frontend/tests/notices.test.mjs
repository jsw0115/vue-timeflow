// 공지 노출 상태 계산·입력 검사·요청 본문과, 관리자 공지 화면·사용자 공지 표시의 서버 연결을 검사한다(PR-10 UF-117 7-2).
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createNoticeClient, dismissKey, noticeBody, noticeError, noticeState } from '../src/features/notices/notices.mjs'

test('노출 상태는 서버 사용자 공지 조건과 같다(노출 여부·시작·끝 날짜)', () => {
  const today = '2026-11-21'
  assert.equal(noticeState({ published: false }, today).id, 'draft')
  assert.equal(noticeState({ published: true }, today).id, 'live')
  assert.equal(noticeState({ published: true, from: '2026-11-21', to: '2026-11-21' }, today).id, 'live')
  assert.equal(noticeState({ published: true, from: '2026-11-22' }, today).id, 'scheduled')
  assert.equal(noticeState({ published: true, to: '2026-11-20' }, today).id, 'ended')
  assert.equal(noticeState({ published: 'true' }, today).id, 'draft')
})

test('제목·내용이 있어야 하고 끝나는 날이 시작보다 이르면 막는다. 빈 날짜는 보내지 않는다', () => {
  assert.match(noticeError({ title: ' ', body: 'x' }), /제목/)
  assert.match(noticeError({ title: 'x', body: '' }), /내용/)
  assert.match(noticeError({ title: 'x', body: 'y', from: '2026-12-02', to: '2026-12-01' }), /끝나는 날/)
  assert.equal(noticeError({ title: 'x', body: 'y', from: '2026-12-01', to: '' }), '')
  assert.deepEqual(noticeBody({ title: ' 점검 ', body: ' 안내 ', from: '', to: '2026-12-01', published: true, popup: 'yes' }), { title: '점검', body: '안내', published: true, popup: false, to: '2026-12-01' })
  assert.equal(dismissKey({ id: 'n1', version: 3 }), 'n1@3')
})

test('관리자 목록은 끝 쪽까지 이어 부르고, 수정·삭제는 받은 version을 보낸다', async () => {
  const sent = []
  const pages = [{ items: Array.from({ length: 100 }, (_, i) => ({ id: 'a' + i })), total: 101 }, { items: [{ id: 'b' }], total: 101 }]
  const client = createNoticeClient({ request: async (path, options = {}) => { sent.push([options.method ?? 'GET', path, options.body && JSON.parse(options.body)]); return path.includes('page=') ? pages.shift() : {} } })
  assert.equal((await client.all()).length, 101)
  await client.update({ id: 'n/1', version: 2 }, { title: 't', body: 'b', published: false })
  await client.remove({ id: 'n/1', version: 3 })
  await client.active()
  assert.deepEqual(sent.slice(2), [
    ['PUT', '/api/admin/notices/n%2F1', { title: 't', body: 'b', published: false, popup: false, version: 2 }],
    ['DELETE', '/api/admin/notices/n%2F1?version=3', undefined],
    ['GET', '/api/notices', undefined],
  ])
})

test('관리자 공지 화면은 서버를 쓰고, 사용자 앱은 공지를 헤더 아래에 보인다', () => {
  const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8')
  const view = read('../src/views/admin/AdminNoticesView.vue')
  assert.match(view, /createNoticeClient/)
  assert.doesNotMatch(view, /store\/adminOps/)
  assert.match(read('../src/AdminApp.vue'), /SERVER_PATHS = new Set\(\[[^\]]*'\/admin\/notices'/)
  assert.match(read('../src/App.vue'), /<NoticeBanner v-if="!isChat" \/>/)
})
