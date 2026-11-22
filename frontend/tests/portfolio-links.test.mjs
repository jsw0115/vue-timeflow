// 포트폴리오 공개 링크의 요청 본문·문구와, 공개 화면이 글자로만 그리고 링크 공개는 검색 수집을 막는지 검사한다(Q-22).
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { LINK_DAYS, createPortfolioLinkClient, expiryText, linkErrorText, publicPagePath, scopeLabel } from '../src/features/career/portfolioLinks.mjs'

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8')

test('요청 본문: 링크 공개는 기간을 보내고 전체 공개는 보내지 않는다', async () => {
  const calls = []
  const client = createPortfolioLinkClient(async (path, options = {}) => { calls.push([options.method ?? 'GET', path, options.body]); return {} })
  await client.create({ itemIds: ['p1'], scope: 'link', expiresInDays: 30 })
  await client.create({ itemIds: ['p1', 'p2'], scope: 'public', expiresInDays: 30 })
  await client.list()
  await client.revoke('abc/def')
  assert.deepEqual(calls, [
    ['POST', '/api/work/portfolio-links', '{"itemIds":["p1"],"scope":"link","expiresInDays":30}'],
    ['POST', '/api/work/portfolio-links', '{"itemIds":["p1","p2"],"scope":"public"}'],
    ['GET', '/api/work/portfolio-links', undefined],
    ['DELETE', '/api/work/portfolio-links/abc%2Fdef', undefined],
  ])
  assert.deepEqual(LINK_DAYS, [1, 7, 30])
  assert.match(read('../../backend/src/main/java/kr/timebar/diary/work/PortfolioLinkController.java'), /LINK_DAYS = Set\.of\(1, 7, 30\)/)
})

test('문구: 범위 이름·만료·오류', () => {
  assert.equal(scopeLabel('public'), '전체 공개')
  assert.equal(scopeLabel(undefined), '링크 공개')
  const now = Date.parse('2026-11-22T00:00:00Z')
  assert.equal(expiryText({ expiresAt: '2026-11-29T00:00:00Z' }, now), '7일 뒤 닫혀요')
  assert.equal(expiryText({}, now), '닫을 때까지 열려 있어요')
  assert.equal(expiryText({ expiresAt: '2026-11-21T00:00:00Z' }, now), '기간이 지났어요')
  assert.match(linkErrorText({ status: 409 }), /너무 많아요|닫아 주세요/)
  assert.equal(publicPagePath('T'.repeat(43)), '/p/' + 'T'.repeat(43))
})

test('공개 화면은 로그인 없이 열리는 bare 경로이고, 내용을 글자로만 그리며 링크 공개는 noindex다', () => {
  const router = read('../src/router/index.js')
  const bare = router.slice(router.indexOf('const bareRoutes'), router.indexOf('export const navItems'))
  assert.match(bare, /path: '\/p\/:token'/)
  const view = read('../src/views/share/PublicPortfolioView.vue')
  assert.doesNotMatch(view, /v-html/)
  assert.match(view, /noindex, nofollow/)
  assert.match(view, /setNoIndex\(data\?\.scope !== 'public'\)/)
  assert.match(view, /setNoIndex\(true\)/)
})

test('로그인 상태 포트폴리오 탭은 "준비 중" 대신 공개 링크 관리를 보인다', () => {
  const docs = read('../src/views/work/CareerDocsView.vue')
  assert.match(docs, /<PortfolioLinkPanel v-if="onServer" :items="portfolio" \/>/)
  assert.doesNotMatch(docs, /링크로 공개하는 기능은 아직 준비 중/)
  const panel = read('../src/components/PortfolioLinkPanel.vue')
  assert.match(panel, /rel="noopener noreferrer"/)
  assert.match(panel, /이 주소는 지금만 보여요/)
})
