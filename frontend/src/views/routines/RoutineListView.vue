<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  routines, ROUTINE_DAYS, isRoutineToday, routineRate, dayLabel, toggleRoutine,
} from '../../store/appState'
import { isAutomationOn, automationParam } from '../../store/automations'
import TagMentionInput from '../../components/TagMentionInput.vue'
import { routineError } from '../../utils/postValidation.mjs'
import Modal from '../../components/Modal.vue'
import ListFilterBar from '../../components/ListFilterBar.vue'
import HelpPopover from '../../components/HelpPopover.vue'
import { modeState, modeMeta, isFieldOn } from '../../store/modeProfiles'

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
    if (scope === '쉬는 중' && !r.paused) return false
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
const DAY_PRESETS = [
  { label: '매일', days: [0, 1, 2, 3, 4, 5, 6] },
  { label: '평일', days: [1, 2, 3, 4, 5] },
  { label: '주말', days: [0, 6] },
]
const draft = ref(emptyDraft())
function emptyDraft() {
  return { title: '', time: '19:00', duration: 30, reminderMinutes: 10, body: '', category: '건강', days: [0, 1, 2, 3, 4, 5, 6], goalCount: 1, goalUnit: '회', notify: true }
}
function on(key) {
  return isFieldOn(modeState.activeMode, 'routine', key)
}
function openModal() {
  editingId.value = null
  draft.value = emptyDraft()
  showModal.value = true
}
function openEdit(r) {
  editingId.value = r.id
  draft.value = {
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

function saveRoutine() {
  if (!canSave.value) return
  const payload = {
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
  if (editingId.value) {
    const target = routines.value.find((r) => r.id === editingId.value)
    if (target) Object.assign(target, payload)
  } else {
    routines.value.push({
      id: Math.max(0, ...routines.value.map((r) => r.id)) + 1,
      ...payload,
      done: false,
      streak: 0,
      best: 0,
      history: [0, 0, 0, 0, 0, 0, 0],
      paused: false,
    })
  }
  showModal.value = false
}
function togglePause(r) {
  r.paused = !r.paused
}
function removeRoutine(r) {
  if (!window.confirm('‘' + r.title + '’ 루틴을 삭제할까요? 연속 기록도 함께 사라져요.')) return
  routines.value = routines.value.filter((x) => x.id !== r.id)
}
</script>

<template>
  <div class="page-tools">
    <b style="font-size: 1rem">루틴</b>
    <HelpPopover
      title="루틴 사용법"
      summary="반복 주기와 목표를 정해두면, 오늘 해야 할 루틴만 골라 보여주고 연속 기록을 이어줘요."
      :steps="[
        '‘+ 새 루틴’으로 이름·시간·요일·목표를 정해요.',
        '오늘 탭에서 체크하면 연속 기록이 하루 올라가요.',
        '잠시 쉬고 싶으면 ‘쉬기’로 전환해요 — 연속 기록이 끊기지 않아요.',
        '검색과 필터로 분류·미완료만 골라 볼 수 있어요.',
      ]"
      :terms="[
        { term: '연속 기록', desc: '빠짐없이 이어온 날수예요. 체크를 해제하면 하루 줄어들어요.' },
        { term: '쉬는 중', desc: '일시 중지 상태로, 오늘 목록에서 빠지고 연속 기록도 유지돼요.' },
        { term: '최근 7일', desc: '지난 7일 중 실제로 체크한 비율이에요.' },
      ]"
      :tips="['요일을 고르면 그 요일에만 오늘 목록에 나타나요.']"
    />
    <span></span>
    <button class="primary" @click="openModal">+ 새 루틴</button>
  </div>

  <div class="callout" v-if="isAutomationOn('routine-streak-alert')">
    <b>⚡ 자동화 켜짐</b>
    <p>{{ automationParam('routine-streak-alert') }}일 이상 연속으로 놓치면 알림을 보내드려요 ·
      <a @click="router.push('/settings/automation')" style="color: var(--color-accent); font-weight: 700; cursor: pointer">설정 바꾸기</a>
    </p>
  </div>

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
      <span>루틴</span><span>주기</span><span>목표</span><span>연속</span><span>최근 7일</span><span>관리</span>
    </div>
    <div class="row routine-grid" v-for="r in visible" :key="r.id" :class="{ 'routine-paused': r.paused }">
      <label>
        <input type="checkbox" :checked="r.done" :disabled="r.paused" @change="toggleRoutine(r)" />
        <span :class="{ done: r.done }">{{ r.title }}</span>
        <small style="color: var(--color-muted); margin-left: 6px">{{ r.time }} · {{ r.duration ?? 30 }}분</small>
      </label>
      <span class="tag">{{ dayLabel(r) }}</span>
      <span class="figure">{{ r.goal?.count }}{{ r.goal?.unit }}</span>
      <span class="figure">{{ r.streak }}일<small style="color: var(--color-muted)"> · 최고 {{ r.best }}</small></span>
      <span class="week-dots">
        <i v-for="(h, i) in r.history" :key="i" :class="{ on: h }" :title="ROUTINE_DAYS[i]"></i>
        <b class="figure">{{ routineRate(r) }}%</b>
      </span>
      <span style="display: flex; gap: 6px">
        <button class="review" style="margin: 0" @click="openEdit(r)">수정</button>
        <button class="review" style="margin: 0" @click="togglePause(r)">{{ r.paused ? '재개' : '쉬기' }}</button>
        <button class="review" style="margin: 0" @click="removeRoutine(r)">삭제</button>
      </span>
    </div>
    <p v-if="!visible.length" class="form-note" style="margin: 12px 0 0">조건에 맞는 루틴이 없어요.</p>
  </section>

  <Modal v-if="showModal" :title="editingId ? '루틴 수정' : '새 루틴 만들기'" wide @close="showModal = false">
    <p class="form-note" style="margin: 0 0 4px">{{ modeMeta(modeState.activeMode).name }} 글양식이 적용돼요</p>
    <label>루틴 이름<input v-model="draft.title" placeholder="예: 저녁 러닝 30분" autofocus /></label>
    <div class="form-row">
      <label style="flex: 1">시작 시간<input v-model="draft.time" type="time" /></label>
      <label>진행 시간 (분)<input type="number" min="1" max="1440" v-model.number="draft.duration" /></label>
      <label v-if="on('category')" style="flex: 1">분류
        <select v-model="draft.category"><option>건강</option><option>공부</option><option>업무</option><option>휴식</option><option>개인</option></select>
      </label>
    </div>

    <div class="section-label">반복 요일</div>
    <div class="filter" style="width: fit-content; margin: 6px 0">
      <button v-for="p in DAY_PRESETS" :key="p.label" type="button" @click="applyPreset(p)">{{ p.label }}</button>
    </div>
    <div class="day-picker">
      <button
        v-for="(d, i) in ROUTINE_DAYS"
        :key="d"
        type="button"
        :class="{ selected: draft.days.includes(i) }"
        @click="toggleDay(i)"
      >{{ d }}</button>
    </div>

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
    <button class="primary" :disabled="!canSave" @click="saveRoutine">{{ editingId ? '변경 저장' : '루틴 만들기' }}</button>
  </Modal>
</template>
