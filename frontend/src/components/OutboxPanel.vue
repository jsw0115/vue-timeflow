<!-- 아직 보내지 않은 메모·할 일 변경의 건수와 상태를 보이고, 확인이 필요한 변경은 비교하거나 지우게 한다(PR-12, UF-101·UF-103). -->
<script setup>
import { computed, ref } from 'vue'
import { session } from '../features/auth/session.js'
import { outbox, sendPending, knownOffline } from '../features/offline/offlineQueue.js'
import { memoStore } from '../store/writing'
import { taskStore } from '../store/appState'
import ConflictCompare from './ConflictCompare.vue'

const KIND = { memo: '메모', task: '할 일' }
// 비교 화면에 보일 서버 필드(요청 본문과 같은 이름)
const COMPARE = {
  memo: [['title', '제목'], ['body', '내용']],
  task: [['title', '제목'], ['note', '내용'], ['due', '마감일'], ['categoryName', '카테고리'], ['priority', '우선순위']],
}
const REASON = {
  conflict: '다른 곳에서 먼저 고쳤어요. 최신 내용을 불러오지 못해 비교할 수 없어요.',
  invalid: '서버가 받지 않은 내용이에요.',
  notFound: '다른 곳에서 지워진 기록이에요.',
}
const items = computed(() => outbox.state.items)
const reviewCount = computed(() => items.value.filter((item) => item.status === 'review').length)
const open = ref(false)
const busy = ref(false)
const notice = ref('')

const title = (item) => item.preview?.title || item.body?.title || '제목 없음'
const statusLabel = (item) => (item.status === 'review' ? '확인 필요' : item.seq === outbox.state.sending ? '전송 중' : '전송 대기')
const rows = (item) => COMPARE[item.kind].map(([key, label]) => ({ label, mine: item.body?.[key] ?? '', latest: item.latest?.[key] ?? '' }))
const reload = (item) => (item.kind === 'memo' ? memoStore.reload() : taskStore.reload())

async function run(action) {
  if (busy.value) return
  busy.value = true
  notice.value = ''
  try { await action() } catch (error) { notice.value = error.message } finally { busy.value = false }
}
const sendNow = () => run(async () => {
  const result = await sendPending()
  if (result.stopped && knownOffline()) notice.value = '연결이 없어 보내지 못했어요. 연결되면 자동으로 보내요.'
  else if (result.stopped) notice.value = '아직 보내지 못한 기록이 있어요. 잠시 뒤 다시 보낼게요.'
})
const keepMine = (item) => run(async () => { await outbox.keepMine(item); await sendPending() })
const useLatest = (item) => run(async () => { await outbox.discard(item); await reload(item) })
const discard = (item) => run(async () => {
  if (!window.confirm('‘' + title(item) + '’ 변경을 지울까요? 이 기기에서도 사라져요.')) return
  await outbox.discard(item)
  await reload(item)
})
</script>

<template>
  <section v-if="session.userId && items.length" class="callout outbox-panel" aria-labelledby="outbox-title">
    <div class="outbox-head">
      <p id="outbox-title" role="status">보내지 않은 기록이 <span class="figure">{{ items.length }}</span>건 있어요.<template v-if="reviewCount"> 그중 <span class="figure">{{ reviewCount }}</span>건은 확인이 필요해요.</template><template v-else> 연결되면 자동으로 보내요.</template></p>
      <div class="outbox-actions">
        <button type="button" class="button-secondary" :aria-expanded="open ? 'true' : 'false'" aria-controls="outbox-list" @click="open = !open">{{ open ? '목록 접기' : '목록 보기' }}</button>
        <button type="button" class="button-secondary" :disabled="busy || outbox.state.flushing" :aria-busy="outbox.state.flushing ? 'true' : undefined" @click="sendNow">{{ outbox.state.flushing ? '보내는 중' : '지금 보내기' }}</button>
      </div>
    </div>
    <p v-if="notice" class="input-field-help" role="status">{{ notice }}</p>
    <ul v-if="open" id="outbox-list" class="outbox-list">
      <li v-for="item in items" :key="item.seq">
        <p><span class="tag" :class="{ warn: item.status === 'review' }">{{ statusLabel(item) }}</span> {{ KIND[item.kind] }} {{ item.op === 'create' ? '새로 만듦' : '수정' }} · {{ title(item) }}</p>
        <template v-if="item.status === 'review'">
          <ConflictCompare v-if="item.error?.kind === 'conflict' && item.latest" :rows="rows(item)" :busy="busy" @keep-mine="keepMine(item)" @use-latest="useLatest(item)" />
          <template v-else>
            <p class="input-field-help" data-state="error">{{ REASON[item.error?.kind] ?? '보내지 못했어요.' }} {{ item.error?.kind === 'invalid' ? item.error.message : '' }}</p>
            <button type="button" class="button-secondary" :disabled="busy" @click="discard(item)">이 변경 지우기</button>
          </template>
        </template>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.outbox-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--space-md); }
.outbox-head p { margin: 0; }
.outbox-actions { display: flex; flex-wrap: wrap; gap: var(--space-md); }
.outbox-list { list-style: none; margin: var(--space-lg) 0 0; padding: 0; }
.outbox-list li { padding: var(--space-md) 0; border-top: 1px solid var(--color-hairline); }
.outbox-list li > p { margin: 0 0 var(--space-sm); }
</style>
