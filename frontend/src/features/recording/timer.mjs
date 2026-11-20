// 집중 화면의 타이머 종류·분 입력 검사·시계 문구·상태 문구·오늘 끝낸 타이머 기록을 정한다(PR-09 2단계, UF-120).

/** 타이머 세 가지. 포모도로·카운트다운은 목표 시간이 있고 스톱워치는 없다. */
export const MODES = [
  { id: 'pomodoro', label: '포모도로' },
  { id: 'countdown', label: '카운트다운' },
  { id: 'stopwatch', label: '스톱워치' },
]
export const POMODORO_MINUTES = 25
export const modeLabel = (mode) => MODES.find((item) => item.id === mode)?.label ?? '실제 기록'

/** 카운트다운 분 입력 검사. 서버와 같은 1~1,440분 정수다(UT-211). 맞으면 빈 문자열이다. */
export function minutesError(value) {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 1440 ? '' : '1분부터 1,440분까지 정수로 입력해 주세요.'
}

/** 초를 시계 문구로 바꾼다. 한 시간이 넘으면 시간도 적는다. */
export function clockText(total) {
  const seconds = Math.max(0, Math.floor(Number(total) || 0))
  const h = Math.floor(seconds / 3600), m = Math.floor((seconds % 3600) / 60), s = seconds % 60
  const pad = (n) => String(n).padStart(2, '0')
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

/** 화면 상태 문구. 종료 요청을 보관 중이면 그 사실을 먼저 알린다. */
export function timerStatus(active, pending) {
  if (pending?.kind === 'finish') return '종료 저장 대기'
  if (!active) return '집중 대기'
  return active.state === 'PAUSED' ? '일시정지' : '집중 중'
}

/** 그 시간대의 날짜(YYYY-MM-DD). */
export function dateIn(at, timeZone) {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(at))
}

/** 오늘 시작해 끝낸 타이머 기록. 모드 없는 플래너 기록과 진행 중 기록은 뺀다. 최근 것이 먼저다. */
export function todayTimerRecords(rows, today, timeZone) {
  return rows
    .filter((row) => row.mode && row.state === 'COMPLETED' && dateIn(Date.parse(row.startedAt), timeZone) === today)
    .sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt))
}
