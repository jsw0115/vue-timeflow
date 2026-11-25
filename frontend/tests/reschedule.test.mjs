// 재배치 제안(PR-19 UF-137)과 플래너 계획 블록: 요청 경로, 시각 정리, 고른 항목만 보내는 본문, 되돌리기 본문, 화면 연결을 검사한다.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { MAX_DELAY, MIN_DELAY, applyBody, createRescheduleClient, defaultFrom, hhmm, moveText, timedBlocks, undoBody } from '../src/features/planner/reschedule.mjs'

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8')

test('한도는 서버와 같고 요청 경로가 맞다', async () => {
  const server = read('../backend/src/main/java/kr/timebar/diary/planner/Rescheduler.java')
  assert.match(server, new RegExp(`MIN_DELAY = ${MIN_DELAY}, MAX_DELAY = ${MAX_DELAY}`))
  const calls = []
  const client = createRescheduleClient(async (path, options = {}) => { calls.push([path, options.method ?? 'GET', options.body ?? null]); return [] })
  await client.blocks('2026-11-25')
  await client.preview({ date: '2026-11-25', from: '11:00', delayMinutes: 30 })
  await client.apply([{ kind: 'block', id: '1', version: 2, startTime: '11:30', endTime: '12:30' }])
  assert.deepEqual(calls.map((c) => c.slice(0, 2)), [['/api/planner/items?date=2026-11-25', 'GET'], ['/api/planner/reschedule/preview', 'POST'], ['/api/planner/reschedule/apply', 'POST']])
  assert.deepEqual(JSON.parse(calls[1][2]), { date: '2026-11-25', from: '11:00', delayMinutes: 30 })
})

test('계획 블록: 그날 시간이 있는 열린 블록만, 서버 시각을 HH:mm으로', () => {
  const items = [
    { id: 1, title: '보고서', date: '2026-11-25', startTime: '11:00:00', endTime: '12:00:00', status: 'SCHEDULED' },
    { id: 2, title: '끝낸 일', date: '2026-11-25', startTime: '13:00', endTime: '14:00', status: 'DONE' },
    { id: 3, title: '시간 없음', date: '2026-11-25', startTime: null, endTime: null, status: 'TODO' },
    { id: 4, title: '다른 날', date: '2026-11-26', startTime: '09:00', endTime: '10:00', status: 'TODO' },
  ]
  assert.deepEqual(timedBlocks(items, '2026-11-25'), [{ id: 1, title: '보고서', startTime: '11:00', endTime: '12:00' }])
  assert.equal(hhmm('bad'), '')
  assert.equal(defaultFrom(new Date(2026, 10, 25, 11, 37)), '11:35')
})

test('고른 항목만 제안 때 version으로 보내고, 되돌리기는 옮긴 뒤 version과 원래 시각을 보낸다. 일정은 보내지 않는다', () => {
  const moves = [
    { kind: 'block', id: '1', version: 2, before: { startTime: '11:00', endTime: '12:00' }, after: { startTime: '11:30', endTime: '12:30' } },
    { kind: 'task', id: 'T1', version: 4, before: { dueTime: '16:00' }, after: { dueTime: '16:30' } },
  ]
  assert.deepEqual(applyBody(moves, new Set(['task:T1'])), [{ kind: 'task', id: 'T1', version: 4, dueTime: '16:30' }])
  assert.deepEqual(undoBody([{ ...moves[0], version: 3 }]), [{ kind: 'block', id: '1', version: 3, startTime: '11:00', endTime: '12:00' }])
  assert.equal(moveText(moves[0]), '11:00–12:00 → 11:30–12:30')
  assert.equal(moveText(moves[1]), '마감 16:00 → 16:30')
  assert.doesNotMatch(read('src/features/planner/reschedule.mjs'), /kind: 'schedule'/)
})

test('화면: 일정은 옮기지 않는다고 밝히고, 고른 것만 옮기며 되돌리기가 있고, 계획 블록은 글자로 구분한다', () => {
  const dialog = read('src/components/RescheduleDialog.vue')
  assert.match(dialog, /일정은 다른 사람과의 약속일 수 있어 옮기지 않아요/)
  assert.match(dialog, /tr\('고른 \{n\}개 옮기기', \{ n: chosen\.size \}\)/)
  assert.match(dialog, /@click="undo">\{\{ tr\('되돌리기'\) \}\}<\/button>/)
  assert.match(dialog, /다른 곳에서 먼저 바뀌어 옮기지 않은 항목이 있어요/)
  const planner = read('src/views/planner/PlannerDailyView.vue')
  assert.match(planner, /class="plan plan-block"/)
  assert.match(planner, /<small class="plan-block-tag" aria-hidden="true">\{\{ tr\('블록'\) \}\}<\/small>/)
  assert.match(planner, /<span class="sr-only">\{\{ tr\('계획 블록 · /)
  assert.match(planner, /v-if="session\.userId" type="button" class="button-text" @click="rescheduling = true">\{\{ tr\('계획이 밀렸나요\?'\) \}\}/)
})
