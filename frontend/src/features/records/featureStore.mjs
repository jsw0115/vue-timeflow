// 다이어리·메모·D-Day·머니로그처럼 feature_record API를 쓰는 기록을 로그인 여부에 따라 서버·로컬로 나눠 저장한다(PR-07 6단계).
import { session } from '../auth/session.js'
import { apiRequest } from '../auth/apiRequest.js'
import { localDate } from '../../utils/postValidation.mjs'
import { createRecordClient } from './recordClient.mjs'
import { createSyncedCollection } from './syncedCollection.mjs'

/**
 * fields는 서버가 받는 필드(FeatureType), demoFields는 시연 기록을 가릴 때 비교할 필드(Q-11)다.
 * toLocal(row)은 서버 응답을 화면 모양으로, toBody(item, pick)은 화면 값을 요청 본문으로 바꾼다. 없으면 fields만 고른다.
 * prepare(item, today)는 로컬 기록을 옮기기 전에 서버 형식으로 맞추고, notes(items, today)는 이전 안내에 보일 수를 준다.
 */
export function createFeatureStore({ local, path, kind, fields, demoFields, toLocal, toBody, prepare, notes, request = apiRequest, owner = () => session.userId }) {
  const pick = (source) => Object.fromEntries(fields.filter((key) => source[key] !== undefined).map((key) => [key, source[key]]))
  const body = (item) => {
    const out = toBody ? toBody(item, pick) : pick(item)
    if (typeof out.title === 'string') out.title = out.title.trim()
    return out
  }
  const synced = createSyncedCollection({
    local, owner, toBody: body,
    client: createRecordClient({ request, path, paged: true }),
    toLocal: (row) => ({ ...(toLocal ? toLocal(row) : row), id: row.id, version: row.version }),
  })

  /** 로컬 자료 이전 항목. 멱등 키는 local:{kind}:{로컬 ID}다(Q-13). */
  function migrationEntry({ label, seeds, today = () => localDate() }) {
    return {
      kind, label, local: synced.local, seeds, fields: demoFields,
      async adopt(item) {
        await synced.create(prepare ? prepare(item, today()) : item, { idempotencyKey: `local:${kind}:${item.id}` })
        synced.forgetLocal(item)
      },
      notes: notes ? (items) => notes(items, today()) : undefined,
    }
  }
  return { ...synced, migrationEntry }
}
