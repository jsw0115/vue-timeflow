<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { tasks, taskStore, openPostComposer } from '../../store/appState'
import Modal from '../../components/Modal.vue'
import StorageNote from '../../components/StorageNote.vue'
import ListFilterBar from '../../components/ListFilterBar.vue'
import { contactById } from '../../store/contacts'
import { modeState, modeMeta, isFieldOn } from '../../store/modeProfiles'
import { OFFLINE_LABEL } from '../../features/records/syncedCollection.mjs'

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
const taskMode = taskStore.mode
// 서버 체크리스트는 목록 응답에 없어서 미리보기할 할 일만 따로 불러온다
const activeChecklist = computed(() => taskStore.checklist(activeTask.value))
watch(() => activeTask.value?.id, () => { if (activeTask.value && taskMode.value === 'server' && activeChecklist.value.status === 'idle') taskStore.loadChecklist(activeTask.value) }, { immediate: true })
// 다른 기기에서 바꾼 내용을 보이도록 목록에 들어올 때 다시 불러온다
onMounted(() => { if (taskMode.value === 'server' && taskStore.state.loaded) taskStore.reload() })
function assigneeLabel(item) {
  if (!item.assigneeId) return '담당자 없음'
  if (item.assigneeId === 'self') return '나'
  return taskMode.value === 'server' ? '다른 계정' : contactById(Number(item.assigneeId))?.name ?? '담당자 없음'
}

function openModal() { openPostComposer('할 일') }
watch(() => route.query.new, (v) => { if (v) openModal() }, { immediate: true })
</script>

<template>
  <div class="page-tools">
    <b style="font-size: 1rem">할 일</b>
    <span></span>
    <button class="primary" @click="openModal">+ 새 할 일</button>
  </div>

  <StorageNote :mode="taskMode" />
  <p v-if="taskStore.notice.message" class="input-field-help" data-state="error" role="status">{{ taskStore.notice.message }}</p>
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
        <label @click.stop><input type="checkbox" :checked="t.done" :aria-busy="taskStore.isPending(t) ? 'true' : undefined" @click.prevent="taskStore.toggle(t)" /><b :class="{ done: t.done }">{{ t.title }}</b><span v-if="t.offline" class="tag" :class="{ warn: t.offline === 'review' }" style="margin-left: var(--space-sm)">{{ OFFLINE_LABEL[t.offline] }}</span></label>
        <span class="tag">{{ t.category }}</span>
        <span class="badge" :class="{ ok: t.done }">{{ t.done ? '완료' : '진행중' }}</span>
      </div>
      <p v-if="taskMode === 'server' && taskStore.state.loading && !taskStore.state.loaded" class="input-field-help" role="status">할 일을 불러오는 중이에요.</p>
      <div v-else-if="taskMode === 'server' && taskStore.state.error && !taskStore.state.loaded" class="empty-state" role="status"><p>할 일을 불러오지 못했어요. 연결을 확인하고 다시 시도해 주세요.</p><button type="button" class="button-secondary" @click="taskStore.reload()">다시 시도</button></div>
      <p v-else-if="!visible.length" class="empty-state" role="status">조건에 맞는 할 일이 없어요. 검색어나 필터를 바꾸거나 '+ 새 할 일'로 추가해 보세요.</p>
    </section>
    <aside class="card detail" v-if="activeTask">
      <h3>{{ activeTask.title }}</h3>
      <p>{{ activeTask.date || '마감일 없음' }} · {{ activeTask.category }}</p>
      <label>체크리스트 {{ activeChecklist.items.filter(item => item.done).length }}/{{ activeChecklist.items.length }}</label>
      <ul class="task-checklist-preview"><li v-for="item in activeChecklist.items" :key="item.id"><label><input type="checkbox" :checked="item.done" :aria-busy="taskStore.isItemBusy(item) ? 'true' : undefined" @click.prevent="taskStore.setItemDone(activeTask, item, !item.done)" /><span :class="{ done: item.done }">{{ item.title }}</span></label><small>{{ assigneeLabel(item) }}</small></li></ul>
      <p v-if="activeChecklist.status === 'loading'" class="input-field-help" role="status">체크리스트를 불러오는 중이에요.</p>
      <div v-else-if="activeChecklist.status === 'error'" role="status"><p class="input-field-help" data-state="error">체크리스트를 불러오지 못했어요.</p><button type="button" class="button-secondary" @click="taskStore.loadChecklist(activeTask)">다시 불러오기</button></div>
      <p v-else-if="!activeChecklist.items.length" class="form-note">상세 보기에서 체크리스트와 담당자를 추가하세요.</p>
      <button class="primary" @click="router.push(`/tasks/${activeTask.id}`)">상세 보기</button>
    </aside>
  </div>

</template>
<style>
.task-checklist-preview { padding: 0; list-style: none; }.task-checklist-preview li { display: flex; flex-direction: column; gap: 4px; padding: 8px 0; }.task-checklist-preview label { display: flex; align-items: center; gap: 8px; margin: 0; }.task-checklist-preview small { color: var(--color-muted); margin-left: 24px; font-size: .75rem; }
</style>
