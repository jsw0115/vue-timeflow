// 포트폴리오 항목(PR-26): 구성 칸·결과물 링크·근거 연결 상태와, 공개 화면이 공개 필드만 그리고 근거를 내보내지 않는지 검사한다.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { MAX_ACTIVITIES, MAX_LINKS, PORTFOLIO_SECTIONS, evidenceOf, filledSections, linksFromText, portfolioDraft, portfolioValues, safeLinks } from '../src/features/career/portfolioItems.mjs'
import { portfolioKind } from '../src/features/records/featureKinds.mjs'

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8')

test('구성 칸과 한도는 서버 공개 필드·입력 검사와 같다', () => {
  const link = read('../backend/src/main/java/kr/timebar/diary/work/PortfolioLinkController.java')
  const fields = link.match(/PUBLIC_FIELDS = List\.of\(([^)]*)\)/)[1].match(/"([^"]+)"/g).map((v) => v.slice(1, -1))
  assert.deepEqual([...fields].sort(), ['title', 'kind', ...PORTFOLIO_SECTIONS.map((s) => s.key), 'links'].sort())
  assert.ok(!fields.includes('activityIds') && !fields.includes('experienceId'))
  const input = read('../backend/src/main/java/kr/timebar/diary/feature/FeatureInput.java')
  assert.match(input, new RegExp(`PORTFOLIO_ACTIVITY_LIMIT = ${MAX_ACTIVITIES};`))
  assert.match(input, new RegExp(`LINK_COUNT = ${MAX_LINKS};`))
  for (const key of ['title', 'kind', ...PORTFOLIO_SECTIONS.map((s) => s.key), 'links', 'activityIds', 'experienceId']) assert.ok(portfolioKind.fields.includes(key), key)
})

test('결과물 링크는 한 줄에 하나, http·https만 받고 나머지는 알린다', () => {
  assert.deepEqual(linksFromText('https://a.example\n\njavascript:alert(1)\nhttps://a.example, http://b.example/x'), { links: ['https://a.example', 'http://b.example/x'], invalid: ['javascript:alert(1)'] })
  assert.deepEqual(safeLinks({ links: ['https://ok.example', 'javascript:x', 3] }), ['https://ok.example'])
})

test('편집 창 값과 저장 본문, 빈 칸 빼기', () => {
  const draft = portfolioDraft({ title: '결제', kind: '문서', problem: '실패율', links: ['https://a.example'], activityIds: ['a1'] }, '케이스 스터디')
  assert.equal(draft.linksText, 'https://a.example')
  assert.equal(draft.outcome, '')
  draft.title = ' 결제 개선 '
  const body = portfolioValues(draft)
  assert.equal(body.title, '결제 개선')
  assert.deepEqual(body.links, ['https://a.example'])
  assert.deepEqual(body.activityIds, ['a1'])
  assert.equal(portfolioDraft(null, '회고').kind, '회고')
  assert.deepEqual(filledSections({ body: '소개', problem: '  ', outcome: '성과' }).map((s) => s.label), ['프로젝트 소개', '성과'])
})

test('근거 상태: 목록을 다 불러온 뒤에만 지워진 근거로 본다', () => {
  const item = { activityIds: ['a1', 'gone'], experienceId: 'c9' }
  const loaded = evidenceOf(item, { activities: [{ id: 'a1', title: '활동' }], experiences: [], loaded: true })
  assert.deepEqual(loaded.activities, [{ id: 'a1', title: '활동', broken: false }, { id: 'gone', title: '', broken: true }])
  assert.equal(loaded.experience.broken, true)
  assert.equal(evidenceOf(item, { loaded: false }).activities.some((a) => a.broken), false)
})

test('화면: 수정 버튼과 충돌 비교, 공개 주의 문구, 공개 화면 링크는 새 창·nofollow, 근거는 공개 화면에 없음', () => {
  const view = read('src/views/work/CareerDocsView.vue')
  assert.match(view, /@click="openPortfolio\(p\)">\{\{ tr\('수정'\) \}\}<\/button>/)
  assert.match(view, /<ConflictCompare v-if="portfolioConflict"/)
  assert.match(view, /회사 기밀·개인정보·비공개 저장소 내용은 적지 마세요/)
  assert.match(view, /근거 연결\(활동·경력\)은 내보내지 않는다/)
  const pub = read('src/views/share/PublicPortfolioView.vue')
  assert.match(pub, /rel="noopener noreferrer nofollow"/)
  assert.match(pub, /v-for="link in safeLinks\(item\)"/)
  assert.doesNotMatch(pub, /activityIds|experienceId/)
})

test('Q-39 링크 비밀번호: 링크 공개에만 보내고, 공개 화면은 비밀번호를 본문으로 보내 연다', async () => {
  const { createPortfolioLinkClient, unlockPublic, unlockErrorText, PASSWORD_MIN, PASSWORD_MAX } = await import('../src/features/career/portfolioLinks.mjs')
  const calls = []
  const request = async (path, options = {}) => { calls.push([path, options.method ?? 'GET', options.body ? JSON.parse(options.body) : null]); return {} }
  const client = createPortfolioLinkClient(request)
  await client.create({ itemIds: ['p1'], scope: 'link', expiresInDays: 7, password: 'secret-1' })
  await client.create({ itemIds: ['p1'], scope: 'public', password: 'secret-1' })
  await client.create({ itemIds: ['p1'], scope: 'link', expiresInDays: 7 })
  await unlockPublic(request, 'A'.repeat(43), 'secret-1')
  assert.deepEqual(calls.map((c) => c[2]), [
    { itemIds: ['p1'], scope: 'link', expiresInDays: 7, password: 'secret-1' },
    { itemIds: ['p1'], scope: 'public' },
    { itemIds: ['p1'], scope: 'link', expiresInDays: 7 },
    { password: 'secret-1' },
  ])
  assert.equal(calls[3][0], `/api/public/portfolios/${'A'.repeat(43)}/unlock`)
  assert.doesNotMatch(calls[3][0], /secret/)
  const server = read('../backend/src/main/java/kr/timebar/diary/work/PortfolioLinkController.java')
  assert.match(server, new RegExp(`PASSWORD_MIN = ${PASSWORD_MIN}, PASSWORD_MAX = ${PASSWORD_MAX}, MAX_FAILED = 10`))
  assert.match(unlockErrorText({ status: 401 }), /비밀번호가 맞지 않아요/)
  const pub = read('src/views/share/PublicPortfolioView.vue')
  assert.match(pub, /type="password" autocomplete="current-password"/)
  assert.match(read('src/components/PortfolioLinkPanel.vue'), /비밀번호는 링크와 다른 길로 알려 주세요/)
})
