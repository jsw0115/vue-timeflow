// 화면 수명과 계정을 구분해 실제 기록을 복구하고 저장 상태를 표시한다. 집중 타이머의 시작·일시정지·재개·종료·취소도 같은 상태로 다룬다(PR-09).
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { session } from '../auth/session.js'
import { apiRequest } from '../auth/apiRequest.js'
import { createRecordingClient, recordingSeconds } from './recordingClient.mjs'

export function useRecording() {
  const active = ref(null), records = ref([]), pending = ref(null), error = ref(''), busy = ref(false), loaded = ref(false), saved = ref(null)
  const now = ref(Date.now()), offset = ref(0)
  let client, generation = 0
  const ticker = setInterval(() => { now.value = Date.now() }, 1000)
  onBeforeUnmount(() => { clearInterval(ticker); generation += 1 })
  function readPending() { pending.value = client?.pending() || null }
  /** 진행 중 기록과 기록 목록을 서버에서 다시 읽는다. 오류 문구는 부른 쪽이 정한다. */
  async function load(current, expected) {
    const [state, items] = await Promise.all([current.recover(), apiRequest('/api/planner/recordings')])
    if (expected !== generation) return
    active.value = state.active; records.value = items; offset.value = Date.parse(state.serverTime) - Date.now(); loaded.value = true; readPending()
  }
  async function refresh() {
    const expected = generation, current = client
    if (!current) return
    busy.value = true; error.value = ''
    try { await load(current, expected) }
    catch (e) { if (expected === generation) error.value = e.message }
    finally { if (expected === generation) busy.value = false }
  }
  watch(() => session.userId, owner => {
    generation += 1; active.value = null; records.value = []; pending.value = null; saved.value = null; loaded.value = false; error.value = ''; busy.value = false
    client = owner ? createRecordingClient({ request: apiRequest, storage: localStorage, owner }) : null
    if (client) refresh()
    else error.value = '실제 기록을 저장하려면 먼저 로그인해주세요.'
  }, { immediate: true })
  /**
   * 명령 하나를 보내고 결과로 화면 상태를 바꾼다. 결과가 { cancelled }면 기록을 지운다.
   * 다른 곳에서 상태가 바뀌어 409·404면 서버 상태를 다시 읽고 오류 문구는 남긴다.
   */
  async function run(action) {
    if (!client || busy.value || !loaded.value) return null
    const current = client, expected = generation
    busy.value = true; error.value = ''; saved.value = null
    try {
      const result = await action(current)
      if (expected !== generation) return null
      if (result?.cancelled) {
        active.value = null; records.value = records.value.filter(row => row.id !== result.id)
      } else {
        active.value = result.state === 'COMPLETED' ? null : result
        records.value = [result, ...records.value.filter(row => row.id !== result.id)]
        if (result.state === 'COMPLETED') saved.value = result
      }
      return result
    } catch (e) {
      if (expected !== generation) return null
      error.value = e.message
      if (e.status === 409 || e.status === 404) await load(current, expected).catch(() => {})
      return null
    } finally {
      if (expected === generation) {
        busy.value = false
        try { readPending() } catch (e) { error.value = e.message }
      }
    }
  }
  const zone = () => Intl.DateTimeFormat().resolvedOptions().timeZone
  /** 플래너의 "지금부터 기록" 버튼. 진행 중이면 끝내고, 보관된 종료 요청이 있으면 다시 보낸다. */
  const toggle = (title) => run(current => pending.value?.kind === 'finish' ? current.retryFinish()
    : active.value ? current.finish(active.value, offset.value)
      : current.start(title, zone()))
  /** 집중 타이머 시작. timer는 { mode, targetMinutes }다. */
  const startTimer = (title, timer) => run(current => current.start(title, zone(), undefined, timer))
  const pause = () => run(current => current.pause(active.value))
  const resume = () => run(current => current.resume(active.value))
  /** endedAt을 주면 그 시각(목표 도달 시각)으로 끝낸다. */
  const finish = (endedAt) => run(current => current.finish(active.value, offset.value, endedAt))
  const retry = () => run(current => current.retryFinish())
  const cancel = () => run(async current => { const id = active.value.id; await current.cancel(active.value); return { cancelled: true, id } })
  const serverNow = computed(() => now.value + offset.value)
  const elapsed = computed(() => recordingSeconds(active.value, pending.value?.kind === 'finish' ? Date.parse(pending.value.body.endedAt) : serverNow.value))
  return { active, records, pending, error, busy, loaded, saved, elapsed, serverNow, refresh, toggle, startTimer, pause, resume, finish, retry, cancel }
}

/**
 * 할 일·일정 화면에서 그 기록을 원본으로 실제 기록을 시작한다(PR-08 UF-91). 화면을 여는 것만으로 기록을 불러오거나 타이머를 돌리지 않는다.
 * 진행 중인 기록이 있으면 새로 시작하지 않고 { started: false }를 돌려준다. 끝내지 못한 종료 요청이 남아 있으면 그 안내로 실패한다.
 */
export async function startRecordingFrom(title, source) {
  if (!session.userId) throw new Error('실제 기록을 저장하려면 먼저 로그인해주세요.')
  const client = createRecordingClient({ request: apiRequest, storage: localStorage, owner: session.userId })
  const state = await client.recover()
  if (state.active) return { started: false, active: state.active }
  return { started: true, active: await client.start(title, Intl.DateTimeFormat().resolvedOptions().timeZone, source) }
}
