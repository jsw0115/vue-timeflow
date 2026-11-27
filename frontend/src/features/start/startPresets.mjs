// 목적별 시작 구성(PR-23 UF-130, Q-34). 분류를 먼저 고르면 그 분류의 커리어 목표 후보와 메뉴·위젯 구성을 보이고, 최종 저장값은 커리어 목표다.
// 메뉴는 숨기지 않는다. 즐겨찾기에 고정하고 나머지 묶음을 접을 뿐이라 묶음 제목을 누르면 언제든 전체 메뉴가 보인다. 위젯은 끄지 않고 앞으로 옮겨 켠다.

/**
 * 분류(08 사용자 유형). menus·widgets는 08 "자주 쓰는 기능"을 실제 메뉴 경로와 위젯 ID로 옮긴 것이다.
 * 실제 기록은 플래너(즐겨찾기 불가 메뉴)에 있어 메뉴 대신 '계획 대비 실제' 위젯으로 넣었다. 백업은 환경설정 안에 있어 메뉴로 넣지 않았다.
 * goals는 분류에 맞는 커리어 목표 후보다. 개인 기록 중심은 원문에 맞는 목표가 따로 없어 네 가지를 모두 보인다.
 */
export const CATEGORIES = [
  { id: 'student', label: '학생·수험생', desc: '공부 루틴과 집중 시간을 쌓아요.', goals: ['job-seeker', 'project-member'], menus: ['/routines', '/focus', '/stats'], widgets: ['routine', 'focusTime', 'routineRate'] },
  { id: 'worker', label: '직장인', desc: '회의·업무가 많고 주간 보고를 써요.', goals: ['job-changer', 'employee', 'project-member'], menus: ['/events', '/tasks', '/work'], widgets: ['events', 'tasksProgress', 'planVsActual'] },
  { id: 'personal', label: '개인 기록 중심', desc: '일기·지출·기념일을 한곳에 모아요.', goals: ['job-seeker', 'job-changer', 'employee', 'project-member'], menus: ['/diary', '/money', '/dday'], widgets: ['dday'] },
]
export const DEFAULT_CATEGORY = 'worker'

/**
 * 커리어 목표별 구성. docs/design 03 §5 "첫 화면 우선 위젯"을 지금 있는 메뉴·위젯으로 옮겼다. 목표가 분류보다 먼저 온다(Career OS 주축).
 * 취업 준비: 지원 마감·진행 단계·학습 루틴·프로젝트 진행·문서 / 이직 준비: 업무 기록·경력 타임라인·WBS·지원 현황·문서 버전
 * 재직 중 성장: 오늘 업무·일정·루틴·WBS·업무 위키·성과 기록 / 프로젝트 참여: 담당 작업·마감·기여 기록·결과물(팀 메시지는 즐겨찾기 불가 메뉴라 뺐다)
 */
export const GOAL_PRESETS = {
  'job-seeker': { menus: ['/career/applications', '/routines', '/work/wbs', '/work/career'], widgets: ['career', 'routine'] },
  'job-changer': { menus: ['/work', '/career/activities', '/work/wbs', '/career/applications', '/work/career'], widgets: ['career', 'events'] },
  employee: { menus: ['/events', '/routines', '/work/wbs', '/work/wiki', '/career/activities'], widgets: ['events', 'routine', 'career'] },
  'project-member': { menus: ['/work/wbs', '/tasks', '/career/activities', '/work/career'], widgets: ['tasksProgress', 'events', 'career'] },
}

export const categoryOf = (id) => CATEGORIES.find((c) => c.id === id) ?? CATEGORIES.find((c) => c.id === DEFAULT_CATEGORY)
/** 고른 분류에 없는 목표면 그 분류의 첫 후보로 맞춘다. */
export const goalFor = (categoryId, goal) => (categoryOf(categoryId).goals.includes(goal) ? goal : categoryOf(categoryId).goals[0])

const unique = (list) => list.filter((value, index) => list.indexOf(value) === index)

/**
 * 시작 구성. pinnable은 즐겨찾기에 넣을 수 있는 경로 목록, max는 즐겨찾기 한도다.
 * 즐겨찾기 = 목표 메뉴 → 분류 메뉴 → 지금 즐겨찾기 순서(중복·고정 불가 제외, 한도까지). 지금 즐겨찾기를 지우지 않고 뒤로 보낸다.
 */
export function composeStart({ category, goal }, { pinnable, current = [], max }) {
  const cat = categoryOf(category)
  const preset = GOAL_PRESETS[goalFor(cat.id, goal)]
  const allowed = new Set(pinnable)
  const favorites = unique([...preset.menus, ...cat.menus, ...current]).filter((path) => allowed.has(path)).slice(0, max)
  const widgets = unique([...preset.widgets, ...cat.widgets])
  return { category: cat.id, goal: goalFor(cat.id, goal), favorites, widgets }
}

/** 위젯 배치에서 widgets를 그 순서로 맨 앞에 두고 켠다. 나머지는 원래 순서·크기·표시 여부 그대로다. 배치에 없는 ID는 무시한다. */
export function arrangeWidgets(layout, widgets) {
  const first = widgets.map((id) => layout.find((w) => w.id === id)).filter(Boolean).map((w) => ({ ...w, visible: true }))
  const rest = layout.filter((w) => !widgets.includes(w.id)).map((w) => ({ ...w }))
  return [...first, ...rest]
}

/** 미리 보기용 차이. 즐겨찾기 추가·밀려나는 항목, 새로 켜지는 위젯, 접히는 묶음. */
export function startDiff({ favorites: before, layout, collapsed = [] }, next, { groups = [], fold = true } = {}) {
  const after = next.favorites
  const shown = new Set(layout.filter((w) => w.visible).map((w) => w.id))
  return {
    added: after.filter((path) => !before.includes(path)),
    dropped: before.filter((path) => !after.includes(path)),
    turnedOn: next.widgets.filter((id) => layout.some((w) => w.id === id) && !shown.has(id)),
    folded: fold ? groups.filter((label) => !collapsed.includes(label)) : [],
  }
}
