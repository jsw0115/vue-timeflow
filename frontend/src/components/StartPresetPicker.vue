<script setup>
// 목적별 시작 구성 고르기(PR-23 UF-130, Q-34). 분류 → 그 분류의 커리어 목표 후보 → 적용 전 미리 보기 순서다. 저장은 부모가 store/startPreset으로 한다.
import { computed, useId, watch } from 'vue'
import { CAREER_GOALS } from '../features/career/careerModel.mjs'
import { CATEGORIES, categoryOf, goalFor, startDiff } from '../features/start/startPresets.mjs'
import { WIDGET_CATALOG } from '../store/dashboard'
import { modeMeta } from '../store/modeProfiles'
import { pinnableMenus } from '../store/navFavorites'
import { currentStart, foldableGroups, planStart } from '../store/startPreset'
import { MAX_FAVORITES } from '../features/nav/favorites.mjs'

const props = defineProps({ mode: { type: String, required: true } })
const category = defineModel('category', { type: String, required: true })
const goal = defineModel('goal', { type: String, required: true })
const applyLayout = defineModel('applyLayout', { type: Boolean, default: false })
const id = useId()

const goals = computed(() => categoryOf(category.value).goals.map((g) => CAREER_GOALS.find((entry) => entry.id === g)).filter(Boolean))
// 분류를 바꿔 지금 목표가 후보에 없으면 그 분류의 첫 후보로 맞춘다
watch(category, (value) => { goal.value = goalFor(value, goal.value) })

const menuName = (path) => pinnableMenus().find((item) => item.path === path)?.name ?? path
const plan = computed(() => planStart({ category: category.value, goal: goal.value }))
const diff = computed(() => {
  const now = currentStart(props.mode)
  return startDiff(now, plan.value, { groups: foldableGroups() })
})
</script>

<template>
  <div class="start-picker">
    <fieldset class="start-group">
      <legend>어떤 하루를 보내나요?</legend>
      <div class="start-options">
        <label v-for="c in CATEGORIES" :key="c.id" class="start-option" :class="{ selected: category === c.id }">
          <input v-model="category" type="radio" :name="id + '-category'" :value="c.id" />
          <span><b>{{ c.label }}</b><small>{{ c.desc }}</small></span><em v-if="category === c.id" class="start-check">선택됨</em>
        </label>
      </div>
    </fieldset>
    <fieldset class="start-group">
      <legend>커리어 목표</legend>
      <p class="input-field-help">고른 분류에 맞는 목표만 보여요. 목표는 커리어 대시보드 순서만 바꾸고 공개 범위나 권한은 바꾸지 않아요.</p>
      <div class="start-options">
        <label v-for="g in goals" :key="g.id" class="start-option" :class="{ selected: goal === g.id }">
          <input v-model="goal" type="radio" :name="id + '-goal'" :value="g.id" />
          <span><b>{{ g.label }}</b><small>{{ g.desc }}</small></span><em v-if="goal === g.id" class="start-check">선택됨</em>
        </label>
      </div>
    </fieldset>
    <label class="start-apply"><input v-model="applyLayout" type="checkbox" />메뉴 즐겨찾기와 홈 위젯도 이 구성으로 맞추기</label>
    <section class="start-preview" :aria-labelledby="id + '-preview'">
      <h3 :id="id + '-preview'">적용하면 바뀌는 것</h3>
      <ul v-if="applyLayout">
        <li>즐겨찾기(이 순서로): {{ plan.favorites.map(menuName).join(', ') }}</li>
        <li v-if="diff.dropped.length">즐겨찾기 한도({{ MAX_FAVORITES }}개)를 넘어 빠지는 메뉴: {{ diff.dropped.map(menuName).join(', ') }}</li>
        <li v-if="diff.folded.length">접는 메뉴 묶음: {{ diff.folded.join(', ') }}. 묶음 제목을 누르면 다시 펼쳐져요.</li>
        <li>홈 위젯({{ modeMeta(mode).name }})에서 앞에 둘 위젯: {{ plan.widgets.map((w) => WIDGET_CATALOG[w]?.title ?? w).join(', ') }}<template v-if="diff.turnedOn.length"> · 새로 켜는 위젯: {{ diff.turnedOn.map((w) => WIDGET_CATALOG[w]?.title ?? w).join(', ') }}</template></li>
        <li>숨기거나 지우는 메뉴, 끄는 위젯은 없어요. 적용한 뒤 환경설정에서 이전 구성으로 되돌릴 수 있어요.</li>
      </ul>
      <p v-else class="input-field-help">커리어 목표만 저장하고, 메뉴 즐겨찾기·묶음 접힘·홈 위젯은 지금 그대로 둬요.</p>
    </section>
  </div>
</template>

<style scoped>
.start-picker { display: grid; gap: var(--space-xl); }
.start-group { display: grid; gap: var(--space-md); margin: 0; padding: 0; border: 0; min-width: 0; }
.start-group legend { margin-bottom: var(--space-sm); padding: 0; font-size: var(--type-body-size); font-weight: 600; }
.start-group p { margin: 0; }
.start-options { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: var(--space-md); }
.start-option { position: relative; display: block; margin: 0; padding: var(--space-lg); border: 1px solid var(--color-hairline); border-radius: var(--radius-lg); background: var(--color-card); cursor: pointer; font-weight: 400; transition: border-color var(--motion-fast); }
.start-option:hover { border-color: var(--color-control-border); }
.start-option.selected { border-color: var(--color-accent); background: var(--color-accent-soft); box-shadow: inset 0 0 0 1px var(--color-accent); }
.start-option:focus-within { outline: 2px solid var(--color-accent); outline-offset: 2px; }
.start-option input { position: absolute; opacity: 0; pointer-events: none; }
.start-option span { padding-right: var(--space-xxl); }
.start-check { position: absolute; top: var(--space-lg); right: var(--space-lg); color: var(--color-accent); font-size: var(--type-caption-size); font-style: normal; font-weight: 600; }
.start-option span { display: grid; gap: var(--space-xs); }
.start-option b { font-size: var(--type-body-size); }
.start-option small { color: var(--color-body); font-size: var(--type-body-sm-size); line-height: 1.5; }
.start-apply { display: flex; align-items: center; gap: var(--space-sm); margin: 0; font-weight: 600; }
.start-apply input { margin: 0; }
.start-preview { padding: var(--space-lg); border: 1px solid var(--color-hairline); border-radius: var(--radius-md); background: var(--color-surface); }
.start-preview h3 { margin: 0 0 var(--space-sm); font-size: var(--type-body-sm-size); }
.start-preview ul { display: grid; gap: var(--space-xs); margin: 0; padding-left: var(--space-xl); font-size: var(--type-body-sm-size); }
.start-preview p { margin: 0; }
</style>
