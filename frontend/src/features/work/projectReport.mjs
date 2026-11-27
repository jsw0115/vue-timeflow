// 업무 보고서 초안(PR-19 UF-138, Q-35): 요청 경로, 기간 고르기, 초안 문장. 서버 ProjectActuals가 계산하고 화면은 문장만 만든다. 자동 발송은 없다.

const base = (projectId) => `/api/work/projects/${encodeURIComponent(projectId)}`
const query = (from, to) => `?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
export const REPORT_PATH = '/api/reports/'

/** 저장 키. 서버 ReportController는 영문·숫자·_·- 100자까지만 받는다. 맞지 않으면 null(저장 불가)이다. */
export function draftKey(projectId, from, to) {
  const key = `wd-${projectId}-${from}-${to}`
  return /^[A-Za-z0-9_-]{1,100}$/.test(key) ? key : null
}

export function createProjectReportClient(request) {
  return {
    candidates: (projectId, from, to) => request(`${base(projectId)}/actuals${query(from, to)}`),
    link: (projectId, actualId) => request(`${base(projectId)}/actuals`, { method: 'POST', body: JSON.stringify({ actualId }) }),
    unlink: (projectId, actualId) => request(`${base(projectId)}/actuals/${encodeURIComponent(actualId)}`, { method: 'DELETE' }),
    draft: (projectId, from, to) => request(`${base(projectId)}/report-draft${query(from, to)}`),
    /** 저장한 초안. 없으면 null이다. */
    async saved(key) {
      try { return await request(REPORT_PATH + key) } catch (error) { if (error?.status === 404) return null; throw error }
    },
    save: (key, { title, body, date }, version) => request(REPORT_PATH + key, { method: 'POST', body: JSON.stringify({ title, body, date, category: 'work-draft', ...(version ? { version } : {}) }) }),
  }
}

const iso = (d) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
const fromIso = (value) => new Date(value + 'T00:00:00Z')
const addDays = (value, n) => { const d = fromIso(value); d.setUTCDate(d.getUTCDate() + n); return iso(d) }

/** 기간 고르기. 주는 월요일에 시작한다. today는 계정 기준 오늘(YYYY-MM-DD)이다. */
export const PERIODS = [
  { id: 'this-week', label: '이번 주' },
  { id: 'last-week', label: '지난주' },
  { id: 'this-month', label: '이번 달' },
  { id: 'custom', label: '직접 고르기' },
]
export function periodRange(id, today) {
  const monday = addDays(today, -((fromIso(today).getUTCDay() + 6) % 7))
  if (id === 'this-week') return { from: monday, to: addDays(monday, 6) }
  if (id === 'last-week') return { from: addDays(monday, -7), to: addDays(monday, -1) }
  if (id === 'this-month') {
    const d = fromIso(today)
    return { from: iso(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))), to: iso(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0))) }
  }
  return null
}

export const hm = (minutes) => { const m = Math.max(0, Math.round(Number(minutes) || 0)); return `${Math.floor(m / 60)}시간 ${m % 60}분` }
const shortDate = (value) => { const d = new Date(value); return Number.isNaN(d.getTime()) ? '' : `${d.getMonth() + 1}/${d.getDate()}` }

/** 서버 초안 재료로 만든 보고서 문장. 사용자가 고쳐 저장할 수 있고, 고쳐도 원본 기록은 바뀌지 않는다. */
export function draftText(summary) {
  const lines = [
    `[${summary.projectTitle} 업무 보고 · ${summary.from} ~ ${summary.to}]`,
    '',
    `· 실제 시간: ${hm(summary.actualMinutes)} (실제 기록 ${summary.sessions.length}건)`,
    '',
    '완료한 작업',
    ...(summary.done.length ? summary.done.map((t) => `- ${t.title}`) : ['- 없음']),
    '',
    '남은 작업',
    ...(summary.remaining.length ? summary.remaining.map((t) => `- ${t.title} (진척 ${t.progress}%)`) : ['- 없음']),
    '',
    '실제 기록',
    ...(summary.sessions.length ? summary.sessions.map((s) => `- ${shortDate(s.startedAt)} ${s.title} ${hm(s.minutes)}`) : ['- 없음']),
  ]
  return lines.join('\n')
}

export function reportErrorText(error) {
  if (error?.status === 400) return error.message || '기간이나 프로젝트를 확인해 주세요.'
  if (error?.status === 404) return '그 프로젝트나 기록을 찾을 수 없어요. 목록을 새로 불러와 주세요.'
  if (error?.status === 409) return '다른 곳에서 먼저 저장했어요. 저장한 초안을 다시 불러온 뒤 고쳐 주세요.'
  if (error?.status == null || error.status === 0) return '서버에 연결하지 못했어요. 연결을 확인하고 다시 시도해 주세요.'
  return '보고서 초안을 처리하지 못했어요. 잠시 뒤 다시 시도해 주세요.'
}
