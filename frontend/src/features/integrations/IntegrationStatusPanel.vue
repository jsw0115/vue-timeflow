<!-- 서버가 확인한 캘린더 연결 상태와 실행 이력만 표시한다. -->
<script setup>
import { tr } from '../../store/locale'
import { ref, watch, onBeforeUnmount } from 'vue'
import { session } from '../auth/session.js'
import { apiRequest } from '../auth/apiRequest.js'
import { loadIntegrationStatus } from './integrationStatus.mjs'
const state = ref(null), busy = ref(false), error = ref('')
let generation = 0
async function refresh() {
  const expected = ++generation
  state.value = null; error.value = ''; busy.value = true
  if (!session.userId) { error.value = '로그인 후 실제 연결 상태를 확인할 수 있습니다.'; busy.value = false; return }
  try { const result = await loadIntegrationStatus(apiRequest); if (expected === generation) state.value = result }
  catch (e) { if (expected === generation) error.value = e.message }
  finally { if (expected === generation) busy.value = false }
}
async function sync(provider) {
  if (busy.value || !state.value?.available || !provider.connected) return
  const expected = generation
  busy.value = true; error.value = ''
  try { await apiRequest(`/api/sync/${provider.id}/run`, { method: 'POST' }); if (expected === generation) await refresh() }
  catch (e) { if (expected === generation) { state.value = null; error.value = e.message } }
  finally { if (expected === generation) busy.value = false }
}
watch(() => session.userId, refresh, { immediate: true })
onBeforeUnmount(() => { generation++ })
</script>
<template>
  <section class="card setting-content" :aria-busy="busy">
    <h2>{{ tr('외부 캘린더 연결 상태') }}</h2>
    <p>{{ tr('서버에서 확인한 연결과 실행 결과를 표시합니다.') }}</p>
    <p v-if="busy" role="status">{{ tr('연결 상태를 확인하고 있습니다.') }}</p>
    <p v-if="error" role="alert">{{ tr('상태 확인 실패. {error}', { error: tr(error) }) }}</p>
    <p v-if="state && !state.available" role="status">{{ tr('현재 외부 캘린더 제공자가 연결되지 않았습니다. 자동 동기화와 연결 설정을 사용할 수 없습니다.') }}</p>
    <div v-for="provider in state?.providers || []" :key="provider.id" class="trow">
      <div><b>{{ tr(provider.name) }}</b><p>{{ tr(provider.label) }}</p><small>{{ tr('마지막 성공 {time}', { time: provider.lastSync || tr('확인된 기록 없음') }) }}</small></div>
      <button type="button" class="review" :disabled="busy || !provider.connected || !state.available" @click="sync(provider)">{{ tr('지금 동기화') }}</button>
    </div>
    <button type="button" class="review" :disabled="busy" @click="refresh">{{ tr('연결 상태 다시 확인') }}</button>
    <h3>{{ tr('실행 이력') }}</h3>
    <p v-if="!state?.logs.length">{{ tr('확인된 실행 이력이 없습니다.') }}</p>
    <ul v-else><li v-for="(log, index) in state.logs" :key="log.id || index">{{ log.text }} · {{ log.time }}</li></ul>
    <p v-if="state?.conflicts.length">{{ tr('확인이 필요한 충돌 {n}건. 실제 충돌 해결 기능이 제공되기 전에는 여기에서 해결됨으로 변경하지 않습니다.', { n: state.conflicts.length }) }}</p>
  </section>
</template>
