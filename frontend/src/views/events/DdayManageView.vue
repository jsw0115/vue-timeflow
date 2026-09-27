<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import Modal from '../../components/Modal.vue'
import ListFilterBar from '../../components/ListFilterBar.vue'
import { ddays, isPast, togglePin, addDday, removeDday, NOTIFY_OPTIONS, notifyLabel } from '../../store/ddays'

/**
 * D-Day 관리 — 목록 화면(/dday)과 같은 ddays 스토어를 쓴다.
 * 이쪽은 표 형태로 한눈에 보고 일괄 정리하는 용도다.
 */
const router = useRouter()
const query = ref('')
const filters = ref({ scope: '전체', category: '전체' })
const FILTER_GROUPS = computed(() => [
  {
    id: 'scope',
    all: '전체',
    options: [
      { value: '전체', label: '전체' },
      { value: '예정', label: '예정' },
      { value: '지남', label: '지남' },
      { value: '고정', label: '고정됨' },
    ],
  },
  {
    id: 'category',
    all: '전체',
    options: [{ value: '전체', label: '분류 전체' }, ...[...new Set(ddays.value.map((d) => d.category))].map((c) => ({ value: c, label: c }))],
  },
])

const visible = computed(() => {
  const k = query.value.trim()
  return ddays.value.filter((d) => {
    if (filters.value.scope === '예정' && isPast(d.dday)) return false
    if (filters.value.scope === '지남' && !isPast(d.dday)) return false
    if (filters.value.scope === '고정' && !d.pinned) return false
    if (filters.value.category !== '전체' && d.category !== filters.value.category) return false
    if (k && !d.title.includes(k) && !d.category.includes(k)) return false
    return true
  })
})

const showModal = ref(false)
const draft = ref({ title: '', category: '개인', date: '', notifyDays: [1] })
function openModal() {
  draft.value = { title: '', category: '개인', date: '', notifyDays: [1] }
  showModal.value = true
}
function toggleNotify(days) {
  const list = draft.value.notifyDays
  const i = list.indexOf(days)
  if (i >= 0) list.splice(i, 1)
  else list.push(days)
}
function create() {
  if (!draft.value.title.trim()) return
  addDday({ ...draft.value, title: draft.value.title.trim(), notifyDays: [...draft.value.notifyDays] })
  showModal.value = false
}
function remove(d) {
  if (!window.confirm('‘' + d.title + '’ D-Day를 삭제할까요?')) return
  removeDday(d.id)
}
</script>

<template>
  <div class="page-tools">
    <b style="font-size: 1rem">D-Day 관리</b>
    <span class="form-note" style="margin: 0">D-Day 화면과 같은 목록이에요</span>
    <span></span>
    <button class="primary" @click="openModal">+ 새 D-Day</button>
  </div>

  <ListFilterBar
    v-model:query="query"
    v-model:filters="filters"
    :groups="FILTER_GROUPS"
    placeholder="이름·분류 검색"
    :result-count="visible.length"
    :total-count="ddays.length"
  />

  <section class="card list">
    <div class="list-head" style="grid-template-columns: 2fr 1fr .8fr 1.4fr .8fr 1.2fr">
      <span>이름</span><span>날짜</span><span>D-Day</span><span>알림</span><span>고정</span><span>관리</span>
    </div>
    <div class="row" style="grid-template-columns: 2fr 1fr .8fr 1.4fr .8fr 1.2fr" v-for="d in visible" :key="d.id" :style="{ opacity: isPast(d.dday) ? 0.55 : 1 }">
      <label>{{ d.title }}<small style="display: block; color: var(--color-muted)">{{ d.category }}</small></label>
      <span>{{ d.date }}</span>
      <b class="figure">{{ d.dday }}</b>
      <span class="tag">{{ notifyLabel(d) }}</span>
      <span>
        <button class="person-info" :title="d.pinned ? '고정 해제' : '고정하기'" aria-label="d.pinned ? '고정 해제' : '고정하기'" @click="togglePin(d)">{{ d.pinned ? '★' : '☆' }}</button>
      </span>
      <span style="display: flex; gap: 6px">
        <button class="review" style="margin: 0" @click="router.push('/dday/' + d.id)">상세</button>
        <button class="review" style="margin: 0" @click="remove(d)">삭제</button>
      </span>
    </div>
    <p v-if="!visible.length" class="form-note" style="margin: 12px 0 0">조건에 맞는 D-Day가 없어요.</p>
  </section>

  <Modal v-if="showModal" title="D-Day 추가" @close="showModal = false">
    <label>제목<input v-model="draft.title" placeholder="예: 여행 출발일" autofocus /></label>
    <label>날짜<input v-model="draft.date" type="date" /></label>
    <label>카테고리<select v-model="draft.category"><option>개인</option><option>업무</option><option>가족</option><option>건강</option><option>공부</option></select></label>
    <div class="section-label">알림 시점</div>
    <div class="filter" style="width: fit-content; flex-wrap: wrap; margin-top: 6px">
      <button v-for="o in NOTIFY_OPTIONS" :key="o.days" type="button" :class="{ selected: draft.notifyDays.includes(o.days) }" @click="toggleNotify(o.days)">{{ o.label }}</button>
    </div>
    <button class="primary" @click="create">D-Day 추가하기</button>
  </Modal>
</template>
