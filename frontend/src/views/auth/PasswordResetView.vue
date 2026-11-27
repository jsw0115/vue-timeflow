<script setup>
import { tr } from '../../store/locale'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import BrandMark from '../../components/brand/BrandMark.vue'

/**
 * 비밀번호 재설정 — 메일 제공자와 서버 재설정 경로가 없어 링크를 보낼 수 없다.
 * 09 Q-09 결정대로 버튼을 비활성화하고 "메일 발송 준비 중"으로 안내한다(PR-32 15단계에서 반영. 예전에는 "재설정 링크를 보냈어요"를 띄우고 새 비밀번호 저장도 서버 호출 없이 로그인 화면으로 보냈다).
 */
const router = useRouter()
const email = ref('')

const emailError = computed(() =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()) ? '' : tr('이메일 형식을 확인해주세요.'),
)
// 메일을 보낼 곳이 없어 아무것도 하지 않는다(버튼도 비활성화)
function sendLink() {}

const next = ref('')
const confirm = ref('')
const pwError = computed(() => {
  if (next.value.length < 8) return tr('새 비밀번호는 8자 이상이어야 해요.')
  if (next.value !== confirm.value) return tr('두 비밀번호가 서로 달라요.')
  return ''
})
// 재설정 링크(토큰) 없이 바꿀 수 없어 아무것도 하지 않는다(버튼도 비활성화)
function changePassword() {}
</script>

<template>
  <div class="auth-page">
    <div class="auth-form-inner" style="text-align: center">
      <div style="display: flex; align-items: center; gap: 9px; margin-bottom: 20px; justify-content: center">
        <BrandMark class="auth-mark" label="" />Timebar Diary
      </div>

      <section class="card" style="text-align: center">
        <h1 class="heading-title-md">{{ tr('비밀번호를 잊으셨나요?') }}</h1>
        <p>{{ tr('가입하신 이메일 주소를 입력하시면') }}<br />{{ tr('재설정 링크를 보내드립니다.') }}</p>
        <input v-model="email" type="email" autocomplete="email" :aria-label="tr('이메일 주소')" :placeholder="tr('이메일 주소')" style="text-align: center; margin-top: 12px" @keyup.enter="sendLink" />
        <p v-if="email && emailError" class="form-note">{{ emailError }}</p>
        <button class="primary" disabled aria-describedby="reset-pending" @click="sendLink">{{ tr('메일 발송 준비 중') }}</button>
        <p id="reset-pending" class="input-field-help">{{ tr('아직 메일 발송 서비스가 연결되지 않아 재설정 링크를 보낼 수 없어요.') }}</p>
      </section>

      <section class="card" style="margin-top: 14px">
        <label>{{ tr('새 비밀번호') }}<input v-model="next" type="password" autocomplete="new-password" :placeholder="tr('8자 이상')" /></label>
        <label>{{ tr('새 비밀번호 확인') }}<input v-model="confirm" type="password" autocomplete="new-password" @keyup.enter="changePassword" /></label>
        <p v-if="next && pwError" class="form-note">{{ pwError }}</p>
        <button class="primary" disabled aria-describedby="reset-pending" @click="changePassword">{{ tr('비밀번호 변경하기') }}</button>
      </section>

      <p style="margin-top: 16px; cursor: pointer" @click="router.push('/auth/login')">{{ tr('← 로그인으로 돌아가기') }}</p>
    </div>
  </div>
</template>
