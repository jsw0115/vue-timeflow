<script setup>
import { ref } from 'vue'

const autoBackup = ref(true)
</script>

<template>
  <section class="card setting-content">
    <h2>데이터 관리</h2>
    <div class="trow"><b>자동 백업<br /><small>마지막 백업: 오늘 03:00</small></b><button type="button" role="switch" class="toggle" :aria-checked="autoBackup" :class="{ on: autoBackup }" @click="autoBackup = !autoBackup"><em></em></button></div>
    <div class="trow"><b>지금 백업하기</b><span style="color: var(--color-accent); font-weight: 700; font-size: 0.8125rem">백업</span></div>
    <div class="trow"><b>데이터 내보내기 (CSV/JSON)</b><span style="color: var(--color-accent); font-weight: 700; font-size: 0.8125rem">내보내기</span></div>
    <div class="trow"><b>백업 파일에서 가져오기</b><span style="color: var(--color-accent); font-weight: 700; font-size: 0.8125rem">가져오기</span></div>
    <section class="card" style="background: var(--color-surface); margin-top: 16px">
      <b style="color: #b23b3b">위험 구역</b>
      <p style="color: #b23b3b">모든 데이터를 초기화하면 되돌릴 수 없어요.</p>
    </section>
  </section>
</template>
