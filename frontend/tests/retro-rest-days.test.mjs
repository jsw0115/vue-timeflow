// 지난 날짜 쉬는 날의 연 5회 한도와 표시 보존(Q-19), 루틴 중지 시작일을 서버가 정하는지(Q-20)를 검사한다.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { RETRO_SKIPS_PER_YEAR, addSkipDates, retroSkipCount } from '../src/utils/recurrence.mjs'

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8')

test('한도는 서버 RoutineRules와 같은 연 5회다', () => {
  assert.equal(RETRO_SKIPS_PER_YEAR, 5)
  assert.match(read('../../backend/src/main/java/kr/timebar/diary/records/RoutineRules.java'), /RETRO_SKIPS_PER_YEAR = 5;/)
})

test('새로 더한 지난 날짜에만 retro를 붙이고, 이미 있던 쉬는 날의 표시는 그대로 둔다', () => {
  const rule = { frequency: 'daily', interval: 1, endMode: 'never', exceptions: [{ date: '2026-11-10', action: 'skip', retro: true }, { date: '2026-11-21', action: 'skip' }] }
  const next = addSkipDates(rule, ['2026-11-20', '2026-11-21', '2026-11-25'], { today: '2026-11-22' })
  assert.deepEqual(next.exceptions, [
    { date: '2026-11-10', action: 'skip', retro: true },
    { date: '2026-11-20', action: 'skip', retro: true },
    { date: '2026-11-21', action: 'skip' },
    { date: '2026-11-25', action: 'skip' },
  ])
  assert.equal(retroSkipCount(next, '2026'), 2)
  assert.equal(retroSkipCount(next, 2025), 0)
  assert.deepEqual(addSkipDates(rule, ['2026-11-20']).exceptions.find((e) => e.date === '2026-11-20'), { date: '2026-11-20', action: 'skip' }, 'today를 안 주면 표시하지 않는다')
})

test('쉬는 날 창은 지난 날짜를 받되 한도를 넘으면 남은 횟수를 알리고, 올해 사용 횟수를 보인다', () => {
  const view = read('../src/views/routines/RoutineListView.vue')
  assert.doesNotMatch(view, /오늘 이후 날짜만 쉬는 날로 정할 수 있어요/)
  assert.match(view, /addSkipDates\(routineRule\(restTarget\.value\), restDates\.value, \{ today: today\.value \}\)/)
  assert.match(view, /if \(retroOver\.value\) return retroOver\.value/)
  assert.match(view, /올해 <span class="figure">\{\{ retroThisYear \}\}\/\{\{ RETRO_SKIPS_PER_YEAR \}\}<\/span>번 썼어요/)
})

test('중지 시작일과 중지 기간은 서버가 정하므로 화면은 보내지 않는다', () => {
  const store = read('../src/features/records/routineStore.mjs')
  const fields = store.match(/const FIELDS = \[([^\]]*)\]/)[1]
  assert.doesNotMatch(fields, /pausedFrom|pausedRanges/)
  assert.match(fields, /'paused'/)
})

test('화면 검사는 retro가 붙은 쉬는 날을 받되 참·거짓이 아니면 막는다', async () => {
  const { recurrenceError } = await import('../src/utils/recurrence.mjs')
  const rule = (extra) => ({ frequency: 'daily', interval: 1, endMode: 'never', exceptions: [{ date: '2026-11-20', action: 'skip', ...extra }] })
  assert.equal(recurrenceError(rule({ retro: true }), '2026-11-01'), '')
  assert.equal(recurrenceError(rule({}), '2026-11-01'), '')
  assert.notEqual(recurrenceError(rule({ retro: 'yes' }), '2026-11-01'), '')
  assert.notEqual(recurrenceError(rule({ title: 'x' }), '2026-11-01'), '')
})
