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
