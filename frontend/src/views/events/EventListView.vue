<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { events, openPostComposer } from '../../store/appState'
import { localDate, rangeError } from '../../utils/postValidation.mjs'
import EventDateFields from '../../components/EventDateFields.vue'
import RepeatSettings from '../../components/RepeatSettings.vue'
import { makeRecurrence, recurrenceError } from '../../utils/recurrence.mjs'
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
const eventError = d => !d.title.trim() ? '제목을 입력해주세요.' : rangeError(d.startDate, d.startTime, d.endDate, d.endTime) || recurrenceError(d.recurrence, d.startDate)
const showDetailModal = ref(false)
const detailDraft = ref({ title: '', category: '', color: '', attendeeIds: [] })
function openDetail() {
  if (!active.value) return
  detailDraft.value = { ...active.value, body: active.value.body ?? '', attendeeIds: [...(active.value.attendeeIds ?? [])], recurrence: makeRecurrence(active.value.recurrence) }
  attendeeKeyword.value = ''
  showDetailModal.value = true
}
function saveDetail() {
  if (!active.value || eventError(detailDraft.value)) return
  Object.assign(active.value, detailDraft.value, { date: detailDraft.value.startDate + ' ' + detailDraft.value.startTime, time: detailDraft.value.startTime, tag: detailDraft.value.category })
  active.value.title = detailDraft.value.title.trim()
  active.value.category = detailDraft.value.category
  active.value.color = detailDraft.value.color
  active.value.attendeeIds = [...detailDraft.value.attendeeIds]
  showDetailModal.value = false
}
function removeActive() {
  if (!active.value) return
  if (!confirm('이 일정을 삭제할까요?')) return
  events.value = events.value.filter((e) => e.id !== active.value.id)
  showDetailModal.value = false
  activeId.value = events.value[0]?.id
}
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
      <p v-if="!visibleEvents.length" class="form-note" style="margin: 12px 0 0">조건에 맞는 일정이 없어요.</p>
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
      <p v-else class="form-note" style="margin: 4px 0 0">아직 참석자가 없어요. 상세 보기에서 주소록으로 추가하세요.</p>
      <button class="primary" @click="openDetail">상세 보기</button>
    </aside>
  </div>

<Modal v-if="showDetailModal" title="일정 상세" :edit-resource="'event:' + activeId" @close="showDetailModal = false">
    <label>제목<input v-model="detailDraft.title" /></label>
    <EventDateFields :draft="detailDraft" />
    <RepeatSettings v-model="detailDraft.recurrence" :start-date="detailDraft.startDate" />
    <p class="form-note">반복 일정을 수정하면 전체 반복에 적용돼요.</p>
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

    <template #footer>
      <button type="button" class="modal-secondary" @click="showDetailModal = false">취소</button>
      <button class="primary" :disabled="!!eventError(detailDraft)" @click="saveDetail">저장하기</button>
      <button style="width: 100%; margin-top: 8px; color: #b23b3b; font-weight: 700; padding: 10px" @click="removeActive">삭제하기</button>
    </template>
  </Modal>
</template>
