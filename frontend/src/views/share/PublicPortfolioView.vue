<script setup>
// 링크로 여는 공개 포트폴리오(Q-22). 로그인 없이 보이고, 고른 항목만 글자로 보인다. 링크 공개는 검색 수집을 막는다.
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { apiRequest } from '../../features/auth/apiRequest.js'

const route = useRoute()
const items = ref([])
const status = ref('loading')
let robots = null

function setNoIndex(on) {
  if (on && !robots) { robots = document.createElement('meta'); robots.name = 'robots'; robots.content = 'noindex, nofollow'; document.head.appendChild(robots) }
  if (!on && robots) { robots.remove(); robots = null }
}
async function load() {
  const token = String(route.params.token ?? '')
  // 링크 공개인지 모르는 동안에는 먼저 검색 수집을 막아 둔다
  setNoIndex(true)
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) { status.value = 'missing'; return }
  try {
    const data = await apiRequest(`/api/public/portfolios/${token}`)
    items.value = data?.items ?? []
    setNoIndex(data?.scope !== 'public')
    status.value = 'ready'
  } catch (error) { status.value = error?.status === 404 ? 'missing' : 'error' }
}
onMounted(load)
onBeforeUnmount(() => setNoIndex(false))
</script>

<template>
  <main class="public-portfolio">
    <h1>공개 포트폴리오</h1>
    <p v-if="status === 'loading'" class="input-field-help" role="status">포트폴리오를 불러오는 중이에요.</p>
    <div v-else-if="status === 'missing'" class="empty-state" role="status"><p>이 링크는 닫혔거나 기간이 지났어요. 링크를 보낸 사람에게 새 링크를 받아 주세요.</p></div>
    <div v-else-if="status === 'error'" class="empty-state" role="alert"><p>포트폴리오를 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요.</p><button type="button" class="button-secondary" @click="load">다시 시도</button></div>
    <template v-else>
      <article v-for="(item, index) in items" :key="index" class="card public-portfolio-item">
        <h2>{{ item.title }}</h2>
        <p v-if="item.kind" class="tag">{{ item.kind }}</p>
        <p v-if="item.body" class="public-portfolio-body">{{ item.body }}</p>
      </article>
      <p v-if="!items.length" class="empty-state">공개된 항목이 없어요. 링크를 보낸 사람에게 다시 확인해 주세요.</p>
    </template>
  </main>
</template>

<style scoped>
.public-portfolio { display: grid; gap: var(--space-xl); width: min(760px, 100%); margin: 0 auto; padding: var(--space-block) var(--space-xl); }
.public-portfolio h1 { margin: 0; }
.public-portfolio-item { display: grid; gap: var(--space-sm); padding: var(--space-xxl); }
.public-portfolio-item h2, .public-portfolio-item p { margin: 0; }
.public-portfolio-item .tag { justify-self: start; }
.public-portfolio-body { white-space: pre-wrap; overflow-wrap: anywhere; }
</style>
