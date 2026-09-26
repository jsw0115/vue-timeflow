import { reactive, watch } from 'vue'

const STORAGE_KEY = 'timeflow.automations.v1'

/**
 * 자동화 카탈로그. Zapier식 커스텀 규칙 빌더 대신, 이미 존재하는 기능(메모 변환/AI 인사이트/
 * 정기 리포트)을 트리거→액션으로 묶은 "추천 자동화" 목록이라 새 도메인·백엔드 스케줄러 없이도
 * 사용자가 바로 켜고 끌 수 있다. params가 있는 항목만 인라인 설정값을 갖는다.
 */
export const AUTOMATION_CATALOG = [
  {
    id: 'memo-to-task',
    domain: '메모',
    title: '태그된 메모 자동으로 할 일 후보 전환',
    desc: '실행 가능한 문장이 담긴 메모를 자동으로 표시해 할 일로 옮기기 쉽게 해줘요',
    icon: '⇄',
  },
  {
    id: 'event-review-card',
    domain: '일정',
    title: '업무 일정 종료 후 회고 카드 자동 생성',
    desc: '‘업무’ 카테고리 일정이 끝나면 짧은 회고를 남길 수 있도록 카드를 미리 준비해요',
    icon: '✦',
  },
  {
    id: 'routine-streak-alert',
    domain: '루틴',
    title: '루틴 연속 실패 시 알림',
    desc: '지정한 일수 이상 연속으로 놓치면 알림으로 알려드려요',
    icon: '↻',
    param: { key: 'days', label: '연속 일수', min: 1, max: 14, unit: '일', default: 3 },
  },
  {
    id: 'overdue-reschedule',
    domain: '할 일',
    title: '지연된 할 일 골든타임에 재배치 제안',
    desc: '마감이 지난 할 일을 내일 오전 골든타임 시간대에 넣어볼지 제안해요',
    icon: '✓',
  },
  {
    id: 'weekly-report',
    domain: '리포트',
    title: '주간 갓생 리포트 이메일 발송',
    desc: '매주 월요일 오전 9시에 지난주 리포트를 이메일로 보내드려요',
    icon: '★',
  },
]

function defaultState() {
  const enabled = {}
  const params = {}
  for (const a of AUTOMATION_CATALOG) {
    // 이미 값이 있는 기능(메모 변환, 정기 리포트)은 기본 ON, 새로 제안하는 기능은 기본 OFF로 시작해
    // 사용자가 직접 켜보게 유도한다.
    enabled[a.id] = ['memo-to-task', 'weekly-report'].includes(a.id)
    if (a.param) params[a.id] = { [a.param.key]: a.param.default }
  }
  return { enabled, params }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const saved = loadState()
const initial = defaultState()

export const automationState = reactive({
  enabled: { ...initial.enabled, ...saved?.enabled },
  params: { ...initial.params, ...saved?.params },
})

watch(
  automationState,
  (val) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
    } catch {
      // localStorage를 쓸 수 없는 환경(시크릿 모드 등)에서는 세션 내 상태만 유지
    }
  },
  { deep: true },
)

export function automationById(id) {
  return AUTOMATION_CATALOG.find((a) => a.id === id)
}

export function isAutomationOn(id) {
  return !!automationState.enabled[id]
}

export function toggleAutomation(id) {
  automationState.enabled[id] = !automationState.enabled[id]
}

export function automationParam(id) {
  const a = automationById(id)
  if (!a?.param) return undefined
  return automationState.params[id]?.[a.param.key]
}

export function setAutomationParam(id, value) {
  const a = automationById(id)
  if (!a?.param) return
  if (!automationState.params[id]) automationState.params[id] = {}
  automationState.params[id][a.param.key] = value
}

export function automationsByDomain() {
  const groups = {}
  for (const a of AUTOMATION_CATALOG) {
    if (!groups[a.domain]) groups[a.domain] = []
    groups[a.domain].push(a)
  }
  return groups
}
