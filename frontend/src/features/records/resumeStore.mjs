// 계정에 하나뿐인 문서(이력서 /api/work/resume, 자기소개서 /api/work/cover-letter)를 불러오고 version으로 저장한다(PR-07 7단계, PR-25 Q-41).
// 로그아웃 상태에서는 서버를 부르지 않는다.
import { effectScope, reactive, watch } from 'vue'
import { session } from '../auth/session.js'
import { apiRequest } from '../auth/apiRequest.js'
import { errorKind } from './recordClient.mjs'

const RESUME = { path: '/api/work/resume', fields: ['name', 'headline', 'years', 'skills', 'education'], empty: () => ({ name: '', headline: '', years: 0, skills: '', education: '' }), required: 'name' }
/** 자기소개서 칸(개편안 문서 유형 표: 지원 동기·직무 역량·문제 해결·협업·성장 경험). 제목은 서버 필수 값이다. */
export const COVER_LETTER_SECTIONS = [
  { key: 'motivation', label: '지원 동기' },
  { key: 'competency', label: '직무 역량' },
  { key: 'problemSolving', label: '문제 해결' },
  { key: 'collaboration', label: '협업' },
  { key: 'growth', label: '성장 경험' },
]
const COVER_LETTER = { path: '/api/work/cover-letter', fields: ['title', ...COVER_LETTER_SECTIONS.map((s) => s.key)], empty: () => ({ title: '', motivation: '', competency: '', problemSolving: '', collaboration: '', growth: '' }), required: 'title' }

export const createResumeStore = (options = {}) => createSingleDocStore({ ...RESUME, ...options })
export const createCoverLetterStore = (options = {}) => createSingleDocStore({ ...COVER_LETTER, ...options })

export function createSingleDocStore({ path, fields: FIELDS, empty, required, request = apiRequest, owner = () => session.userId }) {
  const pick = (row) => ({ ...empty(), ...Object.fromEntries(FIELDS.filter((key) => row?.[key] !== undefined).map((key) => [key, row[key]])) })
  const state = reactive({ value: empty(), version: 0, loaded: false, loading: false, error: null })
  const scope = effectScope(true)
  let generation = 0
  scope.run(() => watch(owner, () => { generation++; Object.assign(state, { value: empty(), version: 0, loaded: false, loading: false, error: null }) }, { flush: 'sync' }))

  async function load() {
    if (!owner()) return state
    const expected = generation
    Object.assign(state, { loading: true, error: null })
    try {
      const row = await request(path)
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

  /** 처음 저장(version 0)은 version 없이 보낸다. 충돌이면 최신 문서를 error.latest로 준다. 자동으로 덮어쓰지 않는다. */
  async function save(fields) {
    const expected = generation
    const body = { ...pick(fields), [required]: String(fields[required] ?? '').trim(), ...(state.version ? { version: state.version } : {}) }
    try {
      const row = await request(path, { method: 'PUT', body: JSON.stringify(body) })
      if (expected !== generation) throw Object.assign(new Error('계정이 바뀌어 이전 요청의 결과를 반영하지 않았어요.'), { kind: 'stale' })
      Object.assign(state, { value: pick(row), version: row.version })
      return state.value
    } catch (error) {
      error.kind ??= errorKind(error)
      if (error.kind === 'conflict') {
        try {
          const latest = await request(path)
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
