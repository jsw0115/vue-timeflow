// 커리어 목표를 계정 환경설정의 career 구역에 읽고 저장한다. 로그아웃이면 이 브라우저에만 둔다(docs/design 03 §5).
import { CAREER_GOALS } from './careerModel.mjs'

export const GOAL_PATH = '/api/settings/career'
export const GOAL_STORAGE_KEY = 'timeflow.career.goal'
const KNOWN = new Set(CAREER_GOALS.map((goal) => goal.id))

/** 알 수 없는 값이면 null이다(저장된 다른 값을 덮지 않는다). */
export const cleanGoal = (value) => (KNOWN.has(value) ? value : null)

/**
 * request는 apiRequest처럼 성공 응답의 data를 돌려주고 실패하면 status를 담아 던진다.
 * 저장은 career 구역의 다른 값을 지우지 않도록 읽어서 합친 뒤 version과 함께 보낸다. 처음 저장이면 version을 보내지 않는다.
 */
export function createCareerGoalAccount({ request }) {
  return {
    async load() {
      const row = await request(GOAL_PATH)
      return cleanGoal(row?.value?.goal)
    },
    async save(goal) {
      const clean = cleanGoal(goal)
      if (!clean) throw new Error('알 수 없는 커리어 목표예요.')
      const row = await request(GOAL_PATH)
      const value = { ...(row?.value && typeof row.value === 'object' && !Array.isArray(row.value) ? row.value : {}), goal: clean }
      const body = row?.version ? { value, version: row.version } : { value }
      const saved = await request(GOAL_PATH, { method: 'POST', body: JSON.stringify(body) })
      return cleanGoal(saved?.value?.goal) ?? clean
    },
  }
}

export function goalErrorText(error) {
  if (error?.status === 409) return '다른 기기에서 설정이 바뀌었어요. 화면을 새로 고친 뒤 다시 골라 주세요.'
  return '커리어 목표를 저장하지 못했어요. 이전 목표를 유지했어요.'
}
