// 다이어리 기분 값을 코드 5개로 정하고, 예전 이모지·한국어 값을 코드로 읽으며, 화면 문구를 준다(Q-07, PR-07 6단계).
export const MOODS = [
  { code: 'good', label: '좋음', legacy: ['🙂'] },
  { code: 'calm', label: '평온', legacy: ['😌'] },
  { code: 'tired', label: '피곤', legacy: ['😴'] },
  { code: 'upset', label: '속상함', legacy: ['😤'] },
  { code: 'proud', label: '뿌듯함', legacy: ['🥳'] },
]

/** 코드·한국어 문구·예전 이모지를 코드로 바꾼다. 모르는 값은 null이다. */
export function moodCode(value) {
  if (value == null || value === '') return null
  return MOODS.find((mood) => mood.code === value || mood.label === value || mood.legacy.includes(value))?.code ?? null
}

export function moodLabel(value) {
  return MOODS.find((mood) => mood.code === moodCode(value))?.label ?? ''
}
