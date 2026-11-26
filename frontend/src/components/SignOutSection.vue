<!-- 이 기기에서 계정 로그아웃한다. 보내지 않은 기록이 있으면 먼저 어떻게 할지 묻는다(PR-12, UF-105). -->
<script setup>
import { tr } from '../store/locale'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { logout, session } from '../features/auth/session.js'
import { outbox } from '../features/offline/offlineQueue.js'
import OutboxLogoutDialog from './OutboxLogoutDialog.vue'

const router = useRouter()
const asking = ref(false)
const busy = ref(false)
function signOut() { if (outbox.state.items.length) asking.value = true; else void finish() }
async function finish() {
  asking.value = false
  busy.value = true
  // 연결이 없어 서버에 알리지 못해도 이 기기의 로그인 정보는 지운다(logout의 finally)
  try { await logout() } catch { /* 서버 토큰은 만료되면 끝난다 */ } finally { busy.value = false; await router.push('/auth/login') }
}
</script>

<template>
  <section v-if="session.userId" class="sign-out" aria-labelledby="sign-out-title">
    <div id="sign-out-title" class="section-label">{{ tr('이 기기의 로그인') }}</div>
    <p class="form-note">{{ tr('{email} 계정으로 로그인했어요.', { email: session.email }) }}</p>
    <button type="button" class="button-secondary" :disabled="busy" :aria-busy="busy ? 'true' : undefined" @click="signOut">{{ busy ? tr('로그아웃하는 중') : tr('이 기기에서 로그아웃') }}</button>
    <OutboxLogoutDialog v-if="asking" @logout="finish" @close="asking = false" />
  </section>
</template>

<style scoped>
.sign-out { margin-bottom: var(--space-xxl); }
</style>
