import { reactive, watch } from 'vue'
import { isHex, themeTokens } from '../utils/colorTheme.mjs'

/**
 * 테마 — 표면(라이트/다크/세피아/고대비)과 색상 테마(포인트 컬러)를 분리해서 관리한다.
 * 색상을 고르면 utils/colorTheme.mjs가 표면에 맞춰 포인트·데이터·상태 색을 대비 기준에 맞게 계산한다(DESIGN.md 2장 테마).
 * 포인트 컬러는 여전히 화면당 하나의 강조에만 쓰인다.
 */
const STORAGE_KEY = 'timeflow.theme.v1'

export const THEMES = {
  // 값은 DESIGN.md 2장 Surface themes 표다. body는 표에 없어 foreground와 muted 사이 값으로 두고 대비를 테스트로 확인한다.
  light: {
    label: '라이트',
    desc: '따뜻한 종이색 바탕의 기본 화면',
    tokens: {
      '--color-canvas': '#faf9f6',
      '--color-surface': '#f3f0e9',
      '--color-card': '#ffffff',
      '--color-foreground': '#242721',
      '--color-body': '#41463f',
      '--color-muted': '#62675f',
      '--color-hairline': '#e1ddd4',
      '--color-control-border': '#767b72',
    },
  },
  dark: {
    label: '다크',
    desc: '어두운 곳에서 눈부심을 줄여요',
    tokens: {
      '--color-canvas': '#171b18',
      '--color-surface': '#222822',
      '--color-card': '#292f29',
      '--color-foreground': '#f4f2ec',
      '--color-body': '#d7dbd3',
      '--color-muted': '#b8c0b7',
      '--color-hairline': '#3b443d',
      '--color-control-border': '#7e8c80',
      // 다크 표면에는 검은 그림자를 더하지 않는다(DESIGN.md 6장). 단계는 표면색과 경계로 나눈다
      '--shadow-popover': 'none',
      '--shadow-overlay': 'none',
    },
  },
  sepia: {
    label: '세피아',
    desc: '종이와 잉크처럼 따뜻한 화면',
    tokens: {
      '--color-canvas': '#f4ebdd',
      '--color-surface': '#ebddca',
      '--color-card': '#fbf6ed',
      '--color-foreground': '#30291f',
      '--color-body': '#4b4133',
      '--color-muted': '#685847',
      '--color-hairline': '#d4c3ab',
      '--color-control-border': '#82715d',
    },
  },
  contrast: {
    label: '고대비',
    desc: '글자와 경계를 가장 또렷하게',
    tokens: {
      '--color-canvas': '#ffffff',
      '--color-surface': '#f0f0f0',
      '--color-card': '#ffffff',
      '--color-foreground': '#000000',
      '--color-body': '#1f1f1f',
      '--color-muted': '#404040',
      '--color-hairline': '#bdbdbd',
      '--color-control-border': '#767676',
    },
  },
}

/**
 * 색상 테마 — value는 포인트 컬러, data는 밝은 표면에서 쓸 데이터 색(같은 색상, 채도 2/3, 밝기 +0.115),
 * hover는 주 버튼 hover(밝기 -0.057, 포레스트는 DESIGN.md 값)다. desc는 DESIGN.md 2장 Theme moods 표의 분위기다.
 * 밝은 표면 기준 흰 글자 대비: 포인트 7:1 이상, 데이터 4.5:1 이상. 어두운 표면에서는 colorTheme.mjs가 밝게 다시 맞춘다.
 */
export const ACCENTS = {
  forest: { label: '포레스트', desc: '차분함 · 성장 · 균형', value: '#2f5d46', data: '#4e7963', hover: '#254a38' },
  ink: { label: '잉크', desc: '집중 · 신뢰 · 절제', value: '#243b53', data: '#415870', hover: '#1b2d3f' },
  plum: { label: '플럼', desc: '사색 · 창의 · 개성', value: '#5b2f4d', data: '#774d6a', hover: '#48253d' },
  clay: { label: '클레이', desc: '따뜻함 · 안정 · 온기', value: '#7a4327', data: '#946148', hover: '#643720' },
  moss: { label: '모스', desc: '자연 · 고요 · 지속성', value: '#3f4d24', data: '#5c6b41', hover: '#2f391b' },
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
  return { accent: preset.value, data: preset.data, hover: preset.hover }
}

/** 표면·색상 조합의 토큰과, 고른 색을 대비 기준 때문에 바꿨는지 여부 */
export function resolveTheme(themeKey = effectiveTheme(), key = themeState.accent, custom = themeState.customAccent) {
  return themeTokens((THEMES[themeKey] ?? THEMES.light).tokens, accentChoice(key, custom))
}

export function applyTheme() {
  const root = typeof document !== 'undefined' ? document.documentElement : null
  if (!root?.style?.setProperty) return
  const { tokens } = resolveTheme()
  // 다른 표면에만 있는 값(다크의 그림자 끄기 등)이 남지 않게, 이번 토큰에 없는 표면 변수는 지워 tokens.css 기본값으로 돌린다
  for (const key of new Set(Object.values(THEMES).flatMap(theme => Object.keys(theme.tokens)))) if (!(key in tokens)) root.style.removeProperty?.(key)
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
