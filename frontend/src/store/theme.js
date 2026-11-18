import { reactive, watch } from 'vue'
import { isHex, themeTokens } from '../utils/colorTheme.mjs'

/**
 * 테마 — 표면(라이트/다크/세피아/고대비)과 색상 테마(포인트 컬러)를 분리해서 관리한다.
 * 색상을 고르면 utils/colorTheme.mjs가 표면에 맞춰 포인트·데이터·상태 색을 대비 기준에 맞게 계산한다(DESIGN.md 2장 테마).
 * 포인트 컬러는 여전히 화면당 하나의 강조에만 쓰인다.
 */
const STORAGE_KEY = 'timeflow.theme.v1'

export const THEMES = {
  light: {
    label: '라이트',
    desc: '기본 밝은 표면',
    tokens: {
      '--color-canvas': '#ffffff',
      '--color-surface': '#f5f3f1',
      '--color-foreground': '#000000',
      '--color-muted': '#777169',
      '--color-hairline': '#e5e5e5',
      '--color-on-primary': '#ffffff',
    },
  },
  dark: {
    label: '다크',
    desc: '어두운 표면 · 야간 사용',
    tokens: {
      '--color-canvas': '#111110',
      '--color-surface': '#1c1b19',
      '--color-foreground': '#f3f1ee',
      '--color-muted': '#9b958c',
      '--color-hairline': '#2e2c29',
      '--color-on-primary': '#111110',
    },
  },
  sepia: {
    label: '세피아',
    desc: '눈이 편한 종이 톤',
    tokens: {
      '--color-canvas': '#faf6ef',
      '--color-surface': '#f0e9dc',
      '--color-foreground': '#2a2520',
      '--color-muted': '#7d7264',
      '--color-hairline': '#e2d8c7',
      '--color-on-primary': '#faf6ef',
    },
  },
  contrast: {
    label: '고대비',
    desc: '경계와 글자를 진하게',
    tokens: {
      '--color-canvas': '#ffffff',
      '--color-surface': '#eeeeee',
      '--color-foreground': '#000000',
      '--color-muted': '#3d3d3d',
      '--color-hairline': '#8c8c8c',
      '--color-on-primary': '#ffffff',
    },
  },
}

/**
 * 색상 테마 — value는 포인트 컬러, data는 밝은 표면에서 쓸 데이터 색(같은 색상, 채도 2/3, 밝기 +0.115)이다.
 * 밝은 표면 기준 흰 글자 대비: 포인트 7:1 이상, 데이터 4.5:1 이상. 어두운 표면에서는 colorTheme.mjs가 밝게 다시 맞춘다.
 */
export const ACCENTS = {
  forest: { label: '포레스트', value: '#2f5d46', data: '#4e7963' },
  ink: { label: '잉크', value: '#243b53', data: '#415870' },
  plum: { label: '플럼', value: '#5b2f4d', data: '#774d6a' },
  clay: { label: '클레이', value: '#7a4327', data: '#946148' },
  moss: { label: '모스', value: '#3f4d24', data: '#5c6b41' },
}
export const CUSTOM_ACCENT = 'custom'
const DEFAULT_CUSTOM = '#2f5d46'

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    if (!parsed) return null
    return {
      theme: THEMES[parsed.theme] ? parsed.theme : 'light',
      accent: ACCENTS[parsed.accent] || parsed.accent === CUSTOM_ACCENT ? parsed.accent : 'forest',
      customAccent: isHex(parsed.customAccent) ? parsed.customAccent.toLowerCase() : DEFAULT_CUSTOM,
      followSystem: !!parsed.followSystem,
    }
  } catch {
    return null
  }
}

export const themeState = reactive(load() ?? { theme: 'light', accent: 'forest', customAccent: DEFAULT_CUSTOM, followSystem: false })

export function effectiveTheme() {
  if (!themeState.followSystem) return themeState.theme
  const prefersDark = typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)')?.matches
  return prefersDark ? 'dark' : 'light'
}

/** 고른 색상 테마. 사용자 지정이면 고른 hex만 주고, 프리셋이면 검증된 데이터 색도 함께 준다. */
export function accentChoice(key = themeState.accent, custom = themeState.customAccent) {
  if (key === CUSTOM_ACCENT) return { accent: isHex(custom) ? custom : DEFAULT_CUSTOM }
  const preset = ACCENTS[key] ?? ACCENTS.forest
  return { accent: preset.value, data: preset.data }
}

/** 표면·색상 조합의 토큰과, 고른 색을 대비 기준 때문에 바꿨는지 여부 */
export function resolveTheme(themeKey = effectiveTheme(), key = themeState.accent, custom = themeState.customAccent) {
  return themeTokens((THEMES[themeKey] ?? THEMES.light).tokens, accentChoice(key, custom))
}

export function applyTheme() {
  const root = typeof document !== 'undefined' ? document.documentElement : null
  if (!root?.style?.setProperty) return
  const { tokens } = resolveTheme()
  Object.entries(tokens).forEach(([key, value]) => root.style.setProperty(key, value))
  root.dataset.theme = effectiveTheme()
}

watch(
  themeState,
  () => {
    applyTheme()
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...themeState }))
    } catch {
      // 저장할 수 없는 환경 — 세션 내 상태만 유지
    }
  },
  { deep: true },
)

/** 시스템 설정을 따를 때, OS 테마가 바뀌면 즉시 반영한다 */
export function watchSystemTheme() {
  if (typeof window === 'undefined' || !window.matchMedia) return
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  mq.addEventListener?.('change', () => {
    if (themeState.followSystem) applyTheme()
  })
}
