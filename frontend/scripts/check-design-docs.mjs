import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { screens } from '../dev-preview/model.mjs'
const root = fileURLToPath(new URL('../../', import.meta.url))
const docs = [
  'docs/README.md', 'docs/api/README.md', 'docs/api/api-catalog.md',
  'docs/api/api-design.md', 'docs/api/api-specification.md', 'docs/api/current-api-inventory.md',
  'docs/product/api-enhancements.md', 'docs/product/platform-preview-design.md',
  'docs/development/local-platforms.md', 'docs/quality/review-2026-09-25.md',
]
let links = 0
for (const relative of docs) {
  const full = path.join(root, relative)
  const content = readFileSync(full, 'utf8')
  assert.ok(!content.includes('\uFFFD'), 'Invalid encoding: ' + relative)
  for (const match of content.matchAll(/\]\(([^)]+)\)/g)) {
    if (/^https?:/.test(match[1])) continue
    const target = match[1].split('#')[0]
    if (!target) continue
    assert.ok(existsSync(path.resolve(path.dirname(full), target)), 'Broken link: ' + relative + ' -> ' + target)
    links++
  }
}
const catalog = readFileSync(path.join(root, 'docs/api/api-catalog.md'), 'utf8')
const ids = [...catalog.matchAll(/^\| ([A-Z]+-\d+) \|/gm)].map(m => m[1])
assert.equal(ids.length, new Set(ids).size, 'Duplicate API IDs')
const operations = [...catalog.matchAll(/^\| [A-Z]+-\d+ \| ([A-Z]+) \| ([^|]+) \|/gm)].map(m => m[1] + m[2].trim())
assert.equal(operations.length, new Set(operations).size, 'Duplicate target API operations')
const router = readFileSync(path.join(root, 'frontend/src/router/index.js'), 'utf8')
for (const [route] of screens) {
  if (route === '/mock-demo/') {
    assert.ok(existsSync(path.join(root, 'frontend/mock-demo/index.html')))
  } else {
    assert.ok(router.includes("'" + route + "'") || router.includes("'" + route + '/:section?\''), 'Preview route missing: ' + route)
  }
}
const html = readFileSync(path.join(root, 'frontend/dist/index.html'), 'utf8')
assert.match(html, /name="viewport"/)
assert.match(html, /lang="ko"/)
assert.ok(!html.includes('dev-preview'), 'Development preview leaked into production')
console.log('Verified ' + docs.length + ' docs, ' + links + ' links, ' + ids.length + ' target APIs, ' + screens.length + ' preview routes; production viewport present')
