<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  routines, openPostComposer, ROUTINE_DAYS, isRoutineToday, routineRate, dayLabel, toggleRoutine,
  isRestToday, routineRule, routinePlannedDates, routineStore,
} from '../../store/appState'
import { createSaveState, saveFailureMessage } from '../../features/records/saveState.mjs'
import SaveStatus from '../../components/SaveStatus.vue'
import ConflictCompare from '../../components/ConflictCompare.vue'
import StorageNote from '../../components/StorageNote.vue'
import { isAutomationOn, automationParam } from '../../store/automations'
import RepeatSettings from '../../components/RepeatSettings.vue'
import { makeRecurrence, skipDates, addSkipDates, removeSkipDate, recurrenceError, datesBetween, MAX_EXCEPTIONS } from '../../utils/recurrence.mjs'
import { localDate } from '../../utils/postValidation.mjs'
import TagMentionInput from '../../components/TagMentionInput.vue'
import { routineError } from '../../utils/postValidation.mjs'
import Modal from '../../components/Modal.vue'
import ListFilterBar from '../../components/ListFilterBar.vue'
import HelpPopover from '../../components/HelpPopover.vue'
import { modeState, modeMeta, isFieldOn } from '../../store/modeProfiles'
import PageActions from '../../components/PageActions.vue'

const route = useRoute()
const router = useRouter()

/* ---------- 검색 · 필터 ---------- */
const query = ref('')
const filters = ref({ scope: '오늘', category: '전체' })
const FILTER_GROUPS = computed(() => [
  {
    id: 'scope',
    all: '전체',
    options: [
      { value: '오늘', label: '오늘' },
      { value: '전체', label: '전체' },
      { value: '미완료', label: '미완료' },
      { value: '쉬는 중', label: '쉬는 중' },
    ],
  },
  {
    id: 'category',
    all: '전체',
    options: [
      { value: '전체', label: '전체 분류' },
      ...[...new Set(routines.value.map((r) => r.category))].map((c) => ({ value: c, label: c })),
    ],
  },
])

const visible = computed(() => {
  const k = query.value.trim()
  return routines.value.filter((r) => {
    const scope = filters.value.scope
    if (scope === '오늘' && !isRoutineToday(r)) return false
    if (scope === '미완료' && (r.done || r.paused)) return false
    if (scope === '쉬는 중' && !r.paused && !isRestToday(r)) return false
    if (filters.value.category !== '전체' && r.category !== filters.value.category) return false
    if (k && !r.title.includes(k) && !(r.category ?? '').includes(k)) return false
    return true
  })
})
const todayList = computed(() => routines.value.filter((r) => isRoutineToday(r)))
const doneCount = computed(() => todayList.value.filter((r) => r.done).length)
const progress = computed(() => (todayList.value.length ? Math.round((doneCount.value / todayList.value.length) * 100) : 0))

/* ---------- 만들기 · 수정 ---------- */
const showModal = ref(false)
const editingId = ref(null)
const routineMode = routineStore.mode
// 수정 창을 연 때의 루틴. 저장은 이 version으로 보내 다른 곳의 변경을 모르고 덮어쓰지 않는다(UF-84)
const editingBase = ref(null)
const saving = createSaveState({ fields: { title: ['title', '이름', '제목'], time: ['time', '시간'], goal: ['goal', '목표'], days: ['요일', 'days'] } })
const conflict = ref(null)
// 중지·쉬는 날·삭제처럼 창 없이 바로 저장하는 동작의 실패 안내
const actionMessage = ref('')
async function quick(run) {
  actionMessage.value = ''
  try { await run() } catch (error) {
    if (error.kind === 'stale') return
    actionMessage.value = error.kind === 'conflict' ? '다른 곳에서 먼저 바뀌어 최신 내용으로 바꿨어요. 확인한 뒤 다시 시도해 주세요.' : saveFailureMessage(error)
  }
}
const DAY_PRESETS = [
  { label: '매일', days: [0, 1, 2, 3, 4, 5, 6] },
  { label: '평일', days: [1, 2, 3, 4, 5] },
  { label: '주말', days: [0, 6] },
]
const draft = ref(emptyDraft())
function emptyDraft() {
  return { startDate: localDate(), recurrence: makeRecurrence({ frequency: 'weekly', weekdays: [0,1,2,3,4,5,6] }), title: '', time: '19:00', duration: 30, reminderMinutes: 10, body: '', category: '건강', days: [0, 1, 2, 3, 4, 5, 6], goalCount: 1, goalUnit: '회', notify: true }
}
// 수정 창을 연 순간의 모드로 필드를 고정한다(UF-133). 열려 있는 동안 하루 모드가 바뀌어도 입력 항목이 그대로다
const formMode = ref(modeState.activeMode)
function on(key) {
  return isFieldOn(formMode.value, 'routine', key)
}
function openModal() { openPostComposer('루틴') }
function openEdit(r) {
  editingId.value = r.id
  editingBase.value = { ...r }
  conflict.value = null
  saving.reset()
  draft.value = {
    startDate: r.startDate ?? localDate(), recurrence: makeRecurrence(r.recurrence ?? { frequency: 'weekly', weekdays: r.days?.length ? r.days : [0,1,2,3,4,5,6] }),
    title: r.title,
    time: r.time,
    duration: r.duration ?? 30,
    reminderMinutes: r.reminderMinutes ?? 10,
    body: r.body ?? '',
    category: r.category ?? '건강',
    days: [...(r.days ?? [])],
    goalCount: r.goal?.count ?? 1,
    goalUnit: r.goal?.unit ?? '회',
    notify: r.notify !== false,
  }
  formMode.value = modeState.activeMode
  showModal.value = true
}
watch(() => route.query.new, (v) => { if (v) openModal() }, { immediate: true })

function toggleDay(d) {
  const list = draft.value.days
  const i = list.indexOf(d)
  if (i >= 0) list.splice(i, 1)
  else list.push(d)
}
function applyPreset(p) {
  draft.value.days = [...p.days]
}
const validationError = computed(() => routineError(draft.value))
const canSave = computed(() => !validationError.value)

async function saveRoutine() {
  if (!canSave.value) return
  const payload = {
    startDate: draft.value.startDate, recurrence: makeRecurrence(draft.value.recurrence),
    title: draft.value.title.trim(),
    time: draft.value.time,
    duration: draft.value.duration,
    reminderMinutes: draft.value.reminderMinutes,
    body: draft.value.body,
    category: draft.value.category,
    days: [...draft.value.days].sort(),
    goal: { count: draft.value.goalCount, unit: draft.value.goalUnit },
    notify: draft.value.notify,
  }
  conflict.value = null
  const result = await saving.run(() => editingId.value
    ? routineStore.update(editingBase.value, payload)
    : routineStore.create({ ...payload, done: false, streak: 0, best: 0, history: [0, 0, 0, 0, 0, 0, 0], paused: false }))
  if (result.ok) { showModal.value = false; return }
  if (result.error.kind === 'conflict') conflict.value = { latest: { ...(result.error.latest ?? editingBase.value) } }
}
const compareRows = computed(() => {
  if (!conflict.value) return []
  const latest = conflict.value.latest, mine = draft.value
  return [
    { label: '루틴 이름', mine: mine.title.trim(), latest: latest.title },
    { label: '시작 시간', mine: mine.time + ' · ' + mine.duration + '분', latest: latest.time + ' · ' + (latest.duration ?? 30) + '분' },
    { label: '목표', mine: mine.goalCount + mine.goalUnit, latest: (latest.goal?.count ?? '') + (latest.goal?.unit ?? '') },
    { label: '분류', mine: mine.category, latest: latest.category },
    { label: '반복 시작일', mine: mine.startDate, latest: latest.startDate ?? '' },
  ]
})
// 내 내용으로 다시 저장: 최신 version으로 내 입력을 다시 보낸다. 서버 내용 쓰기: 입력을 최신 값으로 바꾼다
function keepMine() {
  editingBase.value = { ...conflict.value.latest }
  conflict.value = null
  saveRoutine()
}
function useLatest() {
  const latest = conflict.value.latest
  editingBase.value = { ...latest }
  conflict.value = null
  saving.reset()
  openEdit(latest)
}
function togglePause(r) {
  quick(() => routineStore.update(r, { paused: !r.paused }))
}

/* ---------- 쉬는 날 (UF-134) ---------- */
// 저장할 때마다 목록 항목이 최신 값으로 바뀌므로 ID로 찾아 쓴다
const restTargetId = ref(null)
const restTarget = computed(() => routines.value.find((r) => r.id === restTargetId.value) ?? null)
const restFrom = ref('')
const restTo = ref('')
const restMessage = ref('')
const restSaving = ref(false)
const today = computed(() => localDate())
function openRest(r) {
  restTargetId.value = r.id
  restMessage.value = ''
  restFrom.value = today.value
  restTo.value = today.value
}
const restDates = computed(() => {
  if (!restTarget.value || !restFrom.value || !restTo.value || restFrom.value < today.value || restTo.value < restFrom.value) return []
  return routinePlannedDates(restTarget.value, restFrom.value, restTo.value)
})
const restNextRule = computed(() => (restTarget.value ? addSkipDates(routineRule(restTarget.value), restDates.value) : null))
const restError = computed(() => {
  const r = restTarget.value
  if (!r) return ''
  if (!restFrom.value || !restTo.value) return '시작일과 종료일을 선택해주세요.'
  if (restFrom.value < today.value) return '오늘 이후 날짜만 쉬는 날로 정할 수 있어요.'
  if (restTo.value < restFrom.value) return '종료일은 시작일 이후로 선택해주세요.'
  if (!datesBetween(restFrom.value, restTo.value).length) return `기간은 최대 ${MAX_EXCEPTIONS}일까지 정할 수 있어요.`
  if (!restDates.value.length) return '이 기간에는 예정된 회차가 없어요.'
  const already = skipDates(r.recurrence)
  if (restDates.value.every((date) => already.has(date))) return '이미 쉬는 날로 정한 기간이에요.'
  if (r.done && restDates.value.includes(today.value)) return '오늘 완료한 루틴은 쉬는 날로 정할 수 없어요. 체크를 해제한 뒤 정해주세요.'
  return recurrenceError(restNextRule.value, r.startDate ?? today.value)
})
const restUpcoming = computed(() => [...skipDates(restTarget.value?.recurrence)].filter((date) => date >= today.value).sort())
const restPastCount = computed(() => [...skipDates(restTarget.value?.recurrence)].filter((date) => date < today.value).length)
async function saveRest(recurrence) {
  if (restSaving.value) return
  restSaving.value = true
  restMessage.value = ''
  try { await routineStore.update(restTarget.value, { recurrence }) } catch (error) {
    if (error.kind !== 'stale') restMessage.value = error.kind === 'conflict' ? '다른 곳에서 먼저 바뀌어 최신 내용으로 바꿨어요. 확인한 뒤 다시 시도해 주세요.' : saveFailureMessage(error)
  } finally { restSaving.value = false }
}
function addRest() {
  if (restError.value) return
  saveRest(restNextRule.value)
}
function removeRest(date) {
  saveRest(removeSkipDate(restTarget.value.recurrence, date))
}
function restLabel(date) {
  return `${date} (${ROUTINE_DAYS[new Date(date + 'T12:00:00').getDay()]})`
}
function removeRoutine(r) {
  if (!window.confirm('‘' + r.title + '’ 루틴을 삭제할까요? 연속 기록도 함께 사라져요.')) return
  quick(() => routineStore.remove(r))
}
</script>

<template>
  <div class="page-tools">
    <HelpPopover
      title="루틴 사용법"
      summary="반복 주기와 목표를 정해두면, 오늘 해야 할 루틴만 골라 보여주고 연속 기록을 이어줘요."
      :steps="[
        '‘+ 새 루틴’으로 이름·시간·요일·목표를 정해요.',
        '오늘 탭에서 체크하면 연속 기록이 하루 올라가요.',
        '‘쉬는 날’에서 오늘이나 휴가 기간을 정해요. 그날은 오늘 목록에서 빠지고 연속 기록이 이어져요.',
        '기간 없이 멈추려면 ‘중지’를 눌러요. ‘재개’하면 다시 오늘 목록에 나와요.',
        '검색과 필터로 분류·미완료만 골라 볼 수 있어요.',
      ]"
      :terms="[
        { term: '연속 기록', desc: '빠짐없이 이어온 날수예요. 체크를 해제하면 하루 줄어들어요.' },
        { term: '쉬는 날', desc: '달성률과 연속 기록 계산에서 빼는 날이에요. 반복에 없는 날처럼 다뤄요. 오늘 이후 날짜만 정할 수 있어요.' },
        { term: '쉬는 중', desc: '중지했거나 오늘이 쉬는 날인 루틴이에요. 오늘 목록에서 빠지고 연속 기록도 유지돼요.' },
        { term: '최근 7일', desc: '지난 7일 중 실제로 체크한 비율이에요.' },
      ]"
      :tips="['요일을 고르면 그 요일에만 오늘 목록에 나타나요.']"
    />
    <span></span>
    <PageActions><button class="primary" @click="openModal">+ 새 루틴</button></PageActions>
  </div>

  <div class="callout" v-if="isAutomationOn('routine-streak-alert')">
    <b>자동화 켜짐</b>
    <p>{{ automationParam('routine-streak-alert') }}일 이상 연속으로 놓치면 알림을 보내드려요 ·
      <RouterLink to="/settings/automation" class="inline-link">설정 바꾸기</RouterLink>
    </p>
  </div>

  <StorageNote :mode="routineMode" />
  <p v-if="routineStore.notice.message || actionMessage" class="input-field-help" data-state="error" role="status">{{ routineStore.notice.message || actionMessage }}</p>
  <section class="card" style="margin-bottom: 16px">
    <div style="display: flex; align-items: baseline; gap: 4px; margin-bottom: 10px">
      <b class="figure" style="font-size: 1.5625rem; letter-spacing: -1px">{{ doneCount }}<small>/{{ todayList.length }}</small></b>
      <span style="font-size: 0.875rem; color: var(--color-muted)">오늘 완료 · {{ progress }}%</span>
    </div>
    <div class="progress green"><em :style="{ width: progress + '%' }"></em></div>
  </section>

  <ListFilterBar
    v-model:query="query"
    v-model:filters="filters"
    :groups="FILTER_GROUPS"
    placeholder="루틴 이름·분류 검색"
    :result-count="visible.length"
    :total-count="routines.length"
  />

  <section class="card list">
    <div class="list-head routine-grid">
      <span>루틴</span><span>주기</span><span>목표</span><span>{{ routineMode === 'server' ? '4주 달성률' : '연속' }}</span><span>최근 7일</span><span>관리</span>
    </div>
    <div class="row routine-grid" v-for="r in visible" :key="r.id" :class="{ 'routine-paused': r.paused }">
      <label>
        <input type="checkbox" :checked="r.done" :disabled="r.paused || isRestToday(r)" :aria-busy="routineStore.isBusy(r) ? 'true' : undefined" @click.prevent="toggleRoutine(r)" />
        <span :class="{ done: r.done }">{{ r.title }}</span>
        <small style="color: var(--color-muted); margin-left: 6px">{{ r.time }} · {{ r.duration ?? 30 }}분<template v-if="isRestToday(r)"> · 오늘 쉬는 날</template></small>
      </label>
      <span class="tag">{{ dayLabel(r) }}</span>
      <span class="figure">{{ r.goal?.count }}{{ r.goal?.unit }}</span>
      <span v-if="routineMode === 'server'" class="figure">{{ r.historyLoaded ? r.rate4w + '%' : '–' }}<small style="color: var(--color-muted)"> · 연속 {{ r.historyLoaded ? r.streak : '–' }}일</small></span>
      <span v-else class="figure">{{ r.streak }}일<small style="color: var(--color-muted)"> · 최고 {{ r.best }}</small></span>
      <span class="week-dots">
        <i v-for="(h, i) in r.history" :key="i" :class="{ on: h }" :title="ROUTINE_DAYS[i]"></i>
        <b class="figure">{{ routineRate(r) }}%</b>
      </span>
      <span style="display: flex; flex-wrap: wrap; gap: 6px">
        <button class="review" style="margin: 0" @click="openEdit(r)">수정</button>
        <button class="review" style="margin: 0" :aria-label="r.title + ' 쉬는 날 정하기'" @click="openRest(r)">쉬는 날</button>
        <button class="review" style="margin: 0" @click="togglePause(r)">{{ r.paused ? '재개' : '중지' }}</button>
        <button class="review" style="margin: 0" @click="removeRoutine(r)">삭제</button>
      </span>
    </div>
    <p v-if="routineMode === 'server' && routineStore.state.loading && !routineStore.state.loaded" class="input-field-help" role="status">루틴을 불러오는 중이에요.</p>
    <div v-else-if="routineMode === 'server' && routineStore.state.error && !routineStore.state.loaded" class="empty-state" role="status"><p>루틴을 불러오지 못했어요. 연결을 확인하고 다시 시도해 주세요.</p><button type="button" class="button-secondary" @click="routineStore.reload()">다시 시도</button></div>
    <p v-else-if="!visible.length" class="empty-state" role="status">조건에 맞는 루틴이 없어요. 검색어나 필터를 바꾸거나 '+ 새 루틴'으로 만들어 보세요.</p>
  </section>

  <Modal v-if="showModal" :title="editingId ? '루틴 수정' : '새 루틴 만들기'" :edit-resource="editingId ? 'routine:' + editingId : ''" wide @close="showModal = false">
    <p class="form-note" style="margin: 0 0 4px">{{ modeMeta(formMode).name }} 글양식이 적용돼요</p>
    <label>루틴 이름<input v-model="draft.title" placeholder="예: 저녁 러닝 30분" autofocus /></label>
    <div class="form-row">
      <label style="flex: 1">시작 시간<input v-model="draft.time" type="time" /></label>
      <label>진행 시간 (분)<input type="number" min="1" max="1440" v-model.number="draft.duration" /></label>
      <label v-if="on('category')" style="flex: 1">분류
        <select v-model="draft.category"><option>건강</option><option>공부</option><option>업무</option><option>휴식</option><option>개인</option></select>
      </label>
    </div>

    <label>반복 시작일<input v-model="draft.startDate" type="date" /></label>
    <RepeatSettings :model-value="draft.recurrence" required :start-date="draft.startDate" @update:model-value="value => { draft.recurrence = value; draft.days = value.frequency === 'weekly' ? [...value.weekdays] : [0,1,2,3,4,5,6] }" />

    <div class="form-row" style="margin-top: 14px">
      <label style="flex: 1">목표 수량<input type="number" min="1" v-model.number="draft.goalCount" /></label>
      <label style="flex: 1">단위<input v-model="draft.goalUnit" placeholder="예: 잔, 개, 분" /></label>
    </div>

    <label class="check-field">
      <input type="checkbox" v-model="draft.notify" />
      <span style="flex: 1"><b>알림 받기</b><small>알림 설정을 저장해요 (실제 발송은 서버 연동 필요)</small></span>
    </label>

    <label v-if="draft.notify">시작 전 알림 (분)<select v-model.number="draft.reminderMinutes"><option :value="0">시작 시간</option><option :value="5">5분 전</option><option :value="10">10분 전</option><option :value="30">30분 전</option></select></label>
    <label>내용 · 태그 · 멘션<TagMentionInput v-model="draft.body" /></label>
    <p v-if="!canSave" class="form-note">{{ validationError }}</p>
    <p v-if="saving.state.fieldMessage" class="input-field-help" data-state="error" role="alert">{{ saving.state.fieldMessage }}</p>
    <ConflictCompare v-if="conflict" :rows="compareRows" :busy="saving.state.status === 'saving'" @keep-mine="keepMine" @use-latest="useLatest" />
    <SaveStatus :state="saving.state" :mode="routineMode" @retry="saveRoutine" />

    <template #footer>
      <button type="button" class="modal-secondary" @click="showModal = false">취소</button>
      <button class="primary" :disabled="!canSave || !!conflict" :aria-busy="saving.state.status === 'saving' ? 'true' : undefined" @click="saveRoutine">{{ saving.state.status === 'saving' ? '저장하는 중' : editingId ? '변경 저장' : '루틴 만들기' }}</button>
    </template>
  </Modal>

  <Modal v-if="restTarget" :title="'쉬는 날 · ' + restTarget.title" @close="restTargetId = null">
    <p class="form-note" style="margin: 0">쉬는 날은 달성률과 연속 기록 계산에서 빠져요. 하루 쉬어도 연속 기록이 이어지고, 그날은 오늘 목록에 나오지 않아요.</p>
    <div class="form-row rest-range">
      <label style="flex: 1">시작일<input v-model="restFrom" type="date" :min="today" /></label>
      <label style="flex: 1">종료일<input v-model="restTo" type="date" :min="restFrom || today" /></label>
    </div>
    <p class="form-note" role="status">{{ restError || `예정된 회차 ${restDates.length}일을 쉬는 날로 정해요.` }}</p>

    <h4 class="rest-heading">예정된 쉬는 날</h4>
    <ul v-if="restUpcoming.length" class="rest-list">
      <li v-for="date in restUpcoming" :key="date">
        <span class="figure">{{ restLabel(date) }}</span>
        <button type="button" class="review" style="margin: 0" :aria-label="restLabel(date) + ' 쉬는 날 해제'" @click="removeRest(date)">해제</button>
      </li>
    </ul>
    <p v-else class="empty-state">예정된 쉬는 날이 없어요. 위에서 기간을 고르고 '쉬는 날 추가'를 눌러 보세요.</p>
    <p v-if="restPastCount" class="form-note">지난 쉬는 날 {{ restPastCount }}일은 기록 계산에 그대로 반영돼요.</p>
    <p v-if="restMessage" class="input-field-help" data-state="error" role="status">{{ restMessage }}</p>

    <template #footer>
      <button type="button" class="modal-secondary" @click="restTargetId = null">닫기</button>
      <button type="button" class="primary" :disabled="!!restError || restSaving" :aria-busy="restSaving ? 'true' : undefined" @click="addRest">{{ restSaving ? '저장하는 중' : '쉬는 날 추가' }}</button>
    </template>
  </Modal>
</template>

<style scoped>
.rest-range { flex-wrap: wrap; }
.rest-range label { min-width: 130px; }
.rest-heading { margin: var(--space-xxl) 0 var(--space-md); font-size: 0.875rem; font-weight: 600; }
.rest-list { list-style: none; margin: 0; padding: 0; }
.rest-list li { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--space-md); padding: var(--space-md) 0; border-bottom: 1px solid var(--color-hairline); font-size: 0.875rem; }
</style>
