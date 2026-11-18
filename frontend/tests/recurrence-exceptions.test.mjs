// 반복 규칙의 쉬는 날 예외 검증·적용과 쉬는 날 추가·해제 도우미를 서버 규칙과 같게 검증한다(UF-134, IM-14).
import test from 'node:test'
import assert from 'node:assert/strict'
import { MAX_EXCEPTIONS, makeRecurrence, occurrenceDates, eventOccurrences, recurrenceError, skipDates, addSkipDates, removeSkipDate, datesBetween } from '../src/utils/recurrence.mjs'

const weekly = (weekdays, exceptions) => makeRecurrence({ frequency: 'weekly', weekdays, ...(exceptions ? { exceptions } : {}) })
const skip = date => ({ date, action: 'skip' })

test('쉬는 날은 회차에서 빠지고 횟수 종료 반복은 뒤로 늘어나지 않는다', () => {
  assert.deepEqual(occurrenceDates('2026-11-09', weekly([1, 2, 3, 4, 5], [skip('2026-11-11')]), '2026-11-09', '2026-11-13'), ['2026-11-09', '2026-11-10', '2026-11-12', '2026-11-13'])
  const counted = makeRecurrence({ frequency: 'daily', endMode: 'count', count: 3, exceptions: [skip('2026-11-02')] })
  assert.deepEqual(occurrenceDates('2026-11-01', counted, '2026-11-01', '2026-11-10'), ['2026-11-01', '2026-11-03'])
  assert.deepEqual(occurrenceDates('2026-11-01', { frequency: 'none', exceptions: [skip('2026-11-01')] }, '2026-11-01', '2026-11-01'), [])
  const [only] = eventOccurrences([{ id: 7, startDate: '2026-11-01', endDate: '2026-11-01', startTime: '09:00', recurrence: counted }], '2026-11-01', '2026-11-03').slice(1)
  assert.equal(only.occurrenceKey, '7:2026-11-03')
})

test('예외 목록은 최대 366개, 날짜 중복·잘못된 날짜·지원하지 않는 action을 거부한다', () => {
  const full = datesBetween('2026-01-01', '2027-01-01').map(skip)
  assert.equal(full.length, MAX_EXCEPTIONS)
  assert.equal(recurrenceError(weekly([1], full), '2026-01-01'), '')
  assert.notEqual(recurrenceError(weekly([1], [...full, skip('2027-01-02')]), '2026-01-01'), '')
  assert.notEqual(recurrenceError(weekly([1], [skip('2026-11-11'), skip('2026-11-11')]), '2026-01-01'), '')
  assert.notEqual(recurrenceError(weekly([1], [skip('2026-11-31')]), '2026-01-01'), '')
  assert.notEqual(recurrenceError(weekly([1], [{ date: '2026-11-11', action: 'override' }]), '2026-01-01'), '')
  assert.notEqual(recurrenceError(weekly([1], '2026-11-11'), '2026-01-01'), '')
  assert.notEqual(recurrenceError({ frequency: 'none', exceptions: [skip('2026-11-31')] }, '2026-01-01'), '')
})

test('쉬는 날 추가는 중복 없이 날짜순으로 합치고, 해제는 그 날짜만 뺀다. 원래 규칙은 바꾸지 않는다', () => {
  const rule = weekly([1, 2, 3, 4, 5], [skip('2026-11-25')])
  const next = addSkipDates(rule, ['2026-11-21', '2026-11-20', '2026-11-25'])
  assert.deepEqual(next.exceptions, [skip('2026-11-20'), skip('2026-11-21'), skip('2026-11-25')])
  assert.deepEqual(rule.exceptions, [skip('2026-11-25')])
  assert.deepEqual([...skipDates(next)], ['2026-11-20', '2026-11-21', '2026-11-25'])
  assert.deepEqual(removeSkipDate(next, '2026-11-21').exceptions, [skip('2026-11-20'), skip('2026-11-25')])
  assert.deepEqual([...skipDates(undefined)], [])
  assert.deepEqual(addSkipDates(undefined, ['2026-11-20']).exceptions, [skip('2026-11-20')])
})

test('기간은 양 끝을 포함한 날짜 목록이고, 잘못된 기간은 빈 목록이다', () => {
  assert.deepEqual(datesBetween('2026-11-20', '2026-11-22'), ['2026-11-20', '2026-11-21', '2026-11-22'])
  assert.deepEqual(datesBetween('2026-11-22', '2026-11-20'), [])
  assert.deepEqual(datesBetween('2026-11-31', '2026-12-02'), [])
  assert.equal(datesBetween('2026-03-08', '2026-03-09').length, 2)
  assert.deepEqual(datesBetween('2026-01-01', '2027-01-02'), [], '367일 이상은 한 번에 만들지 않는다')
})
