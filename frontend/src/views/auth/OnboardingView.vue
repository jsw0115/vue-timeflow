<script setup>
// 가입 직후 커리어 목표와 하루 모드(J·P·B)를 고르는 화면.
// 커리어 목표는 로그인 계정의 환경설정(career)에, 하루 모드는 사이드바 '하루 모드'와 같은 값(modeState)으로 이 브라우저에 저장된다.
// 목표는 대시보드 순서만 바꾸고 권한·공개 범위는 바꾸지 않는다(docs/design 03 §5, DEC-02).
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import BrandMark from '../../components/brand/BrandMark.vue'
import { session } from '../../features/auth/session.js'
import { modeState, modeMeta } from '../../store/modeProfiles'
import { careerGoal, chooseCareerGoal } from '../../store/careerGoal'
import { CAREER_GOALS, DEFAULT_GOAL } from '../../features/career/careerModel.mjs'

const router = useRouter()
const goal = ref(careerGoal.goal || DEFAULT_GOAL)
const mode = ref(modeState.activeMode || 'J')
const MODES = ['J', 'P', 'B']

async function start() {
  modeState.activeMode = mode.value
  if (await chooseCareerGoal(goal.value)) router.push('/career')
}
</script>

<template>
  <div class="auth-page onboarding">
    <div class="onboarding-inner">
      <div class="auth-brand-row"><BrandMark class="auth-mark" label="" /><span>Timebar Diary</span></div>
      <p class="eyebrow">가입 완료 · 목표와 하루 모드 고르기</p>
      <h1>{{ session.nickname ? `${session.nickname}님은` : '지금' }} 어떤 목표에 가까운가요?</h1>
      <p class="onboarding-lead">고른 목표에 맞춰 커리어 대시보드에서 먼저 볼 내용을 정해요. 목표는 화면 순서만 바꾸고 공개 범위나 권한은 바꾸지 않아요. 커리어 대시보드에서 언제든 바꿀 수 있어요.</p>

      <div class="mode-options goal-options" role="radiogroup" aria-label="커리어 목표">
        <label v-for="option in CAREER_GOALS" :key="option.id" class="mode-option" :class="{ selected: goal === option.id }">
          <input v-model="goal" type="radio" name="career-goal" :value="option.id" />
          <span class="mode-copy"><b>{{ option.label }}</b><small>{{ option.desc }}</small></span>
          <span v-if="goal === option.id" class="mode-check">선택됨</span>
        </label>
      </div>

      <h2 class="onboarding-sub">하루는 어떻게 보내고 싶나요?</h2>
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
        <button type="button" class="primary" :disabled="careerGoal.status === 'saving'" :aria-busy="careerGoal.status === 'saving' ? 'true' : undefined" @click="start">{{ careerGoal.status === 'saving' ? '저장하는 중' : '이대로 시작하기' }}</button>
      </div>
      <p class="input-field-help" role="status" :data-state="careerGoal.status === 'failed' ? 'error' : undefined">{{ careerGoal.status === 'failed' ? careerGoal.message : (session.userId ? '커리어 목표는 계정에, 하루 모드는 이 브라우저에 저장돼요.' : '로그아웃 상태라 커리어 목표와 하루 모드를 이 브라우저에 저장해요.') }}</p>
    </div>
  </div>
</template>

<style scoped>
.onboarding-inner { width: min(720px, 100%); }
.auth-brand-row { display: inline-flex; align-items: center; gap: var(--space-sm); margin-bottom: var(--space-block); font-weight: 600; }
.onboarding h1 { margin: var(--space-sm) 0; font-size: var(--type-display-size); }
.onboarding-sub { margin: var(--space-xxl) 0 var(--space-sm); font-size: var(--type-title-lg-size); }
.onboarding-lead { margin: 0 0 var(--space-xl); }
.mode-options { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--space-lg); }
.goal-options { grid-template-columns: repeat(2, minmax(0, 1fr)); }
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
@media (max-width: 760px) { .mode-options, .goal-options { grid-template-columns: minmax(0, 1fr); } .onboarding-actions { flex-direction: column-reverse; align-items: stretch; } .onboarding-inner > .input-field-help { text-align: left; } }
</style>
