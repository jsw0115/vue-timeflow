// 화면 수명과 계정을 구분해 실제 기록을 복구하고 저장 상태를 표시한다.
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
  async function refresh() {
    const expected = generation, current = client
    if (!current) return
    busy.value = true; error.value = ''
    try {
      const [state, items] = await Promise.all([current.recover(), apiRequest('/api/planner/recordings')])
      if (expected !== generation) return
      active.value = state.active; records.value = items; offset.value = Date.parse(state.serverTime) - Date.now(); loaded.value = true; readPending()
    } catch (e) { if (expected === generation) error.value = e.message }
    finally { if (expected === generation) busy.value = false }
  }
  watch(() => session.userId, owner => {
    generation += 1; active.value = null; records.value = []; pending.value = null; saved.value = null; loaded.value = false; error.value = ''; busy.value = false
    client = owner ? createRecordingClient({ request: apiRequest, storage: localStorage, owner }) : null
    if (client) refresh()
    else error.value = '실제 기록을 저장하려면 먼저 로그인해주세요.'
  }, { immediate: true })
  async function toggle(title) {
    if (!client || busy.value || !loaded.value) return
    const current = client, expected = generation
    busy.value = true; error.value = ''; saved.value = null
    try {
      const result = pending.value?.kind === 'finish' ? await current.retryFinish()
        : active.value ? await current.finish(active.value, offset.value)
          : await current.start(title, Intl.DateTimeFormat().resolvedOptions().timeZone)
      if (expected !== generation) return
      active.value = result.state === 'RUNNING' ? result : null
      records.value = [result, ...records.value.filter(row => row.id !== result.id)]
      if (result.state === 'COMPLETED') saved.value = result
    } catch (e) { if (expected === generation) error.value = e.message }
    finally {
      if (expected === generation) {
        busy.value = false
        try { readPending() } catch (e) { error.value = e.message }
      }
    }
  }
  const elapsed = computed(() => recordingSeconds(active.value, pending.value?.kind === 'finish' ? Date.parse(pending.value.body.endedAt) : now.value + offset.value))
  return { active, records, pending, error, busy, loaded, saved, elapsed, refresh, toggle }
}
