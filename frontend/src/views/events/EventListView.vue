<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { events, openPostComposer } from '../../store/appState'
import { localDate, rangeError } from '../../utils/postValidation.mjs'
import EventDateFields from '../../components/EventDateFields.vue'
import RepeatSettings from '../../components/RepeatSettings.vue'
import {
  makeRecurrence, recurrenceError, overridesError, overrideFor, setOverride, changedFields, addSkipDates, removeException, splitRecurrence, eventOccurrences,
} from '../../utils/recurrence.mjs'
import TagMentionInput from '../../components/TagMentionInput.vue'
import RichText from '../../components/RichText.vue'
import Modal from '../../components/Modal.vue'
import ListFilterBar from '../../components/ListFilterBar.vue'
import { contacts, isBlocked, contactById } from '../../store/contacts'
import { openProfile } from '../../store/people'
import PersonTag from '../../components/PersonTag.vue'

const route = useRoute()
const router = useRouter()
const query = ref('')
const filters = ref({ category: '전체', state: '전체' })
const FILTER_GROUPS = computed(() => [
  {
    id: 'category',
    all: '전체',
    options: [
      { value: '전체', label: '전체' },
      ...[...new Set(events.value.map((e) => e.category))].map((c) => ({ value: c, label: c })),
    ],
  },
  {
    id: 'state',
    all: '전체',
    options: [
      { value: '전체', label: '모든 상태' },
      { value: '예정', label: '예정' },
      { value: '공유받음', label: '공유받음' },
    ],
  },
])
const visibleEvents = computed(() => {
  const k = query.value.trim()
  return events.value.filter((e) => {
    if (filters.value.category !== '전체' && e.category !== filters.value.category) return false
    if (filters.value.state !== '전체' && e.state !== filters.value.state) return false
    if (k && !e.title.includes(k) && !e.date.includes(k) && !e.category.includes(k)) return false
    return true
  })
})

const COLOR_PRESETS = [
  { name: '핑크', base: '#c25b82' },
  { name: '빨강', base: '#c14848' },
  { name: '노랑', base: '#b5843f' },
  { name: '초록', base: '#2f5d46' },
  { name: '파랑', base: '#3f6b8f' },
]

function lighten(hex, amount) {
  const num = parseInt(hex.slice(1), 16)
  const channel = (shift) => {
    const value = (num >> shift) & 0xff
    return Math.min(255, Math.round(value + (255 - value) * amount))
  }
  const r = channel(16)
  const g = channel(8)
  const b = channel(0)
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}
function gradientFor(hex) {
  return `linear-gradient(135deg, ${hex}, ${lighten(hex, 0.5)})`
}

// 주소록에서 참석자를 고른다 (차단한 사용자는 후보에서 제외)
const attendeeKeyword = ref('')
const attendeeCandidates = computed(() => {
  const k = attendeeKeyword.value.trim()
  return contacts.value.filter((c) => !isBlocked(c.id) && (!k || c.name.includes(k) || c.relation.includes(k)))
})
function toggleAttendee(list, id) {
  const i = list.indexOf(id)
  if (i >= 0) list.splice(i, 1)
  else list.push(id)
}
function attendeeNames(ids) {
  return (ids ?? []).map((id) => contactById(id)?.name).filter(Boolean)
}

const activeId = ref(1)
const active = computed(() => events.value.find((e) => e.id === activeId.value))

function openModal() { openPostComposer('일정') }
// 기존 query.new 링크는 상세 일정 작성 모달로 연결합니다.
watch(() => route.query.new, (v) => { if (v) openModal() }, { immediate: true })
const eventError = d => !d.title.trim() ? '제목을 입력해주세요.' : rangeError(d.startDate, d.startTime, d.endDate, d.endTime) || recurrenceError(d.recurrence, d.startDate) || overridesError(d)
const showDetailModal = ref(false)
const detailDraft = ref({ title: '', category: '', color: '', attendeeIds: [] })

/* 회차 편집(PR-22 2단계). 캘린더에서 반복 일정의 회차를 고르면 그 회차 날짜로 연다.
   이 회차만: 제목·시간만 바꾸는 회차 변경(override) / 이 회차부터: 반복을 둘로 나눔 / 전체 반복: 기존 수정 */
const SCOPES = [{ id: 'this', label: '이 회차만' }, { id: 'following', label: '이 회차부터' }, { id: 'all', label: '전체 반복' }]
const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토']
const occurrenceDate = ref('')
const scope = ref('all')
const occurrenceDraft = ref({ title: '', startTime: '', endTime: '' })
const isRepeating = (e) => !!e?.recurrence && e.recurrence.frequency !== 'none'
const followingSplit = computed(() => (scope.value === 'following' && active.value ? splitRecurrence(active.value, occurrenceDate.value) : null))
const occurrenceEnd = computed(() => eventOccurrences(active.value ? [active.value] : [], occurrenceDate.value, occurrenceDate.value).find((o) => o.startDate === occurrenceDate.value)?.endDate ?? '')
const currentOverride = computed(() => (active.value ? overrideFor(active.value.recurrence, occurrenceDate.value) : null))
const occurrenceError = computed(() => {
  const e = active.value, d = occurrenceDraft.value
  if (!e) return ''
  if (!d.title.trim()) return '제목을 입력해주세요.'
  const next = { ...e, recurrence: setOverride(e.recurrence, occurrenceDate.value, changedFields(e, d)) }
  return recurrenceError(next.recurrence, next.startDate) || overridesError(next)
})
const scopeNote = computed(() => {
  if (scope.value === 'this') return '이 회차의 제목과 시간만 바꿔요. 다른 회차와 반복 설정은 그대로예요. 건너뛴 회차는 일정 상세의 회차 예외에서 되돌릴 수 있어요.'
  if (scope.value === 'following') return followingSplit.value ? occurrenceDate.value + ' 회차부터 바꿔요. 이전 회차는 그대로 남고, 반복이 둘로 나뉘어요.' : '첫 회차라 반복 전체를 바꿔요.'
  return '모든 회차에 적용돼요. 따로 바꾼 회차는 바꾼 항목만 그대로 유지돼요.'
})
const draftExceptions = computed(() => [...(detailDraft.value.recurrence?.exceptions ?? [])].sort((a, b) => a.date.localeCompare(b.date)))
function describeException(x) {
  if (x.action === 'skip') return '건너뜀'
  const parts = []
  if (x.title) parts.push('제목 "' + x.title + '"')
  if (x.startTime || x.endTime) parts.push('시간 ' + (x.startTime ?? detailDraft.value.startTime) + '~' + (x.endTime ?? detailDraft.value.endTime))
  return '이 회차만 변경 · ' + parts.join(', ')
}
// 회차 예외 되돌리기는 다른 입력처럼 저장할 때 반영한다
function restoreException(date) { detailDraft.value.recurrence = removeException(detailDraft.value.recurrence, date) }

function resetDrafts() {
  const e = active.value
  const split = followingSplit.value
  detailDraft.value = { ...e, body: e.body ?? '', attendeeIds: [...(e.attendeeIds ?? [])], recurrence: makeRecurrence(split ? split.tail.recurrence : e.recurrence), ...(split ? { startDate: split.tail.startDate, endDate: split.tail.endDate } : {}) }
  const changed = overrideFor(e.recurrence, occurrenceDate.value) ?? {}
  occurrenceDraft.value = { title: changed.title ?? e.title, startTime: changed.startTime ?? e.startTime, endTime: changed.endTime ?? e.endTime }
}
function selectScope(id) {
  scope.value = id
  resetDrafts()
}
function openDetail(date = '') {
  if (!active.value) return
  occurrenceDate.value = isRepeating(active.value) && date ? date : ''
  scope.value = occurrenceDate.value ? 'this' : 'all'
  resetDrafts()
  attendeeKeyword.value = ''
  showDetailModal.value = true
}
function closeDetail() {
  showDetailModal.value = false
  occurrenceDate.value = ''
  // 캘린더에서 연 주소(id·occurrence)를 지워, 같은 회차를 다시 눌러도 열리게 한다
  if (route.query.id != null || route.query.occurrence != null) {
    const { id, occurrence, ...rest } = route.query
    void router.replace({ query: rest })
  }
}
function saveDetail() {
  if (!active.value || eventError(detailDraft.value)) return
  const d = detailDraft.value
  const values = { ...d, title: d.title.trim(), date: d.startDate + ' ' + d.startTime, time: d.startTime, tag: d.category, attendeeIds: [...d.attendeeIds], recurrence: makeRecurrence(d.recurrence) }
  const split = followingSplit.value
  if (split) {
    // 원래 반복은 회차 전날 끝내고, 이 회차부터는 새 일정으로 잇는다
    active.value.recurrence = split.head
    const id = events.value.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1
    events.value.unshift({ ...values, id })
    activeId.value = id
  } else Object.assign(active.value, values)
  closeDetail()
}
function saveOccurrence() {
  if (!active.value || occurrenceError.value) return
  active.value.recurrence = setOverride(active.value.recurrence, occurrenceDate.value, changedFields(active.value, occurrenceDraft.value))
  closeDetail()
}
function skipOccurrence() {
  if (!active.value) return
  active.value.recurrence = addSkipDates(active.value.recurrence, [occurrenceDate.value])
  closeDetail()
}
function revertOccurrence() {
  if (!active.value) return
  active.value.recurrence = removeException(active.value.recurrence, occurrenceDate.value)
  closeDetail()
}
function removeActive() {
  if (!active.value) return
  if (!confirm('이 일정을 삭제할까요?')) return
  events.value = events.value.filter((e) => e.id !== active.value.id)
  closeDetail()
  activeId.value = events.value[0]?.id
}
// 캘린더에서 /events?id=…&occurrence=YYYY-MM-DD로 오면 그 일정(반복이면 그 회차)을 연다. 실제 회차가 아닌 날짜는 반복 전체로 연다
watch(() => [route.query.id, route.query.occurrence], ([id, occurrence]) => {
  if (id == null) return
  const target = events.value.find((e) => String(e.id) === String(id))
  if (!target) return
  activeId.value = target.id
  const real = typeof occurrence === 'string' && eventOccurrences([target], occurrence, occurrence).some((o) => o.startDate === occurrence)
  openDetail(real ? occurrence : '')
}, { immediate: true })
</script>

<template>
  <div class="page-tools">
    <b style="font-size: 1rem">일정</b>
    <span></span>
    <button class="primary" @click="openModal">+ 새 일정</button>
  </div>

  <ListFilterBar
    v-model:query="query"
    v-model:filters="filters"
    :groups="FILTER_GROUPS"
    placeholder="일정 제목·날짜·분류 검색"
    :result-count="visibleEvents.length"
    :total-count="events.length"
  />

  <div class="manage">
    <section class="card list">
      <div class="list-head"><span>일정</span><span>날짜</span><span>카테고리</span><span>상태</span></div>
      <div class="row" :class="{ picked: activeId === e.id }" v-for="e in visibleEvents" :key="e.id" role="button" tabindex="0" @click="activeId = e.id; openDetail()" @keydown.enter.prevent="activeId = e.id; openDetail()" @keydown.space.prevent="activeId = e.id; openDetail()">
        <label><i :style="{ background: gradientFor(e.color), width: '4px', height: '18px', borderRadius: '3px', display: 'inline-block', marginRight: '8px', verticalAlign: 'middle' }"></i>{{ e.title }}</label>
        <span>{{ e.startDate }} {{ e.startTime }}<small class="date-end">~ {{ e.endDate }} {{ e.endTime }}</small></span>
        <span class="tag">{{ e.category }}</span>
        <span class="badge" :class="{ ok: e.state === '예정', info: e.state === '공유받음' }">{{ e.state }}</span>
      </div>
      <p v-if="!visibleEvents.length" class="empty-state" role="status">조건에 맞는 일정이 없어요. 검색어나 필터를 바꾸거나 '+ 새 일정'으로 추가해 보세요.</p>
    </section>
    <aside class="card detail">
      <h3>{{ active?.title }}</h3>
      <p>{{ active?.startDate }} {{ active?.startTime }}<br />~ {{ active?.endDate }} {{ active?.endTime }}</p><RichText :text="active?.body ?? ''" />
      <label>카테고리</label>
      <p><span class="tag">{{ active?.category }}</span></p>
      <label>참석자 ({{ attendeeNames(active?.attendeeIds).length }}명)</label>
      <p v-if="attendeeNames(active?.attendeeIds).length" class="attendee-chips">
        <PersonTag v-for="n in attendeeNames(active?.attendeeIds)" :key="n" :name="n" />
      </p>
      <p v-else class="empty-state">아직 참석자가 없어요. '상세 보기'에서 주소록의 사람을 추가해 보세요.</p>
      <button class="primary" @click="openDetail()">상세 보기</button>
    </aside>
  </div>

<Modal v-if="showDetailModal" :title="occurrenceDate ? '일정 회차' : '일정 상세'" :edit-resource="'event:' + activeId" @close="closeDetail">
    <template v-if="occurrenceDate">
      <p><b class="figure">{{ occurrenceDate }}</b> ({{ WEEKDAY[new Date(occurrenceDate + 'T00:00:00').getDay()] }}) 회차예요.</p>
      <div class="segmented-tab" role="group" aria-label="수정 범위">
        <button v-for="s in SCOPES" :key="s.id" type="button" :aria-pressed="scope === s.id" @click="selectScope(s.id)">{{ s.label }}</button>
      </div>
      <p role="status">{{ scopeNote }}</p>
    </template>

    <template v-if="scope === 'this'">
      <label>제목<input v-model="occurrenceDraft.title" maxlength="200" /></label>
      <fieldset class="form-fieldset">
        <legend>이 회차 시간</legend>
        <div class="form-row">
          <label>시작 시간<input v-model="occurrenceDraft.startTime" type="time" required /></label>
          <label>종료 시간<input v-model="occurrenceDraft.endTime" type="time" required /></label>
        </div>
      </fieldset>
      <p v-if="occurrenceEnd && occurrenceEnd !== occurrenceDate">종료일은 <span class="figure">{{ occurrenceEnd }}</span>이에요.</p>
      <p role="status">{{ occurrenceError }}</p>
    </template>

    <template v-else>
    <label>제목<input v-model="detailDraft.title" /></label>
    <EventDateFields :draft="detailDraft" />
    <RepeatSettings v-model="detailDraft.recurrence" :start-date="detailDraft.startDate" />
    <p v-if="!occurrenceDate && isRepeating(active)">반복 일정을 수정하면 전체 반복에 적용돼요. 한 회차만 바꾸려면 캘린더에서 그 날짜의 일정을 누르세요.</p>
    <template v-if="draftExceptions.length">
      <div class="section-label">회차 예외</div>
      <p v-for="x in draftExceptions" :key="x.date" style="display: flex; align-items: center; flex-wrap: wrap; gap: var(--space-md); margin: var(--space-sm) 0">
        <small class="figure">{{ x.date }}</small>
        <span style="flex: 1; min-width: 0">{{ describeException(x) }}</span>
        <button type="button" class="button-secondary" :aria-label="x.date + (x.action === 'skip' ? ' 건너뛴 회차 되돌리기' : ' 회차 변경 되돌리기')" @click="restoreException(x.date)">되돌리기</button>
      </p>
      <p>되돌린 회차는 저장하면 원래대로 돌아와요.</p>
    </template>
    <label>내용 · 태그 · 멘션<TagMentionInput v-model="detailDraft.body" /></label>
    <label>카테고리<select v-model="detailDraft.category"><option>업무</option><option>공부</option><option>건강</option><option>휴식</option><option>개인</option></select></label>
    <label>색상</label>
    <div style="display: flex; gap: 8px; margin-top: 6px">
      <button
        v-for="c in COLOR_PRESETS"
        :key="c.base"
        type="button"
        :title="c.name"
        :style="{ width: '28px', height: '28px', borderRadius: '50%', background: gradientFor(c.base), border: detailDraft.color === c.base ? '2px solid var(--color-foreground)' : '2px solid transparent', cursor: 'pointer' }"
        @click="detailDraft.color = c.base"
      ></button>
    </div>

    <div class="section-label">참석자 ({{ detailDraft.attendeeIds.length }}명)</div>
    <input v-model="attendeeKeyword" placeholder="주소록에서 이름 검색" />
    <div class="picker-list invite-list" style="margin-top: 10px; max-height: 180px">
      <label class="picker-row" v-for="c in attendeeCandidates" :key="c.id">
        <input type="checkbox" :checked="detailDraft.attendeeIds.includes(c.id)" @change="toggleAttendee(detailDraft.attendeeIds, c.id)" />
        <i>{{ c.name[0] }}</i>
        <span style="flex: 1"><b>{{ c.name }}</b><small>{{ c.relation }}</small></span>
        <button type="button" class="person-info" @click.prevent="openProfile(c.name)">ⓘ</button>
      </label>
    </div>
    <p class="form-note" role="status">{{ eventError(detailDraft) }}</p>
    </template>

    <template #footer>
      <template v-if="scope === 'this'">
        <button type="button" class="modal-secondary" @click="closeDetail">취소</button>
        <button type="button" class="button-secondary" @click="skipOccurrence">이 회차 건너뛰기</button>
        <button v-if="currentOverride" type="button" class="button-secondary" @click="revertOccurrence">변경 되돌리기</button>
        <button class="primary" :disabled="!!occurrenceError" @click="saveOccurrence">저장하기</button>
      </template>
      <template v-else>
        <button type="button" class="modal-secondary" @click="closeDetail">취소</button>
        <button class="primary" :disabled="!!eventError(detailDraft)" @click="saveDetail">저장하기</button>
        <button v-if="scope === 'all'" style="width: 100%; margin-top: 8px; color: var(--color-status-danger); font-weight: 700; padding: 10px" @click="removeActive">{{ isRepeating(active) ? '반복 전체 삭제하기' : '삭제하기' }}</button>
      </template>
    </template>
  </Modal>
</template>
