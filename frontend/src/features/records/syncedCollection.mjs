// 로그인 상태에서는 계정의 서버 기록을, 로그아웃 상태에서는 이 브라우저의 로컬 목록을 같은 모양으로 보여 주고 저장을 나눠 보낸다(PR-07, UF-81·UF-87).
import { computed, effectScope, reactive } from 'vue'
import { session } from '../auth/session.js'
import { useRecordCollection } from './useRecordCollection.mjs'
import { errorKind } from './recordClient.mjs'
import { isOfflineId } from '../offline/outbox.mjs'

export const OFFLINE_LABEL = { pending: '전송 대기', sending: '전송 중', review: '확인 필요' }
export const offlineOnlyError = () => Object.assign(new Error('연결된 뒤에 할 수 있어요. 아직 보내지 않은 변경이 있어요.'), { kind: 'offline' })

/**
 * local은 localCollection 목록(ref), client는 createRecordClient 결과다.
 * toLocal은 서버 응답을 화면 모양으로, toBody는 화면 값을 요청 본문으로 바꾼다.
 * 로그아웃 상태의 저장은 지금처럼 로컬 목록만 바꾼다. 로그인 상태의 저장은 서버 성공 응답 뒤에만 목록에 들어간다.
 * offline({ kind, queue })을 주면 생성·수정에 { offline: true }를 준 요청이 연결 실패로 끝날 때 대기열에 넣고, 목록에 "전송 대기"로 겹쳐 보인다(PR-12).
 * queue는 offlineQueue.js의 { outbox, onOutboxSent, knownOffline }이다.
 */
export function createSyncedCollection({ local, client, toLocal = (row) => row, toBody = (fields) => fields, owner = () => session.userId, offline = null }) {
  const scope = effectScope(true)
  const server = scope.run(() => useRecordCollection(client, { owner, toLocal }))
  const onServer = () => Boolean(owner())
  const pending = reactive(new Set())
  const queuedFor = (id) => (offline ? offline.queue.outbox.state.items.filter((item) => item.kind === offline.kind && item.ref === String(id)) : [])
  // 보낸 변경이 있으면 서버 목록을 다시 불러와 대기 표시를 실제 기록으로 바꾼다
  if (offline) offline.queue.onOutboxSent((sent) => { if (sent.some(({ item }) => item.kind === offline.kind)) void server.load() })
  /** 서버 목록 위에 아직 보내지 않은 변경을 겹쳐 보인다. 같은 기록의 변경은 넣은 순서대로 덮는다. */
  function withQueued(rows) {
    const items = offline.queue.outbox.state.items.filter((item) => item.kind === offline.kind)
    if (!items.length) return rows
    const groups = new Map()
    for (const item of items) groups.set(item.ref, [...(groups.get(item.ref) ?? []), item])
    const sending = offline.queue.outbox.state.sending
    const status = (group) => (group.some((item) => item.status === 'review') ? 'review' : group.some((item) => item.seq === sending) ? 'sending' : 'pending')
    const merged = (group) => Object.assign({}, ...group.map((item) => item.preview ?? {}))
    const shown = rows.map((row) => {
      const group = groups.get(String(row.id))
      return group ? { ...row, ...merged(group), id: row.id, version: row.version, offline: status(group) } : row
    })
    const created = [...groups].filter(([ref, group]) => isOfflineId(ref) && group[0].op === 'create').map(([ref, group]) => ({ ...merged(group), id: ref, version: 0, offline: status(group) }))
    return [...created.reverse(), ...shown]
  }
  const list = computed({
    get: () => (onServer() ? (offline ? withQueued(server.state.items) : server.state.items) : local.value),
    // 목록을 통째로 바꾸는 기존 코드(테스트·로컬 정리)는 로컬 목록에만 쓴다
    set: (value) => { local.value = value },
  })
  const nextId = () => local.value.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1
  const localRow = (record) => local.value.find((item) => item.id === record.id) ?? record
  // 같은 기록에 요청이 진행 중이면 다시 보내지 않는다(완료 체크를 빠르게 두 번 누른 경우)
  async function track(record, run) {
    if (pending.has(record.id)) return record
    pending.add(record.id)
    try { return await run() } finally { pending.delete(record.id) }
  }
  /** 연결이 없다고 알려졌거나 요청이 연결 실패로 끝나면 변경을 대기열에 넣고, 목록에 보이는 대기 행을 돌려준다(UF-100). */
  async function sendOrQueue(send, change) {
    if (!offline.queue.knownOffline()) {
      try { return await send() } catch (error) { if ((error.kind ?? errorKind(error)) !== 'network') throw error }
    }
    return enqueue(change)
  }
  async function enqueue(change) {
    const item = await offline.queue.outbox.enqueue({ kind: offline.kind, ...change })
    return list.value.find((row) => String(row.id) === item.ref) ?? { ...item.preview, id: item.ref, offline: 'pending' }
  }
  // 대기열에 변경이 남은 기록은 서버로 바로 보내면 순서가 어긋나므로 막는다
  const blockedOffline = (record) => offline && (isOfflineId(record?.id) || queuedFor(record?.id).length > 0)
  const withoutMeta = ({ offline: _offline, ...row }) => row

  return {
    list,
    state: server.state,
    mode: computed(() => (onServer() ? 'server' : 'local')),
    onServer,
    isPending: (record) => pending.has(record?.id),
    reload: () => server.load(),
    async create(fields, options = {}) {
      const { offline: allowQueue, ...rest } = options
      if (onServer() && allowQueue && offline) return sendOrQueue(() => server.create(toBody(fields), rest), { op: 'create', body: toBody(fields), preview: { ...fields } })
      if (onServer()) return server.create(toBody(fields), rest)
      local.value.unshift({ id: nextId(), ...fields })
      return local.value[0]
    },
    async update(record, fields, options = {}) {
      if (onServer() && options.offline && offline) {
        const body = toBody(withoutMeta({ ...record, ...fields }))
        const change = { op: 'update', ref: record.id, baseVersion: record.version, body, preview: withoutMeta({ ...record, ...fields }) }
        // 보내지 않은 변경이 있는 기록(대기열에서 만든 기록 포함)은 순서를 지키려고 대기열 뒤에 넣는다(UF-102)
        if (blockedOffline(record)) return enqueue(change)
        return track(record, () => sendOrQueue(() => server.update(record, body), change))
      }
      if (onServer() && blockedOffline(record)) throw offlineOnlyError()
      if (onServer()) return track(record, () => server.update(record, toBody({ ...record, ...fields })))
      return Object.assign(localRow(record), fields)
    },
    /** 서버 상태 명령(예: 완료 토글). change는 로그아웃 상태에서 로컬 기록에 줄 변경이다. */
    async command(record, action, change) {
      if (onServer() && blockedOffline(record)) throw offlineOnlyError()
      if (onServer()) return track(record, () => server.command(record, action))
      const row = localRow(record)
      return Object.assign(row, change(row))
    },
    async remove(record) {
      if (onServer() && blockedOffline(record)) throw offlineOnlyError()
      if (onServer()) return track(record, () => server.remove(record))
      local.value = local.value.filter((item) => item.id !== record.id)
    },
    /** 계정으로 옮긴 로컬 기록을 이 브라우저 목록에서 뺀다(PR-07 3단계). */
    forgetLocal(record) {
      local.value = local.value.filter((item) => item.id !== record.id)
    },
    local,
    stop: () => scope.stop(),
  }
}
