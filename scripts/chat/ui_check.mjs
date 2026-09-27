// Local, real-backend browser checks. Playwright is isolated under backend/build/chat-ui.
import { chromium, request } from '../../backend/build/chat-ui/node_modules/playwright/index.mjs'
import { mkdir, writeFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import assert from 'node:assert/strict'

const api = await request.newContext({ baseURL: 'http://127.0.0.1:18080' })
async function call(path, user, data, method = data ? 'POST' : 'GET') {
  const response = await api.fetch(path, { method, ...(user ? { headers: { Authorization: `Bearer ${user.accessToken}` } } : {}), ...(data ? { data } : {}) })
  assert.ok(response.ok(), `${method} ${path}: ${response.status()} ${await response.text()}`)
  return (await response.json()).data
}
async function account(nickname) {
  const email = `ui-${randomUUID()}@example.test`, password = 'ChatLocal!927'
  await call('/api/auth/signup', null, { email, password, nickname, agreeTerms: true, agreePrivacy: true })
  return { ...await call('/api/auth/login', null, { email, password }), password }
}
const owner = await account('지수'), peer = await account('서연'), third = await account('민준')
const room = await call('/api/chat/rooms', owner, { kind: 'GROUP', name: '목요일 회고 모임', memberIds: [peer.userId, third.userId] })
async function message(user, body, mentions = []) { return call(`/api/chat/rooms/${room.id}/messages`, user, { clientMessageId: randomUUID(), body, mentionUserIds: mentions }) }
await message(peer, '이번 주도 수고 많았어요. 오늘은 작은 성취 하나씩 나눠볼까요? #회고')
await message(owner, '좋아요! 저는 아침에 20분씩 책 읽는 루틴을 지켰어요. #작은성취')
await message(third, '@지수 저도 다음 주부터 함께하고 싶어요. 추천하는 책이 있나요? #독서', [owner.userId])
await call('/api/chat/rooms', owner, { kind: 'DM', memberIds: [peer.userId] })
await call('/api/chat/rooms', owner, { kind: 'DM', memberIds: [third.userId] })
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
const errors = [], results = []
const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, reducedMotion: 'reduce' })
const page = await context.newPage()
page.on('pageerror', error => errors.push(error.message))
async function signIn(page, user) {
  await page.goto('http://127.0.0.1:15173/auth/login?redirect=/chat')
  await page.getByLabel('이메일', { exact: true }).fill(user.email)
  await page.getByPlaceholder('8자 이상', { exact: true }).fill(user.password)
  await page.getByRole('button', { name: '로그인', exact: true }).click()
  await page.waitForURL(url => url.pathname === '/chat')
}
try {
  await signIn(page, owner)
  await page.getByRole('button', { name: /목요일 회고 모임/ }).click()
  await page.getByRole('heading', { name: '목요일 회고 모임' }).waitFor()
  await page.getByRole('log').getByText('추천하는 책이 있나요?', { exact: false }).waitFor()
  results.push('real UI login and persisted room rendering')
  await page.getByRole('button', { name: '@ 멘션', exact: true }).click()
  await page.getByRole('button', { name: '서연', exact: true }).click()
  await page.getByRole('textbox', { name: '메시지', exact: true }).fill('@서연 함께 읽을 책을 골라볼게요. #회고')
  await page.getByRole('button', { name: '보내기', exact: true }).click()
  await page.getByRole('log').getByText('@서연 함께 읽을 책을 골라볼게요. #회고', { exact: true }).waitFor()
  await page.waitForFunction(() => !document.body.innerText.includes('보내는 중…'))
  results.push('member picker, tagged message and acknowledgement')
  const output = 'docs/chat/verification/screenshots'
  await mkdir(output, { recursive: true })
  await page.screenshot({ path: `${output}/desktop-chat.png`, fullPage: true })
  await page.getByLabel('태그 필터', { exact: true }).fill('회고')
  await page.locator('.chat-tag-filter').getByRole('button', { name: '찾기', exact: true }).click()
  await page.waitForFunction(() => document.querySelectorAll('.chat-message-list .chat-message').length === 2)
  assert.ok(!(await page.getByRole('log').innerText()).includes('#작은성취'))
  results.push('room tag filter uses server results')
  await page.getByRole('link', { name: '멘션함', exact: true }).last().click()
  await page.getByRole('heading', { name: '나를 부른 이야기' }).waitFor()
  await page.getByText('@지수 저도 다음 주부터 함께하고 싶어요. 추천하는 책이 있나요? #독서', { exact: true }).waitFor()
  await page.screenshot({ path: `${output}/mentions.png`, fullPage: true })
  await page.getByRole('button', { name: '읽음으로 표시' }).click()
  await page.getByLabel('안 읽은 멘션만 보기').check()
  await page.getByRole('heading', { name: '새 멘션을 모두 확인했어요' }).waitFor()
  results.push('mention inbox read state and unread filter')
  await page.goto('http://127.0.0.1:15173/chat/tags')
  await page.getByRole('button', { name: /#회고/ }).click()
  await page.getByText('@서연 함께 읽을 책을 골라볼게요. #회고', { exact: true }).waitFor()
  await page.screenshot({ path: `${output}/tags.png`, fullPage: true })
  results.push('tag inbox exposes persisted authorized messages')
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`http://127.0.0.1:15173/chat?room=${room.id}`)
  await page.getByRole('textbox', { name: '메시지', exact: true }).waitFor()
  assert.ok(await page.getByRole('button', { name: '대화 목록으로' }).isVisible())
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
  await page.screenshot({ path: `${output}/mobile-chat.png`, fullPage: true })
  await page.getByRole('textbox', { name: '메시지', exact: true }).fill('한글 조합 테스트')
  await page.getByRole('textbox', { name: '메시지', exact: true }).dispatchEvent('keydown', { key: 'Enter', isComposing: true })
  assert.equal(await page.getByRole('textbox', { name: '메시지', exact: true }).inputValue(), '한글 조합 테스트')
  results.push('390px layout and IME composition guard')
  await page.getByRole('button', { name: '대화 목록으로' }).click()
  await page.getByRole('button', { name: /목요일 회고 모임/ }).waitFor()
  results.push('mobile back navigation to conversation list')
  assert.deepEqual(errors, [])
  await writeFile('docs/chat/verification/ui-results.json', JSON.stringify({ date: '2026-09-27', passed: results, pageErrors: errors }, null, 2))
  console.log(JSON.stringify({ passed: results.length, pageErrors: errors.length }))
} catch (error) {
  await mkdir('backend/build/chat-ui', { recursive: true })
  await page.screenshot({ path: 'backend/build/chat-ui/failure.png', fullPage: true })
  console.error(error)
  process.exitCode = 1
} finally { await browser.close(); await api.dispose() }
