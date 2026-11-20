<script setup>
// 가입 직후 하루 모드(J·P·B)를 고르는 화면. 고른 모드는 사이드바 '하루 모드'와 같은 값(modeState)이며 이 브라우저에 저장된다.
// 예전 화면은 이름이 '지수님'으로 고정이었고 고른 모드를 저장하지 않았다.
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import BrandMark from '../../components/brand/BrandMark.vue'
import { session } from '../../features/auth/session.js'
import { modeState, modeMeta } from '../../store/modeProfiles'

const router = useRouter()
const mode = ref(modeState.activeMode || 'J')
const MODES = ['J', 'P', 'B']

function start() {
  modeState.activeMode = mode.value
  router.push('/')
}
</script>

<template>
  <div class="auth-page onboarding">
    <div class="onboarding-inner">
      <div class="auth-brand-row"><BrandMark class="auth-mark" label="" /><span>Timebar Diary</span></div>
      <p class="eyebrow">가입 완료 · 하루 모드 고르기</p>
      <h1>{{ session.nickname ? `${session.nickname}님은` : '어떤' }} 하루를 어떻게 보내고 싶나요?</h1>
      <p class="onboarding-lead">고른 모드에 맞춰 홈 화면 구성과 글양식 기본값을 준비해요. 사이드바의 '하루 모드'에서 언제든 바꿀 수 있어요.</p>

      <div class="mode-options" role="radiogroup" aria-label="하루 모드">
        <label v-for="m in MODES" :key="m" class="mode-option" :class="{ selected: mode === m }">
          <input v-model="mode" type="radio" name="day-mode" :value="m" />
          <span class="mode-letter" aria-hidden="true">{{ m }}</span>
          <span class="mode-copy"><b>{{ modeMeta(m).name }}</b><small>{{ modeMeta(m).desc }}</small></span>
          <span v-if="mode === m" class="mode-check">선택됨</span>
        </label>
      </div>

      <div class="onboarding-actions">
        <button type="button" class="button-text" @click="router.push('/')">나중에 고를게요</button>
        <button type="button" class="primary" @click="start">이 모드로 시작하기</button>
      </div>
      <p class="input-field-help">하루 모드는 이 브라우저에 저장돼요.</p>
    </div>
  </div>
</template>

<style scoped>
.onboarding-inner { width: min(720px, 100%); }
.auth-brand-row { display: inline-flex; align-items: center; gap: var(--space-sm); margin-bottom: var(--space-block); font-weight: 600; }
.onboarding h1 { margin: var(--space-sm) 0; font-size: var(--type-display-size); }
.onboarding-lead { margin: 0 0 var(--space-xxl); }
.mode-options { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--space-lg); }
.mode-option { position: relative; display: grid; gap: var(--space-md); align-content: start; padding: var(--space-xl); border: 1px solid var(--color-hairline); border-radius: var(--radius-lg); background: var(--color-card); cursor: pointer; transition: border-color var(--motion-fast); }
.mode-option:hover { border-color: var(--color-control-border); }
.mode-option.selected { border-color: var(--color-accent); background: var(--color-accent-soft); box-shadow: inset 0 0 0 1px var(--color-accent); }
.mode-option:focus-within { outline: 2px solid var(--color-accent); outline-offset: 2px; }
.mode-option input { position: absolute; opacity: 0; pointer-events: none; }
.mode-letter { display: grid; place-items: center; width: 36px; height: 36px; border-radius: var(--radius-full); background: var(--color-surface); font-weight: 600; }
.mode-copy { display: grid; gap: var(--space-xs); }
.mode-copy b { font-size: var(--type-body-size); }
.mode-copy small { color: var(--color-body); font-size: var(--type-body-sm-size); line-height: 1.5; }
.mode-check { position: absolute; top: var(--space-lg); right: var(--space-lg); font-size: var(--type-caption-size); font-weight: 600; color: var(--color-accent); }
.onboarding-actions { display: flex; justify-content: flex-end; align-items: center; gap: var(--space-md); margin-top: var(--space-xxl); }
.onboarding-inner > .input-field-help { margin-top: var(--space-md); text-align: right; }
@media (max-width: 760px) { .mode-options { grid-template-columns: minmax(0, 1fr); } .onboarding-actions { flex-direction: column-reverse; align-items: stretch; } .onboarding-inner > .input-field-help { text-align: left; } }
</style>
