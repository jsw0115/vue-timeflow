// 로그인 상태에서는 계정의 서버 기록을, 로그아웃 상태에서는 이 브라우저의 로컬 목록을 같은 모양으로 보여 주고 저장을 나눠 보낸다(PR-07, UF-81·UF-87).
import { computed, effectScope, reactive } from 'vue'
import { session } from '../auth/session.js'
import { useRecordCollection } from './useRecordCollection.mjs'

/**
 * local은 localCollection 목록(ref), client는 createRecordClient 결과다.
 * toLocal은 서버 응답을 화면 모양으로, toBody는 화면 값을 요청 본문으로 바꾼다.
 * 로그아웃 상태의 저장은 지금처럼 로컬 목록만 바꾼다. 로그인 상태의 저장은 서버 성공 응답 뒤에만 목록에 들어간다.
 */
export function createSyncedCollection({ local, client, toLocal = (row) => row, toBody = (fields) => fields, owner = () => session.userId }) {
  const scope = effectScope(true)
  const server = scope.run(() => useRecordCollection(client, { owner, toLocal }))
  const onServer = () => Boolean(owner())
  const pending = reactive(new Set())
  const list = computed({
    get: () => (onServer() ? server.state.items : local.value),
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
  return {
    list,
    state: server.state,
    mode: computed(() => (onServer() ? 'server' : 'local')),
    onServer,
    isPending: (record) => pending.has(record?.id),
    reload: () => server.load(),
    async create(fields, options) {
      if (onServer()) return server.create(toBody(fields), options)
      local.value.unshift({ id: nextId(), ...fields })
      return local.value[0]
    },
    async update(record, fields) {
      if (onServer()) return track(record, () => server.update(record, toBody({ ...record, ...fields })))
      return Object.assign(localRow(record), fields)
    },
    /** 서버 상태 명령(예: 완료 토글). change는 로그아웃 상태에서 로컬 기록에 줄 변경이다. */
    async command(record, action, change) {
      if (onServer()) return track(record, () => server.command(record, action))
      const row = localRow(record)
      return Object.assign(row, change(row))
    },
    async remove(record) {
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
