// 통계 수치와 그 수치를 만든 원본 목록을 서버 응답에서 꺼내고, 기간·시간대·기록 수 문구를 만든다(PR-10 6단계, UF-118).
import { korean } from '../i18n/translate.mjs'

export const EMPTY_TEXT = '기록이 아직 없어요.'

/** 화면 기간 이름과 서버 range 값 */
export const RANGES = [
  { id: 'week', label: '이번 주' },
  { id: 'month', label: '이번 달' },
  { id: 'year', label: '올해' },
]

/** 서버 수치 이름과 원본 목록 이름. tasks는 분이 아니라 완료 개수다. */
export const FIGURES = [
  { key: 'actual', label: '실제 기록 시간', field: 'actualMinutes', unit: 'minutes' },
  { key: 'planned', label: '계획 시간', field: 'plannedMinutes', unit: 'minutes' },
  { key: 'focus', label: '집중 시간', field: 'focusMinutes', unit: 'minutes' },
  { key: 'tasks', label: '완료한 할 일', field: 'completedTasks', unit: 'count' },
]
export const figureOf = (key) => FIGURES.find((figure) => figure.key === key) ?? null

export const SOURCE_KIND = { schedule: '일정', planner: '플래너 블록', recording: '실제 기록', focus: '집중 세션', task: '할 일' }

/** 분 수치 문구. t는 화면 표시용 번역(기본 한국어)이다. */
export function formatMinutes(total, t = korean) {
  const n = Math.max(0, Math.round(Number(total) || 0))
  const h = Math.floor(n / 60), m = n % 60
  if (!h) return t('{n}분', { n: m })
  return m ? t('{n}시간 {m}분', { n: h, m }) : t('{n}시간', { n: h })
}

export const periodText = (stats) => (stats.from === stats.to ? stats.from : `${stats.from} ~ ${stats.to}`)

/** 집계 기준 시간대와 하루 시작 시각. 하루가 0시에 시작하면 시작 시각은 적지 않는다. */
export function zoneText(stats, t = korean) {
  const hour = Number(stats.dayStartHour) || 0
  return t('{zone} 기준', { zone: stats.timeZone }) + (hour ? ' · ' + t('하루는 {time}에 시작', { time: String(hour).padStart(2, '0') + ':00' }) : '')
}

/** 수치의 원본 행. 할 일은 완료한 것만 수치에 들어가므로 완료한 것만 돌려준다. */
export function sourceRows(stats, key) {
  const rows = stats?.sources?.[key] ?? []
  return key === 'tasks' ? rows.filter((row) => row.done) : rows
}

/** 원본 목록 합계. 분 수치는 분 합계, 할 일은 개수다. 화면은 이 값이 수치와 같은지 함께 보인다. */
export function sourceTotal(rows, key) {
  return key === 'tasks' ? rows.length : rows.reduce((sum, row) => sum + (Number(row.minutes) || 0), 0)
}

/**
 * 수치 하나를 화면 값으로 바꾼다. 원본이 하나도 없으면 0 대신 "기록이 아직 없어요"를 보이게 empty를 켠다(UT-201).
 * 추정 문장은 만들지 않는다.
 */
export function figureSummary(stats, key, t = korean) {
  const figure = figureOf(key)
  const rows = sourceRows(stats, key)
  const value = Number(stats?.[figure.field]) || 0
  return {
    key,
    label: t(figure.label),
    value,
    text: rows.length ? (figure.unit === 'count' ? t('{n}개', { n: value }) : formatMinutes(value, t)) : t(EMPTY_TEXT),
    count: rows.length,
    empty: rows.length === 0,
    period: periodText(stats),
    zone: zoneText(stats, t),
  }
}

/** 원본 목록 화면 주소. 같은 기간을 다시 부르도록 range와 기간 첫날을 넘긴다. */
export const sourcePath = (key, range, stats) => `/stats/sources?figure=${encodeURIComponent(key)}&range=${encodeURIComponent(range)}&date=${encodeURIComponent(stats.from)}`

export function statsErrorText(error) {
  if (error?.status == null || error.status === 0) return '서버에 연결하지 못했어요. 연결을 확인하고 다시 시도해 주세요.'
  return error.message || '통계를 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요.'
}

/** request는 apiRequest처럼 성공 응답의 data를 돌려주고 실패면 status를 담아 던지는 함수다. */
export function createStatsClient({ request }) {
  return {
    dashboard: (range = 'week', date = '') => request(`/api/stat/dashboard?range=${encodeURIComponent(range)}${date ? '&date=' + encodeURIComponent(date) : ''}`),
  }
}
