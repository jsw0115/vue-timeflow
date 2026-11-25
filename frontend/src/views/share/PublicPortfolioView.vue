<script setup>
// 링크로 여는 공개 포트폴리오(Q-22). 로그인 없이 보이고, 고른 항목만 글자로 보인다. 링크 공개는 검색 수집을 막는다.
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { apiRequest } from '../../features/auth/apiRequest.js'
import { filledSections, safeLinks } from '../../features/career/portfolioItems.mjs'
import { unlockErrorText, unlockPublic } from '../../features/career/portfolioLinks.mjs'

const route = useRoute()
const items = ref([])
const status = ref('loading')
// 비밀번호가 걸린 링크(Q-39)는 항목 없이 protected만 온다. 비밀번호를 넣어 연다
const locked = ref(false)
const password = ref('')
const unlocking = ref(false)
const unlockMessage = ref('')
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
    locked.value = data?.protected === true && !items.value.length
    setNoIndex(data?.scope !== 'public')
    status.value = 'ready'
  } catch (error) { status.value = error?.status === 404 ? 'missing' : 'error' }
}
async function unlock() {
  if (!password.value) return
  unlocking.value = true; unlockMessage.value = ''
  try {
    const data = await unlockPublic(apiRequest, String(route.params.token ?? ''), password.value)
    items.value = data?.items ?? []; locked.value = false; password.value = ''
  } catch (error) { unlockMessage.value = unlockErrorText(error) } finally { unlocking.value = false }
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
    <form v-else-if="locked" class="card public-portfolio-lock" @submit.prevent="unlock">
      <p>이 포트폴리오는 비밀번호로 보호돼 있어요. 링크를 보낸 사람에게 받은 비밀번호를 넣어 주세요.</p>
      <label>비밀번호<input v-model="password" type="password" autocomplete="current-password" maxlength="100" :aria-invalid="unlockMessage ? 'true' : undefined" aria-describedby="public-portfolio-lock-help" /></label>
      <p id="public-portfolio-lock-help" class="input-field-help" :data-state="unlockMessage ? 'error' : undefined" :role="unlockMessage ? 'alert' : undefined">{{ unlockMessage || '열 번 틀리면 이 링크가 잠겨요.' }}</p>
      <button type="submit" class="primary" :disabled="!password || unlocking" :aria-busy="unlocking ? 'true' : undefined">{{ unlocking ? '확인하는 중' : '열기' }}</button>
    </form>
    <template v-else>
      <article v-for="(item, index) in items" :key="index" class="card public-portfolio-item">
        <h2>{{ item.title }}</h2>
        <p v-if="item.kind" class="tag">{{ item.kind }}</p>
        <!-- 구성 칸과 결과물 링크(PR-26). 서버가 공개 필드만 보낸다 -->
        <dl v-if="filledSections(item).length" class="public-portfolio-sections">
          <template v-for="sec in filledSections(item)" :key="sec.key"><dt>{{ sec.label }}</dt><dd class="public-portfolio-body">{{ sec.value }}</dd></template>
        </dl>
        <div v-if="safeLinks(item).length" class="public-portfolio-links">
          <h3>결과물</h3>
          <ul><li v-for="link in safeLinks(item)" :key="link"><a :href="link" target="_blank" rel="noopener noreferrer nofollow">{{ link }}</a></li></ul>
        </div>
      </article>
      <p v-if="!items.length" class="empty-state">공개된 항목이 없어요. 링크를 보낸 사람에게 다시 확인해 주세요.</p>
    </template>
  </main>
</template>

<style scoped>
.public-portfolio { display: grid; align-content: start; gap: var(--space-xl); width: min(760px, 100%); margin: 0 auto; padding: var(--space-block) var(--space-xl); }
/* 전역 main > * 의 좌우 auto 여백이 격자 안에서 카드를 내용 폭으로 줄이므로 이 화면에서는 폭을 다 쓴다 */
.public-portfolio > * { width: 100%; }
.public-portfolio h1 { margin: 0; }
.public-portfolio-item { display: grid; align-content: start; gap: var(--space-sm); padding: var(--space-xxl); }
.public-portfolio-item h2, .public-portfolio-item p { margin: 0; }
.public-portfolio-item .tag { justify-self: start; }
.public-portfolio-body { white-space: pre-wrap; overflow-wrap: anywhere; }
.public-portfolio-sections { display: grid; gap: var(--space-xs); margin: 0; }
.public-portfolio-sections dt { margin-top: var(--space-md); color: var(--color-muted); font-size: var(--type-caption-size); font-weight: 600; }
.public-portfolio-sections dd { margin: 0; }
.public-portfolio-links h3 { margin: var(--space-md) 0 var(--space-xs); font-size: var(--type-body-sm-size); }
.public-portfolio-links ul { margin: 0; padding-left: var(--space-xl); }
.public-portfolio-links a { overflow-wrap: anywhere; }
.public-portfolio-lock { display: grid; gap: var(--space-md); padding: var(--space-xxl); }
.public-portfolio-lock p { margin: 0; }
.public-portfolio-lock label { display: grid; gap: var(--space-xs); font-weight: 600; }
.public-portfolio-lock button { justify-self: start; }
/* 좁은 화면에서는 본문 폭을 넓히려고 바깥·안쪽 여백을 줄인다 */
@media (max-width: 480px) { .public-portfolio { padding: var(--space-xl) var(--space-lg); } .public-portfolio-item { padding: var(--space-lg); } }
</style>
