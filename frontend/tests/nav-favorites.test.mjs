// 사이드바 메뉴 즐겨찾기의 고정·순서 변경·해제 규칙과 화면 연결을 검사한다(PR-19 UF-131, UT-233).
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { MAX_FAVORITES, NOT_PINNABLE, cleanFavorites, moveFavorite, pinnableItems, toggleFavorite } from '../src/features/nav/favorites.mjs'

const read = (path) => readFileSync(new URL('../src/' + path, import.meta.url), 'utf8')
const groups = [
  { label: '메인', items: [{ path: '/', name: '홈' }, { path: '/calendar', name: '캘린더' }] },
  { label: '플래너', items: [{ path: '/planner', name: '플래너' }, { path: '/focus', name: '집중 모드' }] },
  { label: '소셜', items: [{ path: '/chat', name: '채팅' }, { path: '/community/new', name: '커뮤니티 만들기' }, { path: '/community', name: '커뮤니티' }] },
]

test('즐겨찾기 후보는 화면 메뉴만이고 묶음 이름을 함께 갖는다', () => {
  const items = pinnableItems(groups)
  assert.deepEqual(items.map((item) => item.path), ['/', '/calendar', '/focus', '/community'])
  assert.equal(items.find((item) => item.path === '/focus').group, '플래너')
  for (const path of NOT_PINNABLE) assert.ok(!items.some((item) => item.path === path), path)
})

test('저장값은 없는 메뉴·중복·한도 초과를 빼고 순서를 지킨다', () => {
  const valid = ['/', '/calendar', '/focus']
  assert.deepEqual(cleanFavorites(['/focus', '/x', '/focus', 3, '/'], valid), ['/focus', '/'])
  assert.deepEqual(cleanFavorites('not-a-list', valid), [])
  const many = Array.from({ length: 12 }, (_, index) => '/m' + index)
  assert.equal(cleanFavorites(many, many).length, MAX_FAVORITES)
})

test('UT-233 추가·이동·해제가 모두 되고 끝을 넘는 이동과 한도 초과 추가는 그대로 둔다', () => {
  let list = toggleFavorite([], '/')
  list = toggleFavorite(list, '/calendar')
  list = toggleFavorite(list, '/focus')
  assert.deepEqual(list, ['/', '/calendar', '/focus'])
  assert.deepEqual(moveFavorite(list, '/focus', -1), ['/', '/focus', '/calendar'])
  assert.deepEqual(moveFavorite(list, '/', -1), list)
  assert.deepEqual(moveFavorite(list, '/focus', 1), list)
  assert.deepEqual(moveFavorite(list, '/none', 1), list)
  assert.deepEqual(toggleFavorite(list, '/calendar'), ['/', '/focus'])
  const full = Array.from({ length: MAX_FAVORITES }, (_, index) => '/m' + index)
  assert.equal(toggleFavorite(full, '/new'), full)
})

test('설정 화면은 버튼·체크박스로만 다루고, 옮긴 뒤 포커스를 지키며, 이 브라우저 저장임을 밝힌다', () => {
  const view = read('views/settings/SettingsMenuView.vue')
  assert.match(view, /type="checkbox"/)
  assert.match(view, /data-move="up"[^>]*:disabled="index === 0"/)
  assert.match(view, /data-move="down"[^>]*:disabled="index === favorites\.length - 1"/)
  assert.match(view, /\?\.focus\(\)/)
  assert.match(view, /role="status"/)
  assert.match(view, /이 브라우저에만 저장돼요/)
  assert.doesNotMatch(view, /draggable/)
  assert.doesNotMatch(view, /을\(를\)/)
  assert.match(read('router/settingsSections.js'), /\{ id: 'menu', label: '메뉴 · 즐겨찾기'/)
})

test('사이드바는 즐겨찾기가 있을 때만 맨 위에 보이고 원래 묶음 메뉴는 그대로다', () => {
  const app = read('App.vue')
  const nav = app.slice(app.indexOf('<nav>'), app.indexOf('</nav>'))
  assert.ok(nav.indexOf('v-if="favorites.length"') < nav.indexOf('v-for="group in navGroups"'))
  assert.match(nav, /to="\/settings\/menu"/)
  assert.match(nav, /v-for="item in group\.items\.filter/)
  assert.match(app, /initNavFavorites\(navGroups\)/)
  const store = read('store/navFavorites.js')
  assert.match(store, /localStorage\.setItem\(KEY/)
  assert.doesNotMatch(store, /from '\.\.\/router'/)
})
