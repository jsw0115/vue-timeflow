// 다이어리·메모·D-Day·머니로그의 서버 필드와 화면 값 변환을 정한다(PR-07 6단계). createFeatureStore에 그대로 넘긴다.
import { moodCode } from '../../utils/mood.mjs'
import { dDayLabel, ddayDateLabel, legacyIsoDate } from '../../utils/dday.mjs'

/** 기분은 코드로 보내고, 서버에 남은 예전 값도 코드로 읽는다(Q-07). */
export const diaryKind = {
  kind: 'diary', path: '/api/diaries', fields: ['title', 'body', 'date', 'mood', 'tags'], demoFields: ['title', 'date'],
  toLocal: (row) => ({ ...row, mood: moodCode(row.mood) ?? undefined }),
  toBody: (item, pick) => ({ ...pick(item), ...(item.mood !== undefined ? { mood: moodCode(item.mood) ?? undefined } : {}) }),
}

/** 메모 화면의 time은 표시용이다. 서버 날짜(date, 없으면 서버가 오늘로 채움)를 보인다. */
export const memoKind = {
  kind: 'memo', path: '/api/memos', fields: ['title', 'body', 'date', 'color', 'actionable', 'tags'], demoFields: ['title', 'body'],
  toLocal: (row) => ({ ...row, time: row.date ?? '' }),
}

/** 화면의 date는 "12월 5일" 같은 표시 문구이고, 서버로는 ISO 날짜(isoDate)를 보낸다. 남은 날은 읽을 때마다 계산한다. */
export const ddayKind = {
  kind: 'dday', path: '/api/ddays', fields: ['title', 'body', 'date', 'category', 'pinned', 'notifyDays'], demoFields: ['title', 'date'],
  toLocal: (row) => ({ ...row, isoDate: row.date, date: ddayDateLabel(row.date), dday: dDayLabel(row.date) }),
  toBody: (item, pick) => ({ ...pick(item), date: item.isoDate ?? null }),
  prepare: (item, today) => (item.isoDate ? item : { ...item, isoDate: legacyIsoDate(item.date, today) }),
  notes: (items, today) => ({ yearGuessed: items.filter((item) => !item.isoDate && legacyIsoDate(item.date, today)).length }),
}

export const moneyKind = {
  kind: 'money', path: '/api/money/entries', fields: ['title', 'body', 'date', 'amount', 'type', 'category'], demoFields: ['title', 'date', 'amount'],
}

/** 경력기술서 성과는 입력란에서 한 줄에 하나씩 쓴다. */
export const achievementsFromText = (text) => String(text ?? '').split('\n').map((line) => line.trim()).filter(Boolean)

/** 경력 프로젝트(PR-07 7단계). 서버 필수 값은 title·role이다. */
export const careerKind = {
  kind: 'career', path: '/api/work/career/projects', fields: ['title', 'period', 'role', 'company', 'stack', 'achievements'], demoFields: ['title'],
  toLocal: (row) => ({ ...row, achievements: row.achievements ?? [] }),
}

/** 포트폴리오 항목. 화면의 수정일은 서버 수정 시각의 날짜다. */
export const portfolioKind = {
  kind: 'portfolio', path: '/api/work/portfolio', fields: ['title', 'body', 'kind'], demoFields: ['title'],
  toLocal: (row) => ({ ...row, updated: String(row.updatedAt ?? '').slice(0, 10).replaceAll('-', '.') }),
}

/** 업무 기록 종류. 서버(FeatureInput.validateWork)가 받는 다섯 가지다(PR-10 4단계). */
export const WORK_TYPES = ['연차', '반차', '외근', '출장', '이직']

/** 종류에 필요한 필드만 보낸다. 반차의 사용 일수(0.5)는 서버가 채운다. */
function workRecordBody(item) {
  const out = { title: item.title, type: item.type, owner: item.owner, status: item.status, startDate: item.startDate, endDate: item.endDate, startTime: item.startTime, endTime: item.endTime }
  if (String(item.body ?? '').trim()) out.body = item.body
  if (item.projectId !== undefined && item.projectId !== null && item.projectId !== '') out.projectId = String(item.projectId)
  if (item.type === '연차') out.leaveDays = item.leaveDays
  if (item.type === '반차') out.half = item.half
  if (['외근', '출장'].includes(item.type)) Object.assign(out, { location: item.location, partner: item.partner })
  if (item.type === '출장') Object.assign(out, { transport: item.transport, expense: item.expense })
  if (item.type === '이직') Object.assign(out, { fromCompany: item.fromCompany, toCompany: item.toCompany, role: item.role, handover: item.handover })
  return out
}

export const workRecordKind = {
  kind: 'work-record', path: '/api/work/records',
  fields: ['title', 'body', 'type', 'owner', 'projectId', 'status', 'startDate', 'endDate', 'startTime', 'endTime', 'half', 'leaveDays', 'location', 'partner', 'transport', 'expense', 'fromCompany', 'toCompany', 'role', 'handover'],
  demoFields: ['title', 'type', 'startDate'],
  toBody: (item) => workRecordBody(item),
}

/** 부모 ID는 서버 ID 문자열이나 null로 보낸다. 빈 문자열 날짜·담당은 보내지 않는다. */
function withParent(out, item) {
  out.parentId = item.parentId === undefined || item.parentId === null || item.parentId === '' ? null : String(item.parentId)
  for (const key of ['startDate', 'endDate', 'owner']) if (out[key] === '') delete out[key]
  return out
}

/** WBS 노드. 부모가 있는 계층이라 로컬 자료 이전은 부모를 먼저 옮긴다(parentField). */
export const wbsKind = {
  kind: 'wbs', path: '/api/work/wbs/nodes', fields: ['title', 'body', 'parentId', 'md', 'progress', 'owner', 'open', 'startDate', 'endDate'], demoFields: ['title', 'md', 'progress'],
  toBody: (item, pick) => withParent(pick(item), item), parentField: 'parentId',
}

/** 업무 위키. 화면의 수정일은 서버 수정 시각의 날짜이고, 작성자는 본인이다(업무 자료는 본인만 본다). */
export const wikiKind = {
  kind: 'wiki', path: '/api/work/wiki', fields: ['title', 'body', 'space', 'parentId', 'pinned'], demoFields: ['title', 'space'],
  toBody: (item, pick) => withParent(pick(item), item), parentField: 'parentId',
  toLocal: (row) => ({ ...row, parentId: row.parentId ?? null, updatedAt: String(row.updatedAt ?? '').slice(0, 10), author: '나' }),
}
