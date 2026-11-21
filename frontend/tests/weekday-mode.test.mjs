// 평일·주말 기본 하루 모드가 날짜가 바뀔 때만 적용되고, 열린 작성 창과 그날 직접 고른 모드를 바꾸지 않는지 검사한다(PR-19 UF-133, UT-235).
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { cleanSchedule, isWeekend, nextMode, scheduledMode } from '../src/features/mode/weekdayMode.mjs'
import { accountToday } from '../src/features/quickInput/parseQuickInput.mjs'
import { applyWeekdayMode, modeState, setWeekdaySchedule } from '../src/store/modeProfiles.js'

const read = (path) => readFileSync(new URL('../src/' + path, import.meta.url), 'utf8')

test('저장값은 허용값으로 정리하고 꺼져 있으면 아무 모드도 고르지 않는다', () => {
  assert.deepEqual(cleanSchedule(null), { enabled: false, weekday: 'J', weekend: 'P', appliedFor: '' })
  assert.deepEqual(cleanSchedule({ enabled: 'yes', weekday: 'X', weekend: 'B', appliedFor: '11/21' }), { enabled: false, weekday: 'J', weekend: 'B', appliedFor: '' })
  assert.deepEqual([isWeekend('2026-11-20'), isWeekend('2026-11-21'), isWeekend('2026-11-22'), isWeekend('2026-11-23')], [false, true, true, false])
  assert.equal(scheduledMode(cleanSchedule({ enabled: false }), '2026-11-21'), null)
  assert.equal(scheduledMode(cleanSchedule({ enabled: true }), 'bad'), null)
})

test('UT-235 금요일 23:59에서 토요일이 되면 새 모드가 되고, 열린 작성 창은 연 때의 모드를 쓴다', () => {
  const zone = { timeZone: 'Asia/Seoul', startHour: 0 }
  const friday = accountToday(zone, new Date('2026-11-20T14:59:00Z')) // 서울 23:59
  const saturday = accountToday(zone, new Date('2026-11-20T15:00:30Z')) // 서울 00:00
  assert.deepEqual([friday, saturday], ['2026-11-20', '2026-11-21'])
  const schedule = cleanSchedule({ enabled: true, weekday: 'J', weekend: 'P' })
  const first = nextMode({ activeMode: 'B', schedule }, friday)
  assert.deepEqual(first, { activeMode: 'J', appliedFor: friday, changed: true })
  schedule.appliedFor = first.appliedFor
  assert.equal(nextMode({ activeMode: 'J', schedule }, friday), null)
  assert.deepEqual(nextMode({ activeMode: 'J', schedule }, saturday), { activeMode: 'P', appliedFor: saturday, changed: true })
  // 작성 창·루틴 수정 창은 열 때의 모드로 필드를 고른다
  const composer = read('components/PostComposer.vue')
  assert.match(composer, /const composeMode = modeState\.activeMode\n/)
  assert.match(composer, /function on\(section, field\) \{ return isFieldOn\(composeMode, section, field\) \}/)
  const routine = read('views/routines/RoutineListView.vue')
  assert.match(routine, /return isFieldOn\(formMode\.value, 'routine', key\)/)
  assert.match(routine, /formMode\.value = modeState\.activeMode\n {2}showModal\.value = true/)
})

test('하루 시작 시각이 4시면 토요일 새벽 2시는 아직 금요일이라 평일 모드다', () => {
  const today = accountToday({ timeZone: 'Asia/Seoul', startHour: 4 }, new Date('2026-11-20T17:00:00Z')) // 서울 토 02:00
  assert.equal(today, '2026-11-20')
  assert.equal(scheduledMode(cleanSchedule({ enabled: true, weekday: 'J', weekend: 'P' }), today), 'J')
})

test('같은 날 직접 고른 모드는 덮어쓰지 않고, 설정을 바꾸면 오늘 다시 맞춘다', () => {
  modeState.activeMode = 'B'
  setWeekdaySchedule({ enabled: true, weekday: 'J', weekend: 'P' })
  assert.equal(applyWeekdayMode('2026-11-21'), true)
  assert.equal(modeState.activeMode, 'P')
  modeState.activeMode = 'J' // 토요일이지만 직접 계획 중심으로 바꿨다
  assert.equal(applyWeekdayMode('2026-11-21'), false)
  assert.equal(modeState.activeMode, 'J')
  assert.equal(applyWeekdayMode('2026-11-23'), false) // 월요일 평일 모드가 이미 계획 중심이라 바뀐 것은 없다
  assert.equal(modeState.weekdaySchedule.appliedFor, '2026-11-23')
  assert.equal(modeState.activeMode, 'J')
  setWeekdaySchedule({ weekday: 'B' })
  assert.equal(modeState.weekdaySchedule.appliedFor, '')
  assert.equal(applyWeekdayMode('2026-11-23'), true)
  assert.equal(modeState.activeMode, 'B')
  setWeekdaySchedule({ enabled: false })
  assert.equal(applyWeekdayMode('2026-11-24'), false)
  assert.equal(modeState.activeMode, 'B')
})

test('앱은 시작·1분마다·화면 복귀·하루 기준 로드 때 확인하고, 설정 화면은 이 브라우저 저장임을 밝힌다', () => {
  const app = read('App.vue')
  assert.match(app, /setInterval\(checkWeekdayMode, 60000\)/)
  assert.match(app, /visibilitychange/)
  assert.match(app, /dayBoundary\.state\.timeZone, dayBoundary\.state\.startHour/)
  const env = read('views/settings/SettingsEnvView.vue')
  assert.match(env, /평일과 주말에 다른 모드 쓰기/)
  assert.match(env, /이 브라우저에 저장돼요/)
})
