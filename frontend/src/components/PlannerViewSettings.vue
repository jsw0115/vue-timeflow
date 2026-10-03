<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { defaultPlannerView, plannerViews, setDefaultPlannerView } from '../store/plannerPreferences'
import { cursor } from '../store/plannerDate'
import { localDate } from '../utils/postValidation.mjs'
const route = useRoute()
const current = computed(() => plannerViews.find(view => view.path === route.path)?.id)
</script>
<template>
  <div class="planner-view-controls">
    <nav class="planner-mode-switch" aria-label="플래너 보기"><router-link v-for="view in plannerViews" :key="view.id" :to="{ path: view.path, query: { ...route.query, date: localDate(cursor) } }" :aria-current="current === view.id ? 'page' : undefined">{{ view.label }}</router-link></nav>
    <button type="button" class="planner-save-default" :disabled="current === defaultPlannerView" @click="setDefaultPlannerView(current)">{{ current === defaultPlannerView ? '기본 보기' : '이 보기를 기본으로' }}</button>
  </div>
</template>
<style>
.planner-view-controls { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; margin: 0 0 16px auto; }
.planner-mode-switch { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); padding: 4px; border: 1px solid var(--color-hairline); border-radius: var(--radius-md); background: var(--color-surface); }
.planner-mode-switch a { padding: 9px 16px; border-radius: var(--radius-sm); font-size: .8125rem; text-decoration: none; color: var(--color-muted); text-align: center; }
.planner-mode-switch a[aria-current] { background: var(--color-accent); color: white; }
.planner-save-default { padding: 4px 8px; font-size: .75rem; color: var(--color-accent); }
.planner-save-default:disabled { color: var(--color-muted); }
@media (max-width: 480px) { .planner-view-controls { width: 100%; } .planner-mode-switch { width: 100%; } .planner-mode-switch a { padding: 9px 8px; } }
</style>
