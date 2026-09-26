<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { tasks, toggle, openPostComposer } from '../../store/appState'
import Modal from '../../components/Modal.vue'
import ListFilterBar from '../../components/ListFilterBar.vue'
import { modeState, modeMeta, isFieldOn } from '../../store/modeProfiles'

const route = useRoute()
const router = useRouter()
const query = ref('')
const filters = ref({ state: '전체', category: '전체' })
const FILTER_GROUPS = computed(() => [
  {
    id: 'state',
    all: '전체',
    options: [
      { value: '전체', label: '전체' },
      { value: '진행중', label: '진행중' },
      { value: '완료', label: '완료' },
    ],
  },
  {
    id: 'category',
    all: '전체',
    options: [
      { value: '전체', label: '전체 분류' },
      ...[...new Set(tasks.value.map((t) => t.category))].map((c) => ({ value: c, label: c })),
    ],
  },
])
const visible = computed(() => {
  const k = query.value.trim()
  return tasks.value.filter((t) => {
    if (filters.value.state === '진행중' && t.done) return false
    if (filters.value.state === '완료' && !t.done) return false
    if (filters.value.category !== '전체' && t.category !== filters.value.category) return false
    if (k && !t.title.includes(k) && !t.category.includes(k)) return false
    return true
  })
})
const activeId = computed(() => visible.value[0]?.id)
const activeTask = computed(() => visible.value[0])

function openModal() { openPostComposer('할 일') }
watch(() => route.query.new, (v) => { if (v) openModal() }, { immediate: true })
</script>

<template>
  <div class="page-tools">
    <b style="font-size: 16px">할 일</b>
    <span></span>
    <button class="primary" @click="openModal">+ 새 할 일</button>
  </div>

  <ListFilterBar
    v-model:query="query"
    v-model:filters="filters"
    :groups="FILTER_GROUPS"
    placeholder="할 일 제목·분류 검색"
    :result-count="visible.length"
    :total-count="tasks.length"
  />
  <div class="manage">
    <section class="card list">
      <div class="list-head"><span>할 일</span><span>카테고리</span><span>상태</span></div>
      <div class="row" style="grid-template-columns: 2.2fr 1fr 0.8fr; cursor: pointer" v-for="t in visible" :key="t.id" :class="{ picked: t.id === activeId }" @click="router.push(`/tasks/${t.id}`)">
        <label @click.stop><input type="checkbox" :checked="t.done" @change="toggle(t)" /><b :class="{ done: t.done }">{{ t.title }}</b></label>
        <span class="tag">{{ t.category }}</span>
        <span class="badge" :class="{ ok: t.done }">{{ t.done ? '완료' : '진행중' }}</span>
      </div>
      <p v-if="!visible.length" class="form-note" style="margin: 12px 0 0">조건에 맞는 할 일이 없어요.</p>
    </section>
    <aside class="card detail" v-if="activeTask">
      <h3>{{ activeTask.title }}</h3>
      <p>오늘 마감 · {{ activeTask.category }}</p>
      <label>연결된 일정</label>
      <p>09:00 팀 회의와 연동됨</p>
      <label>복습 알림</label>
      <p>완료 3일 후 자동 복습 카드 생성</p>
      <button class="primary" @click="router.push(`/tasks/${activeTask.id}`)">상세 보기</button>
    </aside>
  </div>

</template>
