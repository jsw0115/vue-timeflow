import { computed, reactive, ref } from 'vue'

/**
 * 프로젝트 캔버스 보드 — 컬럼(상태) × 카드(작업).
 * 카드는 담당자·마감·우선순위·라벨·체크리스트·플래너 연동을 갖고,
 * 컬럼은 WIP 제한을 둘 수 있다.
 */
const STORAGE_KEY = 'timeflow.canvas.v1'

export const PRIORITIES = [
  { id: 'high', label: '높음', rank: 3 },
  { id: 'normal', label: '보통', rank: 2 },
  { id: 'low', label: '낮음', rank: 1 },
]
export const LABELS = ['기획', '디자인', '개발', 'QA', '문서']

function seed() {
  return {
    columns: [
      { id: 'todo', title: '할 일', wip: 0 },
      { id: 'doing', title: '진행중', wip: 3 },
      { id: 'review', title: '검토', wip: 2 },
      { id: 'done', title: '완료', wip: 0 },
    ],
    cards: [
      { id: 1, columnId: 'todo', title: '화면 목록서 정리', assignee: '김지수', due: '2026-09-10', priority: 'normal', labels: ['기획'], checklist: [{ text: '도메인별 분류', done: true }, { text: '누락 화면 확인', done: false }], plannerBlock: '', order: 1 },
      { id: 2, columnId: 'todo', title: '아이콘 세트 조사', assignee: '이서연', due: '', priority: 'low', labels: ['디자인'], checklist: [], plannerBlock: '', order: 2 },
      { id: 3, columnId: 'todo', title: '경쟁 앱 벤치마크', assignee: '박민준', due: '2026-09-08', priority: 'normal', labels: ['기획'], checklist: [], plannerBlock: '', order: 3 },
      { id: 4, columnId: 'doing', title: '디자인 시스템 정의', assignee: '김지수', due: '2026-09-06', priority: 'high', labels: ['디자인'], checklist: [{ text: '토큰 정의', done: true }, { text: '컴포넌트 상태', done: true }, { text: '문서화', done: false }], plannerBlock: '09:00~11:00', order: 1 },
      { id: 5, columnId: 'doing', title: '타임바 컴포넌트 구현', assignee: '박민준', due: '2026-08-28', priority: 'high', labels: ['개발'], checklist: [], plannerBlock: '', order: 2 },
      { id: 6, columnId: 'review', title: '홈 대시보드 QA', assignee: '최지우', due: '2026-09-12', priority: 'normal', labels: ['QA'], checklist: [], plannerBlock: '', order: 1 },
      { id: 7, columnId: 'done', title: '라우팅 셋업', assignee: '박민준', due: '2026-08-10', priority: 'normal', labels: ['개발'], checklist: [], plannerBlock: '', order: 1 },
      { id: 8, columnId: 'done', title: 'API 명세 초안', assignee: '김지수', due: '2026-08-14', priority: 'normal', labels: ['문서'], checklist: [], plannerBlock: '', order: 2 },
    ],
  }
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    if (!parsed?.columns?.length || !Array.isArray(parsed.cards)) return null
    return parsed
  } catch {
    return null
  }
}

export const board = reactive(load() ?? seed())

export function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ columns: board.columns, cards: board.cards }))
  } catch {
    // 저장할 수 없는 환경 — 세션 내 상태만 유지
  }
}

/* ---------------- 조회 ---------------- */
export const filters = ref({ query: '', assignee: '전체', label: '전체', priority: '전체', overdue: false })
const TODAY = '2026-09-06'

export function isOverdue(card) {
  return Boolean(card.due) && card.due < TODAY && card.columnId !== 'done'
}
export function matchesFilter(card) {
  const f = filters.value
  const k = f.query.trim()
  if (k && !card.title.includes(k) && !(card.assignee ?? '').includes(k) && !card.labels.some((l) => l.includes(k))) return false
  if (f.assignee !== '전체' && card.assignee !== f.assignee) return false
  if (f.label !== '전체' && !card.labels.includes(f.label)) return false
  if (f.priority !== '전체' && card.priority !== f.priority) return false
  if (f.overdue && !isOverdue(card)) return false
  return true
}
export function cardsOf(columnId) {
  return board.cards
    .filter((c) => c.columnId === columnId && matchesFilter(c))
    .sort((a, b) => a.order - b.order)
}
export function countOf(columnId) {
  return board.cards.filter((c) => c.columnId === columnId).length
}
export function isWipExceeded(column) {
  return column.wip > 0 && countOf(column.id) > column.wip
}
export const assignees = computed(() => [...new Set(board.cards.map((c) => c.assignee).filter(Boolean))])

export const progress = computed(() => {
  const total = board.cards.length
  const done = board.cards.filter((c) => c.columnId === 'done').length
  return { total, done, pct: total ? Math.round((done / total) * 100) : 0 }
})
export const overdueCount = computed(() => board.cards.filter(isOverdue).length)

export function checklistOf(card) {
  const list = card.checklist ?? []
  return { done: list.filter((i) => i.done).length, total: list.length }
}

/* ---------------- 변경 ---------------- */
function nextOrder(columnId) {
  const list = board.cards.filter((c) => c.columnId === columnId)
  return list.length ? Math.max(...list.map((c) => c.order)) + 1 : 1
}

export function addCard(data) {
  const card = {
    id: Math.max(0, ...board.cards.map((c) => c.id)) + 1,
    columnId: data.columnId,
    title: data.title.trim(),
    assignee: (data.assignee ?? '').trim(),
    due: data.due ?? '',
    priority: data.priority ?? 'normal',
    labels: data.labels ?? [],
    checklist: data.checklist ?? [],
    plannerBlock: data.plannerBlock ?? '',
    order: nextOrder(data.columnId),
  }
  board.cards.push(card)
  persist()
  return card
}
export function updateCard(id, patch) {
  const card = board.cards.find((c) => c.id === id)
  if (!card) return null
  Object.assign(card, patch)
  persist()
  return card
}
export function removeCard(id) {
  board.cards = board.cards.filter((c) => c.id !== id)
  persist()
}
/** 카드를 다른 컬럼(또는 같은 컬럼 내 다른 위치)으로 옮긴다 */
export function moveCard(cardId, toColumnId, beforeCardId = null) {
  const card = board.cards.find((c) => c.id === cardId)
  if (!card) return false
  card.columnId = toColumnId
  const siblings = board.cards
    .filter((c) => c.columnId === toColumnId && c.id !== cardId)
    .sort((a, b) => a.order - b.order)
  const index = beforeCardId ? siblings.findIndex((c) => c.id === beforeCardId) : siblings.length
  const at = index < 0 ? siblings.length : index
  siblings.splice(at, 0, card)
  siblings.forEach((c, i) => (c.order = i + 1))
  persist()
  return true
}
export function addColumn(title) {
  const name = title.trim()
  if (!name) return null
  const id = 'col' + Date.now()
  board.columns.push({ id, title: name, wip: 0 })
  persist()
  return id
}
export function renameColumn(columnId, title) {
  const col = board.columns.find((c) => c.id === columnId)
  if (!col || !title.trim()) return
  col.title = title.trim()
  persist()
}
export function setWip(columnId, wip) {
  const col = board.columns.find((c) => c.id === columnId)
  if (!col) return
  col.wip = Math.max(0, Number(wip) || 0)
  persist()
}
/** 컬럼을 지우면 그 안의 카드도 함께 사라진다 */
export function removeColumn(columnId) {
  board.columns = board.columns.filter((c) => c.id !== columnId)
  board.cards = board.cards.filter((c) => c.columnId !== columnId)
  persist()
}
export function toggleChecklistItem(card, index) {
  const item = card.checklist?.[index]
  if (!item) return
  item.done = !item.done
  persist()
}
export function resetBoard() {
  const fresh = seed()
  board.columns = fresh.columns
  board.cards = fresh.cards
  persist()
}
