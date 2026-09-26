import { reactive, watch } from 'vue'

const STORAGE_KEY = 'timeflow.modeProfiles.v1'

/**
 * 도메인별 글양식 필드 카탈로그. locked 필드는 항상 표시되는 필수 항목이라 토글 대상이 아니다.
 */
export const FIELD_CATALOG = {
  event: {
    label: '일정',
    fields: [
      { key: 'date', label: '날짜', locked: true },
      { key: 'time', label: '시간', locked: true },
      { key: 'category', label: '카테고리' },
      { key: 'repeat', label: '반복' },
      { key: 'reminder', label: '알림' },
      { key: 'location', label: '장소' },
      { key: 'visibility', label: '공개 범위' },
      { key: 'attendees', label: '참석자 초대' },
      { key: 'memo', label: '메모' },
    ],
  },
  routine: {
    label: '루틴',
    fields: [
      { key: 'days', label: '반복 요일', locked: true },
      { key: 'time', label: '시간', locked: true },
      { key: 'category', label: '카테고리' },
      { key: 'reminder', label: '알림' },
      { key: 'goal', label: '목표 횟수' },
      { key: 'memo', label: '메모' },
    ],
  },
  task: {
    label: '업무',
    fields: [
      { key: 'due', label: '마감일', locked: true },
      { key: 'priority', label: '우선순위' },
      { key: 'category', label: '카테고리' },
      { key: 'planTime', label: 'Plan 시간대' },
      { key: 'memo', label: '메모' },
      { key: 'subtasks', label: '서브태스크' },
      { key: 'reviewCard', label: '복습 카드 자동 생성' },
    ],
  },
}

/**
 * J/P/B는 MBTI의 판단(J)·인식(P) 선호 축에서 이름을 땄다.
 * - J형: 계획을 촘촘히 세우고 그대로 실행하는 걸 편하게 느낀다 → 반복/알림/우선순위/체크리스트 같은
 *   구조적 필드를 기본으로 많이 켜둔다.
 * - P형: 큰 흐름만 잡고 상황에 따라 유연하게 움직이는 걸 편하게 느낀다 → 필수 필드만 남기고
 *   반복·알림·마감 압박 요소는 기본으로 끈 채 자유 메모 위주로 남긴다.
 * - B(밸런스): 둘을 고루 섞은 중간값.
 */
const MODE_META = {
  J: { name: 'J형 · 계획형', desc: '촘촘히 계획하고 그대로 실행하는 걸 선호해요' },
  P: { name: 'P형 · 즉흥형', desc: '큰 흐름만 잡고 유연하게 움직이는 걸 선호해요' },
  B: { name: '밸런스형', desc: '계획과 즉흥함을 고루 섞어서 관리해요' },
}

function defaultFieldsFor(mode, domain) {
  const presets = {
    // J형: 세부 옵션을 최대한 펼쳐서 촘촘하게 기록 — 반복/알림/체크리스트/복습까지 구조를 다 챙긴다
    J: {
      event: ['category', 'repeat', 'reminder', 'location', 'visibility', 'attendees'],
      routine: ['category', 'reminder', 'goal'],
      task: ['priority', 'category', 'planTime', 'subtasks', 'reviewCard', 'memo'],
    },
    // P형: 제목 외엔 최소한만 — 반복·알림·목표치 같은 고정/압박 요소는 끄고 자유 메모만 남긴다
    P: {
      event: ['category', 'memo'],
      routine: ['category', 'memo'],
      task: ['category', 'memo'],
    },
    // 밸런스: 구조와 자유 사이 중간값
    B: {
      event: ['category', 'reminder', 'location', 'memo'],
      routine: ['category', 'reminder', 'goal'],
      task: ['priority', 'category', 'planTime', 'memo'],
    },
  }
  return presets[mode][domain]
}

function buildInitialProfiles() {
  const profiles = {}
  for (const mode of Object.keys(MODE_META)) {
    const fields = {}
    for (const domain of Object.keys(FIELD_CATALOG)) {
      fields[domain] = defaultFieldsFor(mode, domain)
    }
    profiles[mode] = {
      versions: [{ version: 1, updatedAt: new Date().toISOString(), fields }],
    }
  }
  return profiles
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

export const modeState = reactive({
  activeMode: saved?.activeMode ?? 'J',
  profiles: saved?.profiles ?? buildInitialProfiles(),
})

watch(
  modeState,
  (val) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
    } catch {
      // localStorage를 쓸 수 없는 환경(시크릿 모드 등)에서는 세션 내 상태만 유지
    }
  },
  { deep: true },
)

export function modeMeta(mode) {
  return MODE_META[mode]
}

export function currentVersion(mode) {
  const versions = modeState.profiles[mode].versions
  return versions[versions.length - 1]
}

export function currentFields(mode, domain) {
  return currentVersion(mode).fields[domain]
}

export function isFieldOn(mode, domain, key) {
  return currentFields(mode, domain).includes(key)
}

/**
 * 새 버전을 이력 끝에 추가한다. 기존 버전은 절대 수정하지 않는다 — 이미 작성된 글은
 * 작성 시점의 버전 번호를 스냅샷으로 들고 있으므로, 이후 여기서 설정이 바뀌어도 영향받지 않는다.
 */
export function saveNewVersion(mode, updatedDomainFields) {
  const versions = modeState.profiles[mode].versions
  const next = {
    version: versions.length + 1,
    updatedAt: new Date().toISOString(),
    fields: updatedDomainFields,
  }
  versions.push(next)
  return next
}

/** 지금 이 순간 활성 모드/버전을 기준으로, 새로 작성되는 글에 찍어둘 스냅샷을 만든다. */
export function snapshotFor(domain) {
  const mode = modeState.activeMode
  const v = currentVersion(mode)
  return { mode, version: v.version, domain, fields: [...v.fields[domain]] }
}

/**
 * 글양식 외에 홈/플래너/알림/AI 리포트에서도 J·P·B 성향이 드러나도록 하는 콘텐츠·기본값 세트.
 * J형은 계획·마감·체크리스트가 앞서 보이도록, P형은 자유 기록·흐름이 앞서 보이도록 구성한다.
 */
export const MODE_CONTENT = {
  J: {
    home: {
      heroLabel: "TODAY'S PLAN",
      heroTitle: '오늘 계획한 일,<br />순서대로 끝내볼까요?',
      heroPlaceholder: '오전 보고서 초안 마무리하기',
      heroCta: '오늘의 계획 저장하기 →',
      cardOrder: { events: 1, routine: 2, dday: 3 },
    },
    planner: {
      cardOrder: { tasks: 1, timeline: 2 },
      reviewPrompt: '계획 대비 실행률과 남은 일을 짧게 정리해보세요',
    },
    notifications: {
      defaults: { '일정 리마인더': true, '루틴 리마인더': true, '회고 작성 알림': true },
    },
    aiReport: {
      summary: '계획 실행률이 꾸준히 오르고 있어요. 다만 저녁 시간대 미루기 패턴이 3회 반복됐어요.',
      insightTitle: '⚠ 미루기 패턴 감지',
      insightBody: '‘분기 보고서 작성’ 할 일이 3일 연속 다음날로 이월됐어요. 오전 집중 시간대(9~11시)에 먼저 배치해보는 건 어떨까요?',
    },
  },
  P: {
    home: {
      heroLabel: "TODAY'S FLOW",
      heroTitle: '오늘은 어떤 흐름으로<br />흘러가고 있나요?',
      heroPlaceholder: '마음 가는 대로 하루 흘려보내기',
      heroCta: '오늘의 기분 저장하기 →',
      cardOrder: { routine: 1, events: 2, dday: 3 },
    },
    planner: {
      cardOrder: { timeline: 1, tasks: 2 },
      reviewPrompt: '오늘 있었던 일 중 기억에 남는 순간을 자유롭게 적어보세요',
    },
    notifications: {
      defaults: { '일정 리마인더': true, '루틴 리마인더': false, '회고 작성 알림': false },
    },
    aiReport: {
      summary: '이번 주는 저녁 시간대에 여유로운 흐름이 이어졌어요. 루틴은 느슨했지만 다이어리는 꾸준히 남겼어요.',
      insightTitle: '✦ 이번 주 흐름',
      insightBody: '저녁 시간대에 기록이 몰리는 편이에요. 마음 내킬 때 짧게라도 남겨두면 나중에 흐름을 되짚기 편해요.',
    },
  },
  B: {
    home: {
      heroLabel: "TODAY'S INTENTION",
      heroTitle: '중요한 한 가지에<br />집중해 볼까요?',
      heroPlaceholder: '작지만 확실한 진전을 만들기',
      heroCta: '의도 저장하기 →',
      cardOrder: { events: 1, routine: 2, dday: 3 },
    },
    planner: {
      cardOrder: { timeline: 1, tasks: 2 },
      reviewPrompt: '잘한 점, 아쉬운 점, 내일을 위해...',
    },
    notifications: {
      defaults: { '일정 리마인더': true, '루틴 리마인더': true, '회고 작성 알림': false },
    },
    aiReport: {
      summary: '계획 실행률과 루틴 달성률이 고르게 유지되고 있어요. 저녁 시간대 미루기 패턴이 3회 있었어요.',
      insightTitle: '⚠ 미루기 패턴 감지',
      insightBody: '‘분기 보고서 작성’ 할 일이 3일 연속 다음날로 이월됐어요. 오전 집중 시간대(9~11시)에 먼저 배치해보는 건 어떨까요?',
    },
  },
}

export function modeContent(mode) {
  return MODE_CONTENT[mode]
}
