<script setup>
// 가입 직후 시작 구성(분류 → 커리어 목표, PR-23 Q-34)과 하루 모드(J·P·B)를 고르는 화면. 회원가입 때의 역할 설정이 이 커리어 목표다(Q-32).
// 커리어 목표는 로그인 계정의 환경설정(career)에, 하루 모드·메뉴 즐겨찾기·홈 위젯은 이 브라우저에 저장된다.
// 목표는 대시보드 순서만 바꾸고 권한·공개 범위는 바꾸지 않는다(docs/design 03 §5, DEC-02).
import { bodyLocale, tr } from '../../store/locale'
import { modeText } from '../../features/i18n/locale.mjs'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import BrandMark from '../../components/brand/BrandMark.vue'
import { session } from '../../features/auth/session.js'
import { modeState, modeMeta } from '../../store/modeProfiles'
import { careerGoal } from '../../store/careerGoal'
import { DEFAULT_GOAL } from '../../features/career/careerModel.mjs'
import { DEFAULT_CATEGORY, goalFor } from '../../features/start/startPresets.mjs'
import StartPresetPicker from '../../components/StartPresetPicker.vue'
import { applyStart, hasManualStart, startPreset } from '../../store/startPreset'

const router = useRouter()
const category = ref(startPreset.category || DEFAULT_CATEGORY)
const goal = ref(goalFor(category.value, careerGoal.goal || DEFAULT_GOAL))
const mode = ref(modeState.activeMode || 'J')
// 메뉴·위젯을 직접 바꾼 적이 없을 때만 구성 맞추기를 기본으로 켠다
const applyLayout = ref(!hasManualStart(mode.value))
const MODES = ['J', 'P', 'B']

async function start() {
  modeState.activeMode = mode.value
  if (await applyStart({ category: category.value, goal: goal.value, mode: mode.value, applyLayout: applyLayout.value })) router.push('/career')
}
</script>

<template>
  <div class="auth-page onboarding">
    <div class="onboarding-inner">
      <div class="auth-brand-row"><BrandMark class="auth-mark" label="" /><span>Timebar Diary</span></div>
      <p class="eyebrow">{{ tr('가입 완료 · 시작 구성과 하루 모드 고르기') }}</p>
      <h1>{{ session.nickname ? tr('{name}님에게 맞는 시작 구성을 골라요', { name: session.nickname }) : tr('지금 맞는 시작 구성을 골라요') }}</h1>
      <p class="onboarding-lead">{{ tr('분류를 고르면 맞는 커리어 목표와 메뉴·홈 위젯 구성을 보여 드려요. 환경설정에서 언제든 바꾸거나 이전 구성으로 되돌릴 수 있어요.') }}</p>
      <StartPresetPicker v-model:category="category" v-model:goal="goal" v-model:apply-layout="applyLayout" :mode="mode" />

      <h2 class="onboarding-sub">{{ tr('하루는 어떻게 보내고 싶나요?') }}</h2>
      <p class="onboarding-lead">{{ tr('고른 모드에 맞춰 홈 화면 구성과 글양식 기본값을 준비해요. 사이드바의 \'하루 모드\'에서 언제든 바꿀 수 있어요.') }}</p>
      <div class="mode-options" role="radiogroup" :aria-label="tr('하루 모드')">
        <label v-for="m in MODES" :key="m" class="mode-option" :class="{ selected: mode === m }">
          <input v-model="mode" type="radio" name="day-mode" :value="m" />
          <span class="mode-letter" aria-hidden="true">{{ m }}</span>
          <span class="mode-copy"><b>{{ modeText(m, bodyLocale, modeMeta(m)).name }}</b><small>{{ modeText(m, bodyLocale, modeMeta(m)).desc }}</small></span>
          <span v-if="mode === m" class="mode-check">{{ tr('선택됨') }}</span>
        </label>
      </div>

      <div class="onboarding-actions">
        <button type="button" class="button-text" @click="router.push('/')">{{ tr('나중에 고를게요') }}</button>
        <button type="button" class="primary" :disabled="startPreset.status === 'saving'" :aria-busy="startPreset.status === 'saving' ? 'true' : undefined" @click="start">{{ startPreset.status === 'saving' ? tr('저장하는 중') : tr('이대로 시작하기') }}</button>
      </div>
      <p class="input-field-help" role="status" :data-state="startPreset.status === 'failed' ? 'error' : undefined">{{ startPreset.status === 'failed' ? tr(startPreset.message) : (session.userId ? tr('커리어 목표는 계정에, 하루 모드·메뉴 즐겨찾기·홈 위젯은 이 브라우저에 저장돼요.') : tr('로그아웃 상태라 커리어 목표와 하루 모드·메뉴 즐겨찾기·홈 위젯을 이 브라우저에 저장해요.')) }}</p>
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
