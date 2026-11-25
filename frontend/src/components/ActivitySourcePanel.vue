<script setup>
import { tr } from '../store/locale'
// 커리어 활동의 근거 원본(PR-24). 일정·실제 기록·WBS 작업을 이 활동의 근거로 잇고, 지워진 원본은 "지워진 원본"으로 남겨 보인다.
import { computed, onMounted, ref } from 'vue'
import { apiRequest } from '../features/auth/apiRequest.js'
import { events } from '../store/appState'
import { wbsNodes } from '../store/wbs'
import { MAX_SOURCES, SOURCE_KINDS, candidates, createActivitySourceClient, kindLabel, sourceErrorText } from '../features/career/activitySources.mjs'

const props = defineProps({ activityId: { type: String, required: true }, activityDate: { type: String, default: '' } })
const client = createActivitySourceClient(apiRequest)
const sources = ref([])
const recordings = ref([])
const status = ref('loading')
const message = ref('')
const kind = ref('schedule')
const picked = ref('')
const busy = ref(false)
const options = computed(() => candidates(kind.value, { events: events.value, recordings: recordings.value, wbs: wbsNodes.value }, props.activityDate, sources.value))

onMounted(async () => {
  try { sources.value = (await client.list(props.activityId)) ?? []; status.value = 'ready' } catch (error) { status.value = 'error'; message.value = sourceErrorText(error) }
  try { recordings.value = (await apiRequest('/api/planner/recordings')) ?? [] } catch { recordings.value = [] }
})
async function run(action) {
  busy.value = true; message.value = ''
  try { sources.value = (await action()) ?? [] } catch (error) { message.value = sourceErrorText(error) } finally { busy.value = false }
}
const add = () => picked.value && run(async () => { const result = await client.add(props.activityId, kind.value, picked.value); picked.value = ''; return result })
const remove = (source) => run(() => client.remove(props.activityId, source.kind, source.id))
</script>

<template>
  <fieldset class="activity-sources">
    <legend>{{ tr('근거 원본') }} <span class="figure">{{ sources.length }}/{{ MAX_SOURCES }}</span></legend>
    <p class="input-field-help">{{ tr('이 활동을 실제로 한 일정·실제 기록·WBS 작업을 이어 두면, 나중에 경력기술서나 보고서를 쓸 때 근거로 찾을 수 있어요. 원본을 지우면 여기에는 "지워진 원본"으로 남아요.') }}</p>
    <p v-if="status === 'loading'" class="input-field-help" role="status">{{ tr('근거를 불러오는 중이에요.') }}</p>
    <ul v-else-if="sources.length" class="source-list">
      <li v-for="s in sources" :key="s.kind + s.id">
        <span class="tag">{{ tr(kindLabel(s.kind)) }}</span>
        <span class="source-title" :class="{ broken: s.broken }">{{ s.broken ? tr('지워진 원본') : s.title }}</span>
        <button type="button" class="button-text" :disabled="busy" :aria-label="tr('{name} 연결 끊기', { name: s.broken ? tr('지워진 원본') : s.title })" @click="remove(s)">{{ tr('끊기') }}</button>
      </li>
    </ul>
    <p v-else-if="status === 'ready'" class="input-field-help">{{ tr('아직 이은 근거가 없어요. 아래에서 종류와 기록을 골라 이어 보세요.') }}</p>
    <div class="source-add">
      <label>{{ tr('근거 종류') }}<select v-model="kind" @change="picked = ''"><option v-for="k in SOURCE_KINDS" :key="k.id" :value="k.id">{{ tr(k.label) }}</option></select></label>
      <label class="source-pick">{{ tr('연결할 기록') }}<select v-model="picked" :disabled="!options.length"><option value="">{{ options.length ? tr('골라 주세요') : tr('고를 기록이 없어요') }}</option><option v-for="o in options" :key="o.id" :value="o.id">{{ o.label }}</option></select></label>
      <button type="button" class="button-secondary" :disabled="!picked || busy || sources.length >= MAX_SOURCES" :aria-busy="busy ? 'true' : undefined" @click="add">{{ tr('잇기') }}</button>
    </div>
    <p v-if="message" class="input-field-help" data-state="error" role="alert">{{ tr(message) }}</p>
  </fieldset>
</template>

<style scoped>
.activity-sources { display: grid; gap: var(--space-sm); margin: var(--space-md) 0; padding: var(--space-md); border: 1px solid var(--color-hairline); border-radius: var(--radius-md); }
.activity-sources legend { padding: 0 var(--space-xs); font-weight: 600; }
.activity-sources p { margin: 0; }
.source-list { display: grid; gap: var(--space-xs); margin: 0; padding: 0; list-style: none; }
.source-list li { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-sm); }
.source-title { flex: 1 1 160px; min-width: 0; overflow-wrap: anywhere; }
.source-title.broken { color: var(--color-muted); text-decoration: line-through; }
.source-add { display: flex; flex-wrap: wrap; align-items: flex-end; gap: var(--space-sm); }
.source-add label { display: grid; gap: var(--space-xs); margin: 0; }
.source-pick { flex: 1 1 200px; min-width: 0; }
.source-pick select { width: 100%; }
.figure { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }
</style>
