import { localCollection } from './localCollection'
export const plannerReviews = localCollection('planner-reviews', [])
export function savePlannerReview(date, body) {
  const existing = plannerReviews.value.find(item => item.id === date)
  const value = { title: `${date} 플래너 회고`, body: body.trim(), at: date }
  if (existing) Object.assign(existing, value)
  else plannerReviews.value.unshift({ id: date, ...value })
}
