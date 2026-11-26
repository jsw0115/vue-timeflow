<script setup>
import { tr } from '../../store/locale'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { isAutomationOn } from '../../store/automations'
import Modal from '../../components/Modal.vue'
import RichText from '../../components/RichText.vue'
import ListFilterBar from '../../components/ListFilterBar.vue'
import { memos, memoStore } from '../../store/writing'
import ListLoadState from '../../components/ListLoadState.vue'
import { listPending } from '../../features/records/listLoadState.mjs'
import { taskStore, openPostComposer } from '../../store/appState'
import { OFFLINE_LABEL } from '../../features/records/syncedCollection.mjs'
import PageActions from '../../components/PageActions.vue'
import TagMentionInput from '../../components/TagMentionInput.vue'
import SaveStatus from '../../components/SaveStatus.vue'
import ConflictCompare from '../../components/ConflictCompare.vue'
import { createSaveState } from '../../features/records/saveState.mjs'

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
function openEditor() { openPostComposer('메모') }
watch(() => route.query.new, (v) => { if (v) openEditor() }, { immediate: true })

/* ---------- 메모 수정·삭제 모달(IMP-019) ---------- */
// 연 때의 메모를 기준(version)으로 저장해 다른 곳의 변경을 모르고 덮어쓰지 않는다(UF-84). 지우기는 서버 DELETE를 쓴다
const memoMode = memoStore.mode
const editing = ref(null)
const editDraft = ref({ title: '', body: '' })
const saving = createSaveState({ fields: { title: ['title', '제목'] } })
const removing = createSaveState()
const conflict = ref(null)
function openEdit(memo) {
  editing.value = { ...memo }
  editDraft.value = { title: memo.title, body: memo.body ?? '' }
  conflict.value = null
  saving.reset()
  removing.reset()
}
// 카드 안의 링크·버튼(태그, 할 일로 변환)을 누른 것은 수정 창을 열지 않는다
function onCardClick(event, memo) {
  if (event.target.closest('a, button, input, label')) return
  openEdit(memo)
}
async function saveEdit() {
  if (!editing.value || !editDraft.value.title.trim()) return
  conflict.value = null
  const result = await saving.run(() => memoStore.update(editing.value, { title: editDraft.value.title.trim(), body: editDraft.value.body }))
  if (result.ok) { editing.value = null; return }
  if (result.error.kind === 'conflict') conflict.value = { latest: { ...(result.error.latest ?? editing.value) } }
}
const compareRows = computed(() => {
  if (!conflict.value) return []
  const latest = conflict.value.latest, mine = editDraft.value
  return [
    { label: '제목', mine: mine.title.trim(), latest: latest.title },
    { label: '내용', mine: mine.body, latest: latest.body ?? '' },
  ]
})
function keepMine() {
  editing.value = { ...editing.value, ...conflict.value.latest }
  conflict.value = null
  saveEdit()
}
function useLatest() {
  const latest = conflict.value.latest
  editing.value = { ...editing.value, ...latest }
  conflict.value = null
  saving.reset()
  editDraft.value = { title: latest.title, body: latest.body ?? '' }
}
const removeMessage = computed(() => (removing.state.status === 'failed' || removing.state.status === 'conflict') ? (removing.state.error?.kind === 'conflict' ? '다른 곳에서 먼저 고쳐서 삭제하지 않았어요. 최신 내용을 확인한 뒤 다시 삭제해 주세요.' : removing.state.message.replace('저장하지', '삭제하지')) : '')
async function removeMemo() {
  if (!editing.value || !window.confirm(tr('‘{title}’ 메모를 삭제할까요?', { title: editing.value.title }))) return
  const result = await removing.run(() => memoStore.remove(editing.value))
  if (result.ok || result.error?.kind === 'notFound') editing.value = null
}

/* ---------- 할 일 변환 모달 ---------- */
const showConvert = ref(false)
const convertSource = ref(null)
const candidates = ref([])
const convertedCount = ref(0)
function openConvert(memo) {
  convertSource.value = memo
  convertError.value = ''
  // 문장 단위로 쪼개 실행 가능한 후보를 만든다
  candidates.value = memo.body
    .split(/[.!?\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 3)
    .map((title, index) => ({ id: index, title, checked: true }))
  if (!candidates.value.length) candidates.value = [{ id: 0, title: memo.title, checked: true }]
  showConvert.value = true
}
// 로그인 상태에서는 고른 문장마다 서버에 할 일을 만든다. 일부가 실패하면 저장한 것은 빼고 남은 문장으로 다시 시도할 수 있게 둔다(PR-07)
const converting = ref(false)
const convertError = ref('')
async function convertToTasks() {
  const picked = candidates.value.filter((c) => c.checked)
  if (!picked.length || converting.value) return
  converting.value = true
  convertError.value = ''
  let saved = 0
  for (const c of picked) {
    try {
      await taskStore.createWithChecklist({ title: c.title, body: '', date: '', category: '업무', priority: '보통' }, [])
      candidates.value = candidates.value.filter((entry) => entry !== c)
      saved++
    } catch {
      // 저장하지 못한 문장은 후보에 남긴다
    }
  }
  converting.value = false
  convertedCount.value = saved
  if (saved < picked.length) {
    convertError.value = saved ? tr('{saved}건은 할 일로 옮겼어요. {failed}건을 저장하지 못했어요. 연결을 확인하고 다시 시도해 주세요.', { saved, failed: picked.length - saved }) : tr('{failed}건을 저장하지 못했어요. 연결을 확인하고 다시 시도해 주세요.', { failed: picked.length - saved })
    return
  }
  showConvert.value = false
  router.push('/tasks')
}
</script>

<template>
  <PageActions><button class="primary" @click="openEditor">{{ tr('+ 메모 작성') }}</button></PageActions>

  <ListFilterBar
    v-model:query="query"
    v-model:filters="filters"
    :groups="FILTER_GROUPS"
    :placeholder="tr('메모 제목·내용 검색')"
    :result-count="visibleMemos.length"
    :total-count="memos.length"
  />
  <div class="form-note" v-if="isAutomationOn('memo-to-task')">
    {{ tr('자동화 켜짐 · 실행 가능한 메모는 자동으로 표시돼요 ·') }}
    <RouterLink to="/settings/automation" class="inline-link">{{ tr('설정') }}</RouterLink>
  </div>
  <div class="memo-grid">
    <section class="card memo-card" :class="m.color" style="break-inside: avoid; margin-bottom: 12px; cursor: pointer" v-for="m in visibleMemos" :key="m.id" @click="onCardClick($event, m)">
      <div style="display: flex; justify-content: space-between; align-items: start; gap: 8px">
        <button type="button" class="memo-open" :aria-label="tr('‘{title}’ 메모 수정', { title: m.title })" @click="openEdit(m)"><b>{{ m.title }}</b></button>
        <button type="button" class="button-text memo-convert" @click.stop="openConvert(m)">{{ tr('할 일로 변환') }}</button>
      </div>
      <p v-if="m.body"><RichText :text="m.body" /></p>
      <p v-else class="form-note" style="margin: 6px 0 0">{{ tr('내용 없음') }}</p>
      <small>{{ m.time }}</small>
      <span v-if="m.offline" class="tag" :class="{ warn: m.offline === 'review' }" style="margin-left: var(--space-sm)">{{ OFFLINE_LABEL[m.offline] }}</span>
    </section>
    <ListLoadState :store="memoStore" loading="메모를 불러오는 중이에요." failed="메모를 불러오지 못했어요. 연결을 확인하고 다시 시도해 주세요." />
    <p v-if="visibleMemos.length === 0 && !listPending(memoStore)">{{ tr('조건에 맞는 메모가 없어요.') }}</p>
  </div>

<Modal v-if="editing" :title="tr('메모 수정')" @close="editing = null">
    <label>{{ tr('제목') }}<input v-model="editDraft.title" maxlength="200" /></label>
    <label>{{ tr('내용 · 태그 · 멘션') }}<TagMentionInput v-model="editDraft.body" :rows="6" /></label>
    <p v-if="saving.state.fieldMessage" class="input-field-help" data-state="error" role="alert">{{ tr(saving.state.fieldMessage) }}</p>
    <ConflictCompare v-if="conflict" :rows="compareRows" :busy="saving.state.status === 'saving'" @keep-mine="keepMine" @use-latest="useLatest" />
    <SaveStatus :state="saving.state" :mode="memoMode" @retry="saveEdit" />
    <p v-if="removeMessage" class="input-field-help" data-state="error" role="status">{{ tr(removeMessage) }}</p>

    <template #footer>
      <button type="button" class="modal-secondary memo-remove" :aria-busy="removing.state.status === 'saving' ? 'true' : undefined" @click="removeMemo">{{ removing.state.status === 'saving' ? tr('삭제하는 중') : tr('삭제하기') }}</button>
      <button type="button" class="modal-secondary" @click="editing = null">{{ tr('취소') }}</button>
      <button class="primary" :disabled="!editDraft.title.trim() || !!conflict" :aria-busy="saving.state.status === 'saving' ? 'true' : undefined" @click="saveEdit">{{ saving.state.status === 'saving' ? tr('저장하는 중') : tr('메모 저장') }}</button>
    </template>
  </Modal>

<Modal v-if="showConvert" :title="tr('할 일로 변환')" wide @close="showConvert = false">
    <p class="form-note" style="margin: 0 0 10px">{{ tr('메모에서 실행 가능한 문장을 뽑았어요. 필요한 항목만 골라 할 일로 옮기세요.') }}</p>
    <section class="card" style="box-shadow: none; margin-bottom: 12px">
      <span class="pill">{{ tr('원본 메모') }}</span>
      <p style="margin-top: 8px">{{ convertSource?.body }}</p>
    </section>
    <label class="task" v-for="c in candidates" :key="c.id">
      <input type="checkbox" v-model="c.checked" />
      <span style="flex: 1"><b>{{ c.title }}</b></span>
    </label>
    <p v-if="candidates.length === 0">{{ tr('변환할 만한 문장을 찾지 못했어요.') }}</p>
    <p v-if="convertError" class="input-field-help" data-state="error" role="status">{{ convertError }}</p>

    <template #footer>
      <button type="button" class="modal-secondary" @click="showConvert = false">{{ tr('취소') }}</button>
      <button class="primary" :disabled="!candidates.some((c) => c.checked)" :aria-busy="converting ? 'true' : undefined" @click="convertToTasks">
      {{ converting ? tr('할 일로 옮기는 중') : tr('선택한 {n}건 할 일로 변환', { n: candidates.filter((c) => c.checked).length }) }}
          </button>
    </template>
  </Modal>
</template>

<style scoped>
/* 메모 제목은 글자 그대로 보이는 버튼이다. 누르면 수정 창이 열린다(IMP-019) */
.memo-open { padding: 0; border: 0; background: none; color: inherit; font: inherit; text-align: left; cursor: pointer; }
.memo-remove { margin-right: auto; color: var(--color-status-danger); }
</style>
