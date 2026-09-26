<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

/**
 * 대화방 단독 화면은 채팅 목록(좌측 목록 + 우측 대화)으로 통합됐다.
 * 예전 링크로 들어오면 통합 화면으로 보낸다.
 */
const router = useRouter()
onMounted(() => router.replace('/chat'))
</script>

<template>
  <section class="card">
    <p>채팅 화면으로 이동하고 있어요.</p>
    <button class="primary" @click="router.replace('/chat')">채팅으로 가기</button>
  </section>
</template>
