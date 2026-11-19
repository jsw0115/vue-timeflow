// 로그인 계정의 서버 기록 목록을 보관하고, 계정이 바뀌면 비우며 이전 계정의 늦은 응답을 버린다(PR-07, UF-80·UF-85).
import { reactive, watch, onScopeDispose } from 'vue'
import { session } from '../auth/session.js'

/**
 * client는 createRecordClient의 결과다. toLocal은 서버 응답을 화면에서 쓰는 모양으로 바꾼다.
 * 저장 결과는 서버 성공 응답 뒤에만 목록에 넣는다. 요청 중에 계정이 바뀌면 결과를 버리고 kind가 'stale'인 오류를 던진다.
 */
export function useRecordCollection(client, { owner = () => session.userId, toLocal = (row) => row } = {}) {
  const state = reactive({ items: [], loaded: false, loading: false, error: null })
  let generation = 0, loads = 0

  const staleError = () => Object.assign(new Error('계정이 바뀌어 이전 요청의 결과를 반영하지 않았어요.'), { kind: 'stale' })
  async function guarded(run) {
    const expected = generation
    let result
    try {
      result = await run()
    } catch (error) {
      if (expected !== generation) throw staleError()
      throw error
    }
    if (expected !== generation) throw staleError()
    return result
  }
  const place = (row) => {
    const index = state.items.findIndex((item) => item.id === row.id)
    if (index >= 0) state.items.splice(index, 1, row)
    return row
  }
  const drop = (id) => { state.items = state.items.filter((item) => item.id !== id) }
  // 충돌이면 목록을 최신 서버 값으로, 다른 곳에서 지워졌으면 목록에서 뺀다. 입력 중인 내용은 화면이 따로 보관한다
  async function mutate(record, run) {
    try {
      return place(toLocal(await guarded(run)))
    } catch (error) {
      if (error.kind === 'conflict' && error.latest) error.latest = place(toLocal(error.latest))
      if (error.kind === 'notFound') drop(record.id)
      throw error
    }
  }

  async function load() {
    const expected = ++loads
    if (!owner()) return
    state.loading = true
    state.error = null
    try {
      const rows = await guarded(() => client.list())
      if (expected !== loads) return
      state.items = (rows ?? []).map(toLocal)
      state.loaded = true
    } catch (error) {
      if (expected === loads && error.kind !== 'stale') state.error = error
    } finally {
      if (expected === loads) state.loading = false
    }
  }
  function reset() {
    generation++
    loads++
    state.items = []
    state.loaded = false
    state.loading = false
    state.error = null
  }

  watch(owner, () => { reset(); void load() }, { immediate: true, flush: 'sync' })
  onScopeDispose(() => { generation++; loads++ })

  return {
    state,
    load,
    async create(body) {
      const row = toLocal(await guarded(() => client.create(body)))
      state.items.unshift(row)
      return row
    },
    update: (record, body) => mutate(record, () => client.update(record, body)),
    command: (record, action, method) => mutate(record, () => client.command(record, action, method)),
    async remove(record) {
      try {
        await guarded(() => client.remove(record))
      } catch (error) {
        if (error.kind === 'conflict' && error.latest) error.latest = place(toLocal(error.latest))
        if (error.kind === 'notFound') drop(record.id)
        throw error
      }
      drop(record.id)
    },
  }
}
