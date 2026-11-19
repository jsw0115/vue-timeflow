// 루틴 목록을 로그인 여부에 따라 서버(/api/routine-records)·로컬로 나눠 저장하고, 이력으로 오늘 완료·연속 기록·최근 4주 달성률을 채운다(PR-07 5단계, Q-05, IM-14 3단계).
import { effectScope, nextTick, reactive, watch } from 'vue'
import { session } from '../auth/session.js'
import { apiRequest } from '../auth/apiRequest.js'
import { createRecordClient, errorKind } from './recordClient.mjs'
import { createSyncedCollection } from './syncedCollection.mjs'
import { localDate } from '../../utils/postValidation.mjs'

/** 서버가 받는 루틴 필드(FeatureType.ROUTINE_RECORD). 완료·연속·이력은 서버 이력에서 계산한 값이라 보내지 않는다. */
const FIELDS = ['title', 'body', 'category', 'startDate', 'time', 'duration', 'days', 'goal', 'notify', 'reminderMinutes', 'paused', 'recurrence']
const DAY = 86400000
const shift = (date, days) => new Date(Date.parse(date + 'T12:00:00Z') + days * DAY).toISOString().slice(0, 10)
const weekday = (date) => new Date(date + 'T12:00:00Z').getUTCDay()
const EMPTY = { done: false, todayVersion: 0, streak: 0, best: 0, history: [0, 0, 0, 0, 0, 0, 0], rate4w: 0, historyLoaded: false }

export function routineBody(fields) {
  const body = Object.fromEntries(FIELDS.filter((key) => fields[key] !== undefined).map((key) => [key, fields[key]]))
  body.title = (fields.title ?? '').trim()
  return body
}

/**
 * 서버 이력(/history)에서 화면 값을 만든다. 첫 수치는 최근 4주(오늘 포함 28일) 달성률이다(Q-05).
 * 분모는 완료와 놓친 날뿐이다. 쉬는 날(skipped)과 오늘·미래의 미완료(pending)는 빼고, 연속·최고 기록은 서버 계산을 쓴다.
 * history는 최근 7일의 완료를 요일 자리(일=0)에 놓은 표시용 값이다.
 */
export function routineDerived(history, today) {
  const items = history?.items ?? []
  const recent = items.filter((item) => item.date >= shift(today, -27) && item.date <= today)
  const done = recent.filter((item) => item.status === 'done').length
  const missed = recent.filter((item) => item.status === 'missed').length
  const week = [0, 0, 0, 0, 0, 0, 0]
  for (const item of items) if (item.date >= shift(today, -6) && item.date <= today && item.status === 'done') week[weekday(item.date)] = 1
  const todayItem = items.find((item) => item.date === today)
  return {
    done: Boolean(todayItem?.completed), todayVersion: todayItem?.version ?? 0,
    streak: history?.streak ?? 0, best: history?.best ?? 0, history: week,
    rate4w: done + missed ? Math.round((100 * done) / (done + missed)) : 0, historyLoaded: true,
  }
}

const TOGGLE_FAILURE = {
  conflict: '다른 곳에서 먼저 바뀌어 최신 상태로 바꿨어요. 확인한 뒤 다시 눌러 주세요.',
  notFound: '다른 곳에서 삭제된 루틴이에요.',
  network: '오늘 완료를 저장하지 못했어요. 연결을 확인하고 다시 눌러 주세요.',
}

export function createRoutineStore({ local, request = apiRequest, owner = () => session.userId, today = () => localDate() }) {
  // 이력에서 만든 값은 루틴 정의 응답에 없어 따로 두고, 수정으로 항목이 바뀌어도 이어 붙인다
  const derived = new Map()
  const toLocal = (row) => ({ ...Object.fromEntries(FIELDS.filter((key) => row[key] !== undefined).map((key) => [key, row[key]])), id: row.id, version: row.version, ...(derived.get(row.id) ?? EMPTY) })
  const synced = createSyncedCollection({ local, client: createRecordClient({ request, path: '/api/routine-records', paged: true }), owner, toLocal, toBody: routineBody })
  const notice = reactive({ message: '' })
  const busy = reactive(new Set())
  const scope = effectScope(true)
  let generation = 0, settling = Promise.resolve()

  async function loadHistory(routine) {
    const expected = generation, day = today()
    try {
      const history = await request(`/api/routine-records/${encodeURIComponent(routine.id)}/history?from=${shift(day, -364)}&to=${day}`)
      if (expected !== generation) return
      const values = routineDerived(history, day)
      derived.set(routine.id, values)
      const row = synced.state.items.find((item) => item.id === routine.id)
      if (row) Object.assign(row, values)
    } catch {
      // 이력을 불러오지 못하면 historyLoaded가 false로 남아 화면이 수치를 비워 둔다
    }
  }
  scope.run(() => {
    watch(owner, () => { generation++; derived.clear(); notice.message = '' }, { flush: 'sync' })
    // 목록을 불러왔거나 루틴이 늘면 이력이 없는 루틴만 불러온다
    watch(() => (synced.state.loaded ? synced.state.items.map((item) => item.id).join(',') : null), (ids) => {
      if (ids === null) return
      settling = Promise.all(synced.state.items.filter((item) => !item.historyLoaded).map(loadHistory))
    })
  })

  function toggleLocal(routine) {
    const row = local.value.find((item) => item.id === routine.id) ?? routine
    row.done = !row.done
    if (row.done) {
      row.streak = (row.streak ?? 0) + 1
      row.best = Math.max(row.best ?? 0, row.streak)
    } else {
      row.streak = Math.max(0, (row.streak ?? 0) - 1)
    }
    return row
  }

  /** 오늘 완료 토글. 서버 성공 응답 뒤에만 바뀌고, 취소할 때는 이력의 수행 기록 version을 보낸다. 실패는 notice로 알린다. */
  async function toggleToday(routine) {
    if (!synced.onServer()) return toggleLocal(routine)
    if (busy.has(routine.id)) return routine
    const expected = generation, day = today()
    busy.add(routine.id)
    notice.message = ''
    const body = { completed: !routine.done, ...(routine.todayVersion ? { version: routine.todayVersion } : {}) }
    try {
      await request(`/api/routine-records/${encodeURIComponent(routine.id)}/history/${day}`, { method: 'PUT', body: JSON.stringify(body) })
      if (expected === generation) await loadHistory(routine)
    } catch (error) {
      error.kind ??= errorKind(error)
      if (expected !== generation) return routine
      notice.message = error.kind === 'invalid' ? error.message : TOGGLE_FAILURE[error.kind] ?? '오늘 완료를 저장하지 못했어요. 잠시 뒤 다시 눌러 주세요.'
      if (error.kind === 'conflict') await loadHistory(routine)
    } finally {
      busy.delete(routine.id)
    }
    return synced.state.items.find((item) => item.id === routine.id) ?? routine
  }

  /** 중지·쉬는 날·반복 변경은 이력 계산을 바꾸므로 저장 뒤 그 루틴의 이력을 다시 불러온다. */
  async function update(record, fields) {
    const saved = await synced.update(record, fields)
    if (synced.onServer() && saved) await loadHistory(saved)
    return synced.onServer() ? synced.state.items.find((item) => item.id === record.id) ?? saved : saved
  }

  /** 로컬 자료 이전 항목. 시연 루틴은 제목·시각으로 구분한다(Q-11). 오늘 완료했으면 오늘 수행 기록도 옮긴다. */
  function migrationEntry({ label, seeds }) {
    return {
      kind: 'routine', label, local: synced.local, seeds, fields: ['title', 'time'],
      async adopt(item) {
        const created = await synced.create({ ...item, startDate: item.startDate ?? today(), duration: item.duration ?? 30 }, { idempotencyKey: `local:routine:${item.id}` })
        if (item.done) {
          try {
            await request(`/api/routine-records/${encodeURIComponent(created.id)}/history/${today()}`, { method: 'PUT', body: JSON.stringify({ completed: true }) })
          } catch (error) {
            // 오늘이 회차가 아니거나 쉬는 날이면(400) 완료 기록만 옮기지 않는다
            if ((error.kind ?? errorKind(error)) !== 'invalid') throw error
          }
        }
        synced.forgetLocal(item)
      },
    }
  }

  return {
    ...synced,
    notice,
    update,
    toggleToday,
    loadHistory,
    isBusy: (routine) => busy.has(routine?.id),
    migrationEntry,
    /** 목록과 이력을 다 불러올 때까지 기다린다(테스트용). */
    async whenSettled() {
      for (let i = 0; i < 100 && owner() && !synced.state.loaded; i++) await new Promise((resolve) => setTimeout(resolve, 2))
      await nextTick()
      await settling
    },
    stop() { synced.stop(); scope.stop() },
  }
}
