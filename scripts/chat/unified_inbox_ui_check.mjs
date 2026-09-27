import { chromium } from '../../backend/build/chat-ui/node_modules/playwright/index.mjs'
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' })
await context.addInitScript(() => {
  if (localStorage.getItem('inbox-test-seeded')) return
  for (const [name, kind] of Object.entries({ tasks: '할 일', events: '일정', routines: '루틴', diaries: '다이어리', memos: '메모', ddays: 'D-day', communities: '커뮤니티', challenges: '챌린지', 'community-posts': '게시글', 'planner-reviews': '플래너' })) {
    localStorage.setItem('timeflow.demo.v1.' + name, JSON.stringify([{ id: name === 'planner-reviews' ? '2026-09-27' : 701, title: `${kind} 통합 검증`, body: '@김지수 확인 부탁해요 #통합', author: '이서연', at: '2026-09-27T03:00:00Z', category: '개인', date: '2026-09-27', dday: 'D-Day', name: '이서연', joined: true, doneDays: 0, days: 21, members: 3, startsIn: 0, likes: 0, comments: 0 }]))
  }
  localStorage.setItem('timeflow.demo.v1.post-index', '[]')
  localStorage.setItem('timeflow.demo.v1.mention-states', '[]')
  localStorage.setItem('inbox-test-seeded', '1')
})
const page = await context.newPage(), errors = [], passed = []
page.on('pageerror', error => errors.push(error.message))
const root = 'http://127.0.0.1:15173', out = 'docs/inbox/verification'
try {
  await mkdir(out, { recursive: true })
  await page.goto(root + '/tags?tag=통합')
  await page.waitForFunction(() => document.querySelectorAll('.chat-inbox-item').length === 10)
  for (const kind of ['D-day', '일정', '할 일', '챌린지', '게시글', '다이어리', '커뮤니티', '메모', '루틴', '플래너']) assert.equal(await page.locator(`[data-kind="${kind}"]`).count(), 1)
  await page.screenshot({ path: `${out}/all-tags.png`, fullPage: true })
  passed.push('ten original content sources appear once in unified tag results')
  await page.getByLabel('글 종류', { exact: true }).selectOption('플래너')
  assert.equal(await page.locator('.chat-inbox-item').count(), 4)
  await page.getByLabel('글 종류', { exact: true }).selectOption('D-day')
  assert.equal(await page.locator('.chat-inbox-item').count(), 1)
  await page.getByRole('link', { name: '원문 열기 ↗' }).click()
  await page.waitForURL(url => url.pathname === '/dday/701')
  passed.push('planner aggregation and D-day original navigation work')
  await page.goto(root + '/mentions')
  await page.waitForFunction(() => document.querySelectorAll('.chat-inbox-item').length === 11)
  await page.locator('[data-kind="D-day"]').getByRole('button', { name: '읽음으로 표시' }).click()
  await page.getByLabel('안 읽은 멘션만 보기').check()
  await page.waitForFunction(() => document.querySelectorAll('.chat-inbox-item').length === 10)
  assert.equal(await page.locator('[data-kind="D-day"]').count(), 0)
  await page.reload()
  await page.locator('[data-kind="D-day"]').waitFor()
  assert.equal(await page.locator('[data-kind="D-day"]').getByRole('button', { name: '읽음으로 표시' }).count(), 0)
  await page.screenshot({ path: `${out}/all-mentions.png`, fullPage: true })
  passed.push('chat and all content mentions merge; local read state survives reload')
  await page.evaluate(async () => {
    const { ddays } = await import('/src/store/ddays.js')
    ddays.value[0].body = '수정한 원문 #새태그'
  })
  await page.waitForFunction(() => !document.querySelector('[data-kind="D-day"]'))
  await page.goto(root + '/tags?tag=새태그')
  await page.locator('[data-kind="D-day"]').getByText('수정한 원문 #새태그', { exact: true }).waitFor()
  await page.evaluate(async () => { const { ddays } = await import('/src/store/ddays.js'); ddays.value = [] })
  await page.waitForFunction(() => !document.querySelector('[data-kind="D-day"]'))
  passed.push('source edits replace tags and remove mentions; source deletion removes results')
  await page.goto(root + '/planner?date=2026-09-27')
  await page.locator('.review textarea').fill('플래너에서 저장한 회고 #회고검증')
  await page.getByRole('button', { name: '회고 저장' }).click()
  await page.goto(root + '/tags?tag=회고검증')
  await page.locator('[data-kind="플래너"]').getByText('플래너에서 저장한 회고 #회고검증', { exact: true }).waitFor()
  passed.push('planner review saved through UI appears in tag inbox after navigation')
  await page.goto(root + '/chat/tags?tag=통합')
  await page.getByLabel('글 종류', { exact: true }).selectOption('다이어리')
  await page.getByLabel('제목·내용·작성자').fill('확인 부탁')
  await page.waitForFunction(() => document.querySelectorAll('.chat-inbox-item').length === 1)
  await page.setViewportSize({ width: 390, height: 844 })
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
  await page.screenshot({ path: `${out}/mobile-inbox.png`, fullPage: true })
  passed.push('legacy chat inbox URL, text filters and mobile layout work')
  assert.deepEqual(errors, [])
  await writeFile(`${out}/results.json`, JSON.stringify({ date: '2026-09-27', passed, pageErrors: errors }, null, 2))
  console.log(JSON.stringify({ passed: passed.length, pageErrors: errors.length }))
} catch (error) { await page.screenshot({ path: 'backend/build/chat-ui/inbox-failure.png', fullPage: true }); throw error }
finally { await browser.close() }
