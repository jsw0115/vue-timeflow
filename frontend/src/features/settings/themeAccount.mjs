// 화면 테마(표면·색상 분위기)를 계정 환경설정의 appearance 구역에 읽고 저장한다(DESIGN.md 4장 Settings: theme customization).
const HEX = /^#[0-9a-f]{6}$/i

export const THEME_DEFAULT = Object.freeze({ theme: 'light', accent: 'forest', customAccent: '#2f5d46', followSystem: false })
export const SECTION_PATH = '/api/settings/appearance'

/** 저장된 값을 허용된 표면·색상 키로만 정리한다. 알 수 없는 값이면 null이다(기존 화면 설정을 덮지 않는다). */
export function cleanTheme(value, { surfaces, accents }) {
  if (!value || typeof value !== 'object') return null
  if (!surfaces.includes(value.theme)) return null
  if (!accents.includes(value.accent) && value.accent !== 'custom') return null
  return {
    theme: value.theme,
    accent: value.accent,
    customAccent: HEX.test(value.customAccent ?? '') ? value.customAccent.toLowerCase() : THEME_DEFAULT.customAccent,
    followSystem: value.followSystem === true,
  }
}

export const sameTheme = (a, b) => ['theme', 'accent', 'customAccent', 'followSystem'].every(key => a?.[key] === b?.[key])

/**
 * request는 apiRequest처럼 성공 응답의 data를 돌려주고 실패면 status를 담아 던진다.
 * 저장은 appearance 구역의 다른 값을 지우지 않도록 읽어서 합친 뒤 version과 함께 보낸다. 처음 저장이면 version을 보내지 않는다.
 */
export function createThemeAccount({ request, keys }) {
  return {
    async load() {
      const row = await request(SECTION_PATH)
      return cleanTheme(row?.value?.theme, keys)
    },
    async save(theme) {
      const clean = cleanTheme(theme, keys)
      if (!clean) throw new Error('알 수 없는 테마 값이에요.')
      const row = await request(SECTION_PATH)
      const value = { ...(row?.value && typeof row.value === 'object' && !Array.isArray(row.value) ? row.value : {}), theme: clean }
      const body = row?.version ? { value, version: row.version } : { value }
      const saved = await request(SECTION_PATH, { method: 'POST', body: JSON.stringify(body) })
      return cleanTheme(saved?.value?.theme, keys) ?? clean
    },
  }
}

export function themeErrorText(error) {
  if (error?.status === 409) return '다른 기기에서 설정이 바뀌었어요. 화면을 새로 고친 뒤 다시 적용해 주세요. 기존 설정을 유지했어요.'
  return '테마를 저장하지 못했어요. 기존 설정을 유지했어요.'
}
