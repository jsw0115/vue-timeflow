// 표시 언어를 계정 환경설정의 general 구역에 읽고 저장한다(PR-32). 다른 값은 지우지 않도록 읽어서 합친 뒤 version과 함께 보낸다.
import { cleanLocale } from './locale.mjs'

export const LOCALE_PATH = '/api/settings/general'
export const LOCALE_STORAGE_KEY = 'timeflow.locale'

export function createLocaleAccount({ request }) {
  return {
    async load() {
      const row = await request(LOCALE_PATH)
      return cleanLocale(row?.value?.locale)
    },
    async save(locale) {
      const clean = cleanLocale(locale)
      if (!clean) throw new Error('알 수 없는 표시 언어예요.')
      const row = await request(LOCALE_PATH)
      const value = { ...(row?.value && typeof row.value === 'object' && !Array.isArray(row.value) ? row.value : {}), locale: clean }
      const body = row?.version ? { value, version: row.version } : { value }
      const saved = await request(LOCALE_PATH, { method: 'POST', body: JSON.stringify(body) })
      return cleanLocale(saved?.value?.locale) ?? clean
    },
  }
}

export function localeErrorText(error) {
  if (error?.status === 409) return '다른 기기에서 설정이 바뀌었어요. 화면을 새로 고친 뒤 다시 골라 주세요.'
  return '표시 언어를 저장하지 못했어요. 이전 언어를 유지했어요.'
}
