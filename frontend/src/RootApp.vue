<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import App from './App.vue'
import AdminApp from './AdminApp.vue'

/**
 * 최상위 셸 선택기.
 * 관리자 라우트(meta.admin)는 사용자 셸을 전혀 거치지 않고 AdminApp에서만 렌더된다.
 * 덕분에 관리자 화면에는 사용자 LNB·퀵캡처·채팅 패널이 나타나지 않는다.
 */
const route = useRoute()
const isAdmin = computed(() => route.meta?.admin === true)
</script>

<template>
  <AdminApp v-if="isAdmin" />
  <App v-else />
</template>
