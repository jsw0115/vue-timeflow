// 할 일의 화면 값과 서버 값(/api/tasks, 체크리스트)을 서로 바꾸고, 체크리스트 변경을 서버 요청으로 나눠 보낸다(PR-07 2단계).
import { errorKind } from './recordClient.mjs'

const PRIORITY = { 높음: 'HIGH', 보통: 'MEDIUM', 낮음: 'LOW' }
const PRIORITY_LABEL = Object.fromEntries(Object.entries(PRIORITY).map(([label, code]) => [code, label]))
// 화면에서 다루지 않는 서버 필드는 수정할 때 그대로 돌려보내 지워지지 않게 한다(PUT은 필드를 통째로 바꾼다)
const KEPT = ['energyLevel', 'durationMin', 'categoryId', 'categoryColor', 'categoryIcon']

export function taskFromServer(row) {
  return {
    id: row.id, version: row.version, title: row.title, body: row.note ?? '', date: row.due ?? '',
    category: row.categoryName ?? '', priority: PRIORITY_LABEL[row.priority] ?? '보통',
    status: row.status, done: row.status === 'DONE',
    server: Object.fromEntries(KEPT.map((key) => [key, row[key] ?? null])),
  }
}

export function taskBody(fields) {
  return {
    ...(fields.server ?? {}),
    title: (fields.title ?? '').trim(), note: fields.body ?? '', due: fields.date || null,
    priority: PRIORITY[fields.priority] ?? 'MEDIUM', categoryName: fields.category || null,
  }
}

/** 화면이 고치는 할 일 필드. 이 값이 그대로면 할 일 본문 요청을 보내지 않는다. */
export const TASK_FIELDS = ['title', 'body', 'date', 'category', 'priority']
export const taskFieldsChanged = (task, draft) => TASK_FIELDS.some((key) => (task[key] ?? '') !== (key === 'title' ? draft.title.trim() : draft[key] ?? ''))

/** 서버 담당자는 계정 ID다. 화면의 "나"(self)는 로그인 계정 ID와 같다(Q-21). */
export function checklistItemFromServer(row, me) {
  return { id: row.id, version: row.version, title: row.title, done: row.completed, assigneeId: row.assigneeId && row.assigneeId === me ? 'self' : row.assigneeId ?? null }
}
const assigneeBody = (assigneeId, me) => (assigneeId === 'self' ? me : assigneeId || null)
const checklistPath = (taskId) => `/api/tasks/${encodeURIComponent(taskId)}/checklist-items`

export async function loadChecklist({ request, taskId, me }) {
  return ((await request(checklistPath(taskId))) ?? []).map((row) => checklistItemFromServer(row, me))
}

/**
 * baseline(서버에 있는 항목)과 draft(화면 항목)를 비교해 바뀐 항목만 차례로 보낸다. 추가·이름과 담당자·완료·삭제 순서다.
 * 중간에 실패해도 던지지 않고, 그때까지 성공한 결과를 담은 baseline·draft와 error를 돌려준다. 같은 값으로 다시 부르면 남은 항목만 보낸다.
 */
export async function syncChecklist({ request, taskId, baseline, draft, me }) {
  const path = checklistPath(taskId), at = (id) => `${path}/${encodeURIComponent(id)}`
  const saved = new Map(baseline.map((item) => [item.id, item]))
  let items = draft.map((item) => ({ ...item, title: item.title.trim() }))
  const send = async (url, method, body) => checklistItemFromServer(await request(url, { method, body: JSON.stringify(body) }), me)
  const result = (error) => {
    const order = items.map((item) => item.id)
    return { baseline: [...saved.values()].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id)), draft: items, error }
  }
  // 다른 계정을 항목 담당자로 정하려면 그 계정이 먼저 할 일 담당자 후보여야 한다(서버 TaskChecklistService). 한 번만 등록한다(Q-21)
  const ensured = new Set()
  const ensure = async (assigneeId) => {
    const id = assigneeBody(assigneeId, me)
    if (!id || id === me || ensured.has(id)) return
    await request(`/api/tasks/${encodeURIComponent(taskId)}/assignees/${encodeURIComponent(id)}`, { method: 'PUT' })
    ensured.add(id)
  }
  try {
    for (const item of [...items]) {
      let current = saved.get(item.id)
      if (!current || (current.assigneeId ?? null) !== (item.assigneeId ?? null)) await ensure(item.assigneeId)
      if (!current) {
        current = await send(path, 'POST', { title: item.title, assigneeId: assigneeBody(item.assigneeId, me) })
        saved.set(current.id, current)
        // 다시 시도할 때 같은 항목을 또 만들지 않도록 화면 항목을 서버 ID로 바꾼다
        items = items.map((entry) => (entry.id === item.id ? { ...entry, id: current.id, version: current.version } : entry))
      } else if (current.title !== item.title || (current.assigneeId ?? null) !== (item.assigneeId ?? null)) {
        current = await send(at(current.id), 'PUT', { title: item.title, assigneeId: assigneeBody(item.assigneeId, me), version: current.version })
        saved.set(current.id, current)
      }
      if (current.done !== Boolean(item.done)) {
        current = await send(`${at(current.id)}/completion`, 'PUT', { completed: Boolean(item.done), version: current.version })
        saved.set(current.id, current)
      }
    }
    const kept = new Set(items.map((item) => item.id))
    for (const current of [...saved.values()]) {
      if (kept.has(current.id)) continue
      await request(`${at(current.id)}?version=${encodeURIComponent(current.version)}`, { method: 'DELETE' })
      saved.delete(current.id)
    }
  } catch (error) {
    error.kind ??= errorKind(error)
    return result(error)
  }
  return result(null)
}

/** 체크리스트 항목 하나의 완료만 바꾼다(목록 미리보기). */
export async function setChecklistDone({ request, taskId, item, done, me }) {
  const body = JSON.stringify({ completed: done, version: item.version })
  return checklistItemFromServer(await request(`${checklistPath(taskId)}/${encodeURIComponent(item.id)}/completion`, { method: 'PUT', body }), me)
}
