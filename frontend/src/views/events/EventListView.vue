<script setup>
import { bodyLocale, tr } from '../../store/locale'
import { formatDate } from '../../features/i18n/locale.mjs'
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { events, eventStore, openPostComposer } from '../../store/appState'
import { createSaveState } from '../../features/records/saveState.mjs'
import SaveStatus from '../../components/SaveStatus.vue'
import ConflictCompare from '../../components/ConflictCompare.vue'
import StorageNote from '../../components/StorageNote.vue'
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
import LinkedRecords from '../../components/LinkedRecords.vue'
import { startRecordingFrom } from '../../features/recording/useRecording.js'
import PageActions from '../../components/PageActions.vue'

const route = useRoute()
const router = useRouter()
// 이 일정에서 실제 기록 시작(UF-91). 반복 일정은 반복 전체(원본 일정 ID)에 연결한다
const recordStart = createSaveState()
const recordRunning = ref(false)
async function startRecord() {
  if (!active.value) return
  recordRunning.value = false
  const result = await recordStart.run(() => startRecordingFrom(active.value.title, { kind: 'schedule', id: String(active.value.id) }))
  if (!result.ok) return
  if (result.value.started) router.push('/planner/daily')
  else recordRunning.value = true
}
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

const activeId = ref(events.value[0]?.id ?? 1)
const active = computed(() => events.value.find((e) => e.id === activeId.value))
// 로그인해 서버 목록으로 바뀌면 고른 일정이 없을 수 있어 첫 일정을 고른다
watch(() => events.value.length, () => { if (!active.value && events.value.length) activeId.value = events.value[0].id })
const eventMode = eventStore.mode
// 상세를 연 때의 일정. 저장은 이 version으로 보내 다른 곳의 변경을 모르고 덮어쓰지 않는다(UF-84)
const base = ref(null)
const saving = createSaveState({ fields: { title: ['제목'], end: ['종료'], recurrence: ['반복', '회차', '예외'] } })
const removing = createSaveState()
const conflict = ref(null)
const splitNotice = ref('')

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
// 회차 요일은 본문 언어로 보인다
const weekdayOf = (date) => (bodyLocale.value === 'ko' ? WEEKDAY[new Date(date + 'T00:00:00').getDay()] : formatDate(new Date(date + 'T00:00:00'), bodyLocale.value, { weekday: 'short' }))
const occurrenceDate = ref('')
const scope = ref('all')
const occurrenceDraft = ref({ title: '', startTime: '', endTime: '' })
const isRepeating = (e) => !!e?.recurrence && e.recurrence.frequency !== 'none'
const followingSplit = computed(() => (scope.value === 'following' && active.value ? splitRecurrence(base.value ?? active.value, occurrenceDate.value) : null))
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
  if (scope.value === 'this') return tr('이 회차의 제목과 시간만 바꿔요. 다른 회차와 반복 설정은 그대로예요. 건너뛴 회차는 일정 상세의 회차 예외에서 되돌릴 수 있어요.')
  if (scope.value === 'following') return followingSplit.value ? tr('{date} 회차부터 바꿔요. 이전 회차는 그대로 남고, 반복이 둘로 나뉘어요.', { date: occurrenceDate.value }) : tr('첫 회차라 반복 전체를 바꿔요.')
  return tr('모든 회차에 적용돼요. 따로 바꾼 회차는 바꾼 항목만 그대로 유지돼요.')
})
const draftExceptions = computed(() => [...(detailDraft.value.recurrence?.exceptions ?? [])].sort((a, b) => a.date.localeCompare(b.date)))
function describeException(x) {
  if (x.action === 'skip') return tr('건너뜀')
  const parts = []
  if (x.title) parts.push(tr('제목 "{title}"', { title: x.title }))
  if (x.startTime || x.endTime) parts.push(tr('시간 {from}~{to}', { from: x.startTime ?? detailDraft.value.startTime, to: x.endTime ?? detailDraft.value.endTime }))
  return tr('이 회차만 변경 · {parts}', { parts: parts.join(', ') })
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
  base.value = { ...active.value }
  conflict.value = null
  splitNotice.value = ''
  saving.reset()
  removing.reset()
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
// 저장은 서버 성공 응답 뒤에만 창을 닫는다. 실패하면 입력을 남기고, 충돌이면 비교 화면을 보인다(UF-82~UF-84)
let retryAction = null
async function run(action, retry) {
  retryAction = retry
  conflict.value = null
  splitNotice.value = ''
  const result = await saving.run(action)
  if (result.ok) {
    if (result.value?.created) activeId.value = result.value.created.id
    closeDetail()
    return
  }
  const error = result.error
  if (error.orphan) splitNotice.value = tr('이 회차부터 나눈 새 일정을 지우지 못해 회차가 겹칠 수 있어요. 목록에서 확인해 주세요.')
  if (error.kind === 'conflict') conflict.value = { latest: { ...(error.latest ?? active.value ?? base.value) } }
}
function saveDetail() {
  if (!active.value || eventError(detailDraft.value)) return
  const d = detailDraft.value
  const values = { ...d, title: d.title.trim(), date: d.startDate + ' ' + d.startTime, time: d.startTime, tag: d.category, attendeeIds: [...d.attendeeIds], recurrence: makeRecurrence(d.recurrence) }
  const split = followingSplit.value
  // 원래 반복은 회차 전날 끝내고, 이 회차부터는 새 일정으로 잇는다
  run(async () => (split ? { created: await eventStore.split(base.value, split.head, values) } : eventStore.update(base.value, values)), saveDetail)
}
function saveOccurrence() {
  if (!active.value || occurrenceError.value) return
  run(() => eventStore.update(base.value, { recurrence: setOverride(base.value.recurrence, occurrenceDate.value, changedFields(base.value, occurrenceDraft.value)) }), saveOccurrence)
}
function skipOccurrence() {
  if (!active.value) return
  run(() => eventStore.update(base.value, { recurrence: addSkipDates(base.value.recurrence, [occurrenceDate.value]) }), skipOccurrence)
}
function revertOccurrence() {
  if (!active.value) return
  run(() => eventStore.update(base.value, { recurrence: removeException(base.value.recurrence, occurrenceDate.value) }), revertOccurrence)
}
const shownOccurrence = (event) => ({ ...event, ...(overrideFor(event.recurrence, occurrenceDate.value) ?? {}) })
const compareRows = computed(() => {
  if (!conflict.value) return []
  const latest = conflict.value.latest
  if (scope.value === 'this') {
    const mine = occurrenceDraft.value, theirs = shownOccurrence(latest)
    return [
      { label: '이 회차 제목', mine: mine.title.trim(), latest: theirs.title },
      { label: '이 회차 시간', mine: mine.startTime + '~' + mine.endTime, latest: theirs.startTime + '~' + theirs.endTime },
    ]
  }
  const mine = detailDraft.value
  return [
    { label: '제목', mine: mine.title.trim(), latest: latest.title },
    { label: '시작', mine: mine.startDate + ' ' + mine.startTime, latest: latest.startDate + ' ' + latest.startTime },
    { label: '종료', mine: mine.endDate + ' ' + mine.endTime, latest: latest.endDate + ' ' + latest.endTime },
    { label: '카테고리', mine: mine.category, latest: latest.category },
    { label: '내용', mine: mine.body, latest: latest.body },
  ]
})
// 내 내용으로 다시 저장: 최신 일정을 기준으로 같은 동작을 다시 계산해 보낸다(UT-126)
function keepMine() {
  base.value = { ...conflict.value.latest }
  conflict.value = null
  retryAction?.()
}
function useLatest() {
  base.value = { ...conflict.value.latest }
  conflict.value = null
  saving.reset()
  resetDrafts()
}
const removeMessage = computed(() => {
  const kind = ['failed', 'conflict'].includes(removing.state.status) ? removing.state.error?.kind : ''
  if (!kind) return ''
  if (kind === 'conflict') return '다른 곳에서 먼저 고쳐서 삭제하지 않았어요. 최신 내용을 확인한 뒤 다시 삭제해 주세요.'
  if (kind === 'network') return '삭제하지 못했어요. 연결을 확인하고 다시 시도해 주세요.'
  return '삭제하지 못했어요. 잠시 뒤 다시 시도해 주세요.'
})
async function removeActive() {
  if (!active.value) return
  if (!confirm(tr('이 일정을 삭제할까요?'))) return
  const result = await removing.run(() => eventStore.remove(base.value ?? active.value))
  if (!result.ok && result.error?.kind !== 'notFound') return
  closeDetail()
  activeId.value = events.value[0]?.id
}
// 캘린더에서 /events?id=…&occurrence=YYYY-MM-DD로 오면 그 일정(반복이면 그 회차)을 연다. 실제 회차가 아닌 날짜는 반복 전체로 연다
// 로그인 상태에서는 목록을 불러온 뒤에 열 수 있어 목록 길이도 본다. 이미 연 일정이면 다시 열지 않는다
watch(() => [route.query.id, route.query.occurrence, events.value.length], ([id, occurrence]) => {
  if (id == null) return
  const target = events.value.find((e) => String(e.id) === String(id))
  if (!target || (showDetailModal.value && activeId.value === target.id)) return
  activeId.value = target.id
  const real = typeof occurrence === 'string' && eventOccurrences([target], occurrence, occurrence).some((o) => o.startDate === occurrence)
  openDetail(real ? occurrence : '')
}, { immediate: true })
</script>

<template>
  <PageActions><button class="primary" @click="openModal">{{ tr('+ 새 일정') }}</button></PageActions>

  <StorageNote :mode="eventMode" />
  <ListFilterBar
    v-model:query="query"
    v-model:filters="filters"
    :groups="FILTER_GROUPS"
    :placeholder="tr('일정 제목·날짜·분류 검색')"
    :result-count="visibleEvents.length"
    :total-count="events.length"
  />

  <div class="manage">
    <section class="card list">
      <div class="list-head"><span>{{ tr('일정') }}</span><span>{{ tr('날짜') }}</span><span>{{ tr('카테고리') }}</span><span>{{ tr('상태') }}</span></div>
      <div class="row" :class="{ picked: activeId === e.id }" v-for="e in visibleEvents" :key="e.id" role="button" tabindex="0" @click="activeId = e.id; openDetail()" @keydown.enter.prevent="activeId = e.id; openDetail()" @keydown.space.prevent="activeId = e.id; openDetail()">
        <label><i :style="{ background: e.color, width: '4px', height: '18px', borderRadius: '3px', display: 'inline-block', marginRight: '8px', verticalAlign: 'middle' }"></i>{{ e.title }}</label>
        <span>{{ e.startDate }} {{ e.startTime }}<small class="date-end">~ {{ e.endDate }} {{ e.endTime }}</small></span>
        <span class="tag">{{ tr(e.category) }}</span>
        <span class="badge" :class="{ ok: e.state === '예정', info: e.state === '공유받음' }">{{ tr(e.state) }}</span>
      </div>
      <p v-if="eventMode === 'server' && eventStore.state.loading && !eventStore.state.loaded" class="input-field-help" role="status">{{ tr('일정을 불러오는 중이에요.') }}</p>
      <div v-else-if="eventMode === 'server' && eventStore.state.error && !eventStore.state.loaded" class="empty-state" role="status"><p>{{ tr('일정을 불러오지 못했어요. 연결을 확인하고 다시 시도해 주세요.') }}</p><button type="button" class="button-secondary" @click="eventStore.reload()">{{ tr('다시 시도') }}</button></div>
      <p v-else-if="!visibleEvents.length" class="empty-state" role="status">{{ tr('조건에 맞는 일정이 없어요. 검색어나 필터를 바꾸거나 \'+ 새 일정\'으로 추가해 보세요.') }}</p>
    </section>
    <aside class="card detail">
      <h3>{{ active?.title }}</h3>
      <p>{{ active?.startDate }} {{ active?.startTime }}<br />~ {{ active?.endDate }} {{ active?.endTime }}</p><RichText :text="active?.body ?? ''" />
      <label>{{ tr('카테고리') }}</label>
      <p><span class="tag">{{ tr(active?.category) }}</span></p>
      <template v-if="eventMode === 'local'">
      <label>{{ tr('참석자 ({n}명)', { n: attendeeNames(active?.attendeeIds).length }) }}</label>
      <p v-if="attendeeNames(active?.attendeeIds).length" class="attendee-chips">
        <PersonTag v-for="n in attendeeNames(active?.attendeeIds)" :key="n" :name="n" />
      </p>
      <p v-else class="empty-state">{{ tr('아직 참석자가 없어요. \'상세 보기\'에서 주소록의 사람을 추가해 보세요.') }}</p>
      </template>
      <button class="button-secondary" @click="openDetail()">{{ tr('상세 보기') }}</button>
    </aside>
  </div>

<Modal v-if="showDetailModal" :title="occurrenceDate ? tr('일정 회차') : tr('일정 상세')" :edit-resource="'event:' + activeId" @close="closeDetail">
    <template v-if="occurrenceDate">
      <p>{{ tr('{date} ({day}) 회차예요.', { date: occurrenceDate, day: weekdayOf(occurrenceDate) }) }}</p>
      <div class="segmented-tab" role="group" :aria-label="tr('수정 범위')">
        <button v-for="s in SCOPES" :key="s.id" type="button" :aria-pressed="scope === s.id" @click="selectScope(s.id)">{{ tr(s.label) }}</button>
      </div>
      <p role="status">{{ scopeNote }}</p>
    </template>

    <template v-if="scope === 'this'">
      <label>{{ tr('제목') }}<input v-model="occurrenceDraft.title" maxlength="200" /></label>
      <fieldset class="form-fieldset">
        <legend>{{ tr('이 회차 시간') }}</legend>
        <div class="form-row">
          <label>{{ tr('시작 시간') }}<input v-model="occurrenceDraft.startTime" type="time" required /></label>
          <label>{{ tr('종료 시간') }}<input v-model="occurrenceDraft.endTime" type="time" required /></label>
        </div>
      </fieldset>
      <p v-if="occurrenceEnd && occurrenceEnd !== occurrenceDate">{{ tr('종료일은 {date}이에요.', { date: occurrenceEnd }) }}</p>
      <p role="status">{{ tr(occurrenceError) }}</p>
    </template>

    <template v-else>
    <label>{{ tr('제목') }}<input v-model="detailDraft.title" /></label>
    <EventDateFields :draft="detailDraft" />
    <RepeatSettings v-model="detailDraft.recurrence" :start-date="detailDraft.startDate" />
    <p v-if="!occurrenceDate && isRepeating(active)">{{ tr('반복 일정을 수정하면 전체 반복에 적용돼요. 한 회차만 바꾸려면 캘린더에서 그 날짜의 일정을 누르세요.') }}</p>
    <template v-if="draftExceptions.length">
      <div class="section-label">{{ tr('회차 예외') }}</div>
      <p v-for="x in draftExceptions" :key="x.date" style="display: flex; align-items: center; flex-wrap: wrap; gap: var(--space-md); margin: var(--space-sm) 0">
        <small class="figure">{{ x.date }}</small>
        <span style="flex: 1; min-width: 0">{{ describeException(x) }}</span>
        <button type="button" class="button-secondary" :aria-label="x.action === 'skip' ? tr('{date} 건너뛴 회차 되돌리기', { date: x.date }) : tr('{date} 회차 변경 되돌리기', { date: x.date })" @click="restoreException(x.date)">{{ tr('되돌리기') }}</button>
      </p>
      <p>{{ tr('되돌린 회차는 저장하면 원래대로 돌아와요.') }}</p>
    </template>
    <label>{{ tr('내용 · 태그 · 멘션') }}<TagMentionInput v-model="detailDraft.body" /></label>
    <label>{{ tr('카테고리') }}<select v-model="detailDraft.category"><option value="업무">{{ tr('업무') }}</option><option value="공부">{{ tr('공부') }}</option><option value="건강">{{ tr('건강') }}</option><option value="휴식">{{ tr('휴식') }}</option><option value="개인">{{ tr('개인') }}</option></select></label>
    <label>{{ tr('색상') }}</label>
    <div style="display: flex; gap: 8px; margin-top: 6px">
      <button
        v-for="c in COLOR_PRESETS"
        :key="c.base"
        type="button"
        :title="tr(c.name)"
        :aria-label="tr(c.name)"
        :aria-pressed="detailDraft.color === c.base"
        :style="{ width: '28px', height: '28px', borderRadius: '50%', background: c.base, border: detailDraft.color === c.base ? '2px solid var(--color-foreground)' : '2px solid transparent', cursor: 'pointer' }"
        @click="detailDraft.color = c.base"
      ></button>
    </div>

    <p v-if="eventMode === 'server'" class="input-field-help">{{ tr('로그인 상태에서는 참석자를 고를 수 없어요. 주소록은 아직 이 브라우저에만 있어서 계정에 참석자로 저장할 수 없어요.') }}</p>
    <template v-else>
    <div class="section-label">{{ tr('참석자 ({n}명)', { n: detailDraft.attendeeIds.length }) }}</div>
    <input v-model="attendeeKeyword" :placeholder="tr('주소록에서 이름 검색')" />
    <div class="picker-list invite-list" style="margin-top: 10px; max-height: 180px">
      <label class="picker-row" v-for="c in attendeeCandidates" :key="c.id">
        <input type="checkbox" :checked="detailDraft.attendeeIds.includes(c.id)" @change="toggleAttendee(detailDraft.attendeeIds, c.id)" />
        <i>{{ c.name[0] }}</i>
        <span style="flex: 1"><b>{{ c.name }}</b><small>{{ c.relation }}</small></span>
        <button type="button" class="person-info" @click.prevent="openProfile(c.name)">ⓘ</button>
      </label>
    </div>
    </template>
    <p class="form-note" role="status">{{ tr(eventError(detailDraft)) }}</p>
    </template>
    <p v-if="saving.state.field" id="event-field-error" class="input-field-help" data-state="error" role="alert">{{ tr({ title: '제목', end: '종료 시간', recurrence: '반복' }[saving.state.field]) }}: {{ tr(saving.state.fieldMessage) }}</p>
    <ConflictCompare v-if="conflict" :rows="compareRows" :busy="saving.state.status === 'saving'" @keep-mine="keepMine" @use-latest="useLatest" />
    <p v-if="splitNotice" class="input-field-help" data-state="error" role="alert">{{ splitNotice }}</p>
    <SaveStatus :state="saving.state" :mode="eventMode" @retry="retryAction?.()" />
    <template v-if="eventMode === 'server' && active">
      <button type="button" class="button-secondary" style="margin-top: var(--space-lg)" :aria-busy="recordStart.state.status === 'saving' ? 'true' : undefined" @click="startRecord">{{ recordStart.state.status === 'saving' ? tr('기록을 시작하는 중') : tr('이 일정 기록 시작') }}</button>
      <p v-if="recordRunning" role="status">{{ tr('진행 중인 기록이 있어 새로 시작하지 않았어요.') }} <RouterLink class="inline-link" to="/planner/daily">{{ tr('플래너에서 먼저 끝내기') }}</RouterLink></p>
      <p v-if="recordStart.state.status === 'failed'" class="input-field-help" data-state="error" role="status">{{ tr(recordStart.state.error?.message ?? '') }}</p>
      <LinkedRecords kind="schedule" :id="String(active.id)" />
    </template>
    <p v-if="removeMessage" class="input-field-help" data-state="error" role="status">{{ tr(removeMessage) }}</p>

    <template #footer>
      <template v-if="scope === 'this'">
        <button type="button" class="modal-secondary" @click="closeDetail">{{ tr('취소') }}</button>
        <button type="button" class="button-secondary" :disabled="saving.state.status === 'saving'" @click="skipOccurrence">{{ tr('이 회차 건너뛰기') }}</button>
        <button v-if="currentOverride" type="button" class="button-secondary" :disabled="saving.state.status === 'saving'" @click="revertOccurrence">{{ tr('변경 되돌리기') }}</button>
        <button class="primary" :disabled="!!occurrenceError || !!conflict" :aria-busy="saving.state.status === 'saving' ? 'true' : undefined" @click="saveOccurrence">{{ saving.state.status === 'saving' ? tr('저장하는 중') : tr('저장하기') }}</button>
      </template>
      <template v-else>
        <button type="button" class="modal-secondary" @click="closeDetail">{{ tr('취소') }}</button>
        <button class="primary" :disabled="!!eventError(detailDraft) || !!conflict" :aria-busy="saving.state.status === 'saving' ? 'true' : undefined" @click="saveDetail">{{ saving.state.status === 'saving' ? tr('저장하는 중') : tr('저장하기') }}</button>
        <button v-if="scope === 'all'" style="width: 100%; margin-top: 8px; color: var(--color-status-danger); font-weight: 600; padding: 10px" :aria-busy="removing.state.status === 'saving' ? 'true' : undefined" @click="removeActive">{{ removing.state.status === 'saving' ? tr('삭제하는 중') : isRepeating(active) ? tr('반복 전체 삭제하기') : tr('삭제하기') }}</button>
      </template>
    </template>
  </Modal>
</template>
