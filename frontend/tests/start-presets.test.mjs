// 목적별 시작 구성(PR-23 UF-130, Q-34): 분류별 목표 후보, 메뉴·위젯 구성, 적용 전 구성 유지(UT-230), 적용 뒤 되돌리기(UT-231)를 검사한다.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { CATEGORIES, GOAL_PRESETS, arrangeWidgets, composeStart, goalFor, startDiff } from '../src/features/start/startPresets.mjs'
import { CAREER_GOALS } from '../src/features/career/careerModel.mjs'
import { MAX_FAVORITES, NOT_PINNABLE } from '../src/features/nav/favorites.mjs'
import { WIDGET_CATALOG, readLayout, templateFor } from '../src/store/dashboard.js'
import { initNavFavorites, navFavorites } from '../src/store/navFavorites.js'
import { collapsedGroups } from '../src/store/navCollapse.js'
import { careerGoal } from '../src/store/careerGoal.js'
import { applyStart, foldableGroups, hasManualStart, startPreset, undoStart } from '../src/store/startPreset.js'

const read = (path) => readFileSync(new URL('../src/' + path, import.meta.url), 'utf8')
const router = read('router/index.js')
const routerPaths = [...router.matchAll(/\{ path: '([^']+)', name: '/g)].map((m) => m[1])

test('구성의 메뉴·위젯·목표는 모두 실제로 있고, 즐겨찾기에 넣을 수 있는 메뉴다', () => {
  const goals = CAREER_GOALS.map((g) => g.id)
  for (const c of CATEGORIES) {
    for (const path of c.menus) { assert.ok(routerPaths.includes(path), path); assert.ok(!NOT_PINNABLE.includes(path), path) }
    for (const id of c.widgets) assert.ok(WIDGET_CATALOG[id], id)
    for (const g of c.goals) assert.ok(goals.includes(g), g)
  }
  assert.deepEqual(Object.keys(GOAL_PRESETS).sort(), [...goals].sort())
  for (const preset of Object.values(GOAL_PRESETS)) {
    for (const path of preset.menus) { assert.ok(routerPaths.includes(path), path); assert.ok(!NOT_PINNABLE.includes(path), path) }
    for (const id of preset.widgets) assert.ok(WIDGET_CATALOG[id], id)
  }
  // 모든 목표는 적어도 한 분류의 후보다
  for (const g of goals) assert.ok(CATEGORIES.some((c) => c.goals.includes(g)), g)
  assert.equal(goalFor('student', 'job-changer'), 'job-seeker')
  assert.equal(goalFor('worker', 'employee'), 'employee')
})

test('즐겨찾기는 목표 메뉴 → 분류 메뉴 → 지금 즐겨찾기 순서이고 중복·고정 불가 메뉴를 빼며 한도까지다', () => {
  const pinnable = routerPaths.filter((p) => !NOT_PINNABLE.includes(p))
  const plan = composeStart({ category: 'worker', goal: 'employee' }, { pinnable, current: ['/money', '/events'], max: MAX_FAVORITES })
  assert.deepEqual(plan.favorites, ['/events', '/routines', '/work/wbs', '/work/wiki', '/career/activities', '/tasks', '/work', '/money'])
  assert.equal(plan.favorites.length, MAX_FAVORITES)
  assert.deepEqual(plan.widgets, ['events', 'routine', 'career', 'tasksProgress', 'planVsActual'])
  const student = composeStart({ category: 'student', goal: 'employee' }, { pinnable, current: [], max: MAX_FAVORITES })
  assert.equal(student.goal, 'job-seeker')
})

test('위젯은 고른 것만 앞으로 옮겨 켜고, 나머지는 순서·크기·표시 여부를 그대로 둔다', () => {
  const layout = templateFor('J')
  const next = arrangeWidgets(layout, ['dday', 'streak', 'nope'])
  assert.deepEqual(next.slice(0, 2).map((w) => [w.id, w.visible]), [['dday', true], ['streak', true]])
  assert.deepEqual(next.slice(2), layout.filter((w) => !['dday', 'streak'].includes(w.id)))
  assert.ok(layout.every((w) => next.find((n) => n.id === w.id).visible || !w.visible))
  const diff = startDiff({ favorites: ['/money'], layout, collapsed: ['소셜'] }, { favorites: ['/events'], widgets: ['streak', 'dday'] }, { groups: ['커리어', '소셜'] })
  assert.deepEqual(diff, { added: ['/events'], dropped: ['/money'], turnedOn: ['streak'], folded: ['커리어'] })
})

test('UT-230 구성 맞추기를 끄면 목표만 저장하고 메뉴·위젯은 그대로다. UT-231 적용하고 되돌리면 이전 구성으로 돌아온다', async () => {
  const groups = [
    { label: '메인', items: [{ path: '/', name: '홈' }, { path: '/dday', name: 'D-Day' }] },
    { label: '커리어', items: [{ path: '/career/activities', name: '활동 타임라인' }, { path: '/career/applications', name: '취업·이직 지원' }, { path: '/work/career', name: '경력·포트폴리오' }] },
    { label: '기록', items: [{ path: '/events', name: '일정' }, { path: '/tasks', name: '할 일' }, { path: '/routines', name: '루틴' }, { path: '/money', name: '머니로그' }] },
    { label: '업무·프로젝트', items: [{ path: '/work/wbs', name: 'WBS' }, { path: '/work', name: '업무 리포트' }, { path: '/work/wiki', name: '업무 위키' }] },
  ]
  initNavFavorites(groups)
  assert.deepEqual(foldableGroups(), ['커리어', '기록', '업무·프로젝트'])
  navFavorites.paths = ['/money']
  assert.equal(hasManualStart('J'), true)
  const before = { favorites: [...navFavorites.paths], collapsed: [...collapsedGroups], layout: readLayout('J') }

  assert.equal(await applyStart({ category: 'worker', goal: 'job-changer', mode: 'J', applyLayout: false }), true)
  assert.equal(careerGoal.goal, 'job-changer')
  assert.deepEqual({ favorites: [...navFavorites.paths], collapsed: [...collapsedGroups], layout: readLayout('J') }, before)
  assert.equal(startPreset.undo, null)

  assert.equal(await applyStart({ category: 'worker', goal: 'employee', mode: 'J', applyLayout: true }), true)
  assert.equal(careerGoal.goal, 'employee')
  assert.deepEqual(navFavorites.paths, ['/events', '/routines', '/work/wbs', '/work/wiki', '/career/activities', '/tasks', '/work', '/money'])
  assert.deepEqual([...collapsedGroups], ['커리어', '기록', '업무·프로젝트'])
  assert.deepEqual(readLayout('J').slice(0, 3).map((w) => w.id), ['events', 'routine', 'career'])

  assert.equal(await undoStart(), true)
  assert.deepEqual({ favorites: [...navFavorites.paths], collapsed: [...collapsedGroups], layout: readLayout('J') }, before)
  assert.equal(careerGoal.goal, 'job-changer')
  assert.equal(startPreset.undo, null)
})

test('온보딩·환경설정은 같은 고르기 화면을 쓰고, 묶음 버튼은 펼침 상태를 알리며 메인 묶음은 접지 않는다', () => {
  const onboarding = read('views/auth/OnboardingView.vue')
  assert.match(onboarding, /<StartPresetPicker v-model:category="category" v-model:goal="goal" v-model:apply-layout="applyLayout" :mode="mode" \/>/)
  assert.match(onboarding, /const applyLayout = ref\(!hasManualStart\(mode\.value\)\)/)
  const env = read('views/settings/SettingsEnvView.vue')
  assert.match(env, /<StartPresetPicker v-model:category="startCategory"/)
  assert.match(env, /const startApplyLayout = ref\(false\)/)
  assert.match(env, /이전 구성으로 되돌리기/)
  const picker = read('components/StartPresetPicker.vue')
  assert.match(picker, /숨기거나 지우는 메뉴, 끄는 위젯은 없어요/)
  assert.match(picker, /묶음 제목을 누르면 다시 펼쳐져요/)
  assert.equal((picker.match(/선택됨<\/em>/g) ?? []).length, 2)
  const app = read('App.vue')
  assert.match(app, /:aria-expanded="group\.label === '플래너' \? undefined : !isGroupCollapsed\(group\.label\)"/)
  assert.match(read('store/startPreset.js'), /export const KEEP_OPEN = \['메인'\]/)
})
