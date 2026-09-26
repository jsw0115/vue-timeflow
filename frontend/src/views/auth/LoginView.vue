<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const email = ref('jisu@timebar.app')
const password = ref('')
const keepSignedIn = ref(true)
const notice = ref('')

const error = computed(() => {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) return '이메일 형식을 확인해주세요.'
  if (password.value.length < 8) return '비밀번호는 8자 이상이에요.'
  return ''
})
function signIn() {
  if (error.value) return
  router.push('/')
}
function social(provider) {
  notice.value = provider + ' 로그인은 연동 설정을 마친 뒤 사용할 수 있어요.'
  setTimeout(() => (notice.value = ''), 3000)
}
</script>

<template>
  <div class="auth-split">
    <div class="auth-side">
      <div style="display: flex; align-items: center; gap: 9px"><b style="background: #ffffff26; border-radius: 8px; width: 30px; height: 30px; display: inline-grid; place-items: center">t</b>Timebar Diary</div>
      <div style="max-width: 400px">
        <p style="font-size: 11px; font-weight: 700; letter-spacing: 1px; opacity: 0.75; margin-bottom: 12px">PLAN vs ACTUAL</p>
        <h1>계획한 하루와<br />실제로 산 하루,<br />같은 타임라인 위에서.</h1>
        <p>타임바 다이어리는 당신의 계획과 실행 사이의 간격을 시각화해 더 나은 내일을 계획하도록 돕습니다.</p>
      </div>
      <p style="opacity: 0.6">© 2026 Timebar Diary</p>
    </div>
    <div class="auth-form">
      <div class="auth-form-inner">
        <p class="eyebrow">WELCOME BACK</p>
        <h2>로그인</h2>
        <label>이메일<input v-model="email" type="email" autocomplete="email" /></label>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px">
          <label style="margin: 0">비밀번호</label>
          <router-link to="/auth/reset-password" style="font-size: 10.5px; color: var(--color-accent); font-weight: 700">비밀번호를 잊으셨나요?</router-link>
        </div>
        <input v-model="password" type="password" autocomplete="current-password" placeholder="8자 이상" style="margin-top: 6px" @keyup.enter="signIn" />
        <label style="display: flex; align-items: center; gap: 8px; font-weight: 400; margin-top: 14px"><input type="checkbox" v-model="keepSignedIn" style="width: auto" />자동 로그인 유지</label>
        <p v-if="error && password" class="form-note">{{ error }}</p>
        <button class="primary" :disabled="Boolean(error)" @click="signIn">로그인</button>
        <div style="display: flex; align-items: center; gap: 10px; margin: 20px 0"><span style="flex: 1; height: 1px; background: var(--color-hairline)"></span><small>또는</small><span style="flex: 1; height: 1px; background: var(--color-hairline)"></span></div>
        <div style="display: flex; gap: 9px">
          <button class="auth-social" @click="social('Google')">Google</button>
          <button class="auth-social" @click="social('Kakao')">Kakao</button>
        </div>
        <p v-if="notice" class="badge warn" style="display: block; text-align: center; margin-top: 12px">{{ notice }}</p>
        <p style="text-align: center; margin-top: 20px">
          아직 계정이 없으신가요? <router-link to="/auth/signup" style="color: var(--color-accent); font-weight: 700">회원가입</router-link>
        </p>
      </div>
    </div>
  </div>
</template>
