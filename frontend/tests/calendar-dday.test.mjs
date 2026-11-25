// 달력의 D-Day 칸(PR-32 11단계에서 찾은 기존 버그): 표시 문구("12월 10일")가 아니라 ISO 날짜(isoDate)로 칸에 넣는지 검사한다.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

test('달력은 D-Day를 isoDate로 날짜 칸에 넣는다', () => {
  const view = readFileSync(new URL('../src/views/home/CalendarView.vue', import.meta.url), 'utf8')
  assert.match(view, /ddays\.value\.forEach\(\(d\) => add\(d\.isoDate, \{ kind: 'dday'/)
  assert.doesNotMatch(view, /add\(d\.date,/)
  const store = readFileSync(new URL('../src/store/ddays.js', import.meta.url), 'utf8')
  assert.match(store, /isoDate: date \|\| undefined/)
})
