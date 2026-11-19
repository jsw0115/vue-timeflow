import { localCollection } from './localCollection'
import { createFeatureStore } from '../features/records/featureStore.mjs'
import { moneyKind } from '../features/records/featureKinds.mjs'

// 시연 기본 머니로그. origin: 'demo'로 표시해 로그인할 때 계정으로 옮기지 않는다(Q-11)
export const MONEY_SEEDS = [
  { id: 1, title: '월급', date: '2026-08-25', amount: 3200000, type: 'in', category: '수입', origin: 'demo' },
  { id: 2, title: '점심 식대', date: '2026-08-24', amount: -12000, type: 'out', category: '식비', origin: 'demo' },
  { id: 3, title: '헬스장 등록', date: '2026-08-20', amount: -89000, type: 'out', category: '건강', origin: 'demo' },
  { id: 4, title: '도서 구매', date: '2026-08-18', amount: -34500, type: 'out', category: '여가', origin: 'demo' },
  { id: 5, title: '지하철 정기권', date: '2026-08-15', amount: -62000, type: 'out', category: '교통', origin: 'demo' },
  { id: 6, title: '월세', date: '2026-08-05', amount: -650000, type: 'out', category: '주거', origin: 'demo' },
]
/** 머니로그. 로그인하면 계정의 서버 목록(/api/money/entries), 로그아웃이면 이 브라우저의 목록이다(PR-07 6단계). */
export const moneyStore = createFeatureStore({ local: localCollection('money-entries', MONEY_SEEDS.map(entry => ({ ...entry }))), ...moneyKind })
export const moneyEntries = moneyStore.list
