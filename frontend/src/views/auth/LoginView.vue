<script setup>
import { tr } from '../../store/locale'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BrandMark from '../../components/brand/BrandMark.vue'
import { login, sessionNotice } from '../../features/auth/session'

const router = useRouter()
const route = useRoute()
// 가입 직후 자동 로그인에 실패해 넘어온 경우 이메일을 채워 두고 가입 완료를 알린다
const email = ref(typeof route.query.email === 'string' ? route.query.email : '')
const password = ref('')
const busy = ref(false)
const notice = ref('')
const joined = route.query.joined === '1'
const attempted = ref(false)
const socialNotice = ref('')

const error = computed(() => {
  // 원문 그대로 둔다. 아래 aria-invalid가 '이메일'·'비밀번호'로 시작하는지로 어느 칸인지 고른다(화면에는 tr로 옮겨 보인다)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) return '이메일 형식을 확인해주세요.'
  if (password.value.length < 8) return '비밀번호는 8자 이상이에요.'
  return ''
})
async function signIn() {
  attempted.value = true
  if (error.value || busy.value) return
  busy.value = true; notice.value = ''
  try {
    await login(email.value.trim(), password.value)
    // 로그인 뒤 기본 도착 화면은 오늘(홈)이다. 다른 화면에서 로그인하러 왔으면 그 화면으로 돌아간다(같은 사이트 경로만)
    const target = typeof route.query.redirect === 'string' && /^\/(?!\/)/.test(route.query.redirect) ? route.query.redirect : '/'
    await router.push(target)
  } catch (err) { notice.value = err.message }
  finally { busy.value = false }
}
function social(provider) {
  // 소셜 로그인은 아직 연결되지 않았다. 오류가 아니라 안내로 보인다
  socialNotice.value = tr('{provider} 로그인은 아직 연결되지 않았어요. 이메일로 로그인해 주세요.', { provider })
}
</script>

<template>
  <div class="auth-split">
    <div class="auth-side">
      <div class="auth-brand"><BrandMark class="auth-mark" label="" />Timebar Diary</div>
      <div style="max-width: 400px">
        <p class="auth-eyebrow">{{ tr('계획과 실제 기록') }}</p>
        <h1>{{ tr('계획한 하루와') }}<br />{{ tr('실제로 산 하루,') }}<br />{{ tr('같은 타임라인 위에서.') }}</h1>
        <p>{{ tr('타임바 다이어리는 당신의 계획과 실행 사이의 간격을 시각화해 더 나은 내일을 계획하도록 돕습니다.') }}</p>
      </div>
      <p style="opacity: 0.6">© 2026 Timebar Diary</p>
    </div>
    <div class="auth-form">
      <div class="auth-form-inner">
        <h2>{{ tr('로그인') }}</h2>
        <p v-if="sessionNotice.ended" class="input-field-help" role="status">{{ tr('로그인이 끝났어요. 지금 보이는 기록은 이 브라우저에 있는 것이에요. 계정 기록을 보려면 다시 로그인해 주세요.') }}</p>
        <p v-if="joined" class="input-field-help login-joined" data-state="success" role="status">{{ tr('가입을 마쳤어요. 가입한 이메일과 비밀번호로 로그인해 주세요.') }}</p>
        <form novalidate @submit.prevent="signIn">
          <label for="login-email">{{ tr('이메일') }}</label>
          <input id="login-email" v-model="email" type="email" autocomplete="email" inputmode="email" :aria-invalid="attempted && !!error && error.startsWith('이메일')" />
          <div class="login-password-head">
            <label for="login-password">{{ tr('비밀번호') }}</label>
            <router-link to="/auth/reset-password" class="inline-link login-reset">{{ tr('비밀번호를 잊으셨나요?') }}</router-link>
          </div>
          <input id="login-password" v-model="password" type="password" autocomplete="current-password" aria-describedby="login-help" :aria-invalid="attempted && !!error && error.startsWith('비밀번호')" />
          <p id="login-help" class="input-field-help" :data-state="attempted && error ? 'error' : undefined">{{ attempted && error ? tr(error) : tr('이 탭을 사용하는 동안 로그인 상태를 유지해요.') }}</p>
          <p v-if="notice" class="input-field-help" data-state="error" role="alert">{{ tr(notice) }}</p>
          <button type="submit" class="primary" :disabled="busy" :aria-busy="busy ? 'true' : undefined">{{ busy ? tr('로그인하는 중…') : tr('로그인') }}</button>
        </form>
        <div style="display: flex; align-items: center; gap: 10px; margin: 20px 0"><span style="flex: 1; height: 1px; background: var(--color-hairline)"></span><small>{{ tr('또는') }}</small><span style="flex: 1; height: 1px; background: var(--color-hairline)"></span></div>
        <div style="display: flex; gap: 9px">
          <button class="auth-social" @click="social('Google')">Google</button>
          <button class="auth-social" @click="social('Kakao')">Kakao</button>
        </div>
        <p v-if="socialNotice" class="input-field-help login-social-note" role="status">{{ socialNotice }}</p>
        <p style="text-align: center; margin-top: 20px">
          {{ tr('아직 계정이 없으신가요?') }} <router-link to="/auth/signup" style="color: var(--color-accent); font-weight: 700">{{ tr('회원가입') }}</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
form { display: grid; }
.login-joined { margin: var(--space-md) 0 0; }
.login-password-head { display: flex; justify-content: space-between; align-items: baseline; gap: var(--space-md); margin-top: var(--space-xl); }
.login-password-head label { margin: 0; }
.login-reset { font-size: var(--type-caption-size); }
form .input-field-help { margin: var(--space-sm) 0 0; }
.login-social-note { margin: var(--space-md) 0 0; text-align: center; }
</style>
