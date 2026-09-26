<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { openProfile } from '../../store/people'

/**
 * 프로필 상세 단독 화면은 어디서나 열리는 공통 프로필 모달로 대체됐다.
 * 예전 링크로 들어오면 주소록으로 보내고 모달을 띄운다.
 */
const router = useRouter()
onMounted(() => {
  openProfile('이서연')
  router.replace('/address')
})
</script>

<template>
  <section class="card">
    <p>주소록으로 이동하고 있어요. 사람 이름 옆 ⓘ 를 누르면 언제든 프로필을 볼 수 있어요.</p>
    <button class="primary" @click="router.replace('/address')">주소록으로 가기</button>
  </section>
</template>
