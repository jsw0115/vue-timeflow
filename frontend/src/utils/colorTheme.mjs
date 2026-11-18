// 표면 테마와 색상 테마(포인트 컬러)에서 대비 기준을 지키는 색 토큰을 계산한다(DESIGN.md 2장 테마).
const HEX = /^#[0-9a-f]{6}$/i
export const isHex = value => typeof value === 'string' && HEX.test(value)

// 화면 상태 색의 기준 값(DESIGN.md 2장). 표면에 맞춰 밝기만 옮겨 쓴다.
export const STATUS_BASE = { danger: '#b23b3b', warning: '#8a6a3c', info: '#43596b' }

// 대비 하한. 포인트 컬러는 글자로도 쓰이고(링크·강조 글자) 데이터 색이 그보다 밝게(다크 표면에서는 어둡게) 구분될 여유가 필요해 canvas 대비 7:1로 둔다.
export const MIN = { accentCanvas: 7, accentSurface: 4.5, text: 4.5, graphic: 3, status: 4.5 }

const channel = value => {
  const c = value / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}
const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16))
const toHex = values => '#' + values.map(v => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('')

export function luminance(hex) {
  const [r, g, b] = rgb(hex).map(channel)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
export function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}
export const isDarkSurface = canvas => luminance(canvas) < 0.2

function toHsl(hex) {
  const [r, g, b] = rgb(hex).map(v => v / 255)
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min, s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return [h / 6, s, l]
}
function fromHsl(h, s, l) {
  if (s === 0) return toHex([l * 255, l * 255, l * 255])
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q
  const hue = t => {
    const x = t < 0 ? t + 1 : t > 1 ? t - 1 : t
    return x < 1 / 6 ? p + (q - p) * 6 * x : x < 1 / 2 ? q : x < 2 / 3 ? p + (q - p) * (2 / 3 - x) * 6 : p
  }
  return toHex([hue(h + 1 / 3) * 255, hue(h) * 255, hue(h - 1 / 3) * 255])
}

/** 밝기만 조금씩 옮겨 모든 [배경, 하한] 조건을 맞춘다. 밝은 표면에서는 어둡게, 어두운 표면에서는 밝게 옮긴다. */
export function fitContrast(hex, rules, dark) {
  const [h, s, start] = toHsl(hex)
  let l = start, out = hex
  for (let step = 0; step < 220 && !rules.every(([bg, min]) => contrast(out, bg) >= min); step++) {
    l = Math.min(1, Math.max(0, l + (dark ? 0.005 : -0.005)))
    out = fromHsl(h, s, l)
  }
  return out
}

/** 포인트 컬러와 같은 색상에서 채도를 낮추고 밝기를 옮긴 데이터 색 출발점. */
function dataSeed(accent, dark) {
  const [h, s, l] = toHsl(accent)
  return fromHsl(h, s * 0.67, Math.min(1, Math.max(0, l + (dark ? -0.115 : 0.115))))
}

/**
 * 표면 토큰과 색상 선택에서 화면 토큰을 만든다.
 * choice = { accent: '#rrggbb', data?: '#rrggbb' }. data는 밝은 표면용으로 검증된 프리셋 값이 있을 때만 준다.
 * 반환값의 adjusted는 고른 포인트 컬러를 대비 기준 때문에 바꿨는지 알려 준다.
 */
export function themeTokens(surfaceTokens, choice) {
  const canvas = surfaceTokens['--color-canvas'], surface = surfaceTokens['--color-surface'], hairline = surfaceTokens['--color-hairline']
  const dark = isDarkSurface(canvas)
  const picked = isHex(choice?.accent) ? choice.accent.toLowerCase() : '#2f5d46'
  const accent = fitContrast(picked, [[canvas, MIN.accentCanvas], [surface, MIN.accentSurface]], dark)
  const onAccent = dark ? canvas : '#ffffff'
  const seed = !dark && isHex(choice?.data) && accent === picked ? choice.data.toLowerCase() : dataSeed(accent, dark)
  const data = fitContrast(seed, [[onAccent, MIN.text], [hairline, MIN.graphic], [canvas, MIN.graphic], [surface, MIN.graphic]], dark)
  const status = Object.fromEntries(Object.entries(STATUS_BASE).map(([name, base]) => [name, fitContrast(base, [[canvas, MIN.status], [surface, MIN.status]], dark)]))
  return {
    adjusted: accent !== picked,
    tokens: {
      ...surfaceTokens,
      '--color-accent': accent,
      '--color-on-accent': onAccent,
      '--color-data': data,
      '--color-on-data': onAccent,
      '--color-status-danger': status.danger,
      '--color-status-warning': status.warning,
      '--color-status-info': status.info,
    },
  }
}
