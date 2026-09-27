import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { generateCurrent } from './design-docs/current.mjs'

const root = fileURLToPath(new URL('../../', import.meta.url))
const read = file => readFileSync(path.join(root, file), 'utf8')
const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
const key = (method, route) => `${method} ${route.split('?')[0]}`
let source
generateCurrent(root, (file, value) => { if (file.endsWith('current-operations.json')) source = JSON.parse(value) })
const sourceKeys = source.map(row => key(row.method, row.route)).sort()
assert.equal(new Set(sourceKeys).size, sourceKeys.length, 'Duplicate source mappings')
const inventory = [...read('docs/api/current-api-inventory.md').matchAll(/^\| (GET|POST|PUT|PATCH|DELETE) \| (\S+) \|/gm)].map(m => key(m[1], m[2])).sort()
assert.deepEqual(inventory, sourceKeys, 'Current inventory does not match source')
assert.deepEqual(JSON.parse(read('docs/api-info/current-operations.json')), source, 'Current operations JSON is stale')
const contract = [...read('docs/api-info/current-contract.md').matchAll(/^### (GET|POST|PUT|PATCH|DELETE) (\S+)/gm)].map(m => key(m[1], m[2])).sort()
assert.deepEqual(contract, sourceKeys, 'Current detailed contracts omit source operations')
const chat = [...read('docs/chat/api/catalog.md').matchAll(/^\| CHAT-\d+ \| (\w+) \| (\S+) \|/gm)].map(m => key(m[1], `/api/chat${m[2]}`)).sort()
assert.deepEqual(chat, sourceKeys.filter(value => value.includes(' /api/chat/')), 'Chat catalog differs from source')
const redis = [...read('docs/chat/redis/api-catalog.md').matchAll(/^\| (GET|POST|PUT|PATCH|DELETE) (\S+) \|/gm)].map(m => key(m[1], m[2]))
assert.equal(new Set(redis).size, redis.length, 'Duplicate Redis HTTP entries')
for (const operation of redis) assert.ok(chat.includes(operation), `Redis HTTP entry has no controller: ${operation}`)
const spec = JSON.parse(read('docs/api-info/openapi.target.json'))
const target = Object.entries(spec.paths).flatMap(([route, operations]) => Object.keys(operations).filter(method => methods.includes(method.toUpperCase())).map(method => ({ id: operations[method].operationId, key: key(method.toUpperCase(), route) })))
const planned = [...read('docs/api-info/catalog.md').matchAll(/^\| ([A-Z]+-\d+) \| (\w+) \| (\S+) \|/gm)].map(m => ({ id: m[1], key: key(m[2], m[3]) }))
assert.deepEqual(planned.map(row => row.key).sort(), target.map(row => row.key).sort(), 'Planned catalog differs from OpenAPI')
assert.equal(new Set(planned.map(row => row.id)).size, planned.length, 'Duplicate target IDs')
const original = [...read('docs/api/api-catalog.md').matchAll(/^\| ([A-Z]+-\d+) \|/gm)].map(m => m[1])
for (const id of original) assert.ok(planned.some(row => row.id === id), `Missing original target: ${id}`)
let checkedLinks = 0
function links(directory) {
  for (const file of readdirSync(path.join(root, directory), { withFileTypes: true })) {
    const relative = path.join(directory, file.name)
    if (file.isDirectory()) { links(relative); continue }
    if (!file.name.endsWith('.md')) continue
    const text = read(relative)
    assert.ok(!text.includes('\uFFFD'), `Invalid encoding ${relative}`)
    for (const match of text.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
      const target = match[1].split('#')[0]
      if (!target || /^https?:/.test(target)) continue
      const resolved = path.resolve(root, directory, decodeURIComponent(target))
      const generatingReport = !process.argv.includes('--check') && resolved === path.join(root, 'docs/api/api-audit-2026-09-27.json')
      assert.ok(existsSync(resolved) || generatingReport, `Broken link ${relative}: ${target}`)
      checkedLinks++
    }
  }
}
for (const directory of ['docs/api', 'docs/api-info', 'docs/chat']) links(directory)
let liveCount = null
if (process.argv.includes('--live')) {
  const response = await fetch('http://127.0.0.1:18080/v3/api-docs')
  assert.ok(response.ok, 'Live OpenAPI unavailable')
  const live = await response.json()
  const actual = Object.entries(live.paths).flatMap(([route, operations]) => Object.keys(operations).filter(method => methods.includes(method.toUpperCase())).map(method => key(method.toUpperCase(), route))).filter(item => item.split(' ')[1].startsWith('/api/')).sort()
  assert.deepEqual(actual, sourceKeys, 'Runtime mappings differ from controller inventory; enable chat-local')
  liveCount = actual.length
}
const result = { date: '2026-09-27', sourceOperations: source.length, serviceConnected: source.filter(row => row.kind === '서비스 연결').length, stub: source.filter(row => row.stub).length, inMemory: source.filter(row => row.kind === '공용 메모리 시연').length, chat: chat.length, redisHttp: redis.length, target: target.length, originalTargetsPreserved: original.length, missing: [], duplicates: [], checkedLinks, runtimeOperations: liveCount }
if (!process.argv.includes('--check')) writeFileSync(path.join(root, 'docs/api/api-audit-2026-09-27.json'), JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify(result))
