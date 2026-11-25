<script setup>
// 한 줄 빠른 기록. 입력을 규칙으로 해석해 날짜·시간·종류를 미리 보여 주고, 확인한 뒤 바로 저장한다(PR-09 3단계, UF-123~UF-125).
// 오전·오후가 모호하면 고를 때까지 일정 저장을 막는다. 해석하지 못하면 원문 그대로 메모로 둔다. 저장은 작성 창과 같은 경로(savePostDraft)다.
import { tr } from '../store/locale'
import { computed, onMounted, ref, watch } from 'vue'
import SaveStatus from './SaveStatus.vue'
import { openPostComposer } from '../store/appState'
import { makePostDraft, savePostDraft, postDraftError, postStorageMode } from '../store/postComposer'
import { createSaveState } from '../features/records/saveState.mjs'
import { dayBoundary } from '../features/records/dayBoundary.mjs'
import { accountToday, dateLabel, draftFor, parseQuickInput, timeLabel } from '../features/quickInput/parseQuickInput.mjs'

defineProps({ placeholder: { type: String, default: '' } })
const KINDS = ['일정', '할 일', '메모']
const text = ref('')
const kind = ref('메모')
const chosenTime = ref(null)
const kindTouched = ref(false)
onMounted(() => { if (dayBoundary.state.status === 'idle') dayBoundary.load() })
const today = computed(() => accountToday({ timeZone: dayBoundary.state.timeZone, startHour: dayBoundary.state.startHour }))
const result = computed(() => parseQuickInput(text.value, today.value))
watch(() => result.value.raw, () => {
  chosenTime.value = result.value.timeChosen
  if (!kindTouched.value) kind.value = result.value.suggestedKind
})
const parsed = computed(() => ({ ...result.value, timeChosen: chosenTime.value }))
const draft = computed(() => draftFor(kind.value, parsed.value))
const full = computed(() => (draft.value ? { ...makePostDraft(kind.value), ...draft.value } : null))
const needsTime = computed(() => kind.value === '일정' && result.value.times.length > 1 && !chosenTime.value)
const problem = computed(() => {
  if (!text.value.trim()) return ''
  if (needsTime.value) return tr('오전인지 오후인지 골라 주세요.')
  if (kind.value === '일정' && !draft.value) return tr('일정은 날짜와 시간이 필요해요. "내일 오후 3시"처럼 적거나 자세히 쓰기로 열어 주세요.')
  return full.value ? postDraftError(kind.value, full.value) : ''
})
// 할 일은 시각을 하나로 정했으면 마감 시각으로 저장한다(Q-31). 오전·오후를 아직 안 골랐으면 날짜만 저장한다고 알린다
const dropsTime = computed(() => kind.value === '할 일' && result.value.times.length > 1 && !chosenTime.value && !result.value.nextDay)
const saving = createSaveState({ fields: { title: ['제목'], date: ['마감', '날짜'] } })
const savedKind = ref('')
async function save() {
  if (!text.value.trim() || problem.value || !full.value) return
  const which = kind.value
  const outcome = await saving.run(() => savePostDraft(which, full.value))
  if (outcome.ok && outcome.value) {
    savedKind.value = which
    text.value = ''
    kindTouched.value = false
  }
}
function pickKind(next) { kind.value = next; kindTouched.value = true; saving.reset() }
function openDetail() {
  const values = draft.value ?? { title: result.value.raw.trim() }
  openPostComposer(kind.value, values.title ?? '', values)
  text.value = ''
  kindTouched.value = false
}
const storage = computed(() => postStorageMode(kind.value))
const PATHS = { '일정': '/events', '할 일': '/tasks', '메모': '/memos' }
</script>

<template>
  <form class="quick-capture-form" @submit.prevent="save">
    <label for="quick-capture-input" class="quick-label">{{ tr('빠른 기록') }}</label>
    <div class="quick-row">
      <input id="quick-capture-input" v-model="text" :placeholder="placeholder" autocomplete="off" aria-describedby="quick-capture-help" @input="savedKind = ''; saving.reset()" />
      <!-- 홈의 주 버튼은 헤더의 "새 글 작성"이라 여기서는 보조 버튼이다(DESIGN.md 4장 Buttons) -->
      <button type="submit" class="button-secondary" :disabled="!text.trim() || !!problem || saving.state.status === 'saving'" :aria-busy="saving.state.status === 'saving' ? 'true' : undefined">{{ saving.state.status === 'saving' ? tr('저장하는 중') : tr('저장') }}</button>
    </div>
    <p id="quick-capture-help" class="input-field-help">{{ tr('"내일 오후 3시 치과"처럼 적으면 날짜·시간을 찾아 미리 보여 줘요. 확인하고 저장하세요.') }}</p>

    <div v-if="text.trim()" class="quick-preview" aria-live="polite">
      <div class="segmented-tab quick-kinds" role="group" :aria-label="tr('저장할 종류')">
        <button v-for="k in KINDS" :key="k" type="button" :aria-pressed="kind === k" @click="pickKind(k)">{{ tr(k) }}</button>
      </div>
      <dl class="quick-chips">
        <div><dt>{{ tr('제목') }}</dt><dd>{{ kind === '메모' ? result.raw.trim() : result.title }}</dd></div>
        <div v-if="kind !== '메모' && result.date"><dt>{{ kind === '할 일' ? tr('마감') : tr('날짜') }}</dt><dd class="figure">{{ dateLabel(kind === '할 일' && result.nextDay ? draft?.date : result.date) }}</dd></div>
        <div v-if="kind === '일정' && result.times.length === 1"><dt>{{ tr('시간') }}</dt><dd class="figure">{{ result.nextDay ? tr('자정(00:00)') : timeLabel(result.times[0]) }} · {{ tr('1시간') }}</dd></div>
        <div v-if="kind === '할 일' && draft?.dueTime"><dt>{{ tr('마감 시각') }}</dt><dd class="figure">{{ timeLabel(draft.dueTime) }}</dd></div>
      </dl>
      <div v-if="kind !== '메모' && result.times.length > 1" class="quick-times" role="radiogroup" :aria-label="tr('시간 고르기')">
        <span class="input-field-help">{{ kind === '일정' ? tr('오전·오후가 없어 두 시간 중 하나를 골라 주세요.') : tr('오전·오후를 고르면 마감 시각도 저장해요.') }}</span>
        <label v-for="t in result.times" :key="t" class="quick-time" :class="{ selected: chosenTime === t }">
          <input v-model="chosenTime" type="radio" name="quick-time" :value="t" />{{ timeLabel(t) }}
        </label>
      </div>
      <p v-if="dropsTime" class="input-field-help">{{ tr('오전·오후를 고르지 않으면 마감 날짜만 저장돼요.') }}</p>
      <p v-if="!result.parsed" class="input-field-help">{{ tr('날짜나 시간을 찾지 못해 원문 그대로 메모로 둘게요.') }}</p>
      <p v-else-if="kind === '메모'" class="input-field-help">{{ tr('메모로 바꾸면 적은 원문 그대로 저장해요.') }}</p>
      <p v-if="problem" class="input-field-help" data-state="error" role="alert">{{ problem }}</p>
      <button type="button" class="button-text quick-detail" @click="openDetail">{{ tr('자세히 쓰기') }}</button>
    </div>
    <SaveStatus :state="saving.state" :mode="storage === 'local' ? 'local' : 'server'" @retry="save" />
    <p v-if="savedKind && saving.state.status === 'saved'" class="quick-saved"><router-link :to="PATHS[savedKind]">{{ tr('{kind} 목록에서 보기', { kind: tr(savedKind) }) }}</router-link></p>
  </form>
</template>

<style scoped>
.quick-label { display: block; margin-bottom: var(--space-sm); font-size: var(--type-body-sm-size); font-weight: 600; color: var(--color-foreground); }
.quick-row { display: flex; gap: var(--space-md); }
.quick-row input { flex: 1; min-width: 0; min-height: var(--input-height); padding: 0 var(--input-padding); border: 1px solid var(--color-control-border); font-size: var(--type-body-size); }
#quick-capture-help { margin: var(--space-sm) 0 0; }
.quick-preview { display: grid; gap: var(--space-sm); margin-top: var(--space-sm); padding: var(--space-md); border: 1px solid var(--color-hairline); border-radius: var(--radius-md); background: var(--color-card); }
.quick-kinds { width: fit-content; max-width: 100%; }
.quick-chips { display: flex; flex-wrap: wrap; gap: var(--space-xs) var(--space-lg); margin: 0; }
.quick-chips div { display: flex; gap: var(--space-xs); align-items: baseline; min-width: 0; }
.quick-chips dt { color: var(--color-muted); font-size: var(--type-caption-size); }
.quick-chips dd { margin: 0; overflow-wrap: anywhere; }
.quick-times { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-sm); }
.quick-times > span { flex-basis: 100%; }
.quick-time { display: inline-flex; align-items: center; gap: var(--space-xs); padding: var(--space-xs) var(--space-md); border: 1px solid var(--color-control-border); border-radius: var(--radius-md); cursor: pointer; }
.quick-time.selected { border-color: var(--color-accent); background: var(--color-accent-soft); }
.quick-time:focus-within { outline: var(--focus-ring-width) solid var(--color-accent); outline-offset: var(--focus-ring-offset); }
.quick-preview p { margin: 0; }
.quick-detail { justify-self: start; }
.quick-saved { margin: var(--space-xs) 0 0; }
.figure { font-family: var(--font-mono); font-size: var(--type-time-size); font-variant-numeric: tabular-nums; }
@media (max-width: 600px) { .quick-row { flex-direction: column; } }
</style>
