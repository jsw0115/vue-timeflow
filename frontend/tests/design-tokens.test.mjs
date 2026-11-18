// DESIGN.md의 토큰 값과 design-system CSS가 같은지, 공통 컴포넌트가 토큰만 쓰는지 검사한다(PR-11, IM-11).
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import postcss from 'postcss'

const repo = fileURLToPath(new URL('../../', import.meta.url))
const read = file => readFileSync(path.join(repo, file), 'utf8')
const design = read('DESIGN.md')
const tokensCss = read('frontend/src/design-system/tokens.css')
const componentsCss = read('frontend/src/design-system/components.css')

// DESIGN.md 부록 B에 적힌, 아직 화면을 맞추지 않은 토큰. 코드를 목표 값으로 바꾸면 여기와 부록 B에서 함께 지운다.
const KNOWN_GAPS = { '--color-hairline': 'color.hairline', '--shadow-card': 'shadow.card', '--shadow-raised': 'shadow.raised' }

const section = (start, end) => {
  const from = design.indexOf(start)
  assert.ok(from >= 0, `DESIGN.md에 ${start} 절이 없다`)
  const to = end ? design.indexOf(end, from) : design.length
  return design.slice(from, to < 0 ? design.length : to)
}
const normalize = value => value.replace(/\s+/g, '').replace(/(^|[^\d])0\./g, '$1.').toLowerCase()

function designTokens() {
  const tokens = {}
  const cssBlock = section('### CSS 변수', '## 3.').match(/```css([\s\S]*?)```/)[1]
  for (const [, name, value] of cssBlock.matchAll(/--([\w-]+):\s*([^;]+);/g)) tokens['--' + name] = value.trim()
  for (const [, group, name, value] of section('## 5.', '## 6.').matchAll(/^\| (space|radius)\.([\w-]+) \| (\d+px) \|/gm)) tokens[`--${group}-${name}`] = value
  for (const [, name, value] of section('## 6.', '## 7.').matchAll(/^\| shadow\.([\w-]+) \| `([^`]+)` \|/gm)) tokens['--shadow-' + name] = value
  return tokens
}
function codeTokens(css) {
  const tokens = {}
  postcss.parse(css).walkRules(':root', rule => rule.walkDecls(/^--/, decl => { tokens[decl.prop] = decl.value }))
  return tokens
}
function tokenErrors(expected, actual, gaps) {
  const errors = []
  for (const [name, value] of Object.entries(expected)) {
    if (!(name in actual)) errors.push(`${name} 없음`)
    else if (name in gaps) { if (normalize(actual[name]) === normalize(value)) errors.push(`${name}은 목표 값과 같아졌다. KNOWN_GAPS와 부록 B에서 지운다`) }
    else if (normalize(actual[name]) !== normalize(value)) errors.push(`${name}: DESIGN.md ${value}, 코드 ${actual[name]}`)
  }
  return errors
}

test('비교 도우미는 값 차이·누락·이미 맞춘 예외를 찾는다', () => {
  assert.deepEqual(tokenErrors({ '--a': '#000', '--b': '1px' }, { '--a': '#000', '--b': '1px' }, {}), [])
  assert.equal(tokenErrors({ '--a': '#000' }, { '--a': '#111' }, {}).length, 1)
  assert.equal(tokenErrors({ '--a': '#000' }, {}, {}).length, 1)
  assert.equal(tokenErrors({ '--a': '#000' }, { '--a': '#000' }, { '--a': 'a' }).length, 1)
  assert.equal(normalize('0 24px 70px rgba(0,0,0,0.1)'), normalize('0 24px 70px rgba(0, 0, 0, .1)'))
})

test('tokens.css의 색·간격·모서리·그림자 값이 DESIGN.md와 같다(부록 B 예외 제외)', () => {
  const expected = designTokens()
  assert.ok(Object.keys(expected).length >= 25, '파싱한 DESIGN.md 토큰 수가 너무 적다')
  assert.deepEqual(tokenErrors(expected, codeTokens(tokensCss), KNOWN_GAPS), [])
  const appendixB = section('## 부록 B')
  for (const name of Object.values(KNOWN_GAPS)) assert.ok(appendixB.includes(name), `부록 B에 ${name} 항목이 없다`)
})

test('토큰은 tokens.css 한 곳에서만 정의한다', () => {
  for (const file of ['frontend/src/styles.css', 'frontend/src/interaction.css', 'frontend/src/typography.css', 'frontend/src/design-system/components.css']) {
    assert.doesNotMatch(read(file), /--(?:color|space|radius|shadow|type|font)-[\w-]+\s*:/, file)
  }
})

test('공통 컴포넌트는 색 코드·임의 px 없이 정의된 토큰만 쓴다', () => {
  const defined = new Set(Object.keys(codeTokens(tokensCss)))
  postcss.parse(componentsCss).walkDecls(decl => {
    assert.doesNotMatch(decl.value, /#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i, `${decl.prop}: ${decl.value}`)
    for (const [px] of decl.value.matchAll(/\d*\.?\d+px/g)) assert.equal(px, '1px', `${decl.prop}: ${decl.value}`)
    for (const [, name] of decl.value.matchAll(/var\((--[\w-]+)/g)) assert.ok(defined.has(name), `정의되지 않은 토큰 ${name}`)
  })
})

test('DESIGN.md 4장 클래스 표의 공통 클래스가 실제로 정의되어 있고, 채운 상태에 미정이 남지 않았다', () => {
  const css = componentsCss + read('frontend/src/styles.css') + read('frontend/src/typography.css')
  const table = section('### 코드 클래스', '### button-primary')
  const classes = [...table.matchAll(/`\.([\w-]+)`/g)].map(match => match[1])
  assert.ok(classes.length >= 7)
  for (const name of classes) assert.match(css, new RegExp(`\\.${name}\\b`), name)
  const components = section('## 4.', '## 5.')
  for (const state of ['hover', 'disabled', 'loading']) assert.doesNotMatch(components, new RegExp(`^\\| ${state} \\| 미정`, 'm'), state)
  assert.match(components, /### empty-state/)
})

test('토큰은 가장 먼저, 공통 컴포넌트는 가장 나중에 불러온다', () => {
  const main = read('frontend/src/main.js')
  const order = ['./design-system/tokens.css', './styles.css', './interaction.css', './typography.css', './design-system/components.css'].map(file => main.indexOf(`'${file}'`))
  assert.ok(order.every(index => index >= 0))
  assert.deepEqual([...order].sort((a, b) => a - b), order)
})

// DESIGN.md 2장 색 역할 나눔. accent 채움은 단일 강조(실제 기록), 상태 점(성공 표시), 사용자 콘텐츠 색(템플릿·카테고리)에만 남긴다.
const ACCENT_FILL_ALLOWED = new Set([
  'features/chat/styles/chat.css :: .chat-status-dot.connected',
  'features/chat/styles/chat.css :: .chat-presence-dot',
  'styles.css :: .tpl-dot.mint',
  'styles.css :: .tpl-bar.mint',
  'styles.css :: .cat>strong',
  'views/share/FriendsView.vue :: template',
  // 플래너의 "실제 기록" 버튼(기록 중). DESIGN.md가 포인트 컬러를 쓰라고 정한 화면의 단일 강조다.
  'styles.css :: .record.record-on',
])
test('accent를 채움색으로 쓰는 곳은 상태 점과 콘텐츠 색뿐이다(선택 상태는 foreground, 데이터는 color.data)', async () => {
  const { readdirSync } = await import('node:fs')
  const { parse } = await import('@vue/compiler-sfc')
  const src = path.join(repo, 'frontend/src')
  const walk = dir => readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)])
  const found = []
  for (const file of walk(src).filter(f => /\.(css|vue)$/.test(f))) {
    const name = path.relative(src, file).split(path.sep).join('/')
    const source = readFileSync(file, 'utf8')
    const styles = file.endsWith('.vue') ? parse(source).descriptor.styles.map(s => s.content) : [source]
    for (const css of styles) postcss.parse(css).walkDecls(/^(background(-color)?|accent-color|fill|stroke)$/, decl => {
      if (decl.value.includes('var(--color-accent)')) found.push(`${name} :: ${decl.parent.selector}`)
    })
    const template = file.endsWith('.vue') ? parse(source).descriptor.template?.content ?? '' : ''
    if (/(background|fill|stroke)\s*[:=]\s*[^>]*?var\(--color-accent\)/.test(template)) found.push(`${name} :: template`)
  }
  assert.deepEqual(found.filter(entry => !ACCENT_FILL_ALLOWED.has(entry)), [])
  assert.ok(found.length >= 4, '허용 목록이 실제 사용처와 맞는지 확인한다')
})

// 상태 색과 같은 hex를 쓰는 콘텐츠 색(시간 블록·템플릿·단계 배지·달력 종류·카테고리 스와치·아이콘 대용 글자). 상태 표시는 --color-status-* 변수를 쓴다.
const STATUS_HEX_CONTENT_USES = {
  'styles.css': 9, 'views/auth/SocialLoginView.vue': 1, 'views/home/CalendarView.vue': 2,
  'views/home/HomeView.vue': 1, 'views/settings/SettingsCategoryView.vue': 6, 'views/stats/StatsBoardView.vue': 1,
  // 테마 계산의 상태 색 기준 값(DESIGN.md 2장 상태 색). 표면에 맞춘 값을 --color-status-*로 내보낸다.
  'utils/colorTheme.mjs': 3,
}
test('상태 표시는 상태 색 변수를 쓰고, 같은 hex는 콘텐츠 색 자리에만 남는다', async () => {
  const { readdirSync } = await import('node:fs')
  const src = path.join(repo, 'frontend/src')
  const walk = dir => readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)])
  const counts = {}
  for (const file of walk(src).filter(f => /\.(vue|css|js|mjs)$/.test(f))) {
    const name = path.relative(src, file).split(path.sep).join('/')
    if (name.startsWith('design-system/')) continue
    const n = (readFileSync(file, 'utf8').match(/#(b23b3b|8a6a3c|43596b)\b/gi) ?? []).length
    if (n) counts[name] = n
  }
  assert.deepEqual(counts, STATUS_HEX_CONTENT_USES)
})
