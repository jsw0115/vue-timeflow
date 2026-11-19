// 저장 요청의 진행·성공·실패·충돌 상태를 사실대로 보관하고, 실패 문구와 관련 입력란을 정한다(PR-07, UF-82·UF-83·UF-84).
import { reactive } from 'vue'
import { errorKind } from './recordClient.mjs'

/** 실패 종류마다 사용자가 다음에 할 일을 알 수 있는 문구를 준다. 400은 서버 메시지를 그대로 쓴다. */
export function saveFailureMessage(error) {
  const kind = error?.kind ?? errorKind(error)
  const base = {
    conflict: '다른 곳에서 먼저 고쳤어요. 내 입력과 최신 내용을 비교해 골라 주세요.',
    invalid: `저장하지 못했어요. ${error?.message || '입력한 내용을 확인해 주세요.'}`,
    notFound: '다른 곳에서 삭제되어 저장하지 못했어요.',
    network: '저장하지 못했어요. 연결을 확인하고 다시 시도해 주세요.',
    stale: '계정이 바뀌어 저장 결과를 반영하지 않았어요.',
  }[kind] ?? '저장하지 못했어요. 잠시 뒤 다시 시도해 주세요.'
  // 일부만 저장된 경우(예: 할 일은 만들고 체크리스트는 실패) 무엇이 저장됐는지 먼저 알린다
  return error?.partialMessage ? `${error.partialMessage} ${base}` : base
}

/** 서버 메시지에 입력란 이름이 들어 있으면 그 입력란을 고른다. fields는 { 입력란: ['찾을 낱말'] }이다. */
export function fieldFor(message, fields = {}) {
  for (const [field, words] of Object.entries(fields)) if (words.some((word) => message?.includes(word))) return field
  return ''
}

/**
 * run(task)는 저장 요청 하나를 실행한다. 요청 중에 다시 부르면 보내지 않는다.
 * 결과는 { ok, value } 또는 { ok: false, error }이고, 실패해도 입력값은 화면이 그대로 들고 있다.
 */
export function createSaveState({ fields } = {}) {
  const state = reactive({ status: 'idle', message: '', field: '', fieldMessage: '', error: null })
  const clear = { message: '', field: '', fieldMessage: '', error: null }
  async function run(task) {
    if (state.status === 'saving') return { ok: false, busy: true }
    Object.assign(state, clear, { status: 'saving' })
    try {
      const value = await task()
      Object.assign(state, clear, { status: 'saved' })
      return { ok: true, value }
    } catch (error) {
      error.kind ??= errorKind(error)
      const field = error.kind === 'invalid' ? fieldFor(error.message, fields) : ''
      Object.assign(state, {
        status: error.kind === 'conflict' ? 'conflict' : 'failed', error, field,
        fieldMessage: field ? error.message : '',
        message: field ? '저장하지 못했어요. 표시한 입력란을 확인해 주세요.' : saveFailureMessage(error),
      })
      return { ok: false, error }
    }
  }
  return { state, run, reset: () => Object.assign(state, clear, { status: 'idle' }) }
}
