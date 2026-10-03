import { ref } from 'vue'

export const plannerViews = [
  { id: 'daily', label: '일간', path: '/planner/daily' },
  { id: 'weekly', label: '주간', path: '/planner/weekly' },
  { id: 'monthly', label: '월간', path: '/planner/monthly' },
  { id: 'yearly', label: '연간', path: '/planner/yearly' },
]
const key = 'timebar.planner.default-view'
let saved
try { saved = localStorage.getItem(key) } catch { /* Use the daily view. */ }
export const defaultPlannerView = ref(plannerViews.some(view => view.id === saved) ? saved : 'daily')
export function plannerLanding() { return plannerViews.find(view => view.id === defaultPlannerView.value)?.path || '/planner/daily' }
export function setDefaultPlannerView(id) {
  if (!plannerViews.some(view => view.id === id)) return
  defaultPlannerView.value = id
  try { localStorage.setItem(key, id) } catch { /* Keep this session's preference. */ }
}
