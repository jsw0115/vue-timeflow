// 320px 가로 넘침을 만들었던 레이아웃 패턴이 다시 들어오지 않는지 정적으로 검사한다(DESIGN.md 8장, IM-11).
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import postcss from 'postcss'

const src = fileURLToPath(new URL('../src/', import.meta.url))
const read = file => readFileSync(path.join(src, file), 'utf8')
const walk = dir => readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)])
function decls(file, selector) {
  const out = []
  postcss.parse(read(file)).walkRules(rule => { if (rule.selectors.includes(selector)) rule.walkDecls(d => out.push([d.prop, d.value, rule.parent.type === 'atrule' ? rule.parent.params : ''])) })
  return out
}

test('지표 행은 인라인 grid-template-columns로 열 수를 고정하지 않는다(좁은 화면 2열 규칙이 막힌다)', () => {
  const fixed = []
  for (const file of walk(src).filter(f => f.endsWith('.vue'))) {
    for (const [tag] of readFileSync(file, 'utf8').matchAll(/<[a-z]+[^>]*class="metrics"[^>]*>/g)) {
      const style = tag.match(/style="([^"]*)"/)?.[1] ?? ''
      if (/grid-template-columns/.test(style) && !/auto-(fit|fill)/.test(style)) fixed.push(path.relative(src, file) + ': ' + style)
    }
  }
  assert.deepEqual(fixed, [], '열 수는 style="--metric-cols: N"으로 정한다')
  const base = decls('styles.css', '.metrics').find(([prop, , media]) => prop === 'grid-template-columns' && !media)
  assert.match(base[1], /var\(--metric-cols/)
  assert.match(base[1], /minmax\(0,\s*1fr\)/)
})

test('주간 표는 표 자체가 아니라 요일 칸에 최소 폭을 줘서 표 안에서 가로로 스크롤한다', () => {
  assert.ok(!decls('styles.css', '.timetable').some(([prop]) => prop === 'min-width'), '.timetable에 min-width를 주면 스크롤 영역이 줄지 못해 화면이 넘친다')
  assert.ok(decls('styles.css', '.timetable').some(([prop, value]) => prop === 'overflow-x' && value === 'auto'))
  assert.ok(decls('styles.css', '.tt-day').some(([prop, value]) => prop === 'min-width' && value === '80px'))
})

test('헤더 액션은 줄어들지 않고, 자리가 없으면 제목 아래 줄로 내려간다', () => {
  assert.ok(decls('typography.css', 'main > header').some(([prop, value, media]) => prop === 'flex-wrap' && value === 'wrap' && !media))
  const actions = decls('typography.css', 'main > header > .actions')
  assert.ok(actions.some(([prop, value]) => prop === 'flex' && value === 'none'))
  assert.ok(actions.some(([prop, value]) => prop === 'margin-left' && value === 'auto'))
})

test('라벨 안 입력은 라벨 폭을 넘지 않는다', () => {
  assert.ok(decls('interaction.css', '.form-row > label :is(input, select, textarea)').some(([prop, value]) => prop === 'max-width' && value === '100%'))
})
