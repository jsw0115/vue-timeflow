<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import Modal from '../../components/Modal.vue'
import HelpPopover from '../../components/HelpPopover.vue'
import ListFilterBar from '../../components/ListFilterBar.vue'
import PersonTag from '../../components/PersonTag.vue'
import {
  board, PRIORITIES, LABELS, filters, cardsOf, countOf, isWipExceeded, isOverdue,
  assignees, progress, overdueCount, checklistOf,
  addCard, updateCard, removeCard, moveCard, addColumn, renameColumn, setWip, removeColumn,
  resetBoard,
} from '../../store/canvas'

const router = useRouter()

/* ---------- 검색 · 필터 ---------- */
const query = computed({
  get: () => filters.value.query,
  set: (v) => (filters.value = { ...filters.value, query: v }),
})
const filterModel = computed({
  get: () => ({ assignee: filters.value.assignee, label: filters.value.label, priority: filters.value.priority }),
  set: (v) => (filters.value = { ...filters.value, ...v }),
})
const FILTER_GROUPS = computed(() => [
  { id: 'assignee', all: '전체', options: [{ value: '전체', label: '담당 전체' }, ...assignees.value.map((a) => ({ value: a, label: a }))] },
  { id: 'label', all: '전체', options: [{ value: '전체', label: '라벨 전체' }, ...LABELS.map((l) => ({ value: l, label: l }))] },
  { id: 'priority', all: '전체', options: [{ value: '전체', label: '우선순위 전체' }, ...PRIORITIES.map((p) => ({ value: p.id, label: p.label }))] },
])
const visibleTotal = computed(() => board.columns.reduce((a, c) => a + cardsOf(c.id).length, 0))
function toggleOverdue() {
  filters.value = { ...filters.value, overdue: !filters.value.overdue }
}

/* ---------- 드래그 앤 드롭 ---------- */
const dragCardId = ref(null)
const dragOverColumn = ref(null)
function onDragStart(card) {
  dragCardId.value = card.id
}
function onDragEnd() {
  dragCardId.value = null
  dragOverColumn.value = null
}
function onDropColumn(columnId) {
  if (dragCardId.value) moveCard(dragCardId.value, columnId)
  onDragEnd()
}
function onDropCard(card) {
  if (dragCardId.value && dragCardId.value !== card.id) moveCard(dragCardId.value, card.columnId, card.id)
  onDragEnd()
}
/** 드래그를 못 쓰는 환경을 위한 이동 버튼 */
function shift(card, delta) {
  const idx = board.columns.findIndex((c) => c.id === card.columnId)
  const next = board.columns[idx + delta]
  if (next) moveCard(card.id, next.id)
}

/* ---------- 카드 만들기 · 상세 ---------- */
const editing = ref(null) // 'new' | card
const draft = ref(emptyDraft('todo'))
const checklistInput = ref('')

function emptyDraft(columnId) {
  return { columnId, title: '', assignee: '', due: '', priority: 'normal', labels: [], checklist: [], plannerBlock: '' }
}
function openAdd(columnId) {
  editing.value = 'new'
  draft.value = emptyDraft(columnId)
  checklistInput.value = ''
}
function openCard(card) {
  editing.value = card
  draft.value = {
    columnId: card.columnId,
    title: card.title,
    assignee: card.assignee,
    due: card.due,
    priority: card.priority,
    labels: [...card.labels],
    checklist: card.checklist.map((i) => ({ ...i })),
    plannerBlock: card.plannerBlock,
  }
  checklistInput.value = ''
}
function toggleDraftLabel(l) {
  const list = draft.value.labels
  const i = list.indexOf(l)
  if (i >= 0) list.splice(i, 1)
  else list.push(l)
}
function addChecklistItem() {
  const text = checklistInput.value.trim()
  if (!text) return
  draft.value.checklist.push({ text, done: false })
  checklistInput.value = ''
}
const canSave = computed(() => Boolean(draft.value.title.trim()))
function save() {
  if (!canSave.value) return
  if (editing.value === 'new') addCard({ ...draft.value })
  else updateCard(editing.value.id, { ...draft.value })
  editing.value = null
}
function onRemove() {
  if (editing.value === 'new') return
  if (!window.confirm('‘' + editing.value.title + '’ 카드를 삭제할까요?')) return
  removeCard(editing.value.id)
  editing.value = null
}

/* ---------- 컬럼 관리 ---------- */
const showColumns = ref(false)
const newColumn = ref('')
function createColumn() {
  if (!addColumn(newColumn.value)) return
  newColumn.value = ''
}
function onRemoveColumn(col) {
  if (!window.confirm('‘' + col.title + '’ 컬럼과 그 안의 카드 ' + countOf(col.id) + '개를 모두 삭제할까요?')) return
  removeColumn(col.id)
}
function onReset() {
  if (!window.confirm('보드를 초기 상태로 되돌릴까요? 지금까지 만든 카드가 사라져요.')) return
  resetBoard()
}
function priorityLabel(id) {
  return PRIORITIES.find((p) => p.id === id)?.label ?? id
}
</script>

<template>
  <div class="page-tools">
    <b style="font-size: 16px">프로젝트 캔버스</b>
    <HelpPopover
      title="프로젝트 캔버스 사용법"
      summary="작업을 카드로 만들어 상태별 컬럼에 놓고, 끌어다 옮기며 진행 상황을 관리하는 보드예요."
      :steps="[
        '컬럼 아래 ‘+ 카드 추가’로 작업을 만들어요.',
        '카드를 끌어서 다른 컬럼에 놓으면 상태가 바뀌어요. (← → 버튼으로도 옮길 수 있어요)',
        '카드를 클릭하면 담당자·마감·우선순위·체크리스트를 편집할 수 있어요.',
        '‘컬럼 관리’에서 컬럼을 추가하거나 WIP 제한을 걸 수 있어요.',
      ]"
      :terms="[
        { term: 'WIP 제한', desc: '한 컬럼에 동시에 둘 수 있는 카드 수예요. 넘으면 컬럼 머리글이 경고로 바뀌어요.' },
        { term: '지연', desc: '마감일이 지났는데 완료 컬럼에 없는 카드예요.' },
        { term: '플래너 연동', desc: '카드에 시간을 적어두면 그날 플래너 타임블록과 연결해 볼 수 있어요.' },
      ]"
      :tips="['필터를 걸어도 카드 개수(컬럼 머리글)는 전체 기준으로 세요.', '보드 상태는 이 브라우저에 저장돼요.']"
    />
    <span></span>
    <button class="review" style="margin: 0" @click="showColumns = true">컬럼 관리</button>
    <button class="primary" @click="openAdd(board.columns[0].id)">+ 카드 추가</button>
  </div>

  <div class="metrics" style="grid-template-columns: repeat(4, 1fr); margin-bottom: 16px">
    <article><span>전체 카드</span><b class="figure">{{ progress.total }}<small>개</small></b></article>
    <article><span>완료</span><b class="figure">{{ progress.done }}<small>개</small></b><small>{{ progress.pct }}%</small></article>
    <article><span>지연</span><b class="figure">{{ overdueCount }}<small>개</small></b><small>마감 초과</small></article>
    <article><span>컬럼</span><b class="figure">{{ board.columns.length }}<small>개</small></b></article>
  </div>

  <ListFilterBar
    v-model:query="query"
    v-model:filters="filterModel"
    :groups="FILTER_GROUPS"
    placeholder="카드 제목·담당자·라벨 검색"
    :result-count="visibleTotal"
    :total-count="progress.total"
  >
    <template #actions>
      <button class="review" style="margin: 0" :class="{ 'chip-on': filters.overdue }" @click="toggleOverdue">
        지연만 보기{{ overdueCount ? ' (' + overdueCount + ')' : '' }}
      </button>
    </template>
  </ListFilterBar>

  <div class="kanban">
    <div
      class="kanban-col"
      v-for="col in board.columns"
      :key="col.id"
      :class="{ 'drag-over': dragOverColumn === col.id }"
      @dragover.prevent="dragOverColumn = col.id"
      @dragleave="dragOverColumn === col.id && (dragOverColumn = null)"
      @drop="onDropColumn(col.id)"
    >
      <div class="kanban-col-head" :class="{ 'wip-over': isWipExceeded(col) }">
        {{ col.title }}
        <span>{{ countOf(col.id) }}<template v-if="col.wip"> / {{ col.wip }}</template></span>
      </div>

      <article
        class="kanban-card"
        v-for="c in cardsOf(col.id)"
        :key="c.id"
        :class="{ dragging: dragCardId === c.id, overdue: isOverdue(c) }"
        draggable="true"
        @dragstart="onDragStart(c)"
        @dragend="onDragEnd"
        @drop.stop="onDropCard(c)"
        @click="openCard(c)"
      >
        <div class="kanban-card-top">
          <b>{{ c.title }}</b>
          <span class="prio" :class="c.priority">{{ priorityLabel(c.priority) }}</span>
        </div>
        <div class="kanban-card-labels">
          <span v-for="l in c.labels" :key="l" class="tag">{{ l }}</span>
          <span v-if="c.plannerBlock" class="tag">▦ {{ c.plannerBlock }}</span>
        </div>
        <div class="kanban-card-meta">
          <PersonTag v-if="c.assignee" :name="c.assignee" />
          <small v-else style="color: var(--color-muted)">담당자 미정</small>
          <small v-if="c.due" class="figure" :class="{ 'sla-over': isOverdue(c) }">{{ c.due.slice(5) }}</small>
          <small v-if="checklistOf(c).total" class="figure">☑ {{ checklistOf(c).done }}/{{ checklistOf(c).total }}</small>
        </div>
        <div class="kanban-card-move">
          <button class="person-info" title="왼쪽 컬럼으로" aria-label="왼쪽 컬럼으로" @click.stop="shift(c, -1)">←</button>
          <button class="person-info" title="오른쪽 컬럼으로" aria-label="오른쪽 컬럼으로" @click.stop="shift(c, 1)">→</button>
        </div>
      </article>

      <button class="kanban-add" @click="openAdd(col.id)">+ 카드 추가</button>
    </div>
  </div>

  <section class="card" style="margin-top: 16px; display: flex; align-items: center; gap: 14px">
    <span>▦</span>
    <p style="margin: 0; flex: 1">
      플래너 연동이 설정된 카드는 카드에 ▦ 시간이 표시돼요. 오늘 플래너에서 같은 시간대 블록과 함께 볼 수 있어요.
    </p>
    <button class="review" style="margin: 0" @click="router.push('/planner')">플래너에서 보기 →</button>
  </section>

  <!-- 카드 추가 · 상세 -->
  <Modal v-if="editing" :title="editing === 'new' ? '카드 추가' : '카드 상세'" wide @close="editing = null">
    <label>제목<input v-model="draft.title" placeholder="예: 릴리즈 노트 작성" autofocus /></label>
    <div class="form-row">
      <label style="flex: 1">담당자<input v-model="draft.assignee" placeholder="예: 지수" /></label>
      <label style="flex: 1">마감일<input type="date" v-model="draft.due" /></label>
      <label style="flex: 1">컬럼
        <select v-model="draft.columnId"><option v-for="c in board.columns" :key="c.id" :value="c.id">{{ c.title }}</option></select>
      </label>
    </div>

    <div class="section-label">우선순위</div>
    <div class="filter" style="width: fit-content; margin: 6px 0 12px">
      <button v-for="p in PRIORITIES" :key="p.id" type="button" :class="{ selected: draft.priority === p.id }" @click="draft.priority = p.id">{{ p.label }}</button>
    </div>

    <div class="section-label">라벨</div>
    <div class="filter" style="width: fit-content; margin: 6px 0 12px">
      <button v-for="l in LABELS" :key="l" type="button" :class="{ selected: draft.labels.includes(l) }" @click="toggleDraftLabel(l)">{{ l }}</button>
    </div>

    <label>플래너 타임블록<input v-model="draft.plannerBlock" placeholder="예: 09:00~11:00 (선택)" /></label>

    <div class="section-label">체크리스트</div>
    <label class="task" v-for="(item, i) in draft.checklist" :key="i" style="border-bottom: 1px solid var(--color-hairline)">
      <input type="checkbox" v-model="item.done" />
      <span style="flex: 1" :class="{ done: item.done }">{{ item.text }}</span>
      <button class="person-info" type="button" title="삭제" aria-label="삭제" @click.prevent="draft.checklist.splice(i, 1)">×</button>
    </label>
    <div class="form-row">
      <input v-model="checklistInput" placeholder="항목 추가 후 Enter" style="flex: 1" @keyup.enter="addChecklistItem" />
      <button class="review" style="margin: 0" @click="addChecklistItem">추가</button>
    </div>

    <p v-if="!canSave" class="form-note">제목을 입력하면 저장할 수 있어요.</p>
    <div class="form-row">
      <button class="primary" style="flex: 1" :disabled="!canSave" @click="save">{{ editing === 'new' ? '카드 추가하기' : '변경 저장' }}</button>
      <button v-if="editing !== 'new'" class="review" style="margin: 0" @click="onRemove">삭제</button>
    </div>
  </Modal>

  <!-- 컬럼 관리 -->
  <Modal v-if="showColumns" title="컬럼 관리" wide @close="showColumns = false">
    <p class="form-note" style="margin-top: 0">WIP 제한을 0으로 두면 제한 없이 쌓을 수 있어요.</p>
    <div class="column-row" v-for="col in board.columns" :key="col.id">
      <input :value="col.title" @change="renameColumn(col.id, $event.target.value)" />
      <label class="wip-field">WIP<input type="number" min="0" max="20" :value="col.wip" @change="setWip(col.id, $event.target.value)" /></label>
      <span class="badge" :class="isWipExceeded(col) ? 'danger' : ''">카드 {{ countOf(col.id) }}개</span>
      <button class="review" style="margin: 0" :disabled="board.columns.length <= 1" @click="onRemoveColumn(col)">삭제</button>
    </div>
    <div class="form-row" style="margin-top: 12px">
      <input v-model="newColumn" placeholder="새 컬럼 이름" style="flex: 1" @keyup.enter="createColumn" />
      <button class="review" style="margin: 0" @click="createColumn">컬럼 추가</button>
    </div>
    <div class="form-row">
      <button class="review" style="margin: 0" @click="onReset">보드 초기화</button>
      <button class="primary" style="flex: 1" @click="showColumns = false">완료</button>
    </div>
  </Modal>
</template>
