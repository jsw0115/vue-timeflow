// 계정별 미완료 기록 명령을 보존하고 동일 식별자로 서버에 재전송한다. 집중 타이머의 일시정지·재개·취소도 보낸다(PR-09).
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
  /** 일시정지·재개·취소 전에 보관된 요청이 없는지 본다. 응답을 잃은 시작이 지금 기록이면 이미 서버에 있으므로 지운다. */
  const settled = (active) => {
    const command = pending()
    if (command?.kind === 'start' && command.body.requestId === active.id) { clear(); return }
    if (command) throw new Error(command.kind === 'finish' ? '저장하지 못한 종료 요청을 먼저 다시 전송해주세요.' : '저장하지 못한 기록 요청을 먼저 다시 전송해주세요.')
  }
  /** version만 보내는 상태 명령. 실패해도 보관하지 않는다. 화면이 서버 상태를 다시 불러 판단한다. */
  const command = (kind) => async (active) => {
    settled(active)
    return request(`/api/planner/recordings/${encodeURIComponent(active.id)}/${kind}`, { method: 'POST', body: JSON.stringify({ version: active.version }) })
  }
  return {
    pending,
    async recover() {
      const result = await request('/api/planner/recordings/current')
      const command = pending()
      if (command?.kind === 'start' && command.body.requestId === result.active?.id) clear()
      return result
    },
    /**
     * source({ kind: 'task'|'schedule', id })를 주면 원본 종류·ID를 함께 보내 실제 기록에 남긴다(PR-08 UF-91).
     * timer({ mode, targetMinutes })를 주면 집중 타이머로 시작한다. 스톱워치에는 목표 시간을 보내지 않는다(UF-120).
     */
    async start(title, timeZone, source, timer) {
      let command = pending()
      if (command && command.kind !== 'start') throw new Error('저장하지 못한 종료 요청을 먼저 다시 전송해주세요.')
      if (!command) {
        const timed = timer?.mode && timer.mode !== 'stopwatch' ? { targetMinutes: timer.targetMinutes } : {}
        command = { kind: 'start', body: { requestId: uuid(), title: title.trim() || '실제 기록', timeZone, ...(source ? { sourceKind: source.kind, sourceId: source.id } : {}), ...(timer?.mode ? { mode: timer.mode, ...timed } : {}) } }
        save(command)
      }
      const result = await post('/api/planner/recordings/start', command.body)
      clear()
      return result
    },
    /** endedAt을 주면 그 시각(목표 도달 시각)으로 끝낸다. 아니면 서버 기준 지금이며, 시작·마지막 일시정지·재개보다 이르지 않게 한다. */
    async finish(active, serverOffset = 0, endedAt) {
      let command = pending()
      if (command?.kind === 'start' && command.body.requestId === active.id) { clear(); command = null }
      if (command && (command.kind !== 'finish' || command.id !== active.id)) throw new Error('보관된 요청과 현재 기록이 다릅니다. 기록 상태를 다시 확인해주세요.')
      if (!command) {
        const end = endedAt ? Date.parse(endedAt) : Math.max(lastBoundary(active), now() + serverOffset)
        command = { kind: 'finish', id: active.id, body: { requestId: uuid(), version: active.version, endedAt: new Date(end).toISOString() } }
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
    pause: command('pause'),
    resume: command('resume'),
    /** 끝내지 않은 기록을 지운다. 성공하면 null이다(204). */
    cancel: command('cancel'),
  }
}

/** 시작과 일시정지·재개 시각 중 가장 늦은 시각(ms). 종료는 이보다 이를 수 없다. */
function lastBoundary(record) {
  let last = Date.parse(record.startedAt)
  for (const pause of record.pauses ?? []) last = Math.max(last, Date.parse(pause.from), pause.to ? Date.parse(pause.to) : 0)
  return last
}

/**
 * 일시정지 구간을 뺀 기록 초(PR-09 UF-122). 음수는 만들지 않는다.
 * 일시정지 중이면 서버가 찍은 일시정지 시각까지만 센다. 이 기기 시계(at)가 서버보다 조금 늦어도 시계가 흔들리지 않는다.
 */
export function recordingSeconds(record, at = Date.now()) {
  if (!record) return 0
  const open = record.endedAt ? null : (record.pauses ?? []).find((pause) => !pause.to)
  const end = record.endedAt ? Date.parse(record.endedAt) : open ? Date.parse(open.from) : at
  let ms = end - Date.parse(record.startedAt)
  for (const pause of record.pauses ?? []) {
    const from = Date.parse(pause.from), to = Math.min(pause.to ? Date.parse(pause.to) : end, end)
    ms -= Math.max(0, to - from)
  }
  return Math.max(0, Math.floor(ms / 1000))
}

/** 목표 시간이 있는 타이머의 남은 초. 목표가 없으면(스톱워치·플래너 기록) null이다. */
export function remainingSeconds(record, at = Date.now()) {
  if (!record?.targetMinutes) return null
  return Math.max(0, record.targetMinutes * 60 - recordingSeconds(record, at))
}

/** 진행 중인 타이머가 목표에 닿는 서버 시각(시작 + 목표 + 닫힌 일시정지). 일시정지 중이거나 목표가 없으면 null이다. */
export function targetEndAt(record) {
  if (!record?.targetMinutes || record.state !== 'RUNNING') return null
  const paused = (record.pauses ?? []).reduce((sum, pause) => sum + (pause.to ? Date.parse(pause.to) - Date.parse(pause.from) : 0), 0)
  return new Date(Date.parse(record.startedAt) + record.targetMinutes * 60000 + paused).toISOString()
}
