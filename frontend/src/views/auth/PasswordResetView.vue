<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

/** 비밀번호 재설정 — 링크 발송과 새 비밀번호 설정이 각각 검증을 거친다. */
const router = useRouter()
const email = ref('')
const sent = ref(false)
const notice = ref('')

const emailError = computed(() =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()) ? '' : '이메일 형식을 확인해주세요.',
)
function sendLink() {
  if (emailError.value) return
  sent.value = true
  flash('재설정 링크를 보냈어요. 메일함을 확인해주세요.')
}

const next = ref('')
const confirm = ref('')
const pwError = computed(() => {
  if (next.value.length < 8) return '새 비밀번호는 8자 이상이어야 해요.'
  if (next.value !== confirm.value) return '두 비밀번호가 서로 달라요.'
  return ''
})
function changePassword() {
  if (pwError.value) return
  router.push('/auth/login')
}
function flash(t) {
  notice.value = t
  setTimeout(() => (notice.value = ''), 3000)
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-form-inner" style="text-align: center">
      <div style="display: flex; align-items: center; gap: 9px; margin-bottom: 20px; justify-content: center">
        <b style="background: var(--color-foreground); color: var(--color-on-primary); border-radius: 8px; width: 27px; height: 27px; display: inline-grid; place-items: center">t</b>Timebar Diary
      </div>

      <section class="card" style="text-align: center">
        <h3>비밀번호를 잊으셨나요?</h3>
        <p>가입하신 이메일 주소를 입력하시면<br />재설정 링크를 보내드립니다.</p>
        <input v-model="email" type="email" placeholder="이메일 주소" style="text-align: center; margin-top: 12px" @keyup.enter="sendLink" />
        <p v-if="email && emailError" class="form-note">{{ emailError }}</p>
        <button class="primary" :disabled="Boolean(emailError)" @click="sendLink">{{ sent ? '링크 다시 보내기' : '재설정 링크 보내기' }}</button>
        <p v-if="notice" class="badge ok" style="display: inline-block; margin-top: 8px">{{ notice }}</p>
      </section>

      <section class="card" style="margin-top: 14px">
        <label>새 비밀번호<input v-model="next" type="password" autocomplete="new-password" placeholder="8자 이상" /></label>
        <label>새 비밀번호 확인<input v-model="confirm" type="password" autocomplete="new-password" @keyup.enter="changePassword" /></label>
        <p v-if="next && pwError" class="form-note">{{ pwError }}</p>
        <button class="primary" :disabled="Boolean(pwError)" @click="changePassword">비밀번호 변경하기</button>
      </section>

      <p style="margin-top: 16px; cursor: pointer" @click="router.push('/auth/login')">← 로그인으로 돌아가기</p>
    </div>
  </div>
</template>
