<script setup>
import { onMounted, ref } from 'vue'
import { adminAccess, adminClient } from '../../features/admin/admin.js'
import { adminErrorText } from '../../features/admin/adminClient.mjs'

/** 관리자 통계. 서버 지표(GET /api/admin/stats)를 그대로 보인다. 방문·리텐션 같은 추이는 서버가 모으지 않아 보이지 않는다(PR-10 5단계). */
const metrics = ref(adminAccess.metrics)
const error = ref('')
const loading = ref(false)
async function load() {
  loading.value = true
  error.value = ''
  try { metrics.value = await adminClient.metrics() } catch (e) { error.value = adminErrorText(e) } finally { loading.value = false }
}
onMounted(load)
const number = (value) => Number(value ?? 0).toLocaleString('ko-KR')
</script>

<template>
  <div class="admin-page-head">
    <div><h2>서비스 지표</h2><p>가입한 계정과 문의·커뮤니티 수를 서버에서 확인해요</p></div>
    <button type="button" class="button-secondary" :disabled="loading" :aria-busy="loading ? 'true' : undefined" @click="load">{{ loading ? '불러오는 중' : '새로 고침' }}</button>
  </div>
  <p v-if="error" class="input-field-help" data-state="error" role="alert">{{ error }}</p>
  <div v-if="metrics" class="metrics" style="--metric-cols: 4; margin: 16px 0">
    <article><span>전체 계정</span><b class="figure">{{ number(metrics.users) }}</b></article>
    <article><span>활성 계정</span><b class="figure">{{ number(metrics.activeUsers) }}</b></article>
    <article><span>1:1 문의</span><b class="figure">{{ number(metrics.tickets) }}</b></article>
    <article><span>커뮤니티</span><b class="figure">{{ number(metrics.communities) }}</b></article>
  </div>
  <p class="form-note">방문 수와 리텐션 추이는 아직 서버가 모으지 않아 보이지 않아요.</p>
</template>
