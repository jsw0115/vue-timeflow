// 목적별 시작 구성 적용·되돌리기(PR-23 UF-130). 커리어 목표는 계정(로그아웃이면 이 브라우저)에, 즐겨찾기·묶음 접힘·홈 위젯은 이 브라우저에 저장한다.
// 적용 직전 구성을 이 브라우저에 남겨 한 번 되돌릴 수 있다.
import { reactive } from 'vue'
import { MAX_FAVORITES } from '../features/nav/favorites.mjs'
import { arrangeWidgets, composeStart, goalFor } from '../features/start/startPresets.mjs'
import { navFavorites, navGroupLabels, pinnableMenus } from './navFavorites.js'
import { collapsedGroups, replaceCollapsedGroups } from './navCollapse.js'
import { readLayout, templateFor, writeLayout } from './dashboard.js'
import { careerGoal, chooseCareerGoal } from './careerGoal.js'

const UNDO_KEY = 'timeflow.start.undo'
const CATEGORY_KEY = 'timeflow.start.category'
/** 접지 않는 묶음. 메인에는 홈·알림이 있다. */
export const KEEP_OPEN = ['메인']
/** 시작 구성이 접는 묶음. */
export const foldableGroups = () => navGroupLabels().filter((label) => !KEEP_OPEN.includes(label))

const readJson = (key) => { try { return JSON.parse(localStorage.getItem(key) ?? 'null') } catch { return null } }
const writeJson = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* 저장할 수 없는 환경이면 이 창에서만 유지 */ } }

export const startPreset = reactive({ category: readJson(CATEGORY_KEY), undo: readJson(UNDO_KEY), status: 'idle', message: '' })

/** 지금 구성. 미리 보기와 되돌리기 기록에 쓴다. */
export function currentStart(mode) {
  return { favorites: [...navFavorites.paths], collapsed: [...collapsedGroups], layout: readLayout(mode), goal: careerGoal.goal }
}

/** 즐겨찾기·묶음 접힘·홈 위젯(mode)을 직접 바꾼 적이 있는지. 있으면 화면이 "구성도 맞추기"를 기본으로 끄고 둔다(UT-230). */
export function hasManualStart(mode) {
  return navFavorites.paths.length > 0 || collapsedGroups.size > 0 || JSON.stringify(readLayout(mode)) !== JSON.stringify(templateFor(mode))
}

export function planStart({ category, goal }) {
  return composeStart({ category, goal }, { pinnable: pinnableMenus().map((item) => item.path), current: navFavorites.paths, max: MAX_FAVORITES })
}

/**
 * 커리어 목표를 먼저 저장하고, 저장되면 applyLayout일 때만 즐겨찾기·묶음 접힘·홈 위젯(mode의 배치)을 바꾼다.
 * 목표 저장이 실패하면 아무것도 바꾸지 않는다.
 */
export async function applyStart({ category, goal, mode, applyLayout }) {
  const clean = goalFor(category, goal)
  writeJson(CATEGORY_KEY, category)
  startPreset.category = category
  const before = currentStart(mode)
  startPreset.status = 'saving'; startPreset.message = ''
  if (!(await chooseCareerGoal(clean))) {
    Object.assign(startPreset, { status: 'failed', message: careerGoal.message })
    return false
  }
  if (applyLayout) {
    const plan = planStart({ category, goal: clean })
    const undo = { ...before, mode, at: new Date().toISOString() }
    writeJson(UNDO_KEY, undo); startPreset.undo = undo
    navFavorites.paths = plan.favorites
    replaceCollapsedGroups(foldableGroups())
    writeLayout(mode, arrangeWidgets(readLayout(mode), plan.widgets))
  }
  Object.assign(startPreset, { status: 'saved', message: applyLayout ? '커리어 목표를 저장하고 메뉴·홈 위젯 구성을 바꿨어요.' : '커리어 목표를 저장했어요. 메뉴·홈 위젯은 그대로 뒀어요.' })
  return true
}

/**
 * 마지막 적용 직전 구성으로 돌린다. 즐겨찾기·묶음 접힘·홈 위젯은 바로 돌리고, 커리어 목표는 그때 고른 값이 있을 때만 다시 저장한다.
 * 그때 목표를 아직 고르지 않았다면 목표는 지금 값으로 둔다(저장된 목표를 지우는 경로가 없다).
 */
export async function undoStart() {
  const undo = startPreset.undo
  if (!undo) return false
  navFavorites.paths = undo.favorites
  replaceCollapsedGroups(undo.collapsed)
  writeLayout(undo.mode, undo.layout)
  let goalNote = ''
  if (undo.goal && undo.goal !== careerGoal.goal) {
    if (!(await chooseCareerGoal(undo.goal))) goalNote = ' 커리어 목표는 되돌리지 못했어요.'
  } else if (!undo.goal) goalNote = ' 커리어 목표는 지금 값으로 뒀어요.'
  try { localStorage.removeItem(UNDO_KEY) } catch { /* 무시 */ }
  Object.assign(startPreset, { undo: null, status: 'saved', message: '이전 메뉴·홈 위젯 구성으로 되돌렸어요.' + goalNote })
  return true
}
