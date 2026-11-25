// 다국어(PR-32): 한국어 원문을 키로 쓰는 영어 사전. 화면은 tr 함수에 한국어 원문과 자리표시 값을 넘기고, 영어가 없으면 한국어 원문을 그대로 보인다.
// 문구를 새 이름 키로 바꾸지 않아 원문이 화면 코드에 그대로 남는다(DESIGN.md: 한국어가 1차 기준).
import { EN } from './dictionary.mjs'

export function translate(ko, locale, vars) {
  // 화면이 넘기는 값이 비었거나 문자열이 아니면(이름표 없는 선택지·숫자) 예전처럼 그대로 보인다
  if (typeof ko !== 'string') return ko == null ? '' : String(ko)
  const text = (locale === 'en' && EN[ko]) || ko
  // 자리표시 값을 넘긴 때만 채운다. 사용자가 쓴 분류·서버 메시지에 든 {…} 글자를 지우지 않게 한다
  if (!vars) return text
  return text.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? ''))
}
/** 표시 함수의 번역 인자 기본값. 한국어 원문 그대로다(자리표시만 채움). */
export const korean = (ko, vars) => translate(ko, 'ko', vars)
export const hasEnglish = (ko) => Object.prototype.hasOwnProperty.call(EN, ko)
