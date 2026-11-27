// 사이드바 메뉴 묶음 접힘 상태. 이 브라우저에만 저장한다(App.vue에서 옮김, PR-23 시작 구성이 함께 쓴다).
import { reactive } from 'vue'

const KEY = 'timeflow.nav.collapsedGroups'
function load() {
  try {
    const raw = localStorage.getItem(KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return new Set(Array.isArray(parsed) ? parsed.filter((label) => typeof label === 'string') : [])
  } catch {
    return new Set()
  }
}
export const collapsedGroups = reactive(load())
function persist() {
  try { localStorage.setItem(KEY, JSON.stringify([...collapsedGroups])) } catch { /* 저장할 수 없는 환경이면 이 창에서만 유지 */ }
}
export const isGroupCollapsed = (label) => collapsedGroups.has(label)
export function setGroupCollapsed(label, collapsed) {
  if (collapsed) collapsedGroups.add(label)
  else collapsedGroups.delete(label)
  persist()
}
/** 접힌 묶음을 통째로 바꾼다(시작 구성 적용·되돌리기). */
export function replaceCollapsedGroups(labels) {
  collapsedGroups.clear()
  for (const label of labels) collapsedGroups.add(label)
  persist()
}
