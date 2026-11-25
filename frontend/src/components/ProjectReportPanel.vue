<script setup>
// 프로젝트 업무 보고서 초안(PR-19 UF-138, Q-35). 프로젝트(최상위 WBS 작업)와 기간을 고르면, 이 프로젝트에 넣은 실제 기록 시간·완료 작업·남은 작업으로 초안을 만든다.
// 초안은 따로 저장하고 원본 기록은 바꾸지 않는다. 자동으로 보내지 않는다.
import { computed, ref, watch } from 'vue'
import { apiRequest } from '../features/auth/apiRequest.js'
import { session } from '../features/auth/session.js'
import { dayBoundary } from '../features/records/dayBoundary.mjs'
import { accountToday } from '../features/quickInput/parseQuickInput.mjs'
import { PERIODS, createProjectReportClient, draftKey, draftText, hm, periodRange, reportErrorText } from '../features/work/projectReport.mjs'
import { wbsNodes } from '../store/wbs'

const client = createProjectReportClient(apiRequest)
const today = accountToday({ timeZone: dayBoundary.state.timeZone, startHour: dayBoundary.state.startHour })
const projects = computed(() => wbsNodes.value.filter((n) => typeof n.id === 'string' && !n.parentId))
const projectId = ref('')
const period = ref('this-week')
const range = ref(periodRange('this-week', today))
const candidates = ref([])
const summary = ref(null)
const text = ref('')
const generated = ref('')
const saved = ref(null)
const status = ref('idle')
const busy = ref(false)
const message = ref('')
const announce = ref('')
const rangeOk = computed(() => !!range.value?.from && !!range.value?.to && range.value.to >= range.value.from)
const key = computed(() => (projectId.value && rangeOk.value ? draftKey(projectId.value, range.value.from, range.value.to) : null))
const edited = computed(() => text.value !== (saved.value?.body ?? generated.value))

watch(period, (id) => { if (id !== 'custom') range.value = periodRange(id, today) })
async function load() {
  if (!projectId.value || !rangeOk.value) return
  status.value = 'loading'; message.value = ''
  try {
    const [list, draft, prior] = await Promise.all([
      client.candidates(projectId.value, range.value.from, range.value.to),
      client.draft(projectId.value, range.value.from, range.value.to),
      key.value ? client.saved(key.value) : null,
    ])
    candidates.value = list ?? []; summary.value = draft; generated.value = draftText(draft); saved.value = prior
    text.value = prior?.body ?? generated.value
    status.value = 'ready'
  } catch (error) { status.value = 'error'; message.value = reportErrorText(error) }
}
watch(() => [projectId.value, range.value?.from, range.value?.to], load)

/** 기록을 넣고 빼면 초안 재료만 다시 받는다. 쓰던 초안 글은 그대로 두고, 다시 만들기를 눌러야 바뀐다. */
async function toggle(item) {
  busy.value = true; message.value = ''
  try {
    if (item.linked) await client.unlink(projectId.value, item.id)
    else await client.link(projectId.value, item.id)
    const [list, draft] = await Promise.all([client.candidates(projectId.value, range.value.from, range.value.to), client.draft(projectId.value, range.value.from, range.value.to)])
    candidates.value = list ?? []; summary.value = draft; generated.value = draftText(draft)
    announce.value = item.linked ? `‘${item.title}’ 기록을 이 프로젝트에서 뺐어요.` : `‘${item.title}’ 기록을 이 프로젝트에 넣었어요.`
  } catch (error) { message.value = reportErrorText(error) } finally { busy.value = false }
}
function regenerate() {
  if (edited.value && !window.confirm('고친 초안 글을 지금 기록으로 다시 만들까요? 고친 내용은 사라져요.')) return
  text.value = generated.value
  announce.value = '지금 기록으로 초안을 다시 만들었어요.'
}
async function saveDraft() {
  if (!key.value || !summary.value) return
  busy.value = true; message.value = ''
  try {
    saved.value = await client.save(key.value, { title: `${summary.value.projectTitle} 업무 보고 ${range.value.from}~${range.value.to}`, body: text.value, date: range.value.to }, saved.value?.version)
    announce.value = '초안을 저장했어요. 원본 기록은 바뀌지 않아요.'
  } catch (error) { message.value = reportErrorText(error) } finally { busy.value = false }
}
const copied = ref(false)
async function copy() {
  try { await navigator.clipboard.writeText(text.value); copied.value = true; setTimeout(() => (copied.value = false), 2000) } catch { copied.value = false }
}
</script>

<template>
  <section class="card project-report" aria-labelledby="project-report-title">
    <h3 id="project-report-title">프로젝트 업무 보고서 초안</h3>
    <p class="input-field-help">프로젝트와 기간을 고르면, 이 프로젝트에 넣은 실제 기록 시간과 WBS 진척으로 초안을 만들어요. 자동으로 보내지 않고, 초안을 고쳐도 원본 기록은 바뀌지 않아요.</p>
    <p v-if="!session.userId" class="empty-state" role="status">로그인하면 계정의 WBS와 실제 기록으로 초안을 만들 수 있어요. 지금은 아래 예시만 볼 수 있어요.</p>
    <template v-else>
      <div class="report-pick">
        <label>프로젝트<select v-model="projectId"><option value="">{{ projects.length ? '골라 주세요' : '최상위 WBS 작업이 없어요' }}</option><option v-for="p in projects" :key="p.id" :value="p.id">{{ p.title }}</option></select></label>
        <label>기간<select v-model="period"><option v-for="p in PERIODS" :key="p.id" :value="p.id">{{ p.label }}</option></select></label>
        <label>시작<input v-model="range.from" type="date" :disabled="period !== 'custom'" /></label>
        <label>끝<input v-model="range.to" type="date" :min="range.from" :disabled="period !== 'custom'" /></label>
      </div>
      <p v-if="!projects.length" class="input-field-help">WBS에서 최상위 작업을 만들면 프로젝트로 고를 수 있어요.</p>
      <p v-if="!rangeOk" class="input-field-help" data-state="error" role="alert">끝 날짜는 시작 날짜와 같거나 뒤여야 해요.</p>
      <p v-if="status === 'loading'" class="input-field-help" role="status">초안 재료를 불러오는 중이에요.</p>
      <template v-if="summary && status !== 'error'">
        <div class="report-metrics">
          <article><span>실제 시간</span><b class="figure">{{ hm(summary.actualMinutes) }}</b></article>
          <article><span>완료한 작업</span><b class="figure">{{ summary.done.length }}건</b></article>
          <article><span>남은 작업</span><b class="figure">{{ summary.remaining.length }}건</b></article>
        </div>
        <fieldset class="report-actuals">
          <legend>이 기간의 실제 기록</legend>
          <p class="input-field-help">체크한 기록만 이 프로젝트의 실제 시간에 들어가요. 기록 하나는 프로젝트 하나에만 넣을 수 있어요.</p>
          <p v-if="!candidates.length" class="input-field-help">이 기간에 끝낸 실제 기록이 없어요. 플래너에서 실제 기록을 남기면 여기에 보여요.</p>
          <label v-for="c in candidates" :key="c.id" class="report-actual">
            <input type="checkbox" :checked="c.linked" :disabled="busy" @change="toggle(c)" />
            <span>{{ c.title || '제목 없는 기록' }} <small class="figure">{{ hm(c.minutes) }}</small><small v-if="c.linkedProjectTitle"> · 지금 ‘{{ c.linkedProjectTitle }}’에 들어 있어요. 체크하면 이 프로젝트로 옮겨요.</small></span>
          </label>
        </fieldset>
        <label class="report-text">초안<textarea v-model="text" rows="12"></textarea></label>
        <p class="input-field-help">{{ saved ? '저장한 초안을 보여 드려요.' : '아직 저장하지 않은 초안이에요.' }}<template v-if="edited"> 고친 내용이 있어요.</template></p>
        <div class="report-actions">
          <button type="button" class="button-secondary" :disabled="busy || !key" :aria-busy="busy ? 'true' : undefined" @click="saveDraft">초안 저장</button>
          <button type="button" class="button-text" :disabled="busy" @click="regenerate">지금 기록으로 다시 만들기</button>
          <button type="button" class="button-text" @click="copy">{{ copied ? '복사했어요' : '복사' }}</button>
        </div>
      </template>
      <p class="sr-only" role="status">{{ announce }}</p>
      <p v-if="message" class="input-field-help" data-state="error" role="alert">{{ message }}</p>
    </template>
  </section>
</template>

<style scoped>
.project-report { display: grid; gap: var(--space-md); margin-bottom: var(--space-lg); }
.project-report h3, .project-report p { margin: 0; }
.report-pick { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: var(--space-sm); }
.report-pick label, .report-text { display: grid; gap: var(--space-xs); margin: 0; font-size: var(--type-body-sm-size); font-weight: 600; }
.report-pick select, .report-pick input { width: 100%; min-width: 0; }
/* 전역 .metrics는 좁은 화면에서 마지막 칸을 숨겨 쓰지 않는다. 세 칸 모두 보여야 한다 */
.report-metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: var(--space-sm); }
.report-metrics article { display: grid; gap: var(--space-xs); padding: var(--space-md); border: 1px solid var(--color-hairline); border-radius: var(--radius-md); }
.report-metrics span { color: var(--color-muted); font-size: var(--type-caption-size); }
.report-metrics b { font-size: var(--type-body-size); }
.report-actuals { display: grid; gap: var(--space-xs); margin: 0; padding: var(--space-md); border: 1px solid var(--color-hairline); border-radius: var(--radius-md); min-width: 0; }
.report-actuals legend { padding: 0 var(--space-xs); font-weight: 600; }
.report-actual { display: flex; align-items: flex-start; gap: var(--space-sm); margin: 0; min-height: var(--input-height); font-weight: 400; overflow-wrap: anywhere; }
.report-actual input { margin-top: var(--space-xs); flex: none; }
.report-actual small { color: var(--color-muted); }
.report-text textarea { width: 100%; font-weight: 400; }
.report-actions { display: flex; flex-wrap: wrap; gap: var(--space-sm); }
</style>
