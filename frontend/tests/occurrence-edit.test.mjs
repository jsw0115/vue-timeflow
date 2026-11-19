// 일정 회차 하나 건너뛰기·바꾸기와 "이 회차부터" 분할 도우미가 서버 규칙과 같게 동작하는지 검사한다(PR-22 2단계, UT-250~UT-255).
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  makeRecurrence, recurrenceError, eventOccurrences, addSkipDates, removeException, removeSkipDate,
  overrideFor, setOverride, changedFields, overridesError, splitRecurrence, occurrenceLink,
} from '../src/utils/recurrence.mjs'

const skip = (date) => ({ date, action: 'skip' })
const over = (date, fields) => ({ date, action: 'override', ...fields })
const weekly = (exceptions, extra = {}) => makeRecurrence({ frequency: 'weekly', weekdays: [1, 3], ...extra, ...(exceptions ? { exceptions } : {}) })
const event = (recurrence, extra = {}) => ({ id: 5, title: '주간 회의', startDate: '2026-11-23', endDate: '2026-11-23', startTime: '10:00', endTime: '11:00', time: '10:00', recurrence, ...extra })
const rows = (list, from = '2026-11-01', to = '2027-01-31') => eventOccurrences(list, from, to).map((r) => [r.startDate, r.title, r.startTime, r.endTime]).sort((a, b) => a[0].localeCompare(b[0]))

test('UT-251 회차 하나만 바꾸면 그 회차에만 제목·시간이 적용되고 다른 회차는 그대로다', () => {
  const list = eventOccurrences([event(weekly([over('2026-11-25', { title: '장소 바뀐 회의', startTime: '14:00', endTime: '15:30' })]))], '2026-11-23', '2026-11-30')
  assert.deepEqual(list.map((r) => r.startDate), ['2026-11-23', '2026-11-25', '2026-11-30'])
  const changed = list[1]
  assert.equal(changed.title, '장소 바뀐 회의')
  assert.equal(changed.startTime, '14:00')
  assert.equal(changed.endTime, '15:30')
  assert.equal(changed.time, '14:00')
  assert.equal(changed.date, '2026-11-25 14:00')
  assert.equal(changed.overridden, true)
  assert.equal(list[2].title, '주간 회의')
  assert.equal(list[2].startTime, '10:00')
  assert.equal(list[2].overridden, false)
  // 바꾸지 않은 필드는 원본을 따르고, 여러 날 일정의 종료 시각은 회차 종료일에 적용된다
  const [multi] = eventOccurrences([event(weekly([over('2026-11-25', { endTime: '08:00' })]), { endDate: '2026-11-24', startTime: '22:00', endTime: '06:00', time: '22:00' })], '2026-11-25', '2026-11-25')
  assert.deepEqual([multi.title, multi.startTime, multi.endTime, multi.endDate], ['주간 회의', '22:00', '08:00', '2026-11-26'])
})

test('UT-253 회차 변경 검증은 서버와 같다(필드 허용 목록, HH:mm, 제목 1~200자, 같은 날짜 하나, 종료는 시작 이후)', () => {
  const err = (exceptions) => recurrenceError(weekly(exceptions), '2026-11-23')
  assert.equal(err([over('2026-11-25', { title: '가'.repeat(200), startTime: '11:30', endTime: '12:00' })]), '')
  for (const bad of [
    [{ date: '2026-11-25', action: 'override' }],
    [over('2026-11-25', { category: '개인' })],
    [over('2026-11-25', { startTime: '25:00' })],
    [over('2026-11-25', { startTime: '9:00' })],
    [over('2026-11-25', { title: '   ' })],
    [over('2026-11-25', { title: '가'.repeat(201) })],
    [over('2026-11-25', { title: 3 })],
    [skip('2026-11-25'), over('2026-11-25', { title: 'x' })],
  ]) assert.notEqual(err(bad), '', JSON.stringify(bad))
  assert.notEqual(overridesError(event(weekly([over('2026-11-25', { startTime: '11:30' })]))), '', '원본 종료 11:00보다 늦은 시작')
  assert.notEqual(overridesError(event(weekly([over('2026-11-25', { startTime: '12:00', endTime: '12:00' })]))), '')
  assert.equal(overridesError(event(weekly([over('2026-11-25', { startTime: '11:30', endTime: '12:00' })]))), '')
  assert.equal(overridesError(event(weekly([over('2026-11-25', { endTime: '08:00' })]), { endDate: '2026-11-24', startTime: '22:00', endTime: '06:00' })), '')
  assert.notEqual(overridesError(event(weekly([over('2026-11-25', { startTime: '10:30' })]), { endTime: '10:15' })), '', '원본 시간을 바꿔 기존 변경이 성립하지 않는다')
  assert.equal(overridesError(event(undefined)), '')
})

test('UT-254 바뀐 필드만 저장하고, 원본과 같은 값으로 되돌리면 그 회차의 변경이 지워진다', () => {
  const base = event(weekly([skip('2026-11-30')]))
  assert.deepEqual(changedFields(base, { title: ' 주간 회의 ', startTime: '10:00', endTime: '12:00' }), { endTime: '12:00' })
  assert.deepEqual(changedFields(base, { title: '  새 제목 ', startTime: '10:00', endTime: '11:00' }), { title: '새 제목' })
  const next = setOverride(base.recurrence, '2026-11-25', { endTime: '12:00' })
  assert.deepEqual(next.exceptions, [over('2026-11-25', { endTime: '12:00' }), skip('2026-11-30')])
  assert.deepEqual(base.recurrence.exceptions, [skip('2026-11-30')], '원래 규칙은 바꾸지 않는다')
  assert.deepEqual(overrideFor(next, '2026-11-25'), over('2026-11-25', { endTime: '12:00' }))
  assert.equal(overrideFor(next, '2026-11-23'), null)
  assert.equal(overrideFor(next, '2026-11-30'), null, '쉬는 날은 변경이 아니다')
  assert.deepEqual(setOverride(next, '2026-11-25', { title: '다른 제목' }).exceptions, [over('2026-11-25', { title: '다른 제목' }), skip('2026-11-30')])
  assert.deepEqual(setOverride(next, '2026-11-25', {}).exceptions, [skip('2026-11-30')])
})

test('UT-250 회차 건너뛰기는 같은 날짜의 변경을 대신하고 다른 예외는 남긴다. 되돌리면 회차가 돌아온다', () => {
  const withOverride = setOverride(weekly([skip('2026-11-30')]), '2026-11-25', { title: 'x' })
  const skipped = addSkipDates(withOverride, ['2026-11-25'])
  assert.deepEqual(skipped.exceptions, [skip('2026-11-25'), skip('2026-11-30')])
  assert.deepEqual(addSkipDates(withOverride, ['2026-12-02']).exceptions, [over('2026-11-25', { title: 'x' }), skip('2026-11-30'), skip('2026-12-02')])
  assert.deepEqual(eventOccurrences([event(skipped)], '2026-11-23', '2026-12-02').map((r) => r.startDate), ['2026-11-23', '2026-12-02'])
  const restored = removeException(skipped, '2026-11-25')
  assert.deepEqual(restored.exceptions, [skip('2026-11-30')])
  assert.deepEqual(eventOccurrences([event(restored)], '2026-11-23', '2026-11-25').map((r) => r.startDate), ['2026-11-23', '2026-11-25'])
  assert.equal(removeSkipDate, removeException, '루틴 화면이 쓰는 이름도 같은 동작이다')
})

test('UT-255 "이 회차부터" 분할: 원래 반복은 전날 끝나고, 새 반복이 그 회차부터 이어 회차가 빠지거나 겹치지 않는다', () => {
  const series = event(weekly([skip('2026-11-25'), over('2026-12-02', { title: '특별 회의' }), skip('2026-12-09')]))
  const split = splitRecurrence(series, '2026-12-02')
  assert.equal(split.head.endMode, 'until')
  assert.equal(split.head.until, '2026-12-01')
  assert.deepEqual(split.head.exceptions, [skip('2026-11-25')])
  assert.deepEqual([split.tail.startDate, split.tail.endDate], ['2026-12-02', '2026-12-02'])
  assert.equal(split.tail.recurrence.endMode, 'never')
  assert.deepEqual(split.tail.recurrence.exceptions, [over('2026-12-02', { title: '특별 회의' }), skip('2026-12-09')])
  assert.deepEqual(series.recurrence.exceptions.length, 3, '원래 규칙은 바꾸지 않는다')
  assert.deepEqual(rows([{ ...series, recurrence: split.head }, { ...series, id: 6, ...split.tail }]), rows([series]))

  // 횟수 종료: 쉬는 날을 포함한 앞선 회차 수를 빼고 남은 횟수로 이어 간다
  const counted = event(makeRecurrence({ frequency: 'daily', endMode: 'count', count: 5, exceptions: [skip('2026-11-24')] }))
  const byCount = splitRecurrence(counted, '2026-11-26')
  assert.equal(byCount.tail.recurrence.count, 2)
  assert.equal(byCount.head.until, '2026-11-25')
  assert.deepEqual(rows([{ ...counted, recurrence: byCount.head }, { ...counted, id: 6, ...byCount.tail }]).map((r) => r[0]), ['2026-11-23', '2026-11-25', '2026-11-26', '2026-11-27'])
  assert.deepEqual(rows([counted]).map((r) => r[0]), ['2026-11-23', '2026-11-25', '2026-11-26', '2026-11-27'])

  // 종료일 종료는 새 반복이 같은 종료일을 이어받는다. 여러 날 일정은 기간을 유지한다
  const until = event(weekly(undefined, { endMode: 'until', until: '2026-12-31' }), { endDate: '2026-11-24' })
  const byUntil = splitRecurrence(until, '2026-12-07')
  assert.equal(byUntil.tail.recurrence.until, '2026-12-31')
  assert.deepEqual([byUntil.tail.startDate, byUntil.tail.endDate], ['2026-12-07', '2026-12-08'])
  assert.deepEqual(rows([{ ...until, recurrence: byUntil.head }, { ...until, id: 6, ...byUntil.tail }]), rows([until]))

  // 첫 회차부터 바꾸면 전체 수정과 같고, 반복에 없는 날짜는 나누지 않는다
  assert.equal(splitRecurrence(series, '2026-11-23'), null)
  assert.equal(splitRecurrence(series, '2026-11-24'), null)
  assert.equal(splitRecurrence(event(undefined), '2026-11-23'), null)
})

test('캘린더의 반복 일정 회차는 그 회차를 연 상태로 일정 화면에 연결한다', () => {
  const [first] = eventOccurrences([event(weekly())], '2026-11-25', '2026-11-25')
  assert.equal(occurrenceLink(first), '/events?id=5&occurrence=2026-11-25')
  const [single] = eventOccurrences([event(undefined, { id: 9 })], '2026-11-23', '2026-11-23')
  assert.equal(occurrenceLink(single), '/events?id=9')
})
