<script setup>
// 회원가입: POST /api/auth/signup으로 계정을 만들고, 같은 정보로 바로 로그인한 뒤 하루 모드 고르기(온보딩)로 간다.
// 동의는 서버 SignupRequest처럼 이용약관·개인정보 처리방침을 따로 받는다(예전에는 체크 하나로 둘 다 보냈다).
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import BrandMark from '../../../components/brand/BrandMark.vue'
import { login, signup } from '../session'
import { passwordProblem } from '../passwordPolicy.mjs'
import { tr } from '../../../store/locale'

const router = useRouter()
const form = reactive({ nickname: '', email: '', password: '', confirm: '', agreeTerms: false, agreePrivacy: false })
const touched = reactive({})
const submitted = ref(false)
const busy = ref(false)
const serverError = ref('')

// 서버 검증(SignupRequest·PasswordPolicy)과 같은 기준을 먼저 화면에서 알려 준다. 최종 판단은 서버가 한다.
const errors = computed(() => ({
  nickname: form.nickname.trim() ? '' : '닉네임을 입력해주세요.',
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) ? '' : '이메일 형식을 확인해주세요.',
  password: passwordProblem(form.password),
  confirm: form.confirm && form.confirm === form.password ? '' : '비밀번호가 서로 달라요.',
  agree: form.agreeTerms && form.agreePrivacy ? '' : '필수 약관 두 가지에 모두 동의해주세요.',
}))
const valid = computed(() => Object.values(errors.value).every((message) => !message))
// 검사 문구는 한국어 원문으로 두고 보일 때 옮긴다
const show = (field) => ((submitted.value || touched[field]) && errors.value[field] ? tr(errors.value[field]) : '')

async function submit() {
  submitted.value = true
  serverError.value = ''
  if (!valid.value || busy.value) return
  busy.value = true
  const email = form.email.trim()
  try {
    await signup({ email, nickname: form.nickname.trim(), password: form.password, agreeTerms: form.agreeTerms, agreePrivacy: form.agreePrivacy })
  } catch (err) {
    serverError.value = err.message
    busy.value = false
    return
  }
  try {
    await login(email, form.password)
    await router.push('/auth/onboarding')
  } catch {
    // 계정은 만들어졌다. 자동 로그인만 실패했으니 로그인 화면으로 보내 이메일을 채워 둔다
    await router.push({ path: '/auth/login', query: { email, joined: '1' } })
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-form-inner signup">
      <RouterLink to="/auth/login" class="auth-brand-row" :aria-label="tr('Timebar Diary 로그인 화면으로')"><BrandMark class="auth-mark" label="" /><span>Timebar Diary</span></RouterLink>
      <h1 class="auth-title">{{ tr('계정 만들기') }}</h1>
      <p class="auth-lead">{{ tr('이메일과 비밀번호로 가입해요. 가입하면 기록을 계정에 저장하고 다른 기기에서도 볼 수 있어요.') }}</p>

      <form novalidate @submit.prevent="submit">
        <div class="input-field">
          <label for="signup-nickname">{{ tr('닉네임') }}</label>
          <input id="signup-nickname" v-model="form.nickname" autocomplete="nickname" maxlength="80" :aria-invalid="!!show('nickname')" aria-describedby="signup-nickname-help" @blur="touched.nickname = true" />
          <span id="signup-nickname-help" class="input-field-help" :data-state="show('nickname') ? 'error' : undefined">{{ show('nickname') || tr('다른 사람에게 보일 이름이에요.') }}</span>
        </div>
        <div class="input-field">
          <label for="signup-email">{{ tr('이메일') }}</label>
          <input id="signup-email" v-model="form.email" type="email" autocomplete="email" inputmode="email" :aria-invalid="!!show('email')" aria-describedby="signup-email-help" @blur="touched.email = true" />
          <span id="signup-email-help" class="input-field-help" :data-state="show('email') ? 'error' : undefined">{{ show('email') || tr('로그인할 때 쓰는 주소예요.') }}</span>
        </div>
        <div class="input-field">
          <label for="signup-password">{{ tr('비밀번호') }}</label>
          <input id="signup-password" v-model="form.password" type="password" autocomplete="new-password" maxlength="72" :aria-invalid="!!show('password')" aria-describedby="signup-password-help" @blur="touched.password = true" />
          <span id="signup-password-help" class="input-field-help" :data-state="show('password') ? 'error' : undefined">{{ show('password') || tr('8~72자, 공백 없이 영문·숫자·특수문자 중 2가지 이상') }}</span>
        </div>
        <div class="input-field">
          <label for="signup-confirm">{{ tr('비밀번호 확인') }}</label>
          <input id="signup-confirm" v-model="form.confirm" type="password" autocomplete="new-password" maxlength="72" :aria-invalid="!!show('confirm')" aria-describedby="signup-confirm-help" @blur="touched.confirm = true" />
          <span id="signup-confirm-help" class="input-field-help" :data-state="show('confirm') ? 'error' : undefined">{{ show('confirm') || tr('같은 비밀번호를 한 번 더 입력해요.') }}</span>
        </div>

        <fieldset class="signup-consent" :aria-invalid="!!(submitted && errors.agree)" aria-describedby="signup-agree-help">
          <legend>{{ tr('필수 동의') }}</legend>
          <label class="consent-row"><input v-model="form.agreeTerms" type="checkbox" /><span>{{ tr('서비스 이용약관에 동의합니다') }}</span></label>
          <label class="consent-row"><input v-model="form.agreePrivacy" type="checkbox" /><span>{{ tr('개인정보 처리방침에 동의합니다') }}</span></label>
          <RouterLink :to="{ path: '/legal', query: { doc: '이용약관' } }" target="_blank" class="inline-link consent-link">{{ tr('약관 전문 보기(새 창)') }}</RouterLink>
          <p id="signup-agree-help" class="input-field-help" :data-state="submitted && errors.agree ? 'error' : undefined">{{ submitted && errors.agree ? tr(errors.agree) : tr('두 항목 모두 필수예요.') }}</p>
        </fieldset>

        <p v-if="serverError" class="input-field-help signup-server-error" data-state="error" role="alert">{{ tr(serverError) }}</p>
        <button type="submit" class="primary" :disabled="busy" :aria-busy="busy ? 'true' : undefined">{{ busy ? tr('가입하는 중…') : tr('가입하기') }}</button>
      </form>

      <p class="auth-switch">{{ tr('이미 계정이 있으신가요?') }} <RouterLink to="/auth/login" class="inline-link">{{ tr('로그인') }}</RouterLink></p>
    </div>
  </div>
</template>

<style scoped>
.signup { width: min(400px, 100%); }
.auth-brand-row { display: inline-flex; align-items: center; gap: var(--space-sm); margin-bottom: var(--space-xxl); color: var(--color-foreground); font-weight: 600; text-decoration: none; }
.auth-title { font-size: var(--type-display-size); }
.auth-lead { margin: var(--space-sm) 0 var(--space-xxl); }
form { display: grid; gap: var(--space-xl); }
form .input-field { display: flex; margin: 0; }
form .input-field input { margin: 0; }
form .input-field label { margin: 0; font-size: var(--type-body-sm-size); font-weight: 600; }
.signup-consent { display: grid; gap: var(--space-sm); margin: 0; padding: var(--space-xl); border: 1px solid var(--color-hairline); border-radius: var(--radius-md); }
.signup-consent legend { padding: 0 var(--space-xs); font-size: var(--type-body-sm-size); font-weight: 600; }
.consent-row { display: flex; align-items: center; gap: var(--space-md); min-height: var(--icon-button-size); margin: 0; font-size: var(--type-body-sm-size); font-weight: 500; }
.consent-row input { width: 18px; height: 18px; margin: 0; flex: none; }
.consent-link { justify-self: start; font-size: var(--type-caption-size); }
.signup-consent .input-field-help { margin: 0; }
.signup-server-error { margin: 0; }
form .primary { width: 100%; margin: 0; }
.auth-switch { margin-top: var(--space-xxl); text-align: center; }
</style>
