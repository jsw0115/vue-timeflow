<script setup>
import { useRoute, useRouter } from 'vue-router'

/**
 * 하위 화면 공통 헤더 — 뒤로가기 + 상위 경로 표시 + 탭.
 * 커뮤니티/그룹 화면처럼 서로 오가는 페이지들이 같은 골격을 쓰도록 통일한다.
 * 브라우저 히스토리가 없으면(새 창·새로고침) fallback 경로로 이동한다.
 */
const props = defineProps({
  title: { type: String, required: true },
  meta: { type: String, default: '' },
  parent: { type: String, default: '' },
  fallback: { type: String, default: '/' },
  tabs: { type: Array, default: () => [] }, // [{ label, path }]
})

const route = useRoute()
const router = useRouter()

function goBack() {
  if (window.history.state?.back) router.back()
  else router.push(props.fallback)
}
function isActive(tab) {
  return route.path === tab.path
}
</script>

<template>
  <div class="subpage-head">
    <button class="review subpage-back" @click="goBack">← 뒤로</button>
    <div class="subpage-title">
      <p v-if="parent" class="eyebrow">{{ parent }}</p>
      <h2>{{ title }}</h2>
    </div>
    <span v-if="meta" class="badge">{{ meta }}</span>
    <slot name="actions" />
  </div>
  <div v-if="tabs.length" class="tabs subpage-tabs">
    <router-link v-for="t in tabs" :key="t.path" :to="t.path" custom v-slot="{ navigate }">
      <button :class="{ selected: isActive(t) }" @click="navigate">{{ t.label }}</button>
    </router-link>
  </div>
</template>
