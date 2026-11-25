<script setup>
// 재배치 제안 창(PR-19 UF-137). 밀린 시각과 분을 넣으면 뒤의 계획 블록·마감 시각 있는 할 일을 옮기는 안을 보이고, 고른 것만 옮긴다.
// 일정은 다른 사람과의 약속일 수 있어 옮기지 않는다. 옮긴 뒤 바로 되돌릴 수 있고, 적용·되돌리기 모두 서버가 version을 확인한다.
import { computed, ref } from 'vue'
import Modal from './Modal.vue'
import { apiRequest } from '../features/auth/apiRequest.js'
import { MAX_DELAY, MIN_DELAY, applyBody, createRescheduleClient, defaultFrom, kindLabel, moveText, rescheduleErrorText, undoBody } from '../features/planner/reschedule.mjs'

const props = defineProps({ date: { type: String, required: true } })
const emit = defineEmits(['close', 'changed'])
const client = createRescheduleClient(apiRequest)
const from = ref(defaultFrom())
const delay = ref(30)
const plan = ref(null)
const chosen = ref(new Set())
const result = ref(null)
const undone = ref(null)
const busy = ref(false)
const message = ref('')
const delayOk = computed(() => Number.isInteger(delay.value) && delay.value >= MIN_DELAY && delay.value <= MAX_DELAY)
const key = (m) => m.kind + ':' + m.id

async function makePlan() {
  busy.value = true; message.value = ''; result.value = null; undone.value = null
  try {
    plan.value = await client.preview({ date: props.date, from: from.value, delayMinutes: delay.value })
    chosen.value = new Set(plan.value.moves.map(key))
  } catch (error) { message.value = rescheduleErrorText(error) } finally { busy.value = false }
}
function toggle(m) {
  const next = new Set(chosen.value)
  if (next.has(key(m))) next.delete(key(m)); else next.add(key(m))
  chosen.value = next
}
async function apply() {
  busy.value = true; message.value = ''
  try { result.value = await client.apply(applyBody(plan.value.moves, chosen.value)); emit('changed') } catch (error) { message.value = rescheduleErrorText(error) } finally { busy.value = false }
}
async function undo() {
  busy.value = true; message.value = ''
  try { undone.value = await client.apply(undoBody(result.value.moved)); emit('changed') } catch (error) { message.value = rescheduleErrorText(error) } finally { busy.value = false }
}
</script>

<template>
  <Modal title="밀린 계획 다시 배치하기" wide @close="emit('close')">
    <p class="input-field-help">계획 블록과 마감 시각이 있는 할 일을 밀린 만큼 뒤로 옮기는 안을 보여 드려요. 일정은 다른 사람과의 약속일 수 있어 옮기지 않아요. 고른 것만 옮겨요.</p>
    <div class="reschedule-inputs">
      <label>언제부터 밀렸나요<input v-model="from" type="time" step="300" :disabled="busy" /></label>
      <label>몇 분 밀렸나요<input v-model.number="delay" type="number" :min="MIN_DELAY" :max="MAX_DELAY" step="5" :disabled="busy" :aria-invalid="delayOk ? undefined : 'true'" aria-describedby="reschedule-delay-help" /></label>
      <button type="button" class="button-secondary" :disabled="busy || !delayOk || !from" @click="makePlan">재배치안 보기</button>
    </div>
    <p id="reschedule-delay-help" class="input-field-help" :data-state="delayOk ? undefined : 'error'">{{ MIN_DELAY }}~{{ MAX_DELAY }}분 사이로 넣어 주세요.</p>

    <template v-if="plan && !result">
      <fieldset class="reschedule-list">
        <legend>옮길 항목 <span class="figure">{{ chosen.size }}/{{ plan.moves.length }}</span></legend>
        <p v-if="!plan.moves.length" class="input-field-help">{{ plan.from }} 뒤로 옮길 계획 블록이나 마감 시각이 있는 할 일이 없어요.</p>
        <label v-for="m in plan.moves" :key="key(m)" class="reschedule-row">
          <input type="checkbox" :checked="chosen.has(key(m))" @change="toggle(m)" />
          <span><b>{{ m.title }}</b><small><span class="tag">{{ kindLabel(m.kind) }}</span> <span class="figure">{{ moveText(m) }}</span></small></span>
        </label>
      </fieldset>
      <div v-if="plan.unplaced.length" class="reschedule-note">
        <h4>오늘 안에 자리가 없어 그대로 둬요</h4>
        <ul><li v-for="u in plan.unplaced" :key="u.kind + u.id">{{ u.title }} <small>({{ kindLabel(u.kind) }})</small></li></ul>
      </div>
      <div v-if="plan.fixed.length" class="reschedule-note">
        <h4>옮기지 않는 일정</h4>
        <ul><li v-for="(f, i) in plan.fixed" :key="i">{{ f.title }} <span class="figure">{{ f.startTime }}–{{ f.endTime }}</span></li></ul>
      </div>
    </template>

    <div v-if="result" class="reschedule-result" role="status">
      <p>{{ result.moved.length }}개를 옮겼어요.</p>
      <template v-if="result.conflicts.length">
        <p>다른 곳에서 먼저 바뀌어 옮기지 않은 항목이 있어요. 플래너를 확인한 뒤 다시 배치해 주세요.</p>
        <ul><li v-for="c in result.conflicts" :key="c.kind + c.id">{{ c.title || '찾을 수 없는 항목' }} <small>({{ kindLabel(c.kind) }})</small></li></ul>
      </template>
      <p v-if="undone">되돌렸어요: {{ undone.moved.length }}개<template v-if="undone.conflicts.length">. 그사이 바뀐 {{ undone.conflicts.length }}개는 되돌리지 않았어요</template>.</p>
    </div>
    <p v-if="message" class="input-field-help" data-state="error" role="alert">{{ message }}</p>

    <template #footer>
      <button type="button" class="modal-secondary" @click="emit('close')">닫기</button>
      <button v-if="result && result.moved.length && !undone" type="button" class="button-secondary" :disabled="busy" @click="undo">되돌리기</button>
      <button v-if="plan && !result" type="button" class="primary" :disabled="busy || !chosen.size" :aria-busy="busy ? 'true' : undefined" @click="apply">고른 {{ chosen.size }}개 옮기기</button>
    </template>
  </Modal>
</template>

<style scoped>
.reschedule-inputs { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); align-items: end; gap: var(--space-sm); margin-top: var(--space-md); }
.reschedule-inputs label { display: grid; gap: var(--space-xs); margin: 0; }
.reschedule-list { display: grid; gap: var(--space-xs); margin: var(--space-md) 0 0; padding: var(--space-md); border: 1px solid var(--color-hairline); border-radius: var(--radius-md); min-width: 0; }
.reschedule-list legend { padding: 0 var(--space-xs); font-weight: 600; }
.reschedule-list p { margin: 0; }
.reschedule-row { display: flex; align-items: flex-start; gap: var(--space-sm); margin: 0; min-height: var(--input-height); font-weight: 400; }
.reschedule-row input { flex: none; width: auto; margin-top: var(--space-xs); }
.reschedule-row span { display: grid; gap: 2px; min-width: 0; overflow-wrap: anywhere; }
.reschedule-row small { color: var(--color-muted); }
.reschedule-note h4 { margin: var(--space-md) 0 var(--space-xs); font-size: var(--type-body-sm-size); }
.reschedule-note ul, .reschedule-result ul { margin: 0; padding-left: var(--space-xl); }
.reschedule-result p { margin: var(--space-sm) 0 0; }
</style>
