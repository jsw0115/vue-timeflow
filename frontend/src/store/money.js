import { localCollection } from './localCollection'

export const moneyEntries = localCollection('money-entries', [
  { id: 1, title: '월급', date: '2026-08-25', amount: 3200000, type: 'in', category: '수입' },
  { id: 2, title: '점심 식대', date: '2026-08-24', amount: -12000, type: 'out', category: '식비' },
  { id: 3, title: '헬스장 등록', date: '2026-08-20', amount: -89000, type: 'out', category: '건강' },
  { id: 4, title: '도서 구매', date: '2026-08-18', amount: -34500, type: 'out', category: '여가' },
  { id: 5, title: '지하철 정기권', date: '2026-08-15', amount: -62000, type: 'out', category: '교통' },
  { id: 6, title: '월세', date: '2026-08-05', amount: -650000, type: 'out', category: '주거' },
])
