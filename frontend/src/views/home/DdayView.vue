<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Modal from '../../components/Modal.vue'
import { ddays, isPast, togglePin, addDday, NOTIFY_OPTIONS, notifyLabel } from '../../store/ddays'

const router = useRouter()
const route = useRoute()
const filter = ref('전체')
const filteredDdays = computed(() => {
  if (filter.value === '고정됨') return ddays.value.filter((d) => d.pinned)
  if (filter.value === '지난 일정') return ddays.value.filter((d) => isPast(d.dday))
  return ddays.value.filter((d) => !isPast(d.dday))
})

const showModal = ref(false)
// 상단 고정 버튼(＋ D-Day 추가)이 이 화면에서 눌리면 모달을 연다
watch(() => route.query.new, (v) => { if (v) showModal.value = true }, { immediate: true })
const draft = ref({ title: '', category: '개인', date: '', notifyDays: [1] })
function toggleDraftNotify(days) {
  const list = draft.value.notifyDays
  const i = list.indexOf(days)
  if (i >= 0) list.splice(i, 1)
  else list.push(days)
}
function createDday() {
  if (!draft.value.title.trim()) return
  addDday({ title: draft.value.title.trim(), category: draft.value.category, date: draft.value.date, notifyDays: [...draft.value.notifyDays] })
  draft.value = { title: '', category: '개인', date: '', notifyDays: [1] }
  showModal.value = false
}
</script>

<template>
  <div class="page-tools">
    <div class="filter">
      <button :class="{ selected: filter === '전체' }" @click="filter = '전체'">전체 {{ ddays.filter((d) => !isPast(d.dday)).length }}</button>
      <button :class="{ selected: filter === '고정됨' }" @click="filter = '고정됨'">고정됨 {{ ddays.filter((d) => d.pinned).length }}</button>
      <button :class="{ selected: filter === '지난 일정' }" @click="filter = '지난 일정'">지난 일정</button>
    </div>
    <span></span>
    <button class="primary" @click="showModal = true">+ D-Day 추가</button>
  </div>
  <div class="metrics">
    <article v-for="d in filteredDdays" :key="d.id" class="dday-card" style="cursor: pointer" @click="router.push(`/dday/${d.id}`)">
      <div class="head">
        <span class="badge brand">{{ d.category }}</span>
        <button class="icon" style="width: 26px; height: 26px; font-size: 0.875rem" :title="d.pinned ? '고정 해제' : '고정하기'" aria-label="d.pinned ? '고정 해제' : '고정하기'" @click.stop="togglePin(d)">{{ d.pinned ? '★' : '☆' }}</button>
      </div>
      <h3>{{ d.title }}</h3>
      <p>{{ d.date }}</p>
      <b class="dday-num">{{ d.dday }}</b>
      <small class="dday-notify">🔔 {{ notifyLabel(d) }}</small>
    </article>
    <p v-if="filteredDdays.length === 0" style="grid-column: 1 / -1">표시할 항목이 없어요.</p>
  </div>

  <Modal v-if="showModal" title="D-Day 추가" @close="showModal = false">
    <label>제목<input v-model="draft.title" placeholder="예: 여행 출발일" autofocus /></label>
    <label>날짜<input v-model="draft.date" type="date" /></label>
    <label>카테고리<select v-model="draft.category"><option>개인</option><option>업무</option><option>가족</option><option>건강</option><option>공부</option></select></label>

    <div class="section-label">알림 시점 (여러 개 선택 가능)</div>
    <div class="filter" style="width: fit-content; flex-wrap: wrap; margin-top: 6px">
      <button
        v-for="o in NOTIFY_OPTIONS"
        :key="o.days"
        type="button"
        :class="{ selected: draft.notifyDays.includes(o.days) }"
        @click="toggleDraftNotify(o.days)"
      >{{ o.label }}</button>
    </div>
    <p class="form-note">{{ draft.notifyDays.length ? '선택한 시점마다 알림을 보내요.' : '알림을 보내지 않아요.' }}</p>

    <button class="primary" @click="createDday">D-Day 추가하기</button>
  </Modal>
</template>
