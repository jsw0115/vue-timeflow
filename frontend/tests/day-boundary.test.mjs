// 하루 시작 시각 기준의 하루 범위, 프로필 저장 본문, 계정 전환 때 늦은 응답 폐기를 검증한다(PR-08 4단계, TS-33).
import test from 'node:test'
import assert from 'node:assert/strict'
import { ref } from 'vue'
import { createDayBoundary, dayRange, profileBody } from '../src/features/records/dayBoundary.mjs'

const HOUR = 3600 * 1000

test('UT-147: 하루 시작이 04:00이면 그날 04:00부터 다음 날 04:00 직전까지다', () => {
  const previous = process.env.TZ
  process.env.TZ = 'Asia/Seoul'
  try {
    const day = dayRange('2026-11-18', 4)
    assert.equal(new Date(day.start).toISOString(), '2026-11-17T19:00:00.000Z')
    assert.equal(day.end - day.start, 24 * HOUR)
    const record = Date.parse('2026-11-18T18:00:00Z') // 서울 11-19 03:00
    assert.ok(record >= day.start && record < day.end, '11-19 03:00 기록은 11-18 하루에 들어간다')
    assert.ok(record < dayRange('2026-11-19', 4).start)
    assert.ok(record >= dayRange('2026-11-19', 0).start, '자정 기준이면 11-19 기록이다')
  } finally { process.env.TZ = previous }
})

test('UT-148: 서머타임 날은 25시간·23시간이고 이웃한 날과 빈틈·겹침이 없다', () => {
  const previous = process.env.TZ
  process.env.TZ = 'America/New_York'
  try {
    assert.equal(dayRange('2026-11-01', 0).end - dayRange('2026-11-01', 0).start, 25 * HOUR)
    assert.equal(dayRange('2026-03-08', 0).end - dayRange('2026-03-08', 0).start, 23 * HOUR)
    assert.equal(dayRange('2026-10-31', 0).end, dayRange('2026-11-01', 0).start)
    assert.equal(dayRange('2026-11-01', 0).end, dayRange('2026-11-02', 0).start)
  } finally { process.env.TZ = previous }
})

test('프로필 저장은 하루 시작·시간대와 함께 이미 있는 소개·모드를 보내 지워지지 않게 한다', () => {
  const profile = { nickname: '지수', timeZone: 'Asia/Seoul', extra: { intro: '안녕하세요', mode: 'P', dayStartHour: 0 } }
  assert.deepEqual(profileBody(profile, { timeZone: 'Asia/Seoul', dayStartHour: 4 }), { nickname: '지수', timeZone: 'Asia/Seoul', dayStartHour: 4, intro: '안녕하세요', mode: 'P' })
  assert.deepEqual(profileBody({ nickname: '지수', extra: {} }, { timeZone: 'UTC', dayStartHour: 0 }), { nickname: '지수', timeZone: 'UTC', dayStartHour: 0 })
})

test('불러온 하루 시작·시간대를 쓰고, 저장 결과를 반영하며, 계정이 바뀐 뒤 온 응답은 버린다', async () => {
  const owner = ref('u1'), calls = []
  let release
  const request = async (url, options = {}) => {
    calls.push({ url, method: options.method ?? 'GET', body: options.body && JSON.parse(options.body) })
    if (options.method === 'PUT') return { nickname: '지수', timeZone: 'Asia/Seoul', extra: { dayStartHour: JSON.parse(options.body).dayStartHour } }
    if (owner.value === 'slow') await new Promise((resolve) => { release = resolve })
    return { nickname: '지수', timeZone: 'Asia/Seoul', extra: { dayStartHour: 2 } }
  }
  const boundary = createDayBoundary({ request, owner: () => owner.value })
  await boundary.load()
  assert.equal(boundary.state.startHour, 2)
  await boundary.save({ timeZone: 'Asia/Seoul', dayStartHour: 4 })
  assert.equal(boundary.state.startHour, 4)
  assert.deepEqual(calls[1], { url: '/api/user/profile', method: 'PUT', body: { nickname: '지수', timeZone: 'Asia/Seoul', dayStartHour: 4 } })

  owner.value = 'slow'
  const slow = boundary.load()
  owner.value = null
  await boundary.load()
  release()
  await slow
  assert.equal(boundary.state.status, 'idle')
  assert.equal(boundary.state.startHour, 0, '로그아웃 뒤 이전 계정의 늦은 응답을 반영하지 않는다')
  await assert.rejects(boundary.save({ timeZone: 'UTC', dayStartHour: 1 }), /불러온 뒤에/)
})
