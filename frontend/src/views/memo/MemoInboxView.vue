<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { isAutomationOn } from '../../store/automations'
import Modal from '../../components/Modal.vue'
import TagMentionInput from '../../components/TagMentionInput.vue'
import RichText from '../../components/RichText.vue'
import { addPost } from '../../store/tagging'
import ListFilterBar from '../../components/ListFilterBar.vue'
import { memos } from '../../store/writing'
import { tasks } from '../../store/appState'

const route = useRoute()
const router = useRouter()
const query = ref('')
const filters = ref({ kind: '전체' })
const FILTER_GROUPS = [
  {
    id: 'kind',
    all: '전체',
    options: [
      { value: '전체', label: '전체' },
      { value: '아이디어', label: '아이디어' },
      { value: '할일 후보', label: '할일 후보' },
    ],
  },
]

const visibleMemos = computed(() => {
  const keyword = query.value.trim().toLowerCase()
  return memos.value.filter((m) => {
    if (filters.value.kind === '할일 후보' && !m.actionable) return false
    if (filters.value.kind === '아이디어' && m.actionable) return false
    if (!keyword) return true
    return `${m.title} ${m.body}`.toLowerCase().includes(keyword)
  })
})

/* ---------- 메모 작성 모달 ---------- */
const showEditor = ref(false)
const editorMode = ref('텍스트')
const draftTitle = ref('')
const draftBody = ref('')
// 제목은 필수, 내용은 선택
const canCreateMemo = computed(() => draftTitle.value.trim().length > 0)
function openEditor() {
  draftTitle.value = ''
  draftBody.value = ''
  editorMode.value = '텍스트'
  showEditor.value = true
}
function createMemo() {
  if (!canCreateMemo.value) return
  const id = Math.max(0, ...memos.value.map((m) => m.id)) + 1
  memos.value.unshift({
    id,
    title: draftTitle.value.trim(),
    body: draftBody.value.trim(),
    time: '방금',
    color: '',
    actionable: true,
  })
  showEditor.value = false
}
watch(() => route.query.new, (v) => { if (v) openEditor() }, { immediate: true })

/* ---------- 할 일 변환 모달 ---------- */
const showConvert = ref(false)
const convertSource = ref(null)
const candidates = ref([])
const convertedCount = ref(0)
function openConvert(memo) {
  convertSource.value = memo
  // 문장 단위로 쪼개 실행 가능한 후보를 만든다
  candidates.value = memo.body
    .split(/[.!?\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 3)
    .map((title, index) => ({ id: index, title, checked: true }))
  if (!candidates.value.length) candidates.value = [{ id: 0, title: memo.title, checked: true }]
  showConvert.value = true
}
function convertToTasks() {
  const picked = candidates.value.filter((c) => c.checked)
  if (!picked.length) return
  let nextId = Math.max(0, ...tasks.value.map((t) => t.id)) + 1
  picked.forEach((c) => {
    tasks.value.push({ id: nextId++, title: c.title, category: '업무', done: false })
  })
  showConvert.value = false
  convertedCount.value = picked.length
  router.push('/tasks')
}
</script>

<template>
  <div class="page-tools">
    <b style="font-size: 1rem">메모</b>
    <span></span>
    <button class="primary" @click="openEditor">+ 메모 작성</button>
  </div>

  <ListFilterBar
    v-model:query="query"
    v-model:filters="filters"
    :groups="FILTER_GROUPS"
    placeholder="메모 제목·내용 검색"
    :result-count="visibleMemos.length"
    :total-count="memos.length"
  />
  <div class="form-note" v-if="isAutomationOn('memo-to-task')">
    ⚡ 자동화 켜짐 · 실행 가능한 메모는 자동으로 표시돼요 ·
    <a @click="router.push('/settings/automation')" style="color: var(--color-accent); font-weight: 700; cursor: pointer">설정</a>
  </div>
  <div class="memo-grid">
    <section class="card memo-card" :class="m.color" style="break-inside: avoid; margin-bottom: 12px" v-for="m in visibleMemos" :key="m.id">
      <div style="display: flex; justify-content: space-between; align-items: start; gap: 8px">
        <b>{{ m.title }}</b>
        <button class="badge new" style="cursor: pointer; flex: none" @click.stop="openConvert(m)">⚡ 할 일로 변환</button>
      </div>
      <p v-if="m.body"><RichText :text="m.body" /></p>
      <p v-else class="form-note" style="margin: 6px 0 0">내용 없음</p>
      <small>{{ m.time }}</small>
    </section>
    <p v-if="visibleMemos.length === 0">조건에 맞는 메모가 없어요.</p>
  </div>

  <Modal v-if="showEditor" title="메모 작성" @close="showEditor = false">
    <div class="tabs" style="width: fit-content; margin-bottom: 12px">
      <button type="button" :class="{ selected: editorMode === '텍스트' }" @click="editorMode = '텍스트'">텍스트</button>
      <button type="button" :class="{ selected: editorMode === '음성' }" @click="editorMode = '음성'">음성</button>
    </div>
    <template v-if="editorMode === '텍스트'">
      <label>제목 <small style="color: var(--color-muted)">(필수)</small>
        <input v-model="draftTitle" placeholder="예: 디자인 리뷰 아이디어" autofocus @keydown.ctrl.enter="createMemo" />
      </label>
      <label>내용 <small style="color: var(--color-muted)">(선택)</small></label>
      <TagMentionInput v-model="draftBody" placeholder="자세한 내용을 적어보세요. #태그 와 @이름 을 쓸 수 있어요" />
    </template>
    <p v-else class="form-note" style="margin: 0">음성 입력은 마이크 권한이 필요해요. 지금은 텍스트 탭에서 먼저 작성해주세요.</p>
    <p v-if="editorMode === '텍스트' && !canCreateMemo" class="form-note">제목을 입력하면 저장할 수 있어요.</p>
    <button class="primary" :disabled="editorMode === '텍스트' && !canCreateMemo" @click="createMemo">메모 저장</button>
  </Modal>

  <Modal v-if="showConvert" title="할 일로 변환" wide @close="showConvert = false">
    <p class="form-note" style="margin: 0 0 10px">메모에서 실행 가능한 문장을 뽑았어요. 필요한 항목만 골라 할 일로 옮기세요.</p>
    <section class="card" style="box-shadow: none; margin-bottom: 12px">
      <span class="pill">원본 메모</span>
      <p style="margin-top: 8px">{{ convertSource?.body }}</p>
    </section>
    <label class="task" v-for="c in candidates" :key="c.id">
      <input type="checkbox" v-model="c.checked" />
      <span style="flex: 1"><b>{{ c.title }}</b></span>
    </label>
    <p v-if="candidates.length === 0">변환할 만한 문장을 찾지 못했어요.</p>
    <button class="primary" :disabled="!candidates.some((c) => c.checked)" @click="convertToTasks">
      선택한 {{ candidates.filter((c) => c.checked).length }}건 할 일로 변환
    </button>
  </Modal>
</template>
