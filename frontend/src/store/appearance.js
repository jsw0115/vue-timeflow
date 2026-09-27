import { reactive, watch } from 'vue'

/**
 * 화면 밀도 · 글자 크기 — 루트 요소의 CSS 변수를 바꿔 앱 전체 간격/폰트에 즉시 반영한다.
 * (설정 > 환경설정 > 화면 밀도)
 */
const STORAGE_KEY = 'timeflow.appearance.v1'

export const DENSITIES = {
  compact: { label: '좁게', desc: '한 화면에 더 많이 보여요', scale: 0.82 },
  cozy: { label: '기본', desc: '기본 간격이에요', scale: 1 },
  roomy: { label: '넓게', desc: '여백을 넉넉하게 써요', scale: 1.18 },
}
export const FONT_SIZES = {
  sm: { label: '작게', px: 13.125 },
  md: { label: '기본', px: 14 },
  lg: { label: '크게', px: 15.75 },
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    if (!parsed) return null
    return {
      density: DENSITIES[parsed.density] ? parsed.density : 'cozy',
      fontSize: FONT_SIZES[parsed.fontSize] ? parsed.fontSize : 'md',
      reduceMotion: !!parsed.reduceMotion,
    }
  } catch {
    return null
  }
}

export const appearance = reactive(load() ?? { density: 'cozy', fontSize: 'md', reduceMotion: false })

export function applyAppearance() {
  const root = typeof document !== 'undefined' ? document.documentElement : null
  if (!root?.dataset) return
  // 밀도는 여백 토큰을, 글자 크기는 rem 기준을 바꾼다. 화면 전체 zoom은 사용하지 않는다.
  root.dataset.density = appearance.density
  root.dataset.font = appearance.fontSize
  root.dataset.reduceMotion = appearance.reduceMotion ? 'on' : 'off'
}

watch(
  appearance,
  () => {
    applyAppearance()
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...appearance }))
    } catch {
      // 저장할 수 없는 환경 — 세션 내 상태만 유지
    }
  },
  { deep: true, immediate: true },
)
