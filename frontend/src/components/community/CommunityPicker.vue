<!-- 챌린지·랭킹처럼 커뮤니티 하나를 골라야 하는 화면에서, 커뮤니티를 고르지 않고 들어왔을 때 내가 가입한 커뮤니티를 보인다(PR-10 3b-2). -->
<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { session } from '../../features/auth/session.js'
import { communityClient } from '../../features/community/community.js'
import { communityErrorText } from '../../features/community/communityClient.mjs'

const props = defineProps({
  // 고른 커뮤니티를 ?id=로 붙여 갈 경로
  path: { type: String, required: true },
  intro: { type: String, default: '커뮤니티를 골라 주세요.' },
})
const router = useRouter()
const rows = ref([])
const status = ref('idle')
const error = ref('')
const mine = computed(() => rows.value.filter((c) => c.membership === 'ACTIVE'))

async function load() {
  if (!session.userId) { rows.value = []; status.value = 'idle'; return }
  status.value = 'loading'
  try { rows.value = await communityClient.list(); status.value = 'ready' } catch (e) { error.value = communityErrorText(e); status.value = 'error' }
}
watch(() => session.userId, load, { immediate: true })
</script>

<template>
  <section class="card picker">
    <p class="picker-intro">{{ intro }}</p>
    <p v-if="status === 'loading'" class="input-field-help" role="status">커뮤니티를 불러오는 중이에요.</p>
    <div v-else-if="status === 'error'" class="empty-state" role="status"><p>{{ error }}</p><button type="button" class="button-secondary" @click="load">다시 시도</button></div>
    <template v-else-if="status === 'ready'">
      <div v-for="c in mine" :key="c.id" class="event picker-row">
        <span class="picker-name"><b>{{ c.title }}</b><small>회원 <span class="figure">{{ c.members }}</span>명</small></span>
        <button type="button" class="button-secondary" @click="router.push({ path: props.path, query: { id: c.id } })">열기</button>
      </div>
      <div v-if="!mine.length" class="empty-state"><p>아직 가입한 커뮤니티가 없어요. 커뮤니티를 찾아 가입해 보세요.</p><button type="button" class="button-secondary" @click="router.push('/community')">커뮤니티 찾기</button></div>
    </template>
  </section>
</template>

<style scoped>
.picker-intro { margin: 0 0 var(--space-md); }
.picker-row { gap: var(--space-lg); align-items: center; }
/* 전역 .event span(grid)이 숫자 span을 따로 줄에 세우지 않게 한다 */
.picker-name span { display: inline; }
.picker-name { flex: 1; min-width: 0; display: flex; flex-wrap: wrap; gap: var(--space-md); align-items: baseline; }
.picker-name small { color: var(--color-muted); }
</style>
