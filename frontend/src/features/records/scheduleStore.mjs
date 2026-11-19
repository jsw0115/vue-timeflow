// 일정 목록을 로그인 여부에 따라 서버(/api/schedules)·로컬로 나눠 저장하고, "이 회차부터" 분할의 두 요청을 한 동작처럼 다룬다(PR-07 4단계).
import { session } from '../auth/session.js'
import { apiRequest } from '../auth/apiRequest.js'
import { createRecordClient, errorKind } from './recordClient.mjs'
import { createSyncedCollection } from './syncedCollection.mjs'

/** 서버가 받는 일정 필드(FeatureType.SCHEDULE). 화면의 time·date·tag·state는 여기서 다시 만든다. */
const FIELDS = ['title', 'body', 'category', 'startDate', 'endDate', 'startTime', 'endTime', 'color', 'attendeeIds', 'recurrence']

export function scheduleFromServer(row) {
  const values = Object.fromEntries(FIELDS.filter((key) => row[key] !== undefined).map((key) => [key, row[key]]))
  return {
    ...values, id: row.id, version: row.version,
    title: row.title ?? '', body: row.body ?? '', category: row.category ?? '', color: row.color ?? '', attendeeIds: row.attendeeIds ?? [],
    time: row.startTime, date: `${row.startDate} ${row.startTime}`, tag: row.category ?? '', state: '예정',
  }
}

/** 서버 허용 필드만 보낸다. 참석자는 계정 ID(문자열)만 받으므로 이 브라우저 주소록의 연락처(숫자 ID)는 뺀다(Q-21과 같은 이유). */
export function scheduleBody(fields) {
  const body = Object.fromEntries(FIELDS.filter((key) => fields[key] !== undefined).map((key) => [key, fields[key]]))
  body.title = (fields.title ?? '').trim()
  body.attendeeIds = (fields.attendeeIds ?? []).filter((id) => typeof id === 'string')
  return body
}
const localAttendees = (event) => (event.attendeeIds ?? []).filter((id) => typeof id !== 'string').length

export function createScheduleStore({ local, request = apiRequest, owner = () => session.userId }) {
  const synced = createSyncedCollection({ local, client: createRecordClient({ request, path: '/api/schedules', paged: true }), owner, toLocal: scheduleFromServer, toBody: scheduleBody })

  /**
   * "이 회차부터" 분할. 새 일정을 먼저 만들고 원래 일정의 반복을 그 전날에서 끝낸다(IM-14 위험 표).
   * 원래 일정 수정이 실패하면 만든 일정을 지워 회차가 겹치지 않게 하고, 지우지도 못하면 error.orphan으로 알린다.
   */
  async function split(record, head, tailFields) {
    const { id, version, ...tail } = tailFields
    if (!synced.onServer()) {
      await synced.update(record, { recurrence: head })
      return synced.create(tail)
    }
    const created = await synced.create(tail)
    try {
      await synced.update(record, { recurrence: head })
    } catch (error) {
      error.kind ??= errorKind(error)
      try { await synced.remove(created) } catch { error.orphan = created }
      throw error
    }
    return created
  }

  /** 로컬 자료 이전 항목. 시연 일정은 날짜가 앱을 연 날로 정해져 제목·시각으로 구분한다(Q-11). */
  function migrationEntry({ label, seeds }) {
    return {
      kind: 'event', label, local: synced.local, seeds, fields: ['title', 'startTime', 'endTime'],
      async adopt(item) {
        await synced.create(item, { idempotencyKey: `local:event:${item.id}` })
        synced.forgetLocal(item)
      },
      notes: (items) => ({ droppedAttendees: items.reduce((sum, event) => sum + localAttendees(event), 0) }),
    }
  }

  return { ...synced, split, migrationEntry }
}
