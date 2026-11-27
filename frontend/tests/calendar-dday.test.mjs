// 달력의 D-Day 칸(PR-32 11단계에서 찾은 기존 버그): 표시 문구("12월 10일")가 아니라 ISO 날짜로 칸을 찾고, isoDate가 없는 시연·예전 D-Day도 칸에 넣는지 검사한다.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { ddayCellDate } from '../src/utils/dday.mjs'

test('D-Day 칸 날짜는 isoDate를 쓰고, 없으면 예전 날짜 문구를 오늘의 연도로 읽는다', () => {
  assert.equal(ddayCellDate({ isoDate: '2026-12-10', date: '12월 10일' }, '2026-11-25'), '2026-12-10')
  assert.equal(ddayCellDate({ date: '8월 31일 · 저녁 식사' }, '2026-11-25'), '2026-08-31')
  assert.equal(ddayCellDate({ date: '날짜 미정' }, '2026-11-25'), null)
  assert.equal(ddayCellDate(undefined, '2026-11-25'), null)
})

test('시연 D-Day는 모두 달력 칸 날짜를 가진다', () => {
  // store/ddays.js는 브라우저 저장소를 불러 Node에서 열 수 없어, 시연 목록의 날짜 문구를 소스에서 읽는다
  const store = readFileSync(new URL('../src/store/ddays.js', import.meta.url), 'utf8')
  const seeds = store.slice(store.indexOf('DDAY_SEEDS = ['), store.indexOf(']\n', store.indexOf('DDAY_SEEDS = [')))
  const dates = [...seeds.matchAll(/date: '([^']+)'/g)].map((m) => m[1])
  assert.equal(dates.length, 5)
  for (const date of dates) assert.match(ddayCellDate({ date }, '2026-11-25'), /^2026-\d{2}-\d{2}$/, date)
})

test('달력은 D-Day 칸 날짜를 ddayCellDate로 고른다', () => {
  const view = readFileSync(new URL('../src/views/home/CalendarView.vue', import.meta.url), 'utf8')
  assert.match(view, /add\(ddayCellDate\(d, TODAY\)/)
})
