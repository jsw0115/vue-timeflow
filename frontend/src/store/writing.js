import { localCollection } from './localCollection'
import { createFeatureStore } from '../features/records/featureStore.mjs'
import { diaryKind, memoKind } from '../features/records/featureKinds.mjs'
import * as offlineQueue from '../features/offline/offlineQueue.js'

// 시연 기본 메모. origin: 'demo'로 표시해 로그인할 때 계정으로 옮기지 않는다(Q-11)
export const MEMO_SEEDS = [
  { id: 1, title: '디자인 리뷰 아이디어', body: '색상 토큰을 카테고리별로 분리하면 좋을 듯. 다음 회의 때 제안하기.', time: '오늘 09:12', color: '', actionable: true, origin: 'demo' },
  { id: 2, title: '읽을 아티클', body: '타임블로킹 관련 글 저장해두기', time: '어제 21:40', color: 'blue', origin: 'demo' },
  { id: 3, title: '장보기 목록', body: '우유, 계란, 바나나, 커피 원두', time: '8/22', color: 'mint', origin: 'demo' },
  { id: 4, title: '회고 메모', body: '이번 주는 계획 대비 실행률이 낮았다. 다음 주엔 오전 집중시간을 늘려보자.', time: '8/18', color: '', origin: 'demo' },
]
/** 메모·다이어리. 로그인하면 계정의 서버 목록, 로그아웃이면 이 브라우저의 목록이다(PR-07 6단계). */
// 메모는 연결이 없을 때 기기 대기열에 보관했다가 연결되면 보낸다(PR-12)
export const memoStore = createFeatureStore({ local: localCollection('memos', MEMO_SEEDS.map(memo => ({ ...memo }))), ...memoKind, offline: offlineQueue })
export const memos = memoStore.list
export const diaryStore = createFeatureStore({ local: localCollection('diaries', []), ...diaryKind })
export const diaries = diaryStore.list
