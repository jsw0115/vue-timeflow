// 다국어(PR-32): 한국어 원문을 키로 쓰는 영어 사전. 화면은 tr 함수에 한국어 원문과 자리표시 값을 넘기고, 영어가 없으면 한국어 원문을 그대로 보인다.
// 문구를 새 이름 키로 바꾸지 않아 원문이 화면 코드에 그대로 남는다(DESIGN.md: 한국어가 1차 기준).
import { EN } from './dictionary.mjs'

export function translate(ko, locale, vars = {}) {
  const text = (locale === 'en' && EN[ko]) || ko
  return text.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? ''))
}
/** 표시 함수의 번역 인자 기본값. 한국어 원문 그대로다(자리표시만 채움). */
export const korean = (ko, vars) => translate(ko, 'ko', vars)
export const hasEnglish = (ko) => Object.prototype.hasOwnProperty.call(EN, ko)
