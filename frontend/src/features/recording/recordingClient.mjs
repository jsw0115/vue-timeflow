// 계정별 미완료 기록 명령을 보존하고 동일 식별자로 서버에 재전송한다.
export function createRecordingClient({ request, storage, owner, uuid = () => crypto.randomUUID(), now = () => Date.now() }) {
  const key = `timebar.recording.pending.v1.${owner}`
  const pending = () => {
    const raw = storage.getItem(key)
    if (!raw) return null
    try { return JSON.parse(raw) } catch { throw new Error('보관된 기록 요청을 읽지 못했습니다. 저장소를 지우기 전에 지원을 요청해주세요.') }
  }
  const save = value => storage.setItem(key, JSON.stringify(value))
  const clear = () => storage.removeItem(key)
  const post = async (path, body) => {
    try { return await request(path, { method: 'POST', body: JSON.stringify(body) }) }
    catch (error) {
      // 서버가 명시적으로 거절한 명령은 새 입력·서버 상태로 다시 시도할 수 있다.
      if (error.status === 400 || error.status === 409) clear()
      throw error
    }
  }
  return {
    pending,
    async recover() {
      const result = await request('/api/planner/recordings/current')
      const command = pending()
      if (command?.kind === 'start' && command.body.requestId === result.active?.id) clear()
      return result
    },
    async start(title, timeZone) {
      let command = pending()
      if (command && command.kind !== 'start') throw new Error('저장하지 못한 종료 요청을 먼저 다시 전송해주세요.')
      if (!command) { command = { kind: 'start', body: { requestId: uuid(), title: title.trim() || '실제 기록', timeZone } }; save(command) }
      const result = await post('/api/planner/recordings/start', command.body)
      clear()
      return result
    },
    async finish(active, serverOffset = 0) {
      let command = pending()
      if (command?.kind === 'start' && command.body.requestId === active.id) { clear(); command = null }
      if (command && (command.kind !== 'finish' || command.id !== active.id)) throw new Error('보관된 요청과 현재 기록이 다릅니다. 기록 상태를 다시 확인해주세요.')
      if (!command) {
        command = { kind: 'finish', id: active.id, body: { requestId: uuid(), version: active.version, endedAt: new Date(Math.max(Date.parse(active.startedAt), now() + serverOffset)).toISOString() } }
        save(command)
      }
      const result = await post(`/api/planner/recordings/${encodeURIComponent(command.id)}/finish`, command.body)
      clear()
      return result
    },
    async retryFinish() {
      const command = pending()
      if (command?.kind !== 'finish') return null
      const result = await post(`/api/planner/recordings/${encodeURIComponent(command.id)}/finish`, command.body)
      clear()
      return result
    },
  }
}

export function recordingSeconds(record, at = Date.now()) {
  if (!record) return 0
  return Math.max(0, Math.floor(((record.endedAt ? Date.parse(record.endedAt) : at) - Date.parse(record.startedAt)) / 1000))
}
