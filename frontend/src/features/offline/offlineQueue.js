// 앱 전체가 함께 쓰는 오프라인 대기열이다. 로그인·연결 복구·화면 복귀 때 자동으로 보내고, 보낸 뒤 목록을 다시 불러오게 알린다(PR-12, UF-102).
import { watch } from 'vue'
import { session } from '../auth/session.js'
import { apiRequest } from '../auth/apiRequest.js'
import { createOutbox, indexedDbOutboxStorage, memoryOutboxStorage } from './outbox.mjs'

// 서버 렌더·테스트처럼 IndexedDB가 없는 환경에서는 메모리에 둔다
const storage = typeof indexedDB !== 'undefined' ? indexedDbOutboxStorage() : memoryOutboxStorage()
export const outbox = createOutbox({ storage, request: apiRequest, owner: () => session.userId })

const sentListeners = new Set()
/** 보낸 변경이 있으면 fn(sent)을 부른다. 기록 저장소가 서버 목록을 다시 불러오는 데 쓴다. */
export function onOutboxSent(fn) { sentListeners.add(fn) }

/** 대기 중인 변경을 지금 보낸다. 연결이 없다고 알려진 동안은 보내지 않는다. */
export async function sendPending() {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return { sent: [], stopped: true }
  const result = await outbox.flush()
  if (result.sent.length) for (const fn of sentListeners) fn(result.sent)
  return result
}

/** 연결이 없다고 알려졌으면 요청을 보내지 않고 바로 대기열에 넣는다. */
export const knownOffline = () => typeof navigator !== 'undefined' && navigator.onLine === false

watch(() => session.userId, () => { void outbox.refresh().then(() => sendPending()) }, { immediate: true })
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => { void sendPending() })
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') void sendPending() })
}
