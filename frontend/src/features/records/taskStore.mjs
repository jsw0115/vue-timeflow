// 할 일 목록을 로그인 여부에 따라 서버·로컬로 나눠 저장하고, 체크리스트를 할 일별로 불러와 저장한다(PR-07 2단계).
import { effectScope, reactive, watch } from 'vue'
import { session } from '../auth/session.js'
import { apiRequest } from '../auth/apiRequest.js'
import { createRecordClient, errorKind } from './recordClient.mjs'
import { createSyncedCollection, offlineOnlyError } from './syncedCollection.mjs'
import { isOfflineId } from '../offline/outbox.mjs'
import { taskFromServer, taskBody, taskFieldsChanged, loadChecklist as fetchChecklist, syncChecklist, setChecklistDone } from './taskRecords.mjs'

/** 체크리스트 항목의 이름·완료·담당자가 서버에서 불러온 것과 같은가. */
const sameChecklist = (baseline, draft) => baseline.length === draft.length && draft.every((item, index) => {
  const base = baseline[index]
  return base && base.id === item.id && base.title === item.title.trim() && Boolean(base.done) === Boolean(item.done) && (base.assigneeId ?? null) === (item.assigneeId ?? null)
})
const PARTIAL = '할 일은 저장했지만 체크리스트 일부를 저장하지 못했어요.'
const staleError = () => Object.assign(new Error('계정이 바뀌어 이전 요청의 결과를 반영하지 않았어요.'), { kind: 'stale' })
const TOGGLE_FAILURE = {
  conflict: '다른 곳에서 먼저 바뀌어 최신 상태로 바꿨어요. 확인한 뒤 다시 눌러 주세요.',
  notFound: '다른 곳에서 삭제된 할 일이에요.',
  network: '완료 표시를 저장하지 못했어요. 연결을 확인하고 다시 눌러 주세요.',
  offline: '아직 보내지 않은 변경이 있어 연결된 뒤에 완료 표시를 바꿀 수 있어요.',
}

export function createTaskStore({ local, request = apiRequest, owner = () => session.userId, offline = null }) {
  const synced = createSyncedCollection({ local, client: createRecordClient({ request, path: '/api/tasks' }), owner, toLocal: taskFromServer, toBody: taskBody, offline: offline && { kind: 'task', queue: offline } })
  // 서버 체크리스트는 할 일 목록 응답에 없어서 할 일별로 따로 불러 둔다. 키는 할 일 ID다
  const checklists = reactive(new Map())
  const busyItems = reactive(new Set())
  const notice = reactive({ message: '' })
  const scope = effectScope(true)
  let generation = 0
  scope.run(() => watch(owner, () => { generation++; checklists.clear(); notice.message = '' }, { flush: 'sync' }))

  const fields = (draft) => ({ title: draft.title.trim(), body: draft.body ?? '', date: draft.date ?? '', category: draft.category ?? '', priority: draft.priority ?? '보통' })
  const trimmed = (items) => (items ?? []).map((item) => ({ ...item, title: item.title.trim() }))
  // 요청 사이에 계정이 바뀌면 남은 요청을 보내지 않는다(새 계정의 토큰으로 이전 계정 기록을 고치지 않게)
  const scoped = (expected) => (url, options) => {
    if (expected !== generation) throw staleError()
    return request(url, options)
  }
  const setItems = (taskId, items) => {
    checklists.set(taskId, { status: 'ready', items, error: null })
    return checklists.get(taskId)
  }

  /** 할 일의 체크리스트. 로그아웃 상태는 할 일 안의 subtasks, 로그인 상태는 불러 둔 서버 항목이다. */
  function checklist(task) {
    if (!task) return { status: 'ready', items: [], error: null }
    if (!synced.onServer()) return { status: 'ready', items: task.subtasks ?? [], error: null }
    return checklists.get(task.id) ?? { status: 'idle', items: [], error: null }
  }
  async function loadChecklist(task) {
    if (!synced.onServer()) return checklist(task)
    // 대기열에서 만든 할 일은 아직 서버에 없어 체크리스트가 비어 있다(PR-12)
    if (isOfflineId(task.id)) return setItems(task.id, [])
    const expected = generation, previous = checklists.get(task.id)
    checklists.set(task.id, { status: 'loading', items: previous?.items ?? [], error: null })
    try {
      const items = await fetchChecklist({ request: scoped(expected), taskId: task.id, me: owner() })
      if (expected !== generation) return checklist(task)
      return setItems(task.id, items)
    } catch (error) {
      error.kind ??= errorKind(error)
      if (expected === generation) checklists.set(task.id, { status: 'error', items: previous?.items ?? [], error })
      return checklist(task)
    }
  }

  /** 체크리스트 결과를 반영하고, 실패면 이어서 저장할 수 있는 진행 상태를 오류에 붙여 던진다. */
  async function finishChecklist(task, expected, result, partialMessage) {
    if (expected !== generation) throw staleError()
    setItems(task.id, result.baseline)
    if (!result.error) return
    Object.assign(result.error, { partialMessage, progress: { task, baseline: result.baseline, subtasks: result.draft } })
    if (result.error.kind === 'conflict') result.error.latestChecklist = (await loadChecklist(task)).items
    throw result.error
  }

  /** 상세 저장. 할 일 필드가 바뀌었을 때만 본문을 보내고, 체크리스트는 바뀐 항목만 보낸다. */
  async function saveDetail(task, draft, baseline) {
    if (!synced.onServer()) {
      const saved = await synced.update(task, { ...fields(draft), subtasks: trimmed(draft.subtasks) })
      return { task: saved, baseline: saved.subtasks, subtasks: saved.subtasks }
    }
    const expected = generation
    // 체크리스트가 그대로일 때만 연결 실패를 대기열에 넣는다. 체크리스트는 대기열 범위 밖이다(PR-12)
    const checklistChanged = !sameChecklist(baseline, draft.subtasks ?? [])
    const current = taskFieldsChanged(task, draft) ? await synced.update(task, fields(draft), { offline: !checklistChanged }) : task
    if (current.offline) return { task: current, baseline, subtasks: draft.subtasks ?? [] }
    if (isOfflineId(current.id)) throw offlineOnlyError()
    const result = await syncChecklist({ request: scoped(expected), taskId: current.id, baseline, draft: draft.subtasks ?? [], me: owner() })
    await finishChecklist(current, expected, result, current !== task ? '할 일 내용은 저장했지만 체크리스트 일부를 저장하지 못했어요.' : '')
    return { task: current, baseline: result.baseline, subtasks: result.draft }
  }

  /** 새 할 일. previous는 할 일을 만든 뒤 체크리스트가 실패했을 때의 진행 상태이며, 이때는 할 일을 다시 만들지 않는다. */
  async function createWithChecklist(values, subtasks, previous = null) {
    if (!synced.onServer()) return { task: await synced.create({ ...fields(values), done: false, subtasks: trimmed(subtasks) }) }
    const expected = generation
    // 체크리스트가 없을 때만 연결 실패를 대기열에 넣는다(PR-12)
    const task = previous?.task ?? await synced.create(fields(values), { offline: !(subtasks ?? []).length })
    if (task.offline) return { task }
    const result = await syncChecklist({ request: scoped(expected), taskId: task.id, baseline: previous?.baseline ?? [], draft: subtasks ?? [], me: owner() })
    await finishChecklist(task, expected, result, PARTIAL)
    return { task }
  }

  /** 완료 토글. 서버 성공 응답 뒤에만 완료로 바뀐다. 실패는 notice로 알리고 던지지 않는다. */
  async function toggle(task) {
    notice.message = ''
    try {
      return await synced.command(task, 'status', (row) => ({ done: !row.done }))
    } catch (error) {
      error.kind ??= errorKind(error)
      if (error.kind !== 'stale') notice.message = TOGGLE_FAILURE[error.kind] ?? '완료 표시를 저장하지 못했어요. 잠시 뒤 다시 눌러 주세요.'
      return null
    }
  }

  /** 목록 미리보기에서 체크리스트 항목 하나의 완료를 바꾼다. */
  async function setItemDone(task, item, done) {
    if (!synced.onServer()) { item.done = done; return item }
    if (busyItems.has(item.id)) return item
    const expected = generation
    busyItems.add(item.id)
    notice.message = ''
    try {
      const saved = await setChecklistDone({ request: scoped(expected), taskId: task.id, item, done, me: owner() })
      if (expected === generation) setItems(task.id, checklist(task).items.map((entry) => (entry.id === saved.id ? saved : entry)))
      return saved
    } catch (error) {
      error.kind ??= errorKind(error)
      if (error.kind === 'stale') return null
      notice.message = error.kind === 'conflict' ? '체크리스트가 다른 곳에서 바뀌어 최신 내용을 불러왔어요.' : '체크리스트 완료 표시를 저장하지 못했어요. 다시 눌러 주세요.'
      if (error.kind === 'conflict') await loadChecklist(task)
      return null
    } finally {
      busyItems.delete(item.id)
    }
  }

  /**
   * 로그인 전에 만든 로컬 할 일 하나를 계정으로 옮긴다(UF-86). 멱등 키 local:task:{id}로 보내 다시 시도해도 하나만 생긴다.
   * 체크리스트는 이미 서버에 같은 제목이 있으면 옮긴 것으로 본다(앞선 시도가 체크리스트 중간에 끊긴 경우).
   * 주소록 연락처 담당자는 계정이 아니라 담당자 없이 옮긴다(Q-21). 모두 성공해야 로컬 목록에서 뺀다.
   */
  async function adoptLocal(item) {
    const expected = generation
    let task = await synced.create(fields({ ...item, title: item.title ?? '' }), { idempotencyKey: `local:task:${item.id}` })
    const subtasks = item.subtasks ?? []
    if (subtasks.length) {
      const existing = await fetchChecklist({ request: scoped(expected), taskId: task.id, me: owner() })
      const unmatched = [...existing]
      const draft = subtasks.map((entry) => {
        const at = unmatched.findIndex((row) => row.title === entry.title.trim())
        const match = at >= 0 ? unmatched.splice(at, 1)[0] : null
        return { id: match?.id ?? `local-${entry.id}`, title: entry.title, done: Boolean(entry.done), assigneeId: entry.assigneeId === 'self' ? 'self' : null }
      })
      const result = await syncChecklist({ request: scoped(expected), taskId: task.id, baseline: existing, draft: [...draft, ...unmatched], me: owner() })
      if (expected !== generation) throw staleError()
      setItems(task.id, result.baseline)
      if (result.error) throw result.error
    }
    if (item.done && task.status !== 'DONE') task = await synced.command(task, 'status')
    if (expected !== generation) throw staleError()
    synced.forgetLocal(item)
    return task
  }
  /** 로컬 자료 이전 목록에 넣을 할 일 항목. seeds는 시연 기본 할 일이다(Q-11: ID와 제목·마감일이 같으면 시연). */
  function migrationEntry({ label, seeds }) {
    return {
      kind: 'task', label, local: synced.local, seeds, fields: ['title', 'date'], adopt: adoptLocal,
      notes: (items) => ({ droppedAssignees: items.flatMap((task) => task.subtasks ?? []).filter((entry) => entry.assigneeId && entry.assigneeId !== 'self').length }),
    }
  }

  return {
    ...synced,
    notice,
    migrationEntry,
    checklist,
    loadChecklist,
    saveDetail,
    createWithChecklist,
    toggle,
    setItemDone,
    isItemBusy: (item) => busyItems.has(item?.id),
    stop() { synced.stop(); scope.stop() },
  }
}
