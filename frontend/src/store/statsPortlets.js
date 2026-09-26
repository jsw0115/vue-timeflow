import { reactive, watch } from 'vue'
import { modeState } from './modeProfiles'

/**
 * 통계 화면 포틀릿 — 종류를 늘리고, 사용자가 직접 켜고 끄고 순서를 바꿀 수 있게 한다.
 * 대시보드와 마찬가지로 J/P/B 모드별 기본 템플릿을 두고, 변경하면 모드별로 저장한다.
 */
const STORAGE_PREFIX = 'timeflow.statsPortlets.v1.'

export const STATS_CATALOG = {
  summary: { title: '한눈에 보기', desc: '총 기록 시간·달성률·연속일', kind: 'metric' },
  categoryDonut: { title: '카테고리 도넛', desc: '카테고리별 시간 비중', kind: 'chart' },
  weekdayBar: { title: '요일별 패턴', desc: '요일마다 얼마나 기록했는지', kind: 'chart' },
  hourHeat: { title: '시간대 히트맵', desc: '하루 중 집중이 잘 되는 시간', kind: 'chart' },
  planVsActual: { title: '계획 대비 실제', desc: '계획 시간과 실제 시간 비교', kind: 'chart' },
  streak: { title: '연속 기록', desc: '가장 긴 연속 기록과 현재 연속일', kind: 'metric' },
  routineRate: { title: '루틴 달성률', desc: '루틴별 최근 달성률 순위', kind: 'list' },
  focusTrend: { title: '집중 시간 추이', desc: '최근 구간별 집중 시간 변화', kind: 'chart' },
  taskThroughput: { title: '할 일 처리량', desc: '기간별 완료 건수와 이월 건수', kind: 'chart' },
  godlifeScore: { title: '갓생 점수', desc: '루틴·집중·기록을 합친 종합 점수', kind: 'metric' },
}

export const MODE_STATS_LAYOUTS = {
  // J형: 수치와 계획 대비 실적 위주
  J: ['summary', 'planVsActual', 'taskThroughput', 'weekdayBar', 'routineRate', 'categoryDonut'],
  // P형: 부담 적은 회고형 지표 위주
  P: ['summary', 'categoryDonut', 'focusTrend', 'streak'],
  // B형: 균형
  B: ['summary', 'categoryDonut', 'planVsActual', 'weekdayBar', 'streak', 'godlifeScore'],
}

export function statsTemplateFor(mode) {
  const on = MODE_STATS_LAYOUTS[mode] ?? MODE_STATS_LAYOUTS.B
  return [
    ...on.map((id) => ({ id, visible: true })),
    ...Object.keys(STATS_CATALOG)
      .filter((id) => !on.includes(id))
      .map((id) => ({ id, visible: false })),
  ]
}

function key(mode) {
  return STORAGE_PREFIX + mode
}
function load(mode) {
  try {
    const raw = localStorage.getItem(key(mode))
    const parsed = raw ? JSON.parse(raw) : null
    if (!Array.isArray(parsed)) return null
    const known = parsed.filter((p) => STATS_CATALOG[p.id])
    if (!known.length) return null
    const missing = statsTemplateFor(mode).filter((t) => !known.some((k) => k.id === t.id))
    return [...known, ...missing]
  } catch {
    return null
  }
}

export const statsState = reactive({
  mode: modeState.activeMode,
  portlets: load(modeState.activeMode) ?? statsTemplateFor(modeState.activeMode),
  editing: false,
})

watch(
  () => statsState.portlets,
  (val) => {
    try {
      localStorage.setItem(key(statsState.mode), JSON.stringify(val))
    } catch {
      // 저장할 수 없는 환경 — 세션 내 상태만 유지
    }
  },
  { deep: true },
)

watch(
  () => modeState.activeMode,
  (mode) => {
    statsState.mode = mode
    statsState.portlets = load(mode) ?? statsTemplateFor(mode)
  },
)

export function toggleStatsPortlet(id) {
  const p = statsState.portlets.find((x) => x.id === id)
  if (p) p.visible = !p.visible
}
export function moveStatsPortlet(id, delta) {
  const list = statsState.portlets
  const i = list.findIndex((x) => x.id === id)
  const j = i + delta
  if (i === -1 || j < 0 || j >= list.length) return
  const [item] = list.splice(i, 1)
  list.splice(j, 0, item)
}
export function resetStatsPortlets() {
  statsState.portlets = statsTemplateFor(statsState.mode)
}

/** 활성 모드가 아닌 모드의 통계 구성도 설정 화면에서 편집할 수 있게 하는 헬퍼 */
export function readStatsPortlets(mode) {
  if (mode === statsState.mode) return statsState.portlets.map((p) => ({ ...p }))
  return load(mode) ?? statsTemplateFor(mode)
}
export function writeStatsPortlets(mode, portlets) {
  const next = portlets.map((p) => ({ ...p }))
  if (mode === statsState.mode) {
    statsState.portlets = next
    return
  }
  try {
    localStorage.setItem(key(mode), JSON.stringify(next))
  } catch {
    // 저장할 수 없는 환경 — 무시한다
  }
}
