export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
export const integerBetween = (value, min, max) => Number.isInteger(value) && value >= min && value <= max
export function rangeError(startDate, startTime, endDate, endTime) {
  if (![startDate, startTime, endDate, endTime].every(Boolean)) return '시작·종료 날짜와 시간을 모두 입력해주세요.'
  if (![startDate, endDate].every(value => /^\d{4}-\d{2}-\d{2}$/.test(value)) || ![startTime, endTime].every(value => /^([01]\d|2[0-3]):[0-5]\d$/.test(value))) return '올바른 날짜와 시간을 입력해주세요.'
  const start = new Date(`${startDate}T${startTime}`)
  const end = new Date(`${endDate}T${endTime}`)
  if (!Number.isFinite(+start) || !Number.isFinite(+end) || localDate(start) !== startDate || localDate(end) !== endDate) return '올바른 날짜와 시간을 입력해주세요.'
  return end <= start ? '종료 일시는 시작 일시보다 늦어야 해요.' : ''
}
export function challengeError(draft, communities) {
  if (!communities.some(c => c.id === draft.communityId && c.joined)) return '참여 중인 커뮤니티를 선택해주세요.'
  if (!draft.title.trim()) return '챌린지 이름을 입력해주세요.'
  if (!integerBetween(draft.days, 3, 100)) return '기간은 3~100일 사이의 정수로 입력해주세요.'
  if (!integerBetween(draft.startsIn, 0, 30)) return '시작까지 남은 일수는 0~30일로 입력해주세요.'
  return ''
}

export function routineError(d) {
  if (!d.title.trim()) return '이름을 입력해주세요.'
  if (!Array.isArray(d.days) || !d.days.length || !d.days.every(day => integerBetween(day, 0, 6))) return '반복 요일을 선택해주세요.'
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(d.time)) return '시작 시간을 입력해주세요.'
  if (!integerBetween(d.duration, 1, 1440)) return '진행 시간은 1~1,440분으로 입력해주세요.'
  if (!integerBetween(d.goalCount, 1, 9999) || !d.goalUnit.trim()) return '목표 수량과 단위를 확인해주세요.'
  if (d.notify && !integerBetween(d.reminderMinutes, 0, 1440)) return '알림 시간을 확인해주세요.'
  return ''
}

export function workRecordError(d) {
  if (!d.title.trim() || !d.owner.trim()) return '제목과 담당자를 입력해주세요.'
  const dates = rangeError(d.startDate, d.startTime, d.endDate, d.endTime)
  if (dates) return dates
  if (d.type === '반차' && d.startDate !== d.endDate) return '반차의 시작·종료 날짜는 같아야 해요.'
  if (d.type === '연차' && (!Number.isFinite(d.leaveDays) || d.leaveDays < 0.5 || d.leaveDays > 365 || d.leaveDays % 0.5)) return '사용 연차는 0.5일 단위로 입력해주세요 (최대 365일).'
  if (['외근', '출장'].includes(d.type) && !d.location.trim()) return '방문 장소를 입력해주세요.'
  if (d.type === '출장' && (!Number.isFinite(d.expense) || d.expense < 0 || d.expense > 100000000)) return '예상 경비를 0~100,000,000원으로 입력해주세요.'
  if (d.type === '이직' && (!d.toCompany.trim() || !d.role.trim())) return '이직할 회사와 직무를 입력해주세요.'
  return ''
}
