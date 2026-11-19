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
