import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import postcss from 'postcss'
import { parse } from '@vue/compiler-sfc'

const root = fileURLToPath(new URL('../src/', import.meta.url))
const read = file => readFileSync(path.join(root, file), 'utf8')
const walk = dir => readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)])
const typeCss = postcss.parse(read('typography.css'))
function declarations(selector) {
  const result = {}
  typeCss.walkRules(selector, rule => { if (rule.parent.type === 'root') rule.walkDecls(d => { result[d.prop] = d.value }) })
  return result
}

test('shared type stylesheet loads after legacy and interaction styles', () => {
  const main = read('main.js')
  assert.ok(main.indexOf("'./typography.css'") > main.indexOf("'./interaction.css'"))
})
test('font preferences scale rem, not the app viewport or only the non-teleported shell', () => {
  assert.equal(declarations(':root')['font-size'], '100%')
  assert.equal(declarations(":root[data-font='sm']")['font-size'], '93.75%')
  assert.equal(declarations(":root[data-font='lg']")['font-size'], '112.5%')
  assert.doesNotMatch(read('styles.css') + read('typography.css'), /zoom\s*:/)
})
test('LNB labels inherit menu size instead of the icon span size and can wrap', () => {
  const label = declarations('.sidebar .nav-text')
  assert.equal(label['font-size'], 'inherit')
  assert.equal(label['white-space'], 'normal')
  assert.equal(label.width, 'auto')
  const row = declarations('.sidebar nav button, .sidebar .nav-link')
  assert.equal(row['font-size'], '.875rem')
  assert.equal(row.height, 'auto')
  assert.equal(row['min-height'], '40px')
})
test('CSS and component styles parse; all literal text sizes respect the new minimum', () => {
  let declarationsChecked = 0
  for (const file of walk(root).filter(f => /\.(css|vue)$/.test(f))) {
    const source = readFileSync(file, 'utf8')
    const blocks = file.endsWith('.vue') ? parse(source).descriptor.styles.map(s => s.content) : [source]
    for (const css of blocks) {
      postcss.parse(css, { from: file }).walkDecls('font-size', d => {
        const literal = d.value.match(/^([\d.]+)(px|rem)$/)
        if (literal) {
          const size = Number(literal[1]) * (literal[2] === 'rem' ? 16 : 1)
          assert.ok(size === 0 || size >= 12, `${file}: undersized ${d.value}`)
          declarationsChecked++
        }
      })
    }
    // Inline Vue style declarations were migrated as well.
    assert.doesNotMatch(source, /font-size\s*:\s*(?:[1-9]|1[01])(?:\.\d+)?px\b/, file)
  }
  assert.ok(declarationsChecked > 200)
})
test('narrow and short viewport guards are present', () => {
  const media = []
  typeCss.walkAtRules('media', r => media.push(r))
  assert.ok(media.some(m => m.params === '(max-width: 760px)' && m.toString().includes('max(1rem, 16px)')))
  assert.ok(media.some(m => m.params === '(max-height: 600px)' && m.toString().includes('overflow-y: auto')))
})
test('dynamic tag text and diary inline fields follow shared font preferences', () => {
  assert.match(read('views/tags/TagBoardView.vue'), /fontSize:.*'rem'/)
  assert.doesNotMatch(read('views/diary/DiaryEntryView.vue'), /<input[^>]*font-size:/)
  assert.equal(declarations('.modal-head h3')['font-size'], '1.125rem')
})
