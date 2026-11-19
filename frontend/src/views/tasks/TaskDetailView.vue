<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { tasks, taskStore } from '../../store/appState'
import { createSaveState } from '../../features/records/saveState.mjs'

import ChecklistEditor from '../../components/ChecklistEditor.vue'
import ConflictCompare from '../../components/ConflictCompare.vue'
import EditPresence from '../../components/EditPresence.vue'
import SaveStatus from '../../components/SaveStatus.vue'
import StorageNote from '../../components/StorageNote.vue'
import TagMentionInput from '../../components/TagMentionInput.vue'

const route = useRoute()
const router = useRouter()
const taskMode = taskStore.mode
const task = computed(() => tasks.value.find((t) => String(t.id) === String(route.params.id)))

const toDraft = (value, items) => ({ title: value.title, category: value.category, body: value.body ?? '', date: value.date ?? '', priority: value.priority ?? '보통', subtasks: items.map(item => ({ ...item })) })
const draft = ref({ title: '', category: '업무', body: '', date: '', priority: '보통', subtasks: [] })
// 편집을 시작한 할 일과 그때의 서버 체크리스트. 저장은 이 version으로 보내 다른 곳의 변경을 모르고 덮어쓰지 않는다(UF-84)
const base = ref(null)
const baseline = ref([])
const checklist = ref({ status: 'idle', error: null })
const conflict = ref(null)
const saving = createSaveState({ fields: { title: ['제목'], date: ['마감'] } })
const removing = createSaveState()

async function begin(id) {
  conflict.value = null
  saving.reset()
  if (id == null) return
  if (base.value?.id !== id) { base.value = { ...task.value }; draft.value = toDraft(task.value, []) }
  checklist.value = { status: 'loading', error: null }
  const entry = taskMode.value === 'server' ? await taskStore.loadChecklist(task.value) : taskStore.checklist(task.value)
  if (task.value?.id !== id) return
  checklist.value = { status: entry.status, error: entry.error }
  if (entry.status !== 'ready') return
  baseline.value = entry.items.map(item => ({ ...item }))
  draft.value.subtasks = entry.items.map(item => ({ ...item }))
}
// 목록을 다시 불러와도 같은 할 일이면 입력 중인 내용을 지우지 않는다
watch(() => task.value?.id, begin, { immediate: true })

const canSave = computed(() => checklist.value.status === 'ready' && !!draft.value.title.trim() && (draft.value.subtasks ?? []).every(item => item.title.trim()))
// 저장한 뒤 다시 고치면 "저장했어요"를 내린다. 저장 결과로 체크리스트 ID를 바꾸는 것은 고친 것으로 보지 않는다
let quiet = false
watch(draft, () => { if (quiet) { quiet = false; return } if (saving.state.status === 'saved') saving.reset() }, { deep: true })

async function save() {
  if (!task.value || !canSave.value) return
  const result = await saving.run(() => taskStore.saveDetail(base.value, draft.value, baseline.value))
  if (result.ok) {
    base.value = { ...result.value.task }
    baseline.value = result.value.baseline.map(item => ({ ...item }))
    quiet = true
    draft.value.subtasks = result.value.subtasks.map(item => ({ ...item }))
    return
  }
  const error = result.error
  // 일부만 저장됐으면 저장된 결과를 기준으로 삼아, 다시 시도할 때 남은 변경만 보낸다
  if (error.progress) {
    base.value = { ...error.progress.task }
    baseline.value = error.progress.baseline.map(item => ({ ...item }))
    draft.value.subtasks = error.progress.subtasks.map(item => ({ ...item }))
  }
  if (error.kind === 'conflict') {
    const latest = error.latest ?? task.value ?? base.value
    const items = error.latestChecklist ?? (await taskStore.loadChecklist(latest)).items
    conflict.value = { latest: { ...latest }, checklist: items.map(item => ({ ...item })) }
  }
}
const summary = (items) => (items ?? []).map(item => (item.done ? '완료 · ' : '') + item.title.trim()).join('\n')
const compareRows = computed(() => {
  if (!conflict.value) return []
  const latest = conflict.value.latest, mine = draft.value
  return [
    { label: '제목', mine: mine.title.trim(), latest: latest.title },
    { label: '카테고리', mine: mine.category, latest: latest.category },
    { label: '마감일', mine: mine.date, latest: latest.date },
    { label: '우선순위', mine: mine.priority, latest: latest.priority },
    { label: '내용', mine: mine.body, latest: latest.body },
    { label: '체크리스트', mine: summary(mine.subtasks), latest: summary(conflict.value.checklist) },
  ]
})
// 내 내용으로 다시 저장: 최신 version과 최신 체크리스트를 기준으로 내 입력을 다시 보낸다(UT-126)
function keepMine() {
  base.value = { ...conflict.value.latest }
  baseline.value = conflict.value.checklist
  conflict.value = null
  save()
}
function useLatest() {
  const { latest, checklist: items } = conflict.value
  base.value = { ...latest }
  baseline.value = items.map(item => ({ ...item }))
  draft.value = toDraft(latest, items)
  conflict.value = null
  saving.reset()
}

// 완료 토글도 편집을 시작한 version으로 보내고, 내 변경이면 기준 version을 따라 올린다
async function toggleDone() {
  if (!task.value) return
  const saved = await taskStore.toggle({ ...task.value, version: base.value?.version ?? task.value.version })
  if (saved && base.value) base.value = { ...base.value, version: saved.version, status: saved.status, done: saved.done }
}
const removeMessage = computed(() => {
  const kind = removing.state.status === 'failed' || removing.state.status === 'conflict' ? removing.state.error?.kind : ''
  if (!kind) return ''
  if (kind === 'conflict') return '다른 곳에서 먼저 고쳐서 삭제하지 않았어요. 최신 내용을 확인한 뒤 다시 삭제해 주세요.'
  if (kind === 'network') return '삭제하지 못했어요. 연결을 확인하고 다시 시도해 주세요.'
  return '삭제하지 못했어요. 잠시 뒤 다시 시도해 주세요.'
})
async function remove() {
  if (!task.value) return
  if (!window.confirm('‘' + task.value.title + '’ 할 일을 삭제할까요? 하위 항목도 함께 사라져요.')) return
  const result = await removing.run(() => taskStore.remove({ ...task.value, version: base.value?.version ?? task.value.version }))
  if (result.ok || result.error?.kind === 'notFound') router.push('/tasks')
}
</script>

<template>
  <div class="crumbs"><a @click="router.push('/tasks')">할 일</a> / 상세</div>
  <section v-if="task" class="card" style="max-width: 520px; margin: 0 auto">
    <EditPresence :resource="'task:' + task.id" />
    <div class="head">
      <div>
        <span class="tag">{{ task.category }}</span>
        <h2 style="margin: 10px 0 4px">{{ task.title }}</h2>
        <p>{{ task.done ? '완료됨' : '진행중' }}</p>
      </div>
      <label style="display: flex; align-items: center; gap: 8px; font-size: 0.8125rem; font-weight: 600">
        <input type="checkbox" :checked="task.done" :aria-busy="taskStore.isPending(task) ? 'true' : undefined" @click.prevent="toggleDone" />완료
      </label>
    </div>
    <p v-if="taskStore.notice.message" class="input-field-help" data-state="error" role="status">{{ taskStore.notice.message }}</p>
    <StorageNote :mode="taskMode" />

    <div style="margin-top: 16px; padding-top: 20px; border-top: 1px solid var(--color-hairline)">
      <label>제목<input v-model="draft.title" :aria-invalid="saving.state.field === 'title' ? 'true' : undefined" :aria-describedby="saving.state.field === 'title' ? 'task-title-error' : undefined" /><span v-if="saving.state.field === 'title'" id="task-title-error" class="input-field-help" data-state="error">{{ saving.state.fieldMessage }}</span></label>
      <label>카테고리<select v-model="draft.category"><option>업무</option><option>공부</option><option>건강</option><option>휴식</option><option>개인</option></select></label>
      <label>마감일<input type="date" v-model="draft.date" :aria-invalid="saving.state.field === 'date' ? 'true' : undefined" :aria-describedby="saving.state.field === 'date' ? 'task-date-error' : undefined" /><span v-if="saving.state.field === 'date'" id="task-date-error" class="input-field-help" data-state="error">{{ saving.state.fieldMessage }}</span></label>
      <label>우선순위<select v-model="draft.priority"><option>높음</option><option>보통</option><option>낮음</option></select></label>
      <label>내용 · 태그 · 멘션<TagMentionInput v-model="draft.body" /></label>
      <p v-if="checklist.status === 'loading'" class="input-field-help" role="status">체크리스트를 불러오는 중이에요.</p>
      <div v-else-if="checklist.status === 'error'" role="status">
        <p class="input-field-help" data-state="error">체크리스트를 불러오지 못했어요. 불러온 뒤에 저장할 수 있어요.</p>
        <button type="button" class="button-secondary" @click="begin(task.id)">다시 불러오기</button>
      </div>
      <ChecklistEditor v-else v-model="draft.subtasks" :account-only="taskMode === 'server'" />
      <ConflictCompare v-if="conflict" :rows="compareRows" :busy="saving.state.status === 'saving'" @keep-mine="keepMine" @use-latest="useLatest" />
      <p v-if="!canSave && checklist.status === 'ready'" class="form-note" role="status">제목과 체크리스트 항목 이름을 입력해주세요.</p>
      <SaveStatus :state="saving.state" :mode="taskMode" @retry="save" />
      <button class="primary" :disabled="!canSave || !!conflict" :aria-busy="saving.state.status === 'saving' ? 'true' : undefined" style="width: 100%; margin-top: 14px" @click="save">{{ saving.state.status === 'saving' ? '저장하는 중' : '저장하기' }}</button>
    </div>


    <button style="width: 100%; margin-top: 20px; color: var(--color-status-danger); font-weight: 700; padding: 10px" :aria-busy="removing.state.status === 'saving' ? 'true' : undefined" @click="remove">{{ removing.state.status === 'saving' ? '삭제하는 중' : '삭제하기' }}</button>
    <p v-if="removeMessage" class="input-field-help" data-state="error" role="status">{{ removeMessage }}</p>
  </section>
  <p v-else-if="taskMode === 'server' && !taskStore.state.loaded && !taskStore.state.error" role="status">할 일을 불러오는 중이에요.</p>
  <div v-else-if="taskMode === 'server' && taskStore.state.error" class="empty-state" role="status"><p>할 일을 불러오지 못했어요. 연결을 확인하고 다시 시도해 주세요.</p><button type="button" class="button-secondary" @click="taskStore.reload()">다시 시도</button></div>
  <p v-else>할 일을 찾을 수 없어요. <a @click="router.push('/tasks')" style="color: var(--color-accent); font-weight: 700; cursor: pointer">목록으로 돌아가기</a></p>
</template>
