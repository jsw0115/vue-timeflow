import { reactive, watch } from 'vue'

/**
 * AI 연동 설정 — 어떤 데이터를 어디까지 AI에게 보낼지, 어떤 산출물을 자동 생성할지 정한다.
 * 설계 원칙: (1) 기본은 전부 꺼짐, (2) 보내는 범위를 사용자가 항목 단위로 고른다,
 * (3) 업무·경력 등 민감 카테고리는 별도 동의 없이는 절대 포함하지 않는다,
 * (4) API 키 같은 비밀값은 브라우저에 저장하지 않는다. AI 준비 여부는 서버 제공 상태로만 판단한다(PR-05).
 */
const STORAGE_KEY = 'timeflow.ai.v1'

export const AI_PROVIDERS = [
  { id: 'none', label: '사용 안 함', note: 'AI 기능을 모두 끕니다' },
  { id: 'builtin', label: '기본 제공(서버)', note: '서비스 서버를 통해 처리해요' },
  { id: 'byok', label: '내 API 키 사용', note: '준비 중 · 키를 브라우저에 저장하지 않아요', disabled: true },
]

/** AI가 만들어주는 산출물 — 각각 어떤 입력이 필요한지 명시한다 */
export const AI_FEATURES = [
  {
    id: 'daily-report',
    title: '일일 업무보고 자동 초안',
    desc: '그날의 일정·할 일·집중 시간을 모아 보고 문장으로 정리해요',
    needs: ['일정', '할 일', '집중 시간'],
    sensitive: false,
  },
  {
    id: 'weekly-report',
    title: '주간/월간 리포트 요약',
    desc: '기간별 실행률과 편차를 요약하고 다음 기간 계획을 제안해요',
    needs: ['통계 집계값'],
    sensitive: false,
  },
  {
    id: 'wbs-draft',
    title: 'WBS 초안 생성',
    desc: '프로젝트 목표를 넣으면 작업 분해 구조와 예상 공수를 제안해요',
    needs: ['프로젝트 제목', '기간'],
    sensitive: false,
  },
  {
    id: 'retro-prompt',
    title: '회고 질문 추천',
    desc: '그날의 기록을 보고 회고에 쓸 질문을 골라줘요',
    needs: ['다이어리 제목'],
    sensitive: false,
  },
  {
    id: 'career-doc',
    title: '경력기술서 문장 다듬기',
    desc: '프로젝트 기록을 경력기술서 문장으로 바꿔줘요',
    needs: ['업무·경력 기록'],
    sensitive: true,
  },
]

/** AI에게 보낼 수 있는 데이터 범위 — 기본값은 최소 범위 */
export const AI_SCOPES = [
  { id: 'titles', label: '제목만', desc: '일정·할 일의 제목만 보냅니다' },
  { id: 'summary', label: '제목 + 집계값', desc: '제목과 시간·달성률 같은 숫자를 함께 보냅니다' },
  { id: 'full', label: '본문 포함', desc: '메모·다이어리 본문까지 보냅니다' },
]

/**
 * 저장하는 값은 아래 필드뿐이다. 나중에 상태에 필드가 늘어도 비밀값이 저장소에 섞이지 않게
 * 저장할 때마다 이 목록으로 다시 고른다.
 */
function sanitize(source) {
  const s = source && typeof source === 'object' && !Array.isArray(source) ? source : {}
  const usable = AI_PROVIDERS.filter((p) => !p.disabled).map((p) => p.id)
  const enabled = {}
  if (s.enabled && typeof s.enabled === 'object' && !Array.isArray(s.enabled)) {
    for (const f of AI_FEATURES) if (s.enabled[f.id] === true) enabled[f.id] = true
  }
  const flag = (value, fallback) => (typeof value === 'boolean' ? value : fallback)
  return {
    provider: usable.includes(s.provider) ? s.provider : 'none',
    scope: AI_SCOPES.some((x) => x.id === s.scope) ? s.scope : 'titles',
    enabled, // featureId -> true
    allowSensitive: flag(s.allowSensitive, false), // 업무·경력 기록 포함 여부(별도 동의)
    redactNames: flag(s.redactNames, true), // 사람 이름 가림
    keepHistory: flag(s.keepHistory, false), // 요청/응답 보관
  }
}

function save(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitize(settings)))
  } catch {
    // 저장할 수 없는 환경 — 세션 내 상태만 유지
  }
}

/** 저장값을 읽어 허용 필드만 남긴다. 예전 버전이 남긴 API 키가 있으면 바로 지운 값으로 다시 저장한다. */
function load() {
  let raw = null
  try {
    raw = localStorage.getItem(STORAGE_KEY)
  } catch {
    return { settings: sanitize(null), clearedKey: false }
  }
  if (raw === null) return { settings: sanitize(null), clearedKey: false }
  let parsed = null
  try {
    parsed = JSON.parse(raw)
  } catch {
    // 깨진 값은 읽을 수 없으니 기본값으로 덮어 키 문자열이 남지 않게 한다
  }
  const settings = sanitize(parsed)
  const legacyKey = parsed && typeof parsed === 'object' ? parsed.apiKey : undefined
  const clearedKey = legacyKey !== undefined && legacyKey !== null && String(legacyKey).trim() !== ''
  if (JSON.stringify(settings) !== raw) save(settings)
  return { settings, clearedKey }
}

const loaded = load()
let clearedKeyNotice = loaded.clearedKey

export const aiSettings = reactive(loaded.settings)

watch(aiSettings, (v) => save(v), { deep: true })

/** 이번 실행에서 예전 API 키를 지웠으면 한 번만 true를 돌려준다. 설정 화면이 안내를 띄울 때 쓴다. */
export function takeClearedKeyNotice() {
  const value = clearedKeyNotice
  clearedKeyNotice = false
  return value
}

/**
 * AI 준비 여부. available은 서버 `/api/integrations/capabilities`의 ai 값(useCapabilityStatus의 state.available)이다.
 * 서버가 true라고 답하지 않으면 준비되지 않은 것으로 본다. BYOK는 호출 경로가 없어 준비로 보지 않는다.
 */
export function isAiReady(available) {
  return available === true && aiSettings.provider === 'builtin'
}
export function isFeatureOn(id, available) {
  return !!aiSettings.enabled[id] && isAiReady(available)
}

/** 설정 화면 배지 문구. status는 useCapabilityStatus의 state({ available, busy, error })다. */
export function aiStatusBadge(status) {
  if (status.busy) return { text: '제공 상태 확인 중', ok: false }
  if (status.error) return { text: '제공 상태를 확인하지 못했어요', ok: false }
  if (status.available === false) return { text: 'AI 준비 중', ok: false }
  if (status.available === true) return isAiReady(true) ? { text: '사용 가능', ok: true } : { text: 'AI 사용 안 함', ok: false }
  return { text: '제공 상태 확인 중', ok: false }
}
export function toggleFeature(id) {
  const feature = AI_FEATURES.find((f) => f.id === id)
  // 민감 산출물은 별도 동의 없이는 켤 수 없다
  if (feature?.sensitive && !aiSettings.allowSensitive) return false
  aiSettings.enabled[id] = !aiSettings.enabled[id]
  return true
}
/** 민감 데이터 동의를 끄면, 그에 의존하던 기능도 함께 꺼진다 */
export function setAllowSensitive(value) {
  aiSettings.allowSensitive = value
  if (!value) AI_FEATURES.filter((f) => f.sensitive).forEach((f) => (aiSettings.enabled[f.id] = false))
}
