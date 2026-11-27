<script setup>
// 플래너 네 보기(일·주·월·연)가 함께 쓰는 한 줄 도구 막대: 왼쪽은 기간 이동, 오른쪽은 보기 전환과 기본 보기 저장.
// 예전에는 보기마다 기간 이동 막대가 따로 있고 보기 전환이 그 위에 한 줄을 더 차지했다(DESIGN.md 5장 Page composition: Context 한 줄).
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { defaultPlannerView, plannerViews, setDefaultPlannerView } from '../store/plannerPreferences'
import { cursor, shift, goToday, dayLabel, weekLabel, monthLabel, yearLabel } from '../store/plannerDate'
import { localDate } from '../utils/postValidation.mjs'
import { tr } from '../store/locale'
const route = useRoute()
const current = computed(() => plannerViews.find(view => view.path === route.path)?.id)
const PERIODS = {
  daily: { unit: 'day', label: dayLabel, prev: '이전 날', next: '다음 날', today: '오늘' },
  weekly: { unit: 'week', label: weekLabel, prev: '이전 주', next: '다음 주', today: '이번 주' },
  monthly: { unit: 'month', label: monthLabel, prev: '이전 달', next: '다음 달', today: '이번 달' },
  yearly: { unit: 'year', label: yearLabel, prev: '이전 해', next: '다음 해', today: '올해' },
}
const period = computed(() => PERIODS[current.value] ?? PERIODS.daily)
</script>
<template>
  <div class="planner-view-controls">
    <div class="planner-period" role="group" :aria-label="tr('기간 이동')">
      <button type="button" class="icon-button" :aria-label="tr(period.prev)" :title="tr(period.prev)" @click="shift(period.unit, -1)">‹</button>
      <h2 class="planner-period-label" aria-live="polite">{{ period.label.value }}</h2>
      <button type="button" class="icon-button" :aria-label="tr(period.next)" :title="tr(period.next)" @click="shift(period.unit, 1)">›</button>
      <button type="button" class="button-text" @click="goToday">{{ tr(period.today) }}</button>
    </div>
    <div class="planner-view-switch">
      <nav class="planner-mode-switch" :aria-label="tr('플래너 보기')"><router-link v-for="view in plannerViews" :key="view.id" :to="{ path: view.path, query: { ...route.query, date: localDate(cursor) } }" :aria-current="current === view.id ? 'page' : undefined">{{ tr(view.label) }}</router-link></nav>
      <button type="button" class="planner-save-default" :disabled="current === defaultPlannerView" @click="setDefaultPlannerView(current)">{{ current === defaultPlannerView ? tr('기본 보기') : tr('이 보기를 기본으로') }}</button>
    </div>
  </div>
</template>
<style>
.planner-view-controls { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--space-lg) var(--space-xl); margin: 0 0 var(--space-xxl); }
.planner-period { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-sm); min-width: 0; }
.planner-period-label { margin: 0 var(--space-xs); font-family: var(--font-sans); font-size: var(--type-title-md-size); font-weight: 600; font-variant-numeric: tabular-nums; white-space: nowrap; }
.planner-view-switch { display: flex; align-items: center; gap: var(--space-md); }
.planner-mode-switch { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: var(--space-xs); padding: var(--space-xs); border-radius: var(--radius-md); background: var(--color-surface); }
.planner-mode-switch a { display: grid; place-items: center; min-height: var(--tab-height); padding: 0 var(--space-xl); border: 1px solid transparent; border-radius: var(--radius-sm); font-size: var(--type-control-size); font-weight: 500; text-decoration: none; color: var(--color-body); text-align: center; white-space: nowrap; }
.planner-mode-switch a:hover:not([aria-current]) { background: var(--color-card); color: var(--color-foreground); }
/* 현재 보기는 세그먼트 선택 규칙과 같다: card 바탕 + 조작 경계 + 굵기(DESIGN.md 4장) */
.planner-mode-switch a[aria-current] { background: var(--color-card); border-color: var(--color-control-border); color: var(--color-foreground); font-weight: 600; }
.planner-save-default { min-height: var(--icon-button-size); padding: 0 var(--space-sm); border-radius: var(--radius-sm); font-size: var(--type-caption-size); font-weight: 600; color: var(--color-accent); white-space: nowrap; }
.planner-save-default:hover:not(:disabled) { background: var(--color-surface); }
.planner-save-default:disabled { color: var(--color-muted); cursor: default; }
@media (max-width: 600px) {
  .planner-view-switch { width: 100%; flex-direction: column; align-items: stretch; gap: var(--space-xs); }
  /* 좁은 화면: 기간 이름이 길면(주간 '11월 3주차 (11.16 ~ 11.22)') 줄을 바꾼다 */
  .planner-period-label { flex: 1 1 0; min-width: 0; white-space: normal; text-align: center; font-size: var(--type-body-size); }
  .planner-mode-switch a { padding: 0 var(--space-sm); }
  .planner-save-default { align-self: flex-end; }
}
</style>
