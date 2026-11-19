<!-- 로그아웃 상태에서 기록이 이 브라우저에만 저장된다는 사실을 알린다(PR-07, UF-87). 로그인 상태에서는 보이지 않는다. -->
<script setup>
defineProps({ mode: { type: String, required: true } })
</script>
<template>
  <p v-if="mode === 'local'" class="input-field-help storage-note">이 브라우저에만 저장돼요. 로그인하면 계정에 저장해 다른 기기에서도 볼 수 있어요.</p>
</template>
<style>
.storage-note { display: block; margin: var(--space-sm) 0; }
</style>
