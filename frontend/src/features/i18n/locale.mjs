// 다국어 1단계(PR-32): 표시 언어 값, 문구 고르기, 날짜·숫자·통화 형식. 서버 SettingsService.LOCALES와 같은 값만 쓴다.
import { GROUPS_EN, MODES_EN, NAV_EN, SETTINGS_EN, SETTINGS_GROUPS_EN, SHELL } from './messages.mjs'

export const LOCALES = [
  { id: 'ko', label: '한국어', tag: 'ko-KR' },
  { id: 'en', label: 'English', tag: 'en-US' },
]
export const DEFAULT_LOCALE = 'ko'
/** 모르는 값이면 null(저장된 다른 값을 덮지 않는다). */
export const cleanLocale = (value) => (LOCALES.some((l) => l.id === value) ? value : null)
export const localeTag = (locale) => LOCALES.find((l) => l.id === locale)?.tag ?? 'ko-KR'

/** 공통 화면 문구. {n} 같은 자리표시를 vars로 채운다. 영어가 없으면 한국어 원문이다. */
export function shellText(key, locale, vars = {}) {
  const entry = SHELL[key]
  if (!entry) return key
  const text = (locale === 'en' && entry.en) || entry.ko
  return text.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? ''))
}
export const groupLabel = (label, locale) => (locale === 'en' && GROUPS_EN[label]) || label
export const navName = (item, locale) => (locale === 'en' && NAV_EN[item.path]?.[0]) || item.name
export const navTitle = (item, locale) => (locale === 'en' && NAV_EN[item.path]?.[1]) || item.title || ''
export const settingsGroupLabel = (label, locale) => (locale === 'en' && SETTINGS_GROUPS_EN[label]) || label
export const settingLabel = (item, locale) => (locale === 'en' && SETTINGS_EN[item.id]?.[0]) || item.label
export const settingDesc = (item, locale) => (locale === 'en' && SETTINGS_EN[item.id]?.[1]) || item.desc || ''
export const modeText = (mode, locale, korean) => (locale === 'en' && MODES_EN[mode]) || korean

/** 날짜. timeZone을 주면 그 시간대 기준이다. 잘못된 값이면 빈 문자열이다. */
export function formatDate(value, locale, options = { dateStyle: 'full' }) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(localeTag(locale), options).format(date)
}
export const formatNumber = (value, locale) => new Intl.NumberFormat(localeTag(locale)).format(value)
/** 머니로그 금액은 원 단위 정수라 통화는 KRW로 고정한다. 언어를 바꿔도 금액과 통화는 바뀌지 않는다. */
export const formatWon = (value, locale) => new Intl.NumberFormat(localeTag(locale), { style: 'currency', currency: 'KRW' }).format(value)
