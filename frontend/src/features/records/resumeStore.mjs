// 계정에 하나뿐인 이력서(/api/work/resume)를 불러오고 version으로 저장한다(PR-07 7단계). 로그아웃 상태에서는 서버를 부르지 않는다.
import { effectScope, reactive, watch } from 'vue'
import { session } from '../auth/session.js'
import { apiRequest } from '../auth/apiRequest.js'
import { errorKind } from './recordClient.mjs'

const FIELDS = ['name', 'headline', 'years', 'skills', 'education']
const empty = () => ({ name: '', headline: '', years: 0, skills: '', education: '' })
const pick = (row) => ({ ...empty(), ...Object.fromEntries(FIELDS.filter((key) => row?.[key] !== undefined).map((key) => [key, row[key]])) })

export function createResumeStore({ request = apiRequest, owner = () => session.userId } = {}) {
  const state = reactive({ value: empty(), version: 0, loaded: false, loading: false, error: null })
  const scope = effectScope(true)
  let generation = 0
  scope.run(() => watch(owner, () => { generation++; Object.assign(state, { value: empty(), version: 0, loaded: false, loading: false, error: null }) }, { flush: 'sync' }))

  async function load() {
    if (!owner()) return state
    const expected = generation
    Object.assign(state, { loading: true, error: null })
    try {
      const row = await request('/api/work/resume')
      if (expected !== generation) return state
      Object.assign(state, { value: pick(row), version: row?.version ?? 0, loaded: true })
    } catch (error) {
      error.kind ??= errorKind(error)
      if (expected === generation) state.error = error
    } finally {
      if (expected === generation) state.loading = false
    }
    return state
  }

  /** 처음 저장(version 0)은 version 없이 보낸다. 충돌이면 최신 이력서를 error.latest로 준다. 자동으로 덮어쓰지 않는다. */
  async function save(fields) {
    const expected = generation
    const body = { ...pick(fields), name: String(fields.name ?? '').trim(), ...(state.version ? { version: state.version } : {}) }
    try {
      const row = await request('/api/work/resume', { method: 'PUT', body: JSON.stringify(body) })
      if (expected !== generation) throw Object.assign(new Error('계정이 바뀌어 이전 요청의 결과를 반영하지 않았어요.'), { kind: 'stale' })
      Object.assign(state, { value: pick(row), version: row.version })
      return state.value
    } catch (error) {
      error.kind ??= errorKind(error)
      if (error.kind === 'conflict') {
        try {
          const latest = await request('/api/work/resume')
          error.latest = pick(latest)
          error.latestVersion = latest?.version ?? 0
        } catch { error.latest = null }
      }
      throw error
    }
  }
  /** 비교 화면에서 고른 최신 값을 기준으로 삼는다. */
  function adopt(latest, version) { Object.assign(state, { value: pick(latest), version }) }

  return { state, load, save, adopt, stop: () => scope.stop() }
}
