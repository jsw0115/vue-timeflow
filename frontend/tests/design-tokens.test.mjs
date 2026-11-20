// DESIGN.md(2026-11-20 판) 앞머리 토큰·CSS 매핑과 design-system CSS가 같은지, 공통 컴포넌트가 토큰만 쓰는지 검사한다.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import postcss from 'postcss'

const repo = fileURLToPath(new URL('../../', import.meta.url))
const read = file => readFileSync(path.join(repo, file), 'utf8')
const design = read('DESIGN.md')
const tokensCss = read('frontend/src/design-system/tokens.css')
const componentsCss = read('frontend/src/design-system/components.css')

/**
 * DESIGN.md 앞머리 이름 → tokens.css 변수. 기존 변수 이름을 유지해서(DESIGN.md 2장) 간격 이름은 한 칸씩 어긋난다.
 * 예: DESIGN spacing.xs(8px)는 코드 --space-md다. 이 표가 두 이름의 유일한 대응표다.
 */
export const MAP = {
  colors: {
    primary: '--color-accent', 'primary-hover': '--color-accent-hover', 'on-primary': '--color-on-accent', ink: '--color-foreground',
    body: '--color-body', muted: '--color-muted', canvas: '--color-canvas', 'surface-soft': '--color-surface', 'surface-card': '--color-card',
    hairline: '--color-hairline', 'control-border': '--color-control-border', focus: '--color-accent', data: '--color-data', 'on-data': '--color-on-data',
    success: '--color-status-success', warning: '--color-status-warning', error: '--color-status-danger', info: '--color-status-info',
  },
  rounded: { xs: '--radius-xs', sm: '--radius-sm', md: '--radius-md', lg: '--radius-lg', xl: '--radius-xl', pill: '--radius-full' },
  spacing: { xxs: '--space-xs', xs: '--space-md', sm: '--space-lg', md: '--space-xl', lg: '--space-xxl', xl: '--space-block', xxl: '--space-gutter', section: '--space-section' },
}

const section = (start, end) => {
  const from = design.indexOf(start)
  assert.ok(from >= 0, `DESIGN.md에 ${start} 절이 없다`)
  const to = end ? design.indexOf(end, from + start.length) : design.length
  return design.slice(from, to < 0 ? design.length : to)
}
const normalize = value => value.replace(/\s+/g, '').replace(/(^|[^\d])0\./g, '$1.').replace(/^"|"$/g, '').toLowerCase()

/** 앞머리 YAML에서 colors·rounded·spacing 묶음의 이름: 값을 읽는다(들여쓰기 2칸 한 줄 값만 쓴다). */
export function frontMatter(text) {
  const yaml = text.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? ''
  const groups = {}
  let current = null
  for (const line of yaml.split('\n')) {
    const top = line.match(/^([\w-]+):\s*$/)
    if (top) { current = top[1]; groups[current] = {}; continue }
    const item = line.match(/^ {2}([\w-]+):\s*"?([^"\n]+?)"?\s*$/)
    if (item && current) groups[current][item[1]] = item[2]
    else if (/^\S/.test(line)) current = null
  }
  return groups
}
function designTokens() {
  const tokens = {}, groups = frontMatter(design.replace(/\r\n/g, '\n'))
  for (const [group, map] of Object.entries(MAP)) for (const [name, variable] of Object.entries(map)) {
    assert.ok(groups[group]?.[name], `DESIGN.md 앞머리에 ${group}.${name}이 없다`)
    tokens[variable] = groups[group][name]
  }
  // 2장 CSS token mapping 블록의 변수도 같은 값이어야 한다
  const block = section('### CSS token mapping', '## 3.').match(/```css([\s\S]*?)```/)[1]
  for (const [, name, value] of block.matchAll(/--([\w-]+):\s*([^;]+);/g)) tokens['--' + name] = value.trim()
  return tokens
}
function codeTokens(css) {
  const tokens = {}
  postcss.parse(css).walkRules(':root', rule => rule.walkDecls(/^--/, decl => { tokens[decl.prop] ??= decl.value }))
  return tokens
}
function tokenErrors(expected, actual) {
  const errors = []
  for (const [name, value] of Object.entries(expected)) {
    if (!(name in actual)) errors.push(`${name} 없음`)
    else if (normalize(actual[name]) !== normalize(value)) errors.push(`${name}: DESIGN.md ${value}, 코드 ${actual[name]}`)
  }
  return errors
}

test('비교 도우미는 값 차이·누락을 찾고 앞머리 YAML을 읽는다', () => {
  assert.deepEqual(tokenErrors({ '--a': '#000', '--b': '1px' }, { '--a': '#000', '--b': '1px' }), [])
  assert.equal(tokenErrors({ '--a': '#000' }, { '--a': '#111' }).length, 1)
  assert.equal(tokenErrors({ '--a': '#000' }, {}).length, 1)
  assert.equal(normalize('"#2F5D46"'), normalize('#2f5d46'))
  assert.deepEqual(frontMatter('---\ncolors:\n  primary: "#2F5D46"\nrounded:\n  sm: 8px\n---\n'), { colors: { primary: '#2F5D46' }, rounded: { sm: '8px' } })
})

test('tokens.css의 색·간격·모서리 값이 DESIGN.md 앞머리·CSS 매핑과 같다', () => {
  const expected = designTokens()
  assert.ok(Object.keys(expected).length >= 30, '파싱한 DESIGN.md 토큰 수가 너무 적다')
  assert.deepEqual(tokenErrors(expected, codeTokens(tokensCss)), [])
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
    for (const [px] of decl.value.matchAll(/\d*\.?\d+px/g)) assert.ok(['1px', '2px'].includes(px), `${decl.prop}: ${decl.value}`)
    for (const [, name] of decl.value.matchAll(/var\((--[\w-]+)/g)) assert.ok(defined.has(name), `정의되지 않은 토큰 ${name}`)
  })
})

test('DESIGN.md 4장 호환 클래스 표의 공통 클래스가 실제로 정의되어 있다', () => {
  const css = componentsCss + read('frontend/src/styles.css') + read('frontend/src/typography.css')
  const table = section('### Existing class compatibility', '### Navigation')
  const classes = [...table.matchAll(/`\.([\w-]+)`/g)].map(match => match[1])
  assert.ok(classes.length >= 12)
  for (const name of classes) assert.match(css, new RegExp(`\\.${name}\\b`), name)
})

test('토큰은 가장 먼저, 공통 컴포넌트는 가장 나중에 불러온다', () => {
  const main = read('frontend/src/main.js')
  const order = ['./design-system/tokens.css', './styles.css', './interaction.css', './typography.css', './design-system/components.css'].map(file => main.indexOf(`'${file}'`))
  assert.ok(order.every(index => index >= 0))
  assert.deepEqual([...order].sort((a, b) => a - b), order)
})

const walk = dir => readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)])
const src = path.join(repo, 'frontend/src')

// DESIGN.md 2장 상태 색. 상태 표시는 --color-status-* 변수로만 쓰고, 기준 hex는 테마 계산(colorTheme.mjs)에만 둔다.
test('상태 색 기준 hex는 colorTheme.mjs·tokens.css에만 있다', () => {
  const found = {}
  for (const file of walk(src).filter(f => /\.(vue|css|js|mjs)$/.test(f))) {
    const name = path.relative(src, file).split(path.sep).join('/')
    const n = (readFileSync(file, 'utf8').match(/#(356b49|815e26|a83f3a|3c617b)\b/gi) ?? []).length
    if (n) found[name] = n
  }
  assert.deepEqual(found, { 'design-system/tokens.css': 4, 'utils/colorTheme.mjs': 4 })
})

// DESIGN.md 4장 Buttons·Navigation. accent 채움은 주 버튼, 현재 위치·선택 표식, 상태 점, 사용자 콘텐츠 색에만 쓴다. 넓은 장식 배경에는 쓰지 않는다.
const ACCENT_FILL_ALLOWED = new Set([
  'design-system/components.css :: .primary',
  'design-system/components.css :: nav button.active::before',
  // 테마 설정 미리보기의 주 버튼 견본(실제 주 버튼과 같은 규칙)
  'views/settings/SettingsThemeView.vue :: .pv-primary',
  // 대화의 주 행동(새 대화·보내기)은 앱 주 버튼과 같은 accent 채움이다(2026-11-20 리뉴얼)
  'features/chat/styles/chat.css :: .chat-primary',
  'features/chat/styles/chat.css :: .chat-status-dot.connected',
  'features/chat/styles/chat.css :: .chat-presence-dot',
  'styles.css :: .tpl-dot.mint',
  'styles.css :: .tpl-bar.mint',
  'styles.css :: .cat>strong',
  'views/share/FriendsView.vue :: template',
  'styles.css :: .record.record-on',
])
test('accent 채움은 주 버튼·현재 위치·선택 표식·상태 점·콘텐츠 색에만 쓴다', async () => {
  const { parse } = await import('@vue/compiler-sfc')
  const found = []
  for (const file of walk(src).filter(f => /\.(css|vue)$/.test(f))) {
    const name = path.relative(src, file).split(path.sep).join('/')
    const source = readFileSync(file, 'utf8')
    const styles = file.endsWith('.vue') ? parse(source).descriptor.styles.map(s => s.content) : [source]
    for (const css of styles) postcss.parse(css).walkDecls(/^(background(-color)?|fill|stroke)$/, decl => {
      if (decl.value.includes('var(--color-accent)')) found.push(`${name} :: ${decl.parent.selector}`)
    })
    const template = file.endsWith('.vue') ? parse(source).descriptor.template?.content ?? '' : ''
    if (/(background|fill|stroke)\s*[:=]\s*[^>]*?var\(--color-accent\)/.test(template)) found.push(`${name} :: template`)
  }
  assert.deepEqual(found.filter(entry => !ACCENT_FILL_ALLOWED.has(entry)), [])
})
