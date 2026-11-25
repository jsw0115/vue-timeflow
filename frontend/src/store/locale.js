// 표시 언어 상태(PR-32 1단계). 로그인하면 계정의 general 설정을 읽고, 로그아웃이면 이 브라우저 값을 쓴다. 기록 내용은 바꾸지 않는다.
import { reactive, ref, watch } from 'vue'
import { session } from '../features/auth/session.js'
import { apiRequest } from '../features/auth/apiRequest.js'
import { DEFAULT_LOCALE, cleanLocale } from '../features/i18n/locale.mjs'
import { LOCALE_STORAGE_KEY, createLocaleAccount, localeErrorText } from '../features/i18n/localeAccount.mjs'
import { translate } from '../features/i18n/translate.mjs'
import { UNITS_EN, UNIT_WORDS_EN } from '../features/i18n/dictionary.mjs'

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

/**
 * 본문 언어. App.vue가 경로마다 정한다(features/i18n/translatedRoutes.mjs). 본문까지 옮긴 화면에서만 표시 언어를 따르고, 나머지 화면은 ko다.
 * 대화 상자·저장 상태처럼 여러 화면이 함께 쓰는 부품이 한국어 본문 화면에서 혼자 영어로 바뀌지 않게 한다.
 */
export const bodyLocale = ref('ko')
export const setBodyLocale = (locale) => { bodyLocale.value = locale }

/** 화면 문구 고르기. 한국어 원문을 넘기면 지금 본문 언어로 돌려준다(템플릿에서 반응형으로 다시 그려진다). */
export const tr = (ko, vars) => translate(ko, bodyLocale.value, vars)

/** 숫자 뒤 단위. 한국어는 그대로, 다른 언어는 단위 표(UNITS_EN)를 쓰고 없으면 붙이지 않는다. */
export const unit = (ko) => (bodyLocale.value === 'ko' ? ko : UNITS_EN[ko] ?? '')
/** 문장 안에 넣는 단위 이름. 한국어는 그대로, 다른 언어는 단위 이름 표를 쓴다. */
export const unitWord = (ko) => (bodyLocale.value === 'ko' ? ko : UNIT_WORDS_EN[ko] ?? ko)
