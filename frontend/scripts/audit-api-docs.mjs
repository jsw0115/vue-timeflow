import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { generateCurrent } from './design-docs/current.mjs'
import { API_DOCUMENT_DATE, API_STATUS, statusSummary } from './api-status.mjs'

const root = fileURLToPath(new URL('../../', import.meta.url))
const read = file => readFileSync(path.join(root, file), 'utf8')
const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
const key = (method, route) => `${method} ${route.split('?')[0]}`
const date = process.argv.find(argument => argument.startsWith('--date='))?.slice('--date='.length) ?? API_DOCUMENT_DATE
assert.match(date, /^\d{4}-\d{2}-\d{2}$/, 'Expected --date=YYYY-MM-DD')
const reportPath = path.join(root, 'docs/api', `api-audit-${date}.json`)
let source
generateCurrent(root, (file, value) => { if (file.endsWith('current-operations.json')) source = JSON.parse(value) })
const sourceKeys = source.map(row => key(row.method, row.route)).sort()
assert.equal(new Set(sourceKeys).size, sourceKeys.length, 'Duplicate source mappings')
const inventory = [...read('docs/api/current-api-inventory.md').matchAll(/^\| (GET|POST|PUT|PATCH|DELETE) \| (\S+) \|/gm)].map(m => key(m[1], m[2])).sort()
assert.deepEqual(inventory, sourceKeys, 'Current inventory does not match source')
const inventoryStatus = Object.fromEntries([...read('docs/api/current-api-inventory.md').matchAll(/^\| (GET|POST|PUT|PATCH|DELETE) \| (\S+) \| ([^|]+) \|/gm)].map(match => [key(match[1], match[2]), match[3].trim()]))
for (const operation of source) {
  assert.equal(inventoryStatus[key(operation.method, operation.route)], operation.implementationStatus, 'Implementation status differs: ' + operation.route)
  assert.ok(Object.values(API_STATUS).includes(operation.implementationStatus), 'Unknown implementation status')
}
assert.deepEqual(JSON.parse(read('docs/api-info/current-operations.json')), source, 'Current operations JSON is stale')
const contract = [...read('docs/api-info/current-contract.md').matchAll(/^### (GET|POST|PUT|PATCH|DELETE) (\S+)/gm)].map(m => key(m[1], m[2])).sort()
assert.deepEqual(contract, sourceKeys, 'Current detailed contracts omit source operations')
const chat = [...read('docs/chat/api/catalog.md').matchAll(/^\| CHAT-\d+ \| (\w+) \| (\S+) \|/gm)].map(m => key(m[1], `/api/chat${m[2]}`)).sort()
assert.deepEqual(chat, sourceKeys.filter(value => value.includes(' /api/chat/')), 'Chat catalog differs from source')
const redis = [...read('docs/chat/redis/api-catalog.md').matchAll(/^\| (GET|POST|PUT|PATCH|DELETE) (\S+) \|/gm)].map(m => key(m[1], m[2]))
assert.equal(new Set(redis).size, redis.length, 'Duplicate Redis HTTP entries')
for (const operation of redis) assert.ok(chat.includes(operation), `Redis HTTP entry has no controller: ${operation}`)
const spec = JSON.parse(read('docs/api-info/openapi.target.json'))
for (const operations of Object.values(spec.paths)) {
  for (const [method, operation] of Object.entries(operations)) {
    if (methods.includes(method.toUpperCase())) assert.equal(operation['x-implementation-status'], 'PLANNED', 'Target /api/v1 falsely marked implemented')
  }
}
const target = Object.entries(spec.paths).flatMap(([route, operations]) => Object.keys(operations).filter(method => methods.includes(method.toUpperCase())).map(method => ({ id: operations[method].operationId, key: key(method.toUpperCase(), route) })))
const planned = [...read('docs/api-info/catalog.md').matchAll(/^\| ([A-Z]+-\d+) \| (\w+) \| (\S+) \|/gm)].map(m => ({ id: m[1], key: key(m[2], m[3]) }))
assert.deepEqual(planned.map(row => row.key).sort(), target.map(row => row.key).sort(), 'Planned catalog differs from OpenAPI')
assert.equal(new Set(planned.map(row => row.id)).size, planned.length, 'Duplicate target IDs')
for (const file of ['docs/api/api-catalog.md', 'docs/api-info/catalog.md']) {
  const targetRows = read(file).split('\n').filter(line => /^\| [A-Z]+-\d+ \|/.test(line))
  for (const row of targetRows) assert.equal(row.split('|').at(-2).trim(), '설계 · 미구현', 'Missing or false target implementation status: ' + row)
}
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
      const generatingReport = !process.argv.includes('--check') && resolved === reportPath
      assert.ok(existsSync(resolved) || generatingReport, `Broken link ${relative}: ${target}`)
      checkedLinks++
    }
  }
}
for (const directory of ['docs/api', 'docs/api-info', 'docs/chat']) links(directory)
let liveCount = null
if (process.argv.includes('--live')) {
  const baseUrl = process.argv.find(argument => argument.startsWith('--base-url='))?.slice('--base-url='.length) ?? 'http://127.0.0.1:18080'
  const response = await fetch(new URL('/v3/api-docs', baseUrl))
  assert.ok(response.ok, 'Live OpenAPI unavailable')
  const live = await response.json()
  const actual = Object.entries(live.paths).flatMap(([route, operations]) => Object.keys(operations).filter(method => methods.includes(method.toUpperCase())).map(method => key(method.toUpperCase(), route))).filter(item => item.split(' ')[1].startsWith('/api/')).sort()
  assert.deepEqual(actual, sourceKeys, 'Runtime mappings differ from controller inventory; enable CHAT_ENABLED')
  liveCount = actual.length
}
const counts = statusSummary(source)
const result = { date, sourceOperations: source.length, implementationCompleted: counts.completed, previouslyConnected: counts.connected, serviceConnected: source.filter(row => row.kind === '서비스 연결').length, stub: counts.stub, inMemory: counts.memory, chat: chat.length, redisHttp: redis.length, target: target.length, originalTargetsPreserved: original.length, missing: [], duplicates: [], checkedLinks, runtimeOperations: liveCount, verificationScope: 'Static source/document consistency; completion labels reference separate unit/MockMvc tests, not live DB verification' }
if (!process.argv.includes('--check')) writeFileSync(reportPath, JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify(result))
