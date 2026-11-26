<script setup>
// 로그인한 사용자에게 지금 노출 중인 공지를 보인다. 띠 공지는 헤더 아래, 팝업 공지는 한 번 뜨는 창이다(PR-10 7-2).
// 닫은 공지는 이 브라우저에만 기억한다(공지를 고치면 다시 보인다). 서버 공지를 불러오지 못하면 아무것도 보이지 않는다.
import { computed, ref, watch } from 'vue'
import { tr } from '../store/locale'
import Modal from './Modal.vue'
import { session } from '../features/auth/session.js'
import { apiRequest } from '../features/auth/apiRequest.js'
import { createNoticeClient, dismissKey } from '../features/notices/notices.mjs'

const STORAGE_KEY = 'timeflow.notices.dismissed'
const client = createNoticeClient({ request: apiRequest })
const notices = ref([])
const dismissed = ref(readDismissed())
function readDismissed() {
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { return new Set() }
}
function dismiss(notice) {
  dismissed.value = new Set([...dismissed.value, dismissKey(notice)])
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...dismissed.value].slice(-200))) } catch { /* 저장소를 쓸 수 없으면 이번 화면에서만 닫는다 */ }
}
watch(() => session.userId, async (id) => {
  notices.value = []
  if (!id) return
  try {
    const rows = await client.active()
    if (session.userId === id) notices.value = Array.isArray(rows) ? rows : []
  } catch { notices.value = [] }
}, { immediate: true })

const open = computed(() => notices.value.filter((notice) => !dismissed.value.has(dismissKey(notice))))
const banners = computed(() => open.value.filter((notice) => notice.popup !== true))
const popup = computed(() => open.value.find((notice) => notice.popup === true) ?? null)
</script>

<template>
  <section v-if="banners.length" class="notice-strip" :aria-label="tr('공지')">
    <article v-for="notice in banners" :key="notice.id" class="notice-item">
      <div class="notice-copy"><b>{{ notice.title }}</b><p>{{ notice.body }}</p></div>
      <button type="button" class="button-text" :aria-label="tr('{name} 공지 닫기', { name: notice.title })" @click="dismiss(notice)">{{ tr('닫기') }}</button>
    </article>
  </section>
  <Modal v-if="popup" :title="popup.title" @close="dismiss(popup)">
    <p class="notice-popup-body">{{ popup.body }}</p>
    <template #footer>
      <button type="button" class="primary" @click="dismiss(popup)">{{ tr('확인') }}</button>
    </template>
  </Modal>
</template>

<style scoped>
.notice-strip { display: grid; gap: var(--space-xs); margin-bottom: var(--space-md); }
.notice-item { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-start; gap: var(--space-sm); padding: var(--space-sm) var(--space-md); border: 1px solid var(--color-hairline); border-left: 3px solid var(--color-status-info); border-radius: var(--radius-sm); background: var(--color-card); }
.notice-copy { flex: 1; min-width: 0; }
.notice-copy p { margin: var(--space-xs) 0 0; color: var(--color-body); font-size: var(--type-body-sm-size); white-space: pre-wrap; overflow-wrap: anywhere; }
.notice-copy b { overflow-wrap: anywhere; }
.notice-popup-body { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; }
</style>
