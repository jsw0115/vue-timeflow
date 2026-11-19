// 로그인 전에 이 브라우저에 남긴 기록을 계정으로 옮긴다. 시연 기록은 빼고, 로컬 ID를 멱등 키로 보내 두 번 옮겨도 하나만 생긴다(PR-07 3단계, UF-86, Q-11·Q-13).
import { computed, effectScope, reactive, ref, watch } from 'vue'
import { session } from '../auth/session.js'

const DISMISSED_KEY = 'timeflow.migration.dismissed.v1'

/**
 * 시연 기록인지 판단한다(Q-11). origin: 'demo' 표시가 있거나, 시드와 ID가 같고 fields의 내용도 모두 같을 때만 시연 기록이다.
 * ID만 같고 내용을 고친 기록은 사용자 기록으로 보고 옮긴다(잘못 버리는 것보다 잘못 옮기는 쪽이 되돌리기 쉽다).
 */
export function isDemoRecord(item, seeds, fields) {
  if (item?.origin === 'demo') return true
  const seed = seeds.find((entry) => String(entry.id) === String(item?.id))
  return Boolean(seed) && fields.every((field) => (seed[field] ?? '') === (item[field] ?? ''))
}

function sessionStore() {
  try { return globalThis.sessionStorage ?? null } catch { return null }
}

/**
 * entries는 기록 종류별 { kind, label, local, seeds, fields, adopt(item), notes?(items) }이다.
 * adopt는 기록 하나를 계정으로 옮기고 성공하면 로컬 목록에서 뺀다. 실패하면 던진다.
 * "나중에"는 이번 로그인 동안만 기억하고, 로그아웃하면 지워 다음 로그인 때 다시 묻는다(UT-130).
 */
export function createLocalMigration({ entries, owner = () => session.userId, storage = sessionStore() }) {
  const read = () => { try { return storage?.getItem(DISMISSED_KEY) ?? '' } catch { return '' } }
  const write = (value) => { try { value ? storage?.setItem(DISMISSED_KEY, value) : storage?.removeItem(DISMISSED_KEY) } catch { /* 저장하지 못해도 이번 화면에서는 기억한다 */ } }
  const dismissedFor = ref(owner() && read() === owner() ? owner() : '')
  const state = reactive({ running: false, finished: false, total: 0, moved: 0, failed: 0 })
  const scope = effectScope(true)
  scope.run(() => watch(owner, (next) => {
    // 로그아웃하면 "나중에"를 지운다. 다른 계정으로 바뀌어도 그 계정에는 다시 묻는다
    if (!next) write('')
    dismissedFor.value = next && read() === next ? next : ''
    Object.assign(state, { finished: false, total: 0, moved: 0, failed: 0 })
  }))

  const candidates = computed(() => entries
    .map((entry) => {
      const items = entry.local.value.filter((item) => !isDemoRecord(item, entry.seeds, entry.fields))
      return { kind: entry.kind, label: entry.label, items, ...(entry.notes?.(items) ?? {}) }
    })
    .filter((group) => group.items.length))
  const total = computed(() => candidates.value.reduce((sum, group) => sum + group.items.length, 0))
  const visible = computed(() => Boolean(owner()) && dismissedFor.value !== owner() && (total.value > 0 || state.running || state.finished))

  async function run() {
    if (state.running || !owner()) return
    const expected = owner()
    const work = candidates.value.flatMap((group) => group.items.map((item) => [entries.find((entry) => entry.kind === group.kind), item]))
    Object.assign(state, { running: true, finished: false, total: work.length, moved: 0, failed: 0 })
    try {
      for (const [entry, item] of work) {
        if (owner() !== expected) break
        try {
          await entry.adopt(item)
          state.moved++
        } catch (error) {
          if (error?.kind === 'stale' || owner() !== expected) break
          state.failed++
        }
      }
    } finally {
      state.running = false
      state.finished = owner() === expected
    }
  }
  return {
    state,
    candidates,
    total,
    visible,
    run,
    dismiss() {
      if (!owner()) return
      write(owner())
      dismissedFor.value = owner()
      Object.assign(state, { finished: false })
    },
    close() { Object.assign(state, { finished: false, total: 0, moved: 0, failed: 0 }) },
    stop: () => scope.stop(),
  }
}
