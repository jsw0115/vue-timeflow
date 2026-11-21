// 커리어 활동·지원 기록의 서버 필드 변환, 화면 라벨, 마감·진행 요약, 목표별 대시보드 순서를 정한다(docs/design 03·04·11).

/** 활동 유형. 서버 FeatureInput.ACTIVITY_TYPES와 같은 순서다. */
export const ACTIVITY_TYPES = [
  { id: 'work', label: '회사 업무' },
  { id: 'intern', label: '인턴' },
  { id: 'part-time', label: '아르바이트' },
  { id: 'freelance', label: '프리랜서' },
  { id: 'project', label: '개인 프로젝트' },
  { id: 'study', label: '학습' },
  { id: 'community', label: '커뮤니티 활동' },
]

/** 지원 상태. 서버 FeatureInput.APPLICATION_STATUSES와 같은 순서다. closed는 진행이 끝난 상태다. */
export const APPLICATION_STATUSES = [
  { id: 'interested', label: '관심' },
  { id: 'preparing', label: '준비 중' },
  { id: 'applied', label: '지원 완료' },
  { id: 'screening-passed', label: '서류 통과' },
  { id: 'interview', label: '면접 예정' },
  { id: 'accepted', label: '최종 합격', closed: true },
  { id: 'rejected', label: '불합격', closed: true },
  { id: 'on-hold', label: '보류' },
  { id: 'withdrawn', label: '철회', closed: true },
]

/**
 * 커리어 목표(사용자 유형). 첫 화면에서 먼저 보일 영역 순서만 바꾸고 권한·공개 범위는 바꾸지 않는다(docs/design 03 §5).
 * sections는 대시보드 영역 ID 순서다.
 */
export const CAREER_GOALS = [
  { id: 'job-seeker', label: '취업 준비', desc: '지원 마감과 진행 단계, 학습·프로젝트 기록을 먼저 보여요.', sections: ['deadlines', 'pipeline', 'activities', 'documents', 'experiences'] },
  { id: 'job-changer', label: '이직 준비', desc: '최근 업무 기록과 경력, 지원 현황을 먼저 보여요.', sections: ['activities', 'experiences', 'pipeline', 'deadlines', 'documents'] },
  { id: 'employee', label: '재직 중 성장', desc: '업무 기록과 경력 정리를 먼저 보여요. 지원 현황은 뒤로 보내요.', sections: ['activities', 'experiences', 'documents', 'deadlines', 'pipeline'] },
  { id: 'project-member', label: '프로젝트 참여', desc: '프로젝트·학습 활동과 결과물 정리를 먼저 보여요.', sections: ['activities', 'documents', 'experiences', 'deadlines', 'pipeline'] },
]
export const DEFAULT_GOAL = 'job-seeker'

const labelOf = (list, id) => list.find((entry) => entry.id === id)?.label ?? id
export const activityTypeLabel = (id) => labelOf(ACTIVITY_TYPES, id)
export const applicationStatusLabel = (id) => labelOf(APPLICATION_STATUSES, id)
export const goalOf = (id) => CAREER_GOALS.find((goal) => goal.id === id) ?? CAREER_GOALS.find((goal) => goal.id === DEFAULT_GOAL)
export const isClosedStatus = (id) => APPLICATION_STATUSES.some((entry) => entry.id === id && entry.closed)

/** 줄바꿈·쉼표로 쓴 값을 배열로 바꾼다. 빈 값과 중복은 뺀다. */
export function listFromText(text) {
  const out = []
  for (const part of String(text ?? '').split(/[\n,]/)) {
    const value = part.trim()
    if (value && !out.includes(value)) out.push(value)
  }
  return out
}

/** http·https 절대 주소만 링크로 쓴다(서버와 같은 규칙). javascript: 같은 스킴은 링크로 만들지 않는다. */
export function isWebUrl(value) {
  try {
    const url = new URL(String(value ?? '').trim())
    return (url.protocol === 'http:' || url.protocol === 'https:') && Boolean(url.hostname)
  } catch {
    return false
  }
}

/** 화면 값 → 서버 본문. 빈 문자열 날짜·선택 필드는 보내지 않는다. 공개 범위는 항상 비공개다. */
export const activityKind = {
  kind: 'career-activity', path: '/api/career/activities',
  fields: ['title', 'body', 'activityType', 'date', 'endDate', 'experienceId', 'role', 'skillTags', 'achievements', 'links', 'tags'],
  demoFields: ['title', 'date'],
  toBody: (item, pick) => {
    const out = pick(item)
    for (const key of ['endDate', 'experienceId', 'role', 'body']) if (out[key] === '' || out[key] === null) delete out[key]
    out.visibility = 'private'
    return out
  },
  toLocal: (row) => ({ ...row, skillTags: row.skillTags ?? [], achievements: row.achievements ?? [], links: row.links ?? [] }),
}

export const applicationKind = {
  kind: 'job-application', path: '/api/career/applications',
  fields: ['title', 'company', 'postingUrl', 'employmentType', 'workType', 'salaryRange', 'deadline', 'appliedDate', 'interviewDate', 'status', 'body'],
  demoFields: ['title', 'company'],
  toBody: (item, pick) => {
    const out = pick(item)
    for (const key of ['postingUrl', 'employmentType', 'workType', 'salaryRange', 'deadline', 'appliedDate', 'interviewDate', 'body']) if (out[key] === '' || out[key] === null) delete out[key]
    return out
  },
}

const DAY = 86400000
const dayNumber = (iso) => Math.round(Date.parse(iso + 'T00:00:00Z') / DAY)

/** 오늘(YYYY-MM-DD) 기준 남은 날. 지난 날은 음수다. */
export function daysUntil(isoDate, today) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate ?? '')) return null
  return dayNumber(isoDate) - dayNumber(today)
}

/** 남은 날 문구. 지난 마감도 비난하지 않는 중립 문구로 보인다(DESIGN.md 비난하지 않는 피드백). */
export function dueLabel(days) {
  if (days === null || days === undefined) return ''
  if (days === 0) return '오늘'
  if (days > 0) return `${days}일 남음`
  return `${-days}일 지남`
}

/**
 * 다가오는 일정: 진행 중인 지원의 마감·면접 날짜를 날짜순으로 모은다. 기간은 오늘부터 withinDays일까지다.
 * 끝난 지원(합격·불합격·철회)은 뺀다.
 */
export function upcomingDates(applications, today, withinDays = 14) {
  const rows = []
  for (const app of applications) {
    if (isClosedStatus(app.status)) continue
    for (const [field, label] of [['deadline', '지원 마감'], ['interviewDate', '면접']]) {
      const days = daysUntil(app[field], today)
      if (days === null || days < 0 || days > withinDays) continue
      rows.push({ id: `${app.id}:${field}`, appId: app.id, label, date: app[field], days, title: app.title, company: app.company })
    }
  }
  return rows.sort((a, b) => a.days - b.days || a.title.localeCompare(b.title))
}

/** 상태별 지원 수. 0건 상태도 순서대로 돌려 표의 분모가 보이게 한다. */
export function pipelineCounts(applications) {
  return APPLICATION_STATUSES.map((status) => ({ ...status, count: applications.filter((app) => app.status === status.id).length }))
}

/** 이력서 기본 정보 입력 현황. 분모(전체 항목 수)를 함께 돌려 숫자의 근거를 보인다(docs/design 11 §4.1). */
export const RESUME_FIELDS = [
  { id: 'name', label: '이름' }, { id: 'headline', label: '한 줄 소개' }, { id: 'years', label: '경력' },
  { id: 'skills', label: '보유 기술' }, { id: 'education', label: '학력' },
]
export function resumeProgress(resume) {
  const filled = RESUME_FIELDS.filter(({ id }) => {
    const value = resume?.[id]
    return typeof value === 'number' ? Number.isFinite(value) : String(value ?? '').trim() !== ''
  })
  return { filled: filled.length, total: RESUME_FIELDS.length, missing: RESUME_FIELDS.filter((field) => !filled.includes(field)).map((field) => field.label) }
}

/** 최근 활동: 날짜 내림차순 limit건. */
export function recentActivities(activities, limit = 5) {
  return [...activities].sort((a, b) => String(b.date ?? '').localeCompare(String(a.date ?? '')) || String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''))).slice(0, limit)
}

/** 활동을 월(YYYY-MM)별로 묶는다. 타임라인 화면이 월 머리글을 붙인다. */
export function groupByMonth(activities) {
  const groups = new Map()
  for (const activity of recentActivities(activities, activities.length)) {
    const month = String(activity.date ?? '').slice(0, 7) || '날짜 없음'
    if (!groups.has(month)) groups.set(month, [])
    groups.get(month).push(activity)
  }
  return [...groups].map(([month, items]) => ({ month, label: /^\d{4}-\d{2}$/.test(month) ? `${month.slice(0, 4)}년 ${Number(month.slice(5))}월` : month, items }))
}
