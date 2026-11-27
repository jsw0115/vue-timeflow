import { reactive } from 'vue'
import { localCollection } from './localCollection'
import { createFeatureStore } from '../features/records/featureStore.mjs'
import { ddayKind } from '../features/records/featureKinds.mjs'
import { saveFailureMessage } from '../features/records/saveState.mjs'
import { dDayLabel, ddayDateLabel } from '../utils/dday.mjs'
import { korean } from '../features/i18n/translate.mjs'

// 남은 날 계산은 utils/dday.mjs에 있다. 예전 계산은 ISO 날짜를 UTC로 읽어 한국 시간에서 오늘을 D-1로 보였다(PR-07 6단계에서 바로잡음)
export { dDayLabel }

// 시연 기본 D-Day. origin: 'demo'로 표시해 로그인할 때 계정으로 옮기지 않는다(Q-11)
export const DDAY_SEEDS = [
  { id: 1, title: '엄마 생신', category: '가족', date: '8월 31일 · 저녁 식사', dday: 'D-7', pinned: true, notifyDays: [7, 1], origin: 'demo' },
  { id: 2, title: '분기 보고서 제출', category: '업무', date: '9월 5일 · 마감', dday: 'D-12', pinned: true, notifyDays: [3, 1, 0], origin: 'demo' },
  { id: 3, title: '건강검진 예약일', category: '건강', date: '9월 12일 · 오전 10시', dday: 'D-19', pinned: false, notifyDays: [1], origin: 'demo' },
  { id: 4, title: '자격증 시험', category: '공부', date: '10월 2일', dday: 'D-39', pinned: false, notifyDays: [30, 7, 1], origin: 'demo' },
  { id: 5, title: '여행 출발일', category: '개인', date: '10월 18일', dday: 'D-55', pinned: false, notifyDays: [], origin: 'demo' },
]
/** D-Day. 로그인하면 계정의 서버 목록(/api/ddays), 로그아웃이면 이 브라우저의 목록이다(PR-07 6단계). */
export const ddayStore = createFeatureStore({ local: localCollection('ddays', DDAY_SEEDS.map(item => ({ ...item, notifyDays: [...item.notifyDays] }))), ...ddayKind })
export const ddays = ddayStore.list
/** 목록에서 바로 저장하는 동작(고정)의 실패 안내 */
export const ddayNotice = reactive({ message: '' })

export function isPast(dday) {
  return typeof dday === 'string' && dday.startsWith('D+')
}

/** 고정 토글. 저장한 D-Day를 돌려주고, 실패하면 안내만 하고 null을 돌려준다. */
export async function togglePin(item) {
  ddayNotice.message = ''
  try {
    return await ddayStore.update(item, { pinned: !item.pinned })
  } catch (error) {
    if (error.kind === 'stale') return null
    ddayNotice.message = error.kind === 'conflict' ? '다른 곳에서 먼저 바뀌어 최신 내용으로 바꿨어요. 확인한 뒤 다시 눌러 주세요.' : saveFailureMessage(error)
    return null
  }
}

export function findDday(id) {
  return ddays.value.find((d) => String(d.id) === String(id))
}

/** 알림 시점 프리셋 — 며칠 전에 알릴지 (0 = 당일) */
export const NOTIFY_OPTIONS = [
  { days: 0, label: '당일' },
  { days: 1, label: '1일 전' },
  { days: 3, label: '3일 전' },
  { days: 7, label: '1주 전' },
  { days: 14, label: '2주 전' },
  { days: 30, label: '한 달 전' },
]
/** 알림 시점 이름. t는 화면 표시용 번역(기본 한국어)이다. */
export function notifyLabel(item, t = korean) {
  const list = item?.notifyDays ?? []
  if (!list.length) return t('알림 없음')
  return list
    .slice()
    .sort((a, b) => b - a)
    .map((d) => { const label = NOTIFY_OPTIONS.find((o) => o.days === d)?.label; return label ? t(label) : t('{n}일 전', { n: d }) })
    .join(' · ')
}
export function toggleNotifyDay(item, days) {
  if (!item.notifyDays) item.notifyDays = []
  const i = item.notifyDays.indexOf(days)
  if (i >= 0) item.notifyDays.splice(i, 1)
  else item.notifyDays.push(days)
}

/** 새 D-Day. 로그아웃 상태에서도 ISO 날짜(isoDate)를 함께 남겨, 로그인할 때 연도까지 옮길 수 있게 한다. */
export async function addDday({ title, category, date, notifyDays, body = '' }) {
  const created = await ddayStore.create({
    title,
    body,
    category,
    isoDate: date || undefined,
    date: date ? ddayDateLabel(date) : '날짜 미정',
    dday: dDayLabel(date),
    pinned: false,
    notifyDays: notifyDays ?? [1],
  })
  return created.id
}

/** base는 상세를 연 때의 D-Day다. 그 version으로 보내 다른 곳의 변경을 모르고 덮어쓰지 않는다. */
export async function updateDday(id, { title, category, date, body }, base = findDday(id)) {
  if (!base) return null
  return ddayStore.update(base, {
    title,
    category,
    ...(body !== undefined ? { body } : {}),
    ...(date ? { isoDate: date, date: ddayDateLabel(date), dday: dDayLabel(date) } : {}),
  })
}

export async function removeDday(id, base = findDday(id)) {
  if (base) await ddayStore.remove(base)
}
