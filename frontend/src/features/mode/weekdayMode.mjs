// 평일·주말 기본 하루 모드 규칙(PR-19 UF-133, CF-002). 계정의 하루 기준 날짜가 바뀔 때만 모드를 바꾸고, 같은 날 직접 고른 모드는 그대로 둔다.

export const MODES = ['J', 'P', 'B']
const DEFAULTS = { enabled: false, weekday: 'J', weekend: 'P', appliedFor: '' }
const ISO = /^\d{4}-\d{2}-\d{2}$/

/** 저장값을 믿지 않고 허용값으로 정리한다. 모르는 모드는 기본값으로 돌린다. */
export function cleanSchedule(raw) {
  const value = raw && typeof raw === 'object' ? raw : {}
  return {
    enabled: value.enabled === true,
    weekday: MODES.includes(value.weekday) ? value.weekday : DEFAULTS.weekday,
    weekend: MODES.includes(value.weekend) ? value.weekend : DEFAULTS.weekend,
    appliedFor: ISO.test(value.appliedFor ?? '') ? value.appliedFor : '',
  }
}

/** 토요일·일요일이면 주말이다. 날짜는 계정 하루 기준(YYYY-MM-DD)으로 받는다. */
export function isWeekend(isoDate) {
  const day = new Date(isoDate + 'T00:00:00Z').getUTCDay()
  return day === 0 || day === 6
}

/** 그날 써야 할 모드. 꺼져 있거나 날짜가 잘못되면 null이다. */
export function scheduledMode(schedule, today) {
  if (!schedule?.enabled || !ISO.test(today ?? '')) return null
  return isWeekend(today) ? schedule.weekend : schedule.weekday
}

/**
 * 오늘 처음 확인할 때만 예약된 모드로 바꾼다. 바꿀 것이 없으면 null.
 * appliedFor가 오늘이면 그 뒤 사용자가 직접 바꾼 모드를 덮어쓰지 않는다.
 */
export function nextMode({ activeMode, schedule }, today) {
  const mode = scheduledMode(schedule, today)
  if (!mode || schedule.appliedFor === today) return null
  return { activeMode: mode, appliedFor: today, changed: mode !== activeMode }
}
