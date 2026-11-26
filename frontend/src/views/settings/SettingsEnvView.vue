<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { modeState, modeMeta, setWeekdaySchedule } from '../../store/modeProfiles'
import { appearance, DENSITIES, FONT_SIZES } from '../../store/appearance'
import DayBoundarySettings from '../../components/DayBoundarySettings.vue'
import { careerGoal } from '../../store/careerGoal'
import { DEFAULT_GOAL } from '../../features/career/careerModel.mjs'
import { DEFAULT_CATEGORY, goalFor } from '../../features/start/startPresets.mjs'
import StartPresetPicker from '../../components/StartPresetPicker.vue'
import { applyStart, startPreset, undoStart } from '../../store/startPreset'
import { savedAt } from '../../features/career/documentVersions.mjs'
import { bodyLocale, chooseLocale, localeState, tr } from '../../store/locale'
import { LOCALES, formatDate, formatWon, modeText } from '../../features/i18n/locale.mjs'
import { session } from '../../features/auth/session.js'

const router = useRouter()
const modes = ['J', 'P', 'B']
// 모드 이름·설명은 본문 언어로 보인다(PR-32)
const modeName = (m) => modeText(m, bodyLocale.value, modeMeta(m)).name
const modeDesc = (m) => modeText(m, bodyLocale.value, modeMeta(m)).desc
const startScreen = ref('홈 대시보드')
const dateFormat = ref('2026.08.24 (월) · 24시간제')
const weekStart = ref('월요일')
const saved = ref(false)

// 시작 구성(PR-23 Q-34): 분류 → 커리어 목표. 설정 화면에서는 메뉴·위젯 맞추기를 기본으로 끄고 둔다(직접 고친 구성을 지키기 위해)
const startCategory = ref(startPreset.category || DEFAULT_CATEGORY)
const startGoal = ref(goalFor(startCategory.value, careerGoal.goal || DEFAULT_GOAL))
const startApplyLayout = ref(false)
watch(() => careerGoal.goal, (value) => { if (value && startPreset.status !== 'saving') startGoal.value = goalFor(startCategory.value, value) })
// 표시 언어(PR-32 1단계). 날짜·금액 형식 미리 보기는 고정 예시 값이다
const LOCALE_SAMPLE_DATE = new Date(2026, 10, 25)
// 저장소 안내는 문장을 이어 붙인 것이 있어(예: 되돌린 뒤 목표 안내) 문장마다 옮긴다
const sentences = (text) => String(text ?? '').split(/(?<=\.) /).map((part) => tr(part)).join(' ')
const applyStartPreset = () => applyStart({ category: startCategory.value, goal: startGoal.value, mode: modeState.activeMode, applyLayout: startApplyLayout.value })

// 아래 '기본값'(시작 화면·날짜 형식·한 주의 시작)은 저장하는 곳이 없는 예시다. 누르면 저장하지 않았다고 알린다(PR-32 12단계에서 "저장했어요"를 고침)
function save() {
  saved.value = true
  setTimeout(() => (saved.value = false), 2000)
}
</script>

<template>
  <section class="card setting-content">
    <div class="setting-head">
      <div>
        <h2>{{ tr('환경 설정') }}</h2>
        <p>{{ tr('기본 모드에 맞춰 홈 화면 구성과 글양식이 달라져요') }}</p>
      </div>
      <span v-if="saved" class="badge" role="status">{{ tr('기본값은 예시라 저장되지 않았어요') }}</span>
    </div>

    <!-- 커리어 목표·시작 구성(docs/design 03 §5, PR-23 Q-34). 저장을 누른 뒤에만 바꾸고, 저장이 끝난 뒤에만 완료 문구를 보인다 -->
    <div class="section-label">{{ tr('커리어 목표 · 시작 구성') }}</div>
    <StartPresetPicker v-model:category="startCategory" v-model:goal="startGoal" v-model:apply-layout="startApplyLayout" :mode="modeState.activeMode" />
    <div class="start-actions">
      <button type="button" class="button-secondary" :disabled="startPreset.status === 'saving' || careerGoal.status === 'saving'" :aria-busy="startPreset.status === 'saving' ? 'true' : undefined" @click="applyStartPreset">{{ startPreset.status === 'saving' ? tr('저장하는 중') : startApplyLayout ? tr('목표 저장하고 구성 적용') : tr('목표 저장') }}</button>
      <button v-if="startPreset.undo" type="button" class="button-text" :disabled="startPreset.status === 'saving'" @click="undoStart">{{ tr('이전 구성으로 되돌리기') }}<span class="figure"> {{ tr('({time} 적용 전)', { time: savedAt(startPreset.undo.at) }) }}</span></button>
    </div>
    <p class="input-field-help" role="status" :data-state="startPreset.status === 'failed' ? 'error' : startPreset.status === 'saved' ? 'success' : undefined">{{ startPreset.status === 'saving' ? tr('저장하는 중이에요.') : startPreset.message ? sentences(startPreset.message) : [careerGoal.goal ? '' : tr('아직 목표를 고르지 않아 기본 목표(취업 준비) 순서로 보여요.'), session.userId ? '' : tr('로그아웃 상태에서는 이 브라우저에 저장해요.')].filter(Boolean).join(' ') }}</p>

    <div class="section-label" style="margin-top: var(--space-lg)">{{ tr('기본 모드') }}</div>
    <div class="mode-picker">
      <button v-for="m in modes" :key="m" :class="{ selected: modeState.activeMode === m }" @click="modeState.activeMode = m">
        <b>{{ m }}</b>
        <span>{{ modeName(m) }}<small>{{ modeDesc(m) }}</small></span>
      </button>
    </div>

    <!-- 평일·주말 기본 모드(PR-19 UF-133). 하루 모드와 같이 이 브라우저에만 저장한다 -->
    <label class="task weekday-mode-toggle">
      <input type="checkbox" :checked="modeState.weekdaySchedule.enabled" aria-describedby="weekday-mode-help" @change="setWeekdaySchedule({ enabled: $event.target.checked })" />
      <span><b>{{ tr('평일과 주말에 다른 모드 쓰기') }}</b><small id="weekday-mode-help">{{ tr('날짜가 바뀌면 그날 모드로 바꿔요. 그날 직접 고른 모드와 작성 중인 글은 그대로예요.') }}</small></span>
    </label>
    <div v-if="modeState.weekdaySchedule.enabled" class="form-row weekday-mode-pick">
      <label>{{ tr('평일(월~금)') }}<select :value="modeState.weekdaySchedule.weekday" @change="setWeekdaySchedule({ weekday: $event.target.value })"><option v-for="m in modes" :key="m" :value="m">{{ modeName(m) }}</option></select></label>
      <label>{{ tr('주말(토·일)') }}<select :value="modeState.weekdaySchedule.weekend" @change="setWeekdaySchedule({ weekend: $event.target.value })"><option v-for="m in modes" :key="m" :value="m">{{ modeName(m) }}</option></select></label>
    </div>
    <p v-if="modeState.weekdaySchedule.enabled" class="form-note weekday-mode-note">{{ tr('켜거나 바꾸면 오늘 모드도 바로 맞춰요. 날짜가 바뀌는 시각은 아래 \'하루의 기준\'을 따르고, 설정은 이 브라우저에 저장돼요.') }}</p>

    <div class="form-style-cta">
      <div>
        <b>{{ tr('일정·루틴·업무 글양식 · 화면 구성') }}</b>
        <p>{{ tr('모드별로 작성 항목과 홈·통계 포틀릿 구성을 직접 고를 수 있어요. 바꿔도 이미 쓴 글은 그대로 유지돼요.') }}</p>
      </div>
      <button type="button" class="button-secondary" @click="router.push('/settings/forms')">{{ tr('글양식 설정하기') }}</button>
    </div>

    <!-- 표시 언어(PR-32 1단계). 저장이 끝난 뒤에만 바꾸고, 기록 내용은 바꾸지 않는다 -->
    <div class="section-label" style="margin-top: 22px">{{ tr('표시 언어') }}</div>
    <p class="form-note" style="margin-top: 0">{{ tr('영어를 고르면 메뉴와 대부분의 화면 본문이 영어로 바뀌어요. 채팅·집중 모드 등 일부 화면 본문, 내가 쓴 기록, 내보내는 문서는 그대로예요.') }}</p>
    <fieldset class="locale-picker">
      <legend class="sr-only">{{ tr('표시 언어') }}</legend>
      <label v-for="l in LOCALES" :key="l.id" class="locale-option" :class="{ selected: localeState.locale === l.id }" :lang="l.id">
        <input type="radio" name="display-locale" :value="l.id" :checked="localeState.locale === l.id" :disabled="localeState.status === 'saving'" @change="chooseLocale(l.id)" />
        <span><b>{{ l.label }}</b><small>{{ formatDate(LOCALE_SAMPLE_DATE, l.id) }} · {{ formatWon(12000, l.id) }}</small></span>
        <em v-if="localeState.locale === l.id">{{ l.id === 'en' ? 'Selected' : '선택됨' }}</em>
      </label>
    </fieldset>
    <p class="input-field-help" role="status" :data-state="localeState.status === 'failed' ? 'error' : localeState.status === 'saved' ? 'success' : undefined">{{ localeState.status === 'saving' ? tr('저장하는 중이에요.') : tr(localeState.message) }}</p>

    <div class="section-label" style="margin-top: 22px">{{ tr('화면 밀도') }}</div>
    <p class="form-note" style="margin-top: 0">{{ tr('간격과 글자 크기를 바꾸면 앱 전체에 바로 적용돼요.') }}</p>
    <div class="density-picker">
      <button
        v-for="(d, key) in DENSITIES"
        :key="key"
        :class="{ selected: appearance.density === key }"
        @click="appearance.density = key"
      >
        <span class="density-preview" :style="{ '--p': d.scale }"><i></i><i></i><i></i></span>
        <b>{{ tr(d.label) }}</b>
        <small>{{ tr(d.desc) }}</small>
      </button>
    </div>

    <div class="section-label" style="margin-top: 20px">{{ tr('글자 크기') }}</div>
    <div class="filter" style="width: fit-content; margin-top: 8px">
      <button v-for="(f, key) in FONT_SIZES" :key="key" :class="{ selected: appearance.fontSize === key }" @click="appearance.fontSize = key">
        {{ tr(f.label) }}
      </button>
    </div>

    <label class="task" style="border: 0; margin-top: 14px; display: inline-flex;">
      <input type="checkbox" v-model="appearance.reduceMotion" />
      <span style="flex: 1"><b>{{ tr('동작 줄이기') }}</b><small>{{ tr('전환 효과와 애니메이션을 최소화해요') }}</small></span>
    </label>

    <!-- 점수 숨기기(PR-19 UF-136). 이 브라우저에만 저장한다. 랭킹 참여는 계정 설정이라 랭킹 화면에서 바꾼다 -->
    <label class="task weekday-mode-toggle">
      <input type="checkbox" v-model="appearance.hideScores" aria-describedby="hide-scores-help" />
      <span><b>{{ tr('점수 숨기기') }}</b><small id="hide-scores-help">{{ tr('홈·통계의 갓생 점수를 보이지 않게 해요. 기록과 계산은 그대로이고, 이 브라우저에만 저장돼요. 랭킹에서 빠지려면 랭킹 화면의 \'랭킹에 나를 보이기\'를 끄세요.') }}</small></span>
    </label>

    <DayBoundarySettings />

    <div class="section-label" style="margin-top: 22px">{{ tr('기본값') }}</div>
    <p class="sample-label">{{ tr('시작 화면·날짜 형식·한 주의 시작은 아직 저장되지 않는 예시예요.') }}</p>
    <label>{{ tr('시작 화면') }}<select v-model="startScreen"><option value="홈 대시보드">{{ tr('홈 대시보드') }}</option><option value="플래너">{{ tr('플래너') }}</option><option value="할 일">{{ tr('할 일') }}</option><option value="통계 보드">{{ tr('통계 보드') }}</option></select></label>
    <label>{{ tr('날짜/시간 포맷') }}<select v-model="dateFormat"><option value="2026.08.24 (월) · 24시간제">{{ tr('2026.08.24 (월) · 24시간제') }}</option><option value="2026-08-24 · 12시간제">{{ tr('2026-08-24 · 12시간제') }}</option><option value="8월 24일 토요일 · 24시간제">{{ tr('8월 24일 토요일 · 24시간제') }}</option></select></label>
    <label>{{ tr('한 주의 시작') }}<select v-model="weekStart"><option value="월요일">{{ tr('월요일') }}</option><option value="일요일">{{ tr('일요일') }}</option></select></label>

    <button class="primary" @click="save">{{ tr('저장하기') }}</button>
  </section>
</template>

<style scoped>
.locale-picker { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-md); margin: 0; padding: 0; border: 0; min-width: 0; }
.locale-option { position: relative; display: block; margin: 0; padding: var(--space-lg); border: 1px solid var(--color-hairline); border-radius: var(--radius-md); background: var(--color-card); cursor: pointer; font-weight: 400; }
.locale-option.selected { border-color: var(--color-accent); background: var(--color-accent-soft); box-shadow: inset 0 0 0 1px var(--color-accent); }
.locale-option:focus-within { outline: 2px solid var(--color-accent); outline-offset: 2px; }
.locale-option input { position: absolute; opacity: 0; pointer-events: none; }
.locale-option span { display: grid; gap: var(--space-xs); padding-right: var(--space-xxl); }
.locale-option small { color: var(--color-body); font-size: var(--type-body-sm-size); }
.locale-option em { position: absolute; top: var(--space-lg); right: var(--space-lg); color: var(--color-accent); font-size: var(--type-caption-size); font-style: normal; font-weight: 600; }
.start-actions { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-sm) var(--space-md); margin-top: var(--space-lg); }
.weekday-mode-toggle { display: inline-flex; margin-top: var(--space-lg); border: 0; }
.weekday-mode-toggle span { flex: 1; }
.weekday-mode-note { margin-top: 0; }
@media (max-width: 480px) { .weekday-mode-pick { flex-direction: column; } }
</style>
