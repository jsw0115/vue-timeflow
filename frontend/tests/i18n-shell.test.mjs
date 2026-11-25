// 다국어 1단계(PR-32): 메뉴·설정 목록·공통 문구의 영어 누락이 없고, 한국어가 기본·대체 문구이며, 표시 언어 저장이 다른 설정을 지우지 않는지 검사한다.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { GROUPS_EN, MODES_EN, NAV_EN, SETTINGS_EN, SETTINGS_GROUPS_EN, SHELL } from '../src/features/i18n/messages.mjs'
import { DEFAULT_LOCALE, LOCALES, cleanLocale, formatDate, formatWon, groupLabel, navName, navTitle, settingLabel, shellText } from '../src/features/i18n/locale.mjs'
import { createLocaleAccount } from '../src/features/i18n/localeAccount.mjs'

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8')
const router = read('src/router/index.js')
const navBlock = router.slice(router.indexOf('export const navGroups'), router.indexOf('\n]\n', router.indexOf('export const navGroups')))
const navPaths = [...navBlock.matchAll(/\{ path: '([^']+)', name: '/g)].map((m) => m[1])
const navGroupLabels = [...navBlock.matchAll(/^ {4}label: '([^']+)'/gm)].map((m) => m[1])
const settings = read('src/router/settingsSections.js')
const settingIds = [...settings.matchAll(/\{ id: '([^']+)', label: '/g)].map((m) => m[1])
const settingGroups = [...settings.matchAll(/^ {4}label: '([^']+)'/gm)].map((m) => m[1])
const hangul = /[가-힣]/

test('메뉴·묶음·설정 구역·하루 모드의 영어가 모두 있고 한글이 섞이지 않는다', () => {
  assert.ok(navPaths.length > 40)
  assert.deepEqual(navPaths.filter((p) => !NAV_EN[p]), [])
  assert.deepEqual(Object.keys(NAV_EN).filter((p) => !navPaths.includes(p)), [])
  assert.deepEqual(navGroupLabels.filter((l) => !GROUPS_EN[l]), [])
  assert.deepEqual(settingIds.filter((id) => !SETTINGS_EN[id]), [])
  assert.deepEqual(settingGroups.filter((l) => !SETTINGS_GROUPS_EN[l]), [])
  assert.deepEqual(Object.keys(MODES_EN), ['J', 'P', 'B'])
  const english = [...Object.values(NAV_EN).flat(), ...Object.values(GROUPS_EN), ...Object.values(SETTINGS_EN).flat(), ...Object.values(SETTINGS_GROUPS_EN), ...Object.values(MODES_EN).flatMap((m) => [m.name, m.desc]), ...Object.values(SHELL).map((e) => e.en)]
  assert.deepEqual(english.filter((text) => !text || hangul.test(text)), [])
})

test('한국어가 기본이고, 영어가 없으면 한국어 원문을 보인다. 자리표시를 채운다', () => {
  assert.equal(DEFAULT_LOCALE, 'ko')
  assert.deepEqual(LOCALES.map((l) => l.id), JSON.parse('[' + read('../backend/src/main/java/kr/timebar/diary/operations/SettingsService.java').match(/LOCALES = List\.of\(([^)]*)\)/)[1] + ']'))
  assert.equal(cleanLocale('ja'), null)
  assert.equal(shellText('newPost', 'ko'), '새 글 작성')
  assert.equal(shellText('newPost', 'en'), 'New post')
  assert.equal(shellText('unreadNotifications', 'en', { n: 3 }), 'Notifications, 3 unread')
  assert.equal(shellText('unreadNotifications', 'ko', { n: 3 }), '알림, 안 읽은 알림 3개')
  const item = { path: '/tasks', name: '할 일', title: '오늘 해야 할 일' }
  assert.deepEqual([navName(item, 'ko'), navTitle(item, 'ko'), navName(item, 'en'), navTitle(item, 'en')], ['할 일', '오늘 해야 할 일', 'Tasks', 'What to do today'])
  assert.equal(navName({ path: '/no-such', name: '상세' }, 'en'), '상세')
  assert.equal(groupLabel('없는 묶음', 'en'), '없는 묶음')
  assert.equal(settingLabel({ id: 'env', label: '환경 설정' }, 'en'), 'Preferences')
  // 빈 상태 문구 규칙(empty-states 시험): 두 문장 이상, 느낌표 없음
  for (const text of Object.values(SHELL.noSettingResult)) { assert.ok(text.split(/(?<=[.?])\s+/).filter(Boolean).length >= 2, text); assert.doesNotMatch(text, /!/) }
})

test('날짜는 언어 형식을 따르고, 금액은 언어를 바꿔도 원화 그대로다', () => {
  const day = new Date(2026, 10, 25)
  assert.equal(formatDate(day, 'ko'), '2026년 11월 25일 수요일')
  assert.equal(formatDate(day, 'en'), 'Wednesday, November 25, 2026')
  assert.equal(formatDate('bad', 'en'), '')
  assert.equal(formatWon(12000, 'ko'), '₩12,000')
  assert.equal(formatWon(12000, 'en'), '₩12,000')
})

test('표시 언어 저장은 general 구역의 다른 값을 지우지 않고 version을 보낸다', async () => {
  const calls = []
  const request = async (path, options = {}) => {
    calls.push([path, options.method ?? 'GET', options.body ?? null])
    return options.method === 'POST' ? { value: JSON.parse(options.body).value, version: 4 } : { value: { weekStart: 'mon', locale: 'ko' }, version: 3 }
  }
  const account = createLocaleAccount({ request })
  assert.equal(await account.save('en'), 'en')
  assert.deepEqual(calls[1], ['/api/settings/general', 'POST', JSON.stringify({ value: { weekStart: 'mon', locale: 'en' }, version: 3 })])
  await assert.rejects(account.save('ja'))
})

test('앱 셸은 문구를 언어별로 고르고, 바뀐 부분에만 lang을 붙이며, 문서 기본 언어는 한국어로 둔다', () => {
  const app = read('src/App.vue')
  for (const old of ['>새 글 작성<', '>환경설정<', '<b>하루 모드</b>', '>즐겨찾기<router-link', 'aria-label="통합 검색"', '<b>로그인</b>']) assert.ok(!app.includes(old), old)
  assert.match(app, /<aside class="sidebar" :class="\{ open: mobileNav \}" :lang="locale">/)
  assert.match(app, /<div class="page-heading" :lang="headingLang">/)
  assert.match(app, /\{\{ navName\(item, locale\) \}\}/)
  assert.match(read('index.html'), /<html lang="ko">/)
  const env = read('src/views/settings/SettingsEnvView.vue')
  assert.match(env, /각 화면 본문과 내가 쓴 기록은 그대로예요/)
  assert.match(env, /@change="chooseLocale\(l\.id\)"/)
  assert.match(read('src/views/settings/SettingsView.vue'), /settingLabel\(item, locale\)/)
})

test('좁은 화면(760px 이하)에서도 설정 구역을 고를 수 있다', () => {
  const view = read('src/views/settings/SettingsView.vue')
  assert.match(view, /class="setting-mobile-pick"/)
  assert.match(view, /@media \(max-width: 760px\) \{\n {2}\.setting-mobile-pick \{ display: grid;/)
  assert.match(view, /\.setting-mobile-pick \{ display: none; \}/)
  assert.equal(shellText('settingsSection', 'en'), 'Settings section')
})
