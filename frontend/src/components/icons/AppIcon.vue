<script setup>
// 앱 공통 선 아이콘. 이름이 없으면 fallback 글자를 그린다(기존 라우터 글자 아이콘 호환). 늘 장식이므로 화면 읽기에서 숨긴다.
import { computed, h } from 'vue'
import { ICONS, shape } from './iconPaths.mjs'

const props = defineProps({ name: { type: String, default: '' }, fallback: { type: String, default: '' }, size: { type: [Number, String], default: 20 } })
const shapes = computed(() => (ICONS[props.name] ?? []).map(shape))
const Shapes = () => shapes.value.map(([tag, attrs]) => h(tag, attrs))
</script>

<template>
  <svg
    v-if="shapes.length"
    class="app-icon"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.75"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  ><Shapes /></svg>
  <span v-else class="app-icon app-icon-text" aria-hidden="true">{{ fallback }}</span>
</template>
