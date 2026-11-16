// 계정별 기능 제공 상태를 조회하고 오래된 응답과 조회 실패를 분리한다.
import { reactive, watch, onScopeDispose } from 'vue'
import { session } from '../auth/session.js'
import { apiRequest } from '../auth/apiRequest.js'

export function useCapabilityStatus(feature, { owner = () => session.userId, request = apiRequest } = {}) {
  const state = reactive({ available: null, busy: false, error: '' })
  let generation = 0
  async function refresh() {
    const expected = ++generation
    state.available = null; state.error = ''; state.busy = false
    if (!owner()) { state.error = '로그인 후 제공 상태를 확인할 수 있습니다.'; return }
    state.busy = true
    try {
      const rows = await request('/api/integrations/capabilities')
      if (expected !== generation) return
      const matches = Array.isArray(rows) ? rows.filter(row => row?.feature === feature()) : []
      if (matches.length !== 1 || typeof matches[0].available !== 'boolean') throw new Error('invalid capability')
      state.available = matches[0].available
    } catch {
      if (expected === generation) state.error = '제공 상태를 확인하지 못했습니다. 연결 상태를 확인하고 다시 시도해주세요.'
    } finally {
      if (expected === generation) state.busy = false
    }
  }
  watch([owner, feature], refresh, { immediate: true, flush: 'sync' })
  onScopeDispose(() => { generation++ })
  return { state, refresh }
}
