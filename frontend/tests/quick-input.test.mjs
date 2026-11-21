// 빠른 입력 해석 규칙(UT-216~UT-219)과 종류별 초안, 계정 기준 오늘, 홈 연결을 검사한다(PR-09 3단계).
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { accountToday, dateLabel, draftFor, parseQuickInput, timeLabel } from '../src/features/quickInput/parseQuickInput.mjs'

const BASE = '2026-11-18' // 수요일

test('UT-216 "내일 오후 3시 치과"는 11-19 15:00 "치과" 일정 후보다', () => {
  const r = parseQuickInput('내일 오후 3시 치과', BASE)
  assert.deepEqual([r.date, r.times, r.timeChosen, r.title, r.suggestedKind], ['2026-11-19', ['15:00'], '15:00', '치과', '일정'])
  assert.deepEqual(draftFor('일정', r), { title: '치과', startDate: '2026-11-19', endDate: '2026-11-19', startTime: '15:00', endTime: '16:00' })
})

test('UT-217 다음 주 월요일·월말·자정까지', () => {
  assert.equal(parseQuickInput('다음 주 월요일 회의', BASE).date, '2026-11-23')
  assert.equal(parseQuickInput('월말 정산', BASE).date, '2026-11-30')
  const midnight = parseQuickInput('자정까지 보고서', BASE)
  // 자정은 그날이 끝나는 때 = 다음 날 00:00. 할 일로 제안하고, 할 일 마감 날짜는 그날이다
  assert.deepEqual([midnight.date, midnight.times, midnight.title, midnight.suggestedKind], ['2026-11-19', ['00:00'], '보고서', '할 일'])
  assert.deepEqual(draftFor('할 일', midnight), { title: '보고서', date: '2026-11-18' })
  assert.equal(parseQuickInput('오늘 밤 12시 마감', BASE).date, '2026-11-19')
  assert.equal(parseQuickInput('월말', '2026-12-05').date, '2026-12-31')
})

test('UT-218 "3시 미팅"은 03:00·15:00 두 후보이고 자동으로 고르지 않는다', () => {
  const r = parseQuickInput('3시 미팅', BASE)
  assert.deepEqual([r.times, r.timeChosen, r.title], [['03:00', '15:00'], null, '미팅'])
  assert.equal(draftFor('일정', r), null)
  assert.deepEqual(draftFor('일정', { ...r, timeChosen: '15:00' }).startTime, '15:00')
})

test('UT-219 "그거 해야 함"은 날짜 없이 원문 그대로 메모 초안이다', () => {
  const r = parseQuickInput('그거 해야 함', BASE)
  assert.deepEqual([r.parsed, r.date, r.suggestedKind, r.raw], [false, null, '메모', '그거 해야 함'])
  assert.deepEqual(draftFor('메모', r), { title: '그거 해야 함' })
})

test('그 밖의 규칙: 24시간제·반·날짜 표기·요일·잘못된 날짜', () => {
  assert.deepEqual(parseQuickInput('11월 25일 14:30 면접', BASE).times, ['14:30'])
  assert.deepEqual(parseQuickInput('금요일 저녁 7시 반 약속', BASE).times, ['19:30'])
  assert.equal(parseQuickInput('금요일 약속', BASE).date, '2026-11-20')
  assert.equal(parseQuickInput('수요일 약속', BASE).date, BASE)
  assert.equal(parseQuickInput('10일 월세', BASE).date, '2026-12-10')
  assert.equal(parseQuickInput('2월 30일 일정', BASE).date, null)
  assert.equal(parseQuickInput('오후 11시 반 마감', BASE).timeChosen, '23:30')
  assert.deepEqual(draftFor('일정', parseQuickInput('오후 11시 반 마감', BASE)).endDate, '2026-11-19')
  assert.equal(dateLabel('2026-11-19'), '11월 19일 (목)')
  assert.equal(timeLabel('00:00'), '오전 12시')
  assert.equal(timeLabel('15:30'), '오후 3시 30분')
})

test('계정 시간대와 하루 시작 시각으로 오늘을 정한다', () => {
  const now = new Date('2026-11-18T17:30:00Z') // 서울 11-19 02:30
  assert.equal(accountToday({ timeZone: 'Asia/Seoul', startHour: 0 }, now), '2026-11-19')
  assert.equal(accountToday({ timeZone: 'Asia/Seoul', startHour: 4 }, now), '2026-11-18')
})

test('홈은 빠른 기록 컴포넌트를 쓰고, 작성 창과 같은 저장 경로를 쓴다', () => {
  const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8')
  assert.match(read('../src/views/home/HomeView.vue'), /<QuickCapture /)
  const capture = read('../src/components/QuickCapture.vue')
  assert.match(capture, /savePostDraft\(which, full\.value\)/)
  assert.match(capture, /할 일은 마감 날짜만 저장돼요/)
})
