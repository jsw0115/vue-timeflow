// 화면 소스가 폐지 예정인 구형 일정·루틴 API를 새로 호출하지 않는지 정적으로 검사한다(UT-106, IM-03).
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const src = fileURLToPath(new URL('../src/', import.meta.url))
const walk = dir => readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)])

// 화면 API 호출은 '/api/...' 전체 경로 문자열을 쓴다. 기준 계약은 /api/schedules·/api/routine-records다.
// 일정 템플릿(/api/events/templates)은 신형 저장소라 폐지 대상이 아니다.
const legacy = /\/api\/(events(?!\/templates(?![\w-]))|routines)(?![\w-])/g

test('화면 소스에 구형 /api/events·/api/routines 호출이 없다', () => {
  const hits = []
  for (const file of walk(src).filter(f => /\.(js|mjs|vue)$/.test(f))) {
    const text = readFileSync(file, 'utf8')
    for (const match of text.matchAll(legacy)) {
      const line = text.slice(0, match.index).split('\n').length
      hits.push(`${path.relative(src, file)}:${line} ${match[0]}`)
    }
  }
  assert.deepEqual(hits, [], `구형 API 대신 /api/schedules·/api/routine-records를 쓰세요.\n${hits.join('\n')}`)
})

test('검사 패턴이 구형 경로만 잡고 신형·채팅 경로는 통과시킨다', () => {
  const found = text => [...text.matchAll(legacy)].map(m => m[0])
  assert.deepEqual(found("fetch('/api/events?from=2026-11-18')"), ['/api/events'])
  assert.deepEqual(found('fetch(`/api/routines/${id}/logs`)'), ['/api/routines'])
  assert.deepEqual(found("fetch('/api/schedules/occurrences'); fetch('/api/routine-records'); fetch('/api/chat/events')"), [])
  assert.deepEqual(found("fetch('/api/events/templates'); fetch(`/api/events/templates/${id}/apply`)"), [])
  assert.deepEqual(found("fetch('/api/events/templatesX'); fetch('/api/events/recurring')"), ['/api/events', '/api/events'])
})
