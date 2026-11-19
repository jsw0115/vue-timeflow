// 빈 목록 문구가 empty-state 클래스와 "무엇이 비었는지 + 다음 행동" 형식을 지키는지 검사한다(DESIGN.md 4장 empty-state).
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const src = fileURLToPath(new URL('../src/', import.meta.url))
const walk = dir => readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)])
const vues = walk(src).filter(file => file.endsWith('.vue')).map(file => ({ name: path.relative(src, file).split(path.sep).join('/'), source: readFileSync(file, 'utf8') }))
const EMPTY_WORDS = /(없어요|없습니다|비어 있)/
// 블록 여백 없이 줄 안에 두는 예외 문구. 공유 그룹 멤버 칩 줄의 문구는 2026-11-20 서버 연결로 없어졌다(PR-10 2단계).
const INLINE_ALLOWED = new Set()

test('빈 목록 문구는 form-note가 아니라 empty-state로 쓴다', () => {
  const leftovers = []
  for (const { name, source } of vues) {
    for (const [, tag, attrs, text] of source.matchAll(/<(p|div|span)([^>]*class="form-note"[^>]*)>([^<]*)</g)) {
      // v-if·v-else로 목록이 비었을 때만 나오는 문구만 빈 상태로 본다. 항상 보이는 규칙 안내는 제외한다.
      const showsWhenEmpty = /v-if="[^"]*(!\s*[\w.?()]+\.length|noResult)|v-else(?!-)/.test(attrs)
      if (EMPTY_WORDS.test(text) && showsWhenEmpty && !INLINE_ALLOWED.has(name)) leftovers.push(`${name}: <${tag}> ${text.trim()}`)
    }
  }
  assert.deepEqual(leftovers, [])
})

test('empty-state 문구는 두 문장 이상이고 느낌표·장식 이모지가 없다', () => {
  const found = []
  for (const { name, source } of vues) {
    for (const [, text] of source.matchAll(/class="empty-state"[^>]*>([^<]+)</g)) {
      found.push(text)
      const sentences = text.trim().split(/(?<=[.?])\s+/).filter(Boolean)
      assert.ok(sentences.length >= 2, `${name}: 다음 행동 문장이 없다 — ${text}`)
      assert.doesNotMatch(text, /!|\p{Extended_Pictographic}/u, `${name}: ${text}`)
    }
  }
  assert.ok(found.length >= 40, `empty-state가 ${found.length}곳뿐이다`)
})
