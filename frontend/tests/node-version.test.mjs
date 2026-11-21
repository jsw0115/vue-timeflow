// 지원 Node 버전 표시(.nvmrc)와 engines가 서로 맞고, 버전 확인 스크립트가 경계를 바르게 판정하는지 검사한다(PR-06, TS-09).
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { minimumOf, satisfies } from '../scripts/check-node.mjs'

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8')

test('.nvmrc의 Node 주 버전이 package.json engines 최소 버전과 같다', () => {
  const nvmrc = read('../.nvmrc').trim()
  const minimum = minimumOf(JSON.parse(read('../package.json')).engines.node)
  assert.equal(minimum, '22.12.0')
  assert.match(nvmrc, /^\d+$/)
  assert.equal(nvmrc, minimum.split('.')[0])
})

test('버전 비교는 22.12.0 경계를 지킨다', () => {
  for (const ok of ['22.12.0', 'v22.12.1', '22.23.5', '24.0.0']) assert.equal(satisfies(ok, '22.12.0'), true, ok)
  for (const bad of ['20.18.0', '22.11.9', 'v22.2.0', '21.99.99']) assert.equal(satisfies(bad, '22.12.0'), false, bad)
  assert.equal(satisfies('10.9.9', '10'), true)
  assert.equal(minimumOf('^22'), null)
})
