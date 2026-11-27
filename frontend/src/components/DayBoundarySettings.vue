<!-- 하루가 시작하는 시각(0~6시)과 계정 시간대를 계정 프로필에 저장한다. 통계와 플래너가 같은 기준으로 날짜를 나눈다(PR-08 UF-95). -->
<script setup>
import { tr } from '../store/locale'
import { computed, ref, watch } from 'vue'
import { session } from '../features/auth/session.js'
import { START_HOURS, dayBoundary } from '../features/records/dayBoundary.mjs'
import { createSaveState } from '../features/records/saveState.mjs'
import SaveStatus from './SaveStatus.vue'

const state = dayBoundary.state
const browserZone = Intl.DateTimeFormat().resolvedOptions().timeZone
const draft = ref({ dayStartHour: 0, timeZone: '' })
watch(() => [state.status, state.startHour, state.timeZone], () => {
  if (state.status === 'ready') draft.value = { dayStartHour: state.startHour, timeZone: state.timeZone }
}, { immediate: true })
const saving = createSaveState({ fields: { timeZone: ['시간대'] } })
const dirty = computed(() => state.status === 'ready' && (draft.value.dayStartHour !== state.startHour || draft.value.timeZone.trim() !== state.timeZone))
watch(draft, () => { if (saving.state.status === 'saved') saving.reset() }, { deep: true })
const hourLabel = (hour) => (hour === 0 ? tr('자정(00:00)') : String(hour).padStart(2, '0') + ':00')
function save() {
  if (!dirty.value || !draft.value.timeZone.trim()) return
  saving.run(() => dayBoundary.save({ dayStartHour: draft.value.dayStartHour, timeZone: draft.value.timeZone.trim() }))
}
</script>

<template>
  <section class="day-boundary" aria-labelledby="day-boundary-title">
    <div id="day-boundary-title" class="section-label">{{ tr('하루의 기준') }}</div>
    <p v-if="!session.userId" class="form-note">{{ tr('로그인하면 하루가 시작하는 시각과 시간대를 계정에 저장할 수 있어요.') }}</p>
    <p v-else-if="state.status === 'loading' || state.status === 'idle'" class="input-field-help" role="status">{{ tr('계정 설정을 불러오는 중이에요.') }}</p>
    <div v-else-if="state.status === 'error'" role="status">
      <p class="input-field-help" data-state="error">{{ tr('계정 설정을 불러오지 못했어요.') }}</p>
      <button type="button" class="button-secondary" @click="dayBoundary.load()">{{ tr('다시 불러오기') }}</button>
    </div>
    <template v-else>
      <p class="form-note">{{ tr('새벽에 남긴 기록을 전날로 세고 싶으면 하루가 시작하는 시각을 늦추세요. 통계와 플래너가 같은 기준으로 날짜를 나누고, 이미 남긴 시각은 바뀌지 않아요.') }}</p>
      <label>{{ tr('하루가 시작하는 시각') }}
        <select v-model.number="draft.dayStartHour">
          <option v-for="hour in START_HOURS" :key="hour" :value="hour">{{ hourLabel(hour) }}</option>
        </select>
      </label>
      <label>{{ tr('시간대') }}
        <input v-model="draft.timeZone" maxlength="64" :placeholder="tr('예: Asia/Seoul')" :aria-invalid="saving.state.field === 'timeZone' ? 'true' : undefined" :aria-describedby="saving.state.field === 'timeZone' ? 'day-boundary-zone-error' : 'day-boundary-zone-help'" />
      </label>
      <p v-if="saving.state.field === 'timeZone'" id="day-boundary-zone-error" class="input-field-help" data-state="error">{{ tr(saving.state.fieldMessage) }}</p>
      <p v-else id="day-boundary-zone-help" class="input-field-help">{{ tr('이 브라우저의 시간대는') }} <span class="figure">{{ browserZone }}</span>{{ tr('예요.') }}<button v-if="draft.timeZone !== browserZone" type="button" class="button-secondary day-boundary-use" @click="draft.timeZone = browserZone">{{ tr('이 시간대로 바꾸기') }}</button></p>
      <SaveStatus :state="saving.state" saved-text="하루의 기준을 계정에 저장했어요." @retry="save" />
      <button type="button" class="button-secondary day-boundary-save" :disabled="!dirty || !draft.timeZone.trim()" :aria-busy="saving.state.status === 'saving' ? 'true' : undefined" @click="save">{{ saving.state.status === 'saving' ? tr('저장하는 중') : tr('하루의 기준 저장하기') }}</button>
    </template>
  </section>
</template>

<style scoped>
.day-boundary { margin-top: var(--space-xxl); }
.day-boundary-use { margin-left: var(--space-md); }
.day-boundary-save { margin-top: var(--space-lg); }
</style>
