import { reactive, watch } from 'vue'
import { modeState } from './modeProfiles'

const STORAGE_PREFIX = 'timeflow.dashboard.v2.'
const SIZE_ORDER = ['sm', 'md', 'lg']

export const WIDGET_CATALOG = {
  events: { title: '오늘의 흐름', desc: '계획과 실제 기록을 확인해요' },
  routine: { title: '오늘의 루틴', desc: '작은 반복이 하루를 만들어요' },
  tasksProgress: { title: '할 일 진행률', desc: '오늘 완료한 할 일 비율' },
  routineRate: { title: '루틴 달성률', desc: '오늘 루틴 체크 비율' },
  focusTime: { title: '집중 시간', desc: '오늘 누적 집중 시간' },
  dday: { title: 'D-Day', desc: '다가오는 중요한 날짜' },
  eventsCount: { title: '오늘 일정 개수', desc: '오늘 예정된 일정 수' },
  // 통계 화면에서 가져온 포틀릿 — 홈에서도 같은 지표를 볼 수 있다
  categoryDonut: { title: '카테고리 비중', desc: '카테고리별 시간 비중 도넛' },
  weekdayBar: { title: '요일별 패턴', desc: '요일마다 얼마나 기록했는지' },
  planVsActual: { title: '계획 대비 실제', desc: '계획 시간과 실제 시간 비교' },
  streak: { title: '연속 기록', desc: '현재·최장 연속 기록' },
  godlifeScore: { title: '갓생 점수', desc: '루틴·집중·기록 종합 점수' },
}

/**
 * 모드별 기본 포틀릿 템플릿.
 * J형은 계획·진척 위주로 촘촘하게, P형은 지금 할 것만 크게,
 * B형은 계획과 여백을 절반씩 보여준다. 사용자가 바꾸면 모드별로 따로 저장된다.
 */
export const MODE_LAYOUTS = {
  J: [
    { id: 'events', size: 'lg', visible: true },
    { id: 'tasksProgress', size: 'sm', visible: true },
    { id: 'routineRate', size: 'sm', visible: true },
    { id: 'eventsCount', size: 'sm', visible: true },
    { id: 'routine', size: 'md', visible: true },
    { id: 'dday', size: 'md', visible: true },
    { id: 'focusTime', size: 'sm', visible: true },
    { id: 'planVsActual', size: 'md', visible: true },
    { id: 'weekdayBar', size: 'md', visible: false },
    { id: 'categoryDonut', size: 'md', visible: false },
    { id: 'streak', size: 'sm', visible: false },
    { id: 'godlifeScore', size: 'sm', visible: false },
  ],
  P: [
    { id: 'routine', size: 'lg', visible: true },
    { id: 'events', size: 'md', visible: true },
    { id: 'focusTime', size: 'sm', visible: true },
    { id: 'dday', size: 'sm', visible: true },
    { id: 'tasksProgress', size: 'sm', visible: false },
    { id: 'routineRate', size: 'sm', visible: false },
    { id: 'eventsCount', size: 'sm', visible: false },
    { id: 'streak', size: 'sm', visible: true },
    { id: 'godlifeScore', size: 'sm', visible: false },
    { id: 'categoryDonut', size: 'md', visible: false },
    { id: 'weekdayBar', size: 'md', visible: false },
    { id: 'planVsActual', size: 'md', visible: false },
  ],
  B: [
    { id: 'events', size: 'lg', visible: true },
    { id: 'routine', size: 'md', visible: true },
    { id: 'tasksProgress', size: 'sm', visible: true },
    { id: 'routineRate', size: 'sm', visible: true },
    { id: 'focusTime', size: 'sm', visible: true },
    { id: 'dday', size: 'md', visible: true },
    { id: 'eventsCount', size: 'sm', visible: false },
    { id: 'categoryDonut', size: 'md', visible: true },
    { id: 'godlifeScore', size: 'sm', visible: true },
    { id: 'streak', size: 'sm', visible: false },
    { id: 'weekdayBar', size: 'md', visible: false },
    { id: 'planVsActual', size: 'md', visible: false },
  ],
}

export function templateFor(mode) {
  return (MODE_LAYOUTS[mode] ?? MODE_LAYOUTS.B).map((w) => ({ ...w }))
}

function storageKey(mode) {
  return STORAGE_PREFIX + mode
}

function loadLayout(mode) {
  try {
    const raw = localStorage.getItem(storageKey(mode))
    const parsed = raw ? JSON.parse(raw) : null
    if (!Array.isArray(parsed)) return null
    // 카탈로그에 없는(구버전) 위젯 id는 걸러내고, 새로 추가된 위젯은 모드 템플릿 값으로 보충한다
    const known = parsed.filter((w) => WIDGET_CATALOG[w.id])
    if (!known.length) return null
    const missing = templateFor(mode).filter((d) => !known.some((w) => w.id === d.id))
    return [...known, ...missing]
  } catch {
    return null
  }
}

export const dashboardState = reactive({
  mode: modeState.activeMode,
  layout: loadLayout(modeState.activeMode) ?? templateFor(modeState.activeMode),
  editing: false,
})

function persist() {
  try {
    localStorage.setItem(storageKey(dashboardState.mode), JSON.stringify(dashboardState.layout))
  } catch {
    // localStorage를 쓸 수 없는 환경 — 세션 내 상태만 유지
  }
}

watch(() => dashboardState.layout, persist, { deep: true })

// 모드를 바꾸면 그 모드의 사용자 설정(없으면 기본 템플릿)으로 화면 구성이 통째로 바뀐다
watch(
  () => modeState.activeMode,
  (mode) => {
    dashboardState.mode = mode
    dashboardState.layout = loadLayout(mode) ?? templateFor(mode)
  },
)

export function resetLayout() {
  dashboardState.layout = templateFor(dashboardState.mode)
}

export function cycleSize(id) {
  const widget = dashboardState.layout.find((w) => w.id === id)
  if (!widget) return
  widget.size = SIZE_ORDER[(SIZE_ORDER.indexOf(widget.size) + 1) % SIZE_ORDER.length]
}

export function toggleVisible(id) {
  const widget = dashboardState.layout.find((w) => w.id === id)
  if (widget) widget.visible = !widget.visible
}

export function moveWidget(fromId, toId) {
  const list = dashboardState.layout
  const fromIndex = list.findIndex((w) => w.id === fromId)
  const toIndex = list.findIndex((w) => w.id === toId)
  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return
  const [item] = list.splice(fromIndex, 1)
  list.splice(toIndex, 0, item)
}

/** 지금 레이아웃이 모드 기본값과 같은지 — 설정 화면에서 "기본값 사용중" 표시에 쓴다 */
export function isTemplateDefault() {
  const t = templateFor(dashboardState.mode)
  if (t.length !== dashboardState.layout.length) return false
  return t.every((w, i) => {
    const cur = dashboardState.layout[i]
    return cur && cur.id === w.id && cur.size === w.size && cur.visible === w.visible
  })
}

/** 활성 모드가 아닌 모드의 구성도 설정 화면에서 편집할 수 있게 하는 헬퍼 */
export function readLayout(mode) {
  if (mode === dashboardState.mode) return dashboardState.layout.map((w) => ({ ...w }))
  return loadLayout(mode) ?? templateFor(mode)
}
export function writeLayout(mode, layout) {
  const next = layout.map((w) => ({ ...w }))
  if (mode === dashboardState.mode) {
    dashboardState.layout = next
    return
  }
  try {
    localStorage.setItem(storageKey(mode), JSON.stringify(next))
  } catch {
    // 저장할 수 없는 환경 — 무시한다
  }
}
