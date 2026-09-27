import { chromium } from '../../backend/build/chat-ui/node_modules/playwright/index.mjs'
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' })
const page = await context.newPage(), errors = [], requests = [], passed = []
page.on('pageerror', error => errors.push(error.message))
await context.route('**/api/**', route => {
  if (!new URL(route.request().url()).pathname.startsWith('/api/')) return route.continue()
  requests.push(route.request().url()); return route.abort()
})
const root = 'http://127.0.0.1:15173', output = 'docs/chat/verification/screenshots'
try {
  await mkdir(output, { recursive: true })
  await page.goto(`${root}/chat`)
  await page.getByRole('heading', { name: '목요일 회고 모임' }).waitFor()
  await page.getByRole('log').getByText('@서연 함께 읽을 책을 골라볼게요. #회고', { exact: true }).waitFor()
  assert.equal(await page.locator('.chat-room-item').count(), 3)
  assert.equal(await page.locator('.chat-welcome').count(), 0)
  await page.screenshot({ path: `${output}/preview-desktop.png`, fullPage: true })
  passed.push('anonymous conversation opens populated sample room without server requests')
  await page.getByRole('textbox', { name: '메시지', exact: true }).fill('미리보기에서 작성한 메시지 #테스트')
  await page.getByRole('button', { name: '보내기', exact: true }).click()
  await page.getByRole('log').getByText('미리보기에서 작성한 메시지 #테스트', { exact: true }).waitFor()
  await page.getByLabel('태그 필터', { exact: true }).fill('테스트')
  await page.locator('.chat-tag-filter').getByRole('button', { name: '찾기' }).click()
  await page.waitForFunction(() => document.querySelectorAll('.chat-message').length === 1)
  passed.push('preview send and room tag filter are interactive')
  await page.getByRole('link', { name: '멘션함', exact: true }).last().click()
  await page.getByText('@지수 저도 다음 주부터 함께하고 싶어요. 추천하는 책이 있나요? #독서', { exact: true }).waitFor()
  await page.getByRole('button', { name: '읽음으로 표시' }).click()
  await page.getByLabel('안 읽은 멘션만 보기').check()
  await page.getByRole('heading', { name: '새 멘션을 모두 확인했어요' }).waitFor()
  passed.push('preview mention read and unread filters work')
  await page.getByRole('link', { name: '태그함', exact: true }).click()
  await page.getByText('@서연 함께 읽을 책을 골라볼게요. #회고', { exact: true }).waitFor()
  await page.getByRole('button', { name: /#테스트/ }).click()
  await page.getByText('미리보기에서 작성한 메시지 #테스트', { exact: true }).waitFor()
  passed.push('tag inbox starts with results and shares preview messages')
  for (const path of ['/mentions', '/chat/mentions', '/tags', '/chat/tags']) {
    await page.goto(root + path)
    await page.locator('.chat-inbox-item').first().waitFor()
    assert.ok(!(await page.locator('.chat-workspace').innerText()).includes('로그인하고'))
  }
  passed.push('all four inbox URLs render sample data on direct entry')
  await page.goto(`${root}/chat`)
  await page.getByRole('heading', { name: '목요일 회고 모임' }).waitFor()
  await page.getByRole('button', { name: '새 대화', exact: true }).click()
  await page.getByLabel('상대의 가입 이메일').fill('seoyeon@example.test')
  await page.getByRole('dialog').getByRole('button', { name: '찾기' }).click()
  await page.getByRole('button', { name: '대화 시작하기' }).click()
  await page.getByRole('heading', { name: '서연', exact: true }).waitFor()
  passed.push('new conversation sample participant lookup reuses existing DM')
  await page.goto(`${root}/chat`)
  await page.getByRole('heading', { name: '목요일 회고 모임' }).waitFor()
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 })
    const box = await page.getByRole('button', { name: '보내기', exact: true }).boundingBox()
    assert.ok(box && box.y + box.height <= 844, 'composer stays in viewport')
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    if (width === 390) await page.screenshot({ path: `${output}/preview-mobile.png`, fullPage: true })
  }
  passed.push('390px and 320px composer remain visible without horizontal overflow')
  assert.deepEqual(errors, [])
  assert.deepEqual(requests, [])
  await writeFile('docs/chat/verification/preview-results.json', JSON.stringify({ date: '2026-09-27', passed, pageErrors: errors, apiRequests: requests.length }, null, 2))
  console.log(JSON.stringify({ passed: passed.length, pageErrors: errors.length, apiRequests: requests.length }))
} catch (error) {
  await page.screenshot({ path: 'backend/build/chat-ui/preview-failure.png', fullPage: true })
  throw error
} finally { await browser.close() }
