import { reactive, watch } from 'vue'

/**
 * 테마 — 표면(라이트/다크/세피아/고대비)과 포인트 컬러를 분리해서 관리한다.
 * DESIGN.md 원칙대로 포인트 컬러는 화면당 하나만 쓰이므로, 여기서 --color-accent 하나만 바꿔도
 * 앱 전체 강조 요소가 일관되게 따라온다.
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

/** 포인트 컬러 — 각각 대비 4.5:1 이상을 만족하는 어두운 톤으로만 구성한다 */
export const ACCENTS = {
  forest: { label: '포레스트', value: '#2f5d46' },
  ink: { label: '잉크', value: '#243b53' },
  plum: { label: '플럼', value: '#5b2f4d' },
  clay: { label: '클레이', value: '#7a4327' },
  moss: { label: '모스', value: '#3f4d24' },
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    if (!parsed) return null
    return {
      theme: THEMES[parsed.theme] ? parsed.theme : 'light',
      accent: ACCENTS[parsed.accent] ? parsed.accent : 'forest',
      followSystem: !!parsed.followSystem,
    }
  } catch {
    return null
  }
}

export const themeState = reactive(load() ?? { theme: 'light', accent: 'forest', followSystem: false })

function effectiveTheme() {
  if (!themeState.followSystem) return themeState.theme
  const prefersDark = typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)')?.matches
  return prefersDark ? 'dark' : 'light'
}

export function applyTheme() {
  const root = typeof document !== 'undefined' ? document.documentElement : null
  if (!root?.style?.setProperty) return
  const active = THEMES[effectiveTheme()] ?? THEMES.light
  Object.entries(active.tokens).forEach(([key, value]) => root.style.setProperty(key, value))
  root.style.setProperty('--color-accent', ACCENTS[themeState.accent]?.value ?? ACCENTS.forest.value)
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
