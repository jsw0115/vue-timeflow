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
