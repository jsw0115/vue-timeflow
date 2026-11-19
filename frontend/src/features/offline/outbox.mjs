// 연결이 없을 때 메모·할 일의 생성·수정을 계정별 대기열에 넣고, 연결되면 넣은 순서대로 같은 요청 ID로 보낸다(PR-12, UF-100·UF-102~UF-104).
import { reactive } from 'vue'
import { errorKind } from '../records/recordClient.mjs'

export const OFFLINE_PREFIX = 'offline:'
export const isOfflineId = (id) => typeof id === 'string' && id.startsWith(OFFLINE_PREFIX)
export const OUTBOX_PATHS = { memo: '/api/memos', task: '/api/tasks' }
// 화면 상태(반응형 프록시)에서 받은 항목도 저장소가 복제할 수 있는 순수 데이터로 바꾼다
const plain = (value) => JSON.parse(JSON.stringify(value))

/** 테스트와 IndexedDB를 쓸 수 없는 환경에서 쓰는 저장소. 탭을 닫으면 사라진다. */
export function memoryOutboxStorage() {
  const rows = new Map()
  const key = (owner, seq) => owner + '|' + seq
  return {
    async list(owner) { return [...rows.values()].filter((row) => row.owner === owner).sort((a, b) => a.seq - b.seq).map((row) => structuredClone(row)) },
    async put(item) { rows.set(key(item.owner, item.seq), structuredClone(item)) },
    async remove(owner, seq) { rows.delete(key(owner, seq)) },
  }
}

/** 브라우저를 닫았다 열어도 남는 기기 저장소(UT-184). 항목 키는 [계정, 순번]이고 계정 색인으로만 읽는다(UF-104). */
export function indexedDbOutboxStorage({ indexedDB = globalThis.indexedDB, name = 'timebar-outbox' } = {}) {
  let opening = null
  const open = () => (opening ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(name, 1)
    req.onupgradeneeded = () => req.result.createObjectStore('items', { keyPath: ['owner', 'seq'] }).createIndex('owner', 'owner')
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => { opening = null; reject(req.error) }
  }))
  const run = async (mode, action) => {
    const db = await open()
    return new Promise((resolve, reject) => {
      const tx = db.transaction('items', mode)
      let value
      const req = action(tx.objectStore('items'))
      if (req) req.onsuccess = () => { value = req.result }
      tx.oncomplete = () => resolve(value)
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    })
  }
  return {
    async list(owner) { return ((await run('readonly', (store) => store.index('owner').getAll(owner))) ?? []).sort((a, b) => a.seq - b.seq) },
    put: (item) => run('readwrite', (store) => store.put(item)),
    remove: (owner, seq) => run('readwrite', (store) => store.delete([owner, seq])),
  }
}

/**
 * storage는 위 저장소, request는 apiRequest처럼 성공 응답의 data를 돌려주고 실패면 status를 담아 던지는 함수, owner는 지금 계정 ID다.
 * 항목: { owner, seq, id(요청 ID·멱등 키), kind, op('create'|'update'), ref(대상 서버 ID 또는 offline: 임시 ID), baseVersion, body, preview, status('pending'|'review'), error, latest }.
 */
export function createOutbox({ storage, request, owner, uuid = () => crypto.randomUUID() }) {
  const state = reactive({ items: [], sending: null, flushing: false })

  async function refresh() {
    const user = owner()
    const items = user ? await storage.list(user) : []
    if (owner() === user) state.items = items
    return items
  }

  /**
   * 변경 하나를 넣는다. 생성은 offline: 임시 ID를 대상으로 받는다.
   * 같은 대상에 아직 보내지 않은 변경이 있으면 기준 version을 비워 두고, 앞 변경이 끝날 때 응답 version으로 채운다.
   */
  async function enqueue({ kind, op, ref = null, baseVersion = null, body, preview = null }) {
    const user = owner()
    if (!user) throw new Error('로그인한 뒤에 기기에 보관할 수 있어요.')
    if (!OUTBOX_PATHS[kind] || !['create', 'update'].includes(op)) throw new Error('대기열에 넣을 수 없는 변경이에요.')
    const items = await storage.list(user)
    const target = op === 'create' ? OFFLINE_PREFIX + uuid() : String(ref)
    const waiting = items.some((item) => item.ref === target)
    const item = plain({
      owner: user, seq: items.reduce((max, entry) => Math.max(max, entry.seq), 0) + 1, id: uuid(), kind, op, ref: target,
      baseVersion: op === 'update' && !waiting ? baseVersion : null, body, preview, status: 'pending', error: null, latest: null,
      queuedAt: new Date().toISOString(),
    })
    await storage.put(item)
    await refresh()
    return item
  }

  function send(item) {
    const headers = { 'Idempotency-Key': item.id }
    if (item.op === 'create') return request(OUTBOX_PATHS[item.kind], { method: 'POST', body: JSON.stringify(item.body), headers })
    return request(OUTBOX_PATHS[item.kind] + '/' + encodeURIComponent(item.ref), { method: 'PUT', body: JSON.stringify({ ...item.body, version: item.baseVersion }), headers })
  }

  /**
   * 보낸 변경을 지우고 같은 대상의 뒤 변경에 서버 ID와 기준 version을 넘긴다. 순서는 뒤 항목을 고친 다음 지우기라, 그 사이에 멈춰도 다시 보내면 멱등 키가 같은 결과를 준다.
   * 다시 보낸 수정의 응답 version이 보낸 version + 1이 아니면 그 사이 다른 곳에서 고친 것이다. 뒤 변경은 덮어쓰지 않게 확인 필요로 둔다(UF-103).
   */
  async function advance(user, item, result) {
    const changedElsewhere = item.op === 'update' && Number(result?.version) !== item.baseVersion + 1
    let first = true
    for (const follower of (await storage.list(user)).filter((entry) => entry.seq !== item.seq && entry.ref === item.ref)) {
      const next = { ...follower, ref: String(result.id) }
      if (first) {
        if (changedElsewhere) Object.assign(next, { status: 'review', error: { kind: 'conflict', message: '다른 곳에서 먼저 고쳤어요.' }, latest: result, baseVersion: null })
        else next.baseVersion = Number(result.version)
        first = false
      }
      await storage.put(next)
    }
    await storage.remove(user, item.seq)
    return changedElsewhere
  }

  /**
   * 대기 중인 변경을 넣은 순서대로 보낸다(UF-102). 연결 실패·서버 오류면 멈추고 다음에 다시 보낸다.
   * 409·400·404는 확인 필요로 두고 그 기록의 뒤 변경만 멈추며, 다른 기록은 계속 보낸다(UT-188). 계정이 바뀌면 바로 멈춘다(UF-104).
   */
  async function flush() {
    const user = owner()
    if (!user || state.flushing) return { sent: [], stopped: !user }
    state.flushing = true
    const sent = [], blocked = new Set(), tried = new Set()
    let stopped = false
    try {
      for (;;) {
        if (owner() !== user) { stopped = true; break }
        const items = await storage.list(user)
        for (const entry of items) if (entry.status === 'review') blocked.add(entry.ref)
        const item = items.find((entry) => !tried.has(entry.seq) && !blocked.has(entry.ref) && entry.status === 'pending')
        if (!item) break
        tried.add(item.seq)
        // 앞 변경이 아직 안 끝난 수정(대상이 임시 ID이거나 기준 version이 없음)은 이번에 보내지 않는다
        if (item.op === 'update' && (isOfflineId(item.ref) || item.baseVersion == null)) { blocked.add(item.ref); continue }
        state.sending = item.seq
        try {
          const result = await send(item)
          if (await advance(user, item, result)) blocked.add(String(result.id))
          sent.push({ item, result })
        } catch (error) {
          const kind = error.kind ?? errorKind(error)
          if (kind === 'network' || kind === 'server') { stopped = true; break }
          let latest = null
          if (kind === 'conflict' && item.op === 'update') {
            try { latest = await request(OUTBOX_PATHS[item.kind] + '/' + encodeURIComponent(item.ref)) } catch { latest = null }
          }
          await storage.put({ ...item, status: 'review', error: { kind, message: error.message ?? '' }, latest })
          blocked.add(item.ref)
        } finally {
          state.sending = null
        }
      }
    } finally {
      state.flushing = false
      await refresh()
    }
    return { sent, stopped }
  }

  /** 충돌한 수정을 최신 version 위에 내 내용으로 다시 보낸다. 본문의 version이 바뀌므로 새 요청 ID를 쓴다. */
  async function keepMine(item) {
    if (!item.latest) throw new Error('최신 내용을 불러온 뒤에 다시 보낼 수 있어요.')
    await storage.put(plain({ ...item, id: uuid(), status: 'pending', error: null, latest: null, baseVersion: Number(item.latest.version) }))
    await refresh()
  }
  /** 이 변경과 같은 기록의 뒤 변경을 함께 지운다(생성을 지우면 그 기록의 수정도 보낼 곳이 없다). */
  async function discard(item) {
    for (const entry of await storage.list(item.owner)) if (entry.seq === item.seq || (entry.ref === item.ref && entry.seq > item.seq)) await storage.remove(entry.owner, entry.seq)
    await refresh()
  }
  /** 지금 계정의 대기 항목을 모두 지운다(로그아웃 때 "지우기", UF-105). */
  async function clear() {
    const user = owner()
    if (!user) return
    for (const entry of await storage.list(user)) await storage.remove(user, entry.seq)
    await refresh()
  }

  return { state, refresh, enqueue, flush, keepMine, discard, clear }
}
