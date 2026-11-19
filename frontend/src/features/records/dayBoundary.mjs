// 계정의 하루 시작 시각(0~6시 정시)과 시간대를 불러오고 저장하며, 그 기준으로 하루의 범위를 계산한다(PR-08 4단계, UF-94·UF-95).
import { reactive, watch } from 'vue'
import { session } from '../auth/session.js'
import { apiRequest } from '../auth/apiRequest.js'

export const START_HOURS = [0, 1, 2, 3, 4, 5, 6]

/**
 * 날짜(YYYY-MM-DD)의 범위를 이 브라우저 시간대의 밀리초로 돌려준다. 그날 시작 시각부터 다음 날 시작 시각 직전까지다.
 * 서머타임으로 하루가 23·25시간이어도 벽시계 기준으로 다음 날 같은 시각에서 끝난다.
 */
export function dayRange(date, startHour = 0) {
  const start = new Date(date + 'T00:00:00')
  start.setHours(startHour, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { start: +start, end: +end }
}

/** 프로필 PUT은 보낸 키로 추가 정보를 통째로 바꾼다. 이미 있는 소개·모드를 함께 보내 지워지지 않게 한다. */
export function profileBody(profile, { timeZone, dayStartHour }) {
  const extra = profile.extra ?? {}
  return {
    nickname: profile.nickname, timeZone, dayStartHour,
    ...(extra.intro != null ? { intro: extra.intro } : {}),
    ...(extra.mode != null ? { mode: extra.mode } : {}),
  }
}

export function createDayBoundary({ request = apiRequest, owner = () => session.userId } = {}) {
  const state = reactive({ status: 'idle', profile: null, startHour: 0, timeZone: '' })
  let generation = 0
  const apply = (profile) => Object.assign(state, { status: 'ready', profile, startHour: Number(profile.extra?.dayStartHour ?? 0), timeZone: profile.timeZone })

  async function load() {
    const expected = ++generation
    if (!owner()) { Object.assign(state, { status: 'idle', profile: null, startHour: 0, timeZone: '' }); return }
    state.status = 'loading'
    try {
      const profile = await request('/api/user/profile')
      if (expected === generation) apply(profile)
    } catch {
      if (expected === generation) state.status = 'error'
    }
  }
  /** 불러온 프로필을 기준으로 저장한다. 계정이 바뀌는 사이에 온 응답은 반영하지 않는다. */
  async function save(values) {
    if (!state.profile) throw new Error('계정 설정을 불러온 뒤에 저장할 수 있어요.')
    const expected = generation
    const profile = await request('/api/user/profile', { method: 'PUT', body: JSON.stringify(profileBody(state.profile, values)) })
    if (expected === generation) apply(profile)
    return profile
  }
  return { state, load, save }
}

export const dayBoundary = createDayBoundary()
watch(() => session.userId, () => { void dayBoundary.load() }, { immediate: true })
