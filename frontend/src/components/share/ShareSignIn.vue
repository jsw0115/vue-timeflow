<!-- 로그아웃 상태에서 공유·커뮤니티 화면 대신 보인다. 계정끼리 쓰는 기능이라 시연 데이터를 보이지 않는다(PR-10 2·3단계). -->
<script setup>
import { tr } from '../../store/locale'
import { useRouter } from 'vue-router'

defineProps({ message: { type: String, default: '공유는 로그인한 계정끼리만 할 수 있어요. 로그인하면 친구를 찾고 그룹을 만들 수 있어요.' } })
const router = useRouter()
</script>

<template>
  <section class="card">
    <div class="empty-state" role="status"><p>{{ tr(message) }}</p><button type="button" class="button-secondary" @click="router.push('/auth/login')">{{ tr('로그인하기') }}</button></div>
  </section>
</template>
