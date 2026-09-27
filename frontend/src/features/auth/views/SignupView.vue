<script setup>
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { login, signup } from '../session'
const router = useRouter()
const form = reactive({ nickname: '', email: '', password: '', confirm: '', agree: false })
const busy = ref(false), notice = ref('')
const error = computed(() => {
  if (!form.nickname.trim() || form.nickname.trim().length > 80) return '닉네임을 1~80자로 입력해주세요.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return '이메일 형식을 확인해주세요.'
  if (form.password.length < 8 || form.password.length > 72) return '비밀번호는 8~72자여야 해요.'
  if (form.password !== form.confirm) return '비밀번호가 서로 달라요.'
  if (!form.agree) return '약관을 확인하고 동의해주세요.'
  return ''
})
async function submit() {
  if (error.value || busy.value) return
  busy.value = true; notice.value = ''
  try {
    await signup({ nickname: form.nickname.trim(), email: form.email.trim(), password: form.password, agreeTerms: form.agree, agreePrivacy: form.agree })
    await login(form.email.trim(), form.password)
    await router.push('/chat')
  } catch (err) { notice.value = err.message }
  finally { busy.value = false }
}
</script>
<template>
  <div class="auth-page"><form class="auth-form-inner" @submit.prevent="submit"><p class="eyebrow">TIMEBAR DIARY</p><h2>계정 만들기</h2><p>하루의 계획과 대화를 함께 이어가요.</p>
    <section class="card">
      <label>닉네임<input v-model="form.nickname" maxlength="80" autocomplete="nickname" required /></label>
      <label>이메일<input v-model="form.email" type="email" maxlength="255" autocomplete="email" required /></label>
      <label>비밀번호<input v-model="form.password" type="password" minlength="8" maxlength="72" autocomplete="new-password" required /></label>
      <p class="form-note">영문·숫자·특수문자 중 두 종류 이상을 사용하고 공백은 제외해주세요.</p>
      <label>비밀번호 확인<input v-model="form.confirm" type="password" autocomplete="new-password" required /></label>
      <label class="task"><input v-model="form.agree" type="checkbox" /><span>서비스 이용약관 및 개인정보 처리방침에 동의합니다.</span></label>
      <p v-if="notice" role="alert" class="form-note">{{ notice }}</p><p v-else class="form-note">{{ error }}</p>
      <button class="primary" :disabled="Boolean(error) || busy">{{ busy ? '계정을 만드는 중…' : '가입하고 대화 시작하기' }}</button>
    </section><p>이미 계정이 있으신가요? <router-link to="/auth/login">로그인</router-link></p>
  </form></div>
</template>
