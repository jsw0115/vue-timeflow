// 다이어리·메모·D-Day·머니로그처럼 feature_record API를 쓰는 기록을 로그인 여부에 따라 서버·로컬로 나눠 저장한다(PR-07 6단계).
import { session } from '../auth/session.js'
import { apiRequest } from '../auth/apiRequest.js'
import { localDate } from '../../utils/postValidation.mjs'
import { createRecordClient } from './recordClient.mjs'
import { createSyncedCollection } from './syncedCollection.mjs'
import { isDemoRecord } from './localMigration.mjs'

/**
 * fields는 서버가 받는 필드(FeatureType), demoFields는 시연 기록을 가릴 때 비교할 필드(Q-11)다.
 * toLocal(row)은 서버 응답을 화면 모양으로, toBody(item, pick)은 화면 값을 요청 본문으로 바꾼다. 없으면 fields만 고른다.
 * prepare(item, today)는 로컬 기록을 옮기기 전에 서버 형식으로 맞추고, notes(items, today)는 이전 안내에 보일 수를 준다.
 * parentField가 있으면(WBS·위키처럼 계층) 이전할 때 부모를 먼저 옮기고 그 필드를 새 서버 ID로 바꾼다. 시연 부모 아래 기록은 최상위로 옮긴다(PR-10 4단계).
 */
export function createFeatureStore({ local, path, kind, fields, demoFields, toLocal, toBody, prepare, notes, parentField = null, request = apiRequest, owner = () => session.userId, offline = null }) {
  const pick = (source) => Object.fromEntries(fields.filter((key) => source[key] !== undefined).map((key) => [key, source[key]]))
  const body = (item) => {
    const out = toBody ? toBody(item, pick) : pick(item)
    if (typeof out.title === 'string') out.title = out.title.trim()
    return out
  }
  const synced = createSyncedCollection({
    local, owner, toBody: body, offline: offline && { kind, queue: offline },
    client: createRecordClient({ request, path, paged: true }),
    toLocal: (row) => ({ ...(toLocal ? toLocal(row) : row), id: row.id, version: row.version }),
  })

  /** 로컬 자료 이전 항목. 멱등 키는 local:{kind}:{로컬 ID}다(Q-13). */
  function migrationEntry({ label, seeds, today = () => localDate() }) {
    // 이번 계정에서 옮긴 로컬 ID → 서버 ID. 계정이 바뀌면 비운다
    const moved = new Map()
    let movedFor = null
    async function adoptOne(item, visiting = new Set()) {
      if (movedFor !== owner()) { moved.clear(); movedFor = owner() }
      const key = String(item.id)
      if (moved.has(key)) return moved.get(key)
      let row = prepare ? prepare(item, today()) : item
      if (parentField && row[parentField] !== undefined && row[parentField] !== null && row[parentField] !== '') {
        const parentKey = String(row[parentField])
        let parentId = moved.get(parentKey) ?? null
        if (!moved.has(parentKey) && !visiting.has(parentKey)) {
          const parent = synced.local.value.find((entry) => String(entry.id) === parentKey)
          visiting.add(key)
          parentId = parent && !isDemoRecord(parent, seeds, demoFields) ? await adoptOne(parent, visiting) : null
        }
        row = { ...row, [parentField]: parentId }
      }
      const created = await synced.create(row, { idempotencyKey: `local:${kind}:${item.id}` })
      moved.set(key, created.id)
      synced.forgetLocal(item)
      return created.id
    }
    return {
      kind, label, local: synced.local, seeds, fields: demoFields,
      async adopt(item) { await adoptOne(item) },
      notes: notes ? (items) => notes(items, today()) : undefined,
    }
  }
  return { ...synced, migrationEntry }
}
