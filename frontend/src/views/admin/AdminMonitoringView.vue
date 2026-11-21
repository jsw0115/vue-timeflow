<script setup>
// 시스템 모니터링. 서버가 주는 값(가동 시간·힙 메모리·CPU 수)만 보인다(PR-10 UF-117 7-6).
// API 성공률·응답 시간·오류 수·장애 기록·알림 규칙은 서버가 모으지 않아 보이지 않는다고 알린다.
import { computed, onMounted, ref } from 'vue'
import { apiRequest } from '../../features/auth/apiRequest.js'
import { adminErrorText } from '../../features/admin/adminClient.mjs'
import { heapPercent, loadMonitoring, mib, uptimeLabel } from '../../features/admin/monitoring.mjs'

const data = ref(null)
const status = ref('loading')
const loadError = ref('')
const checkedAt = ref('')
async function load() {
  status.value = 'loading'
  loadError.value = ''
  try {
    data.value = await loadMonitoring(apiRequest)
    checkedAt.value = new Intl.DateTimeFormat('ko-KR', { timeStyle: 'medium' }).format(new Date())
    status.value = 'ready'
  } catch (error) { loadError.value = adminErrorText(error); status.value = 'error' }
}
onMounted(load)
const percent = computed(() => heapPercent(data.value?.heapUsedBytes, data.value?.heapMaxBytes))
</script>

<template>
  <div class="admin-page-head">
    <div><h2>시스템 모니터링</h2><p>지금 응답한 API 서버 한 대의 상태예요</p></div>
    <button type="button" class="button-secondary" :disabled="status === 'loading'" @click="load">새로 불러오기</button>
  </div>

  <p v-if="status === 'loading' && !data" class="input-field-help" role="status">서버 상태를 불러오는 중이에요.</p>
  <div v-else-if="status === 'error'" class="empty-state" role="status"><p>{{ loadError }}</p><button type="button" class="button-secondary" @click="load">다시 시도</button></div>
  <template v-else-if="data">
    <div class="metrics" style="--metric-cols: 3; margin-bottom: 16px">
      <article><span>가동 시간</span><b class="figure">{{ uptimeLabel(data.uptimeMs) }}</b><small>이 서버 프로세스가 시작된 뒤</small></article>
      <article><span>힙 메모리</span><b class="figure">{{ mib(data.heapUsedBytes) }}<small>MiB</small></b><small>최대 {{ mib(data.heapMaxBytes) }} MiB 중<template v-if="percent !== null"> · {{ percent }}%</template></small></article>
      <article><span>CPU</span><b class="figure">{{ data.processors }}<small>개</small></b><small>서버가 쓸 수 있는 프로세서 수</small></article>
    </div>
    <p class="input-field-help monitor-checked" role="status">{{ checkedAt }}에 확인했어요. 값은 자동으로 바뀌지 않으니 새로 불러오기를 눌러 주세요.</p>
    <p class="callout">API 성공률·응답 시간·오류 수·장애 기록·알림 규칙은 서버가 모으지 않아 보이지 않아요. 여러 서버를 운영하면 각 서버의 값이 다를 수 있어요.</p>
  </template>
</template>

<style scoped>
/* 지표 카드의 설명 문구는 숫자 아래 줄에 둔다(숫자 단위 small은 그대로 숫자 옆) */
.metrics article > small { display: block; margin-top: var(--space-xs); color: var(--color-muted); }
.monitor-checked { display: block; margin: 0 0 var(--space-md); }
</style>
