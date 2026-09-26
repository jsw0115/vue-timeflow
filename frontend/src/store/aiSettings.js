import { reactive, watch } from 'vue'

/**
 * AI 연동 설정 — 어떤 데이터를 어디까지 AI에게 보낼지, 어떤 산출물을 자동 생성할지 정한다.
 * 설계 원칙: (1) 기본은 전부 꺼짐, (2) 보내는 범위를 사용자가 항목 단위로 고른다,
 * (3) 업무·경력 등 민감 카테고리는 별도 동의 없이는 절대 포함하지 않는다.
 */
const STORAGE_KEY = 'timeflow.ai.v1'

export const AI_PROVIDERS = [
  { id: 'none', label: '사용 안 함', note: 'AI 기능을 모두 끕니다' },
  { id: 'builtin', label: '기본 제공(서버)', note: '서비스 서버를 통해 처리해요' },
  { id: 'byok', label: '내 API 키 사용', note: '내 키로 직접 호출해요 · 키는 이 기기에만 저장' },
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

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export const aiSettings = reactive(
  load() ?? {
    provider: 'none',
    apiKey: '',
    scope: 'titles',
    enabled: {}, // featureId -> boolean
    allowSensitive: false, // 업무·경력 기록 포함 여부(별도 동의)
    redactNames: true, // 사람 이름 가림
    keepHistory: false, // 요청/응답 보관
  },
)

watch(
  aiSettings,
  (v) => {
    try {
      // API 키는 저장하되 이 기기 밖으로 나가지 않는다
      localStorage.setItem(STORAGE_KEY, JSON.stringify(v))
    } catch {
      // 저장할 수 없는 환경 — 세션 내 상태만 유지
    }
  },
  { deep: true },
)

export function isAiReady() {
  if (aiSettings.provider === 'none') return false
  if (aiSettings.provider === 'byok' && !aiSettings.apiKey.trim()) return false
  return true
}
export function isFeatureOn(id) {
  return !!aiSettings.enabled[id] && isAiReady()
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
