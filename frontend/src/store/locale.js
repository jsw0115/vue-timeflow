// 표시 언어 상태(PR-32 1단계). 로그인하면 계정의 general 설정을 읽고, 로그아웃이면 이 브라우저 값을 쓴다. 기록 내용은 바꾸지 않는다.
import { reactive, watch } from 'vue'
import { session } from '../features/auth/session.js'
import { apiRequest } from '../features/auth/apiRequest.js'
import { DEFAULT_LOCALE, cleanLocale } from '../features/i18n/locale.mjs'
import { LOCALE_STORAGE_KEY, createLocaleAccount, localeErrorText } from '../features/i18n/localeAccount.mjs'

const account = createLocaleAccount({ request: apiRequest })
function readLocal() { try { return cleanLocale(localStorage.getItem(LOCALE_STORAGE_KEY)) } catch { return null } }
function writeLocal(locale) { try { localStorage.setItem(LOCALE_STORAGE_KEY, locale) } catch { /* 저장할 수 없으면 이번 화면에서만 유지 */ } }

export const localeState = reactive({ locale: readLocal() ?? DEFAULT_LOCALE, status: 'idle', message: '' })

watch(() => session.userId, async (id) => {
  if (!id) { Object.assign(localeState, { locale: readLocal() ?? DEFAULT_LOCALE, status: 'idle', message: '' }); return }
  try {
    const saved = await account.load()
    if (session.userId !== id) return
    if (saved) { localeState.locale = saved; writeLocal(saved) }
  } catch { /* 불러오지 못하면 이 브라우저 값을 그대로 쓴다 */ }
}, { immediate: true })

/** 저장이 끝난 뒤에만 바꾼다. 실패하면 이전 언어를 유지한다. */
export async function chooseLocale(locale) {
  const clean = cleanLocale(locale)
  if (!clean || localeState.status === 'saving') return false
  if (!session.userId) {
    writeLocal(clean)
    Object.assign(localeState, { locale: clean, status: 'saved', message: '이 브라우저에 저장했어요.' })
    return true
  }
  localeState.status = 'saving'
  try {
    const saved = await account.save(clean)
    writeLocal(saved)
    Object.assign(localeState, { locale: saved, status: 'saved', message: '계정에 저장했어요.' })
    return true
  } catch (error) {
    Object.assign(localeState, { status: 'failed', message: localeErrorText(error) })
    return false
  }
}
