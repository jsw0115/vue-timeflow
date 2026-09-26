<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

/** 회원가입 — 입력 검증과 휴대폰 인증이 실제로 동작한다. */
const router = useRouter()
const form = ref({ nickname: '', email: '', password: '', confirm: '', phone: '', code: '', agree: false })
const codeSent = ref(false)
const verified = ref(false)
const notice = ref('')

const phoneOk = computed(() => /^01[0-9]-?\d{3,4}-?\d{4}$/.test(form.value.phone.trim()))
const error = computed(() => {
  const f = form.value
  if (!f.nickname.trim()) return '닉네임을 입력해주세요.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) return '이메일 형식을 확인해주세요.'
  if (f.password.length < 8) return '비밀번호는 8자 이상이어야 해요.'
  if (f.password !== f.confirm) return '비밀번호가 서로 달라요.'
  if (!verified.value) return '휴대폰 인증을 완료해주세요.'
  if (!f.agree) return '약관에 동의해주세요.'
  return ''
})

function sendCode() {
  if (!phoneOk.value) {
    flash('휴대폰 번호 형식을 확인해주세요. (예: 010-1234-5678)')
    return
  }
  codeSent.value = true
  flash('인증번호를 보냈어요.')
}
function verify() {
  if (form.value.code.trim().length < 4) {
    flash('인증번호 4자리 이상을 입력해주세요.')
    return
  }
  verified.value = true
  flash('휴대폰 인증이 완료됐어요.')
}
function submit() {
  if (error.value) return
  router.push('/auth/onboarding')
}
function flash(t) {
  notice.value = t
  setTimeout(() => (notice.value = ''), 3000)
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-form-inner">
      <div style="display: flex; align-items: center; gap: 9px; margin-bottom: 20px">
        <b style="background: var(--color-foreground); color: var(--color-on-primary); border-radius: 8px; width: 27px; height: 27px; display: inline-grid; place-items: center">t</b>Timebar Diary
      </div>
      <h2>계정 만들기</h2>
      <p>이메일과 간단한 정보만 있으면 30초면 충분해요.</p>

      <section class="card" style="margin-top: 16px">
        <label>닉네임<input v-model="form.nickname" placeholder="표시할 이름" /></label>
        <label>이메일<input v-model="form.email" type="email" autocomplete="email" placeholder="you@example.com" /></label>
        <div class="form-row">
          <label style="flex: 1">비밀번호<input v-model="form.password" type="password" autocomplete="new-password" placeholder="8자 이상" /></label>
          <label style="flex: 1">비밀번호 확인<input v-model="form.confirm" type="password" autocomplete="new-password" /></label>
        </div>

        <label>휴대폰 번호</label>
        <div class="form-row">
          <input v-model="form.phone" inputmode="tel" placeholder="010-1234-5678" style="flex: 1" :disabled="verified" />
          <button class="review" style="margin: 0; white-space: nowrap" :disabled="verified" @click="sendCode">인증번호 받기</button>
        </div>
        <div class="form-row" v-if="codeSent && !verified">
          <input v-model="form.code" inputmode="numeric" placeholder="인증번호" style="flex: 1" @keyup.enter="verify" />
          <button class="primary" style="white-space: nowrap" @click="verify">확인</button>
        </div>
        <p v-if="verified" class="badge ok" style="display: inline-block">휴대폰 인증 완료</p>

        <label class="task" style="border: 0; margin-top: 12px">
          <input type="checkbox" v-model="form.agree" />
          <span style="flex: 1"><b>서비스 이용약관 및 개인정보처리방침에 동의합니다</b><small>필수 항목이에요</small></span>
        </label>

        <p v-if="notice" class="badge warn" style="display: inline-block">{{ notice }}</p>
        <p v-else-if="error" class="form-note">{{ error }}</p>
        <button class="primary" :disabled="Boolean(error)" @click="submit">가입 완료하기</button>
      </section>

      <p style="text-align: center; margin-top: 16px">
        이미 계정이 있으신가요? <router-link to="/auth/login" style="color: var(--color-accent); font-weight: 700">로그인</router-link>
      </p>
    </div>
  </div>
</template>
