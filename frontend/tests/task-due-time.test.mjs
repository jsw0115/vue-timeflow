// 할 일 마감 시각(Q-31): 선택 입력이고 마감일이 있을 때만 보내며, 빠른 입력은 하나로 정한 시각을 마감 시각으로 넣는다.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { taskBody, taskFromServer, taskFieldsChanged } from '../src/features/records/taskRecords.mjs'
import { draftFor, parseQuickInput } from '../src/features/quickInput/parseQuickInput.mjs'

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8')

test('서버 값 ↔ 화면 값: 시각은 마감일이 있을 때만 보내고, 비우면 null로 지운다', () => {
  assert.equal(taskFromServer({ id: 't', version: 1, title: 'a', due: '2026-11-23', dueTime: '15:00' }).dueTime, '15:00')
  assert.equal(taskFromServer({ id: 't', version: 1, title: 'a' }).dueTime, '')
  assert.equal(taskBody({ title: 'a', date: '2026-11-23', dueTime: '15:00' }).dueTime, '15:00')
  assert.equal(taskBody({ title: 'a', date: '', dueTime: '15:00' }).dueTime, null)
  assert.equal(taskBody({ title: 'a', date: '2026-11-23', dueTime: '' }).dueTime, null)
  assert.equal(taskFieldsChanged({ title: 'a', body: '', date: '2026-11-23', dueTime: '', category: '', priority: '보통' }, { title: 'a', body: '', date: '2026-11-23', dueTime: '09:00', category: '', priority: '보통' }), true)
})

test('빠른 입력: "내일 오후 3시 치과"를 할 일로 바꾸면 마감 시각 15:00, 자정 마감은 시각 없이 전날, 오전·오후 모호하면 고를 때만', () => {
  const today = '2026-11-22'
  assert.deepEqual(draftFor('할 일', parseQuickInput('내일 오후 3시 치과', today)), { title: '치과', date: '2026-11-23', dueTime: '15:00' })
  const midnight = parseQuickInput('내일 자정까지 보고서', today)
  assert.equal(draftFor('할 일', midnight).dueTime, undefined)
  const ambiguous = parseQuickInput('내일 3시 회의', today)
  assert.equal(ambiguous.times.length, 2)
  assert.equal(draftFor('할 일', ambiguous).dueTime, undefined)
  assert.equal(draftFor('할 일', { ...ambiguous, timeChosen: '15:00' }).dueTime, '15:00')
})

test('작성 창·상세 화면에 선택 입력란이 있고 마감일 없이는 막는다', () => {
  const composer = read('../src/components/PostComposer.vue')
  assert.match(composer, /마감 시각 \(선택\)<input v-model="draft\.dueTime" type="time" :disabled="!draft\.date"/)
  assert.match(read('../src/views/tasks/TaskDetailView.vue'), /v-model="draft\.dueTime" :disabled="!draft\.date"/)
  assert.match(read('../src/store/postComposer.js'), /마감 시각은 마감일과 함께 정해 주세요/)
})
