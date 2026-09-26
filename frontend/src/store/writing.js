import { localCollection } from './localCollection'
export const memos = localCollection('memos', [
  { id: 1, title: '디자인 리뷰 아이디어', body: '색상 토큰을 카테고리별로 분리하면 좋을 듯. 다음 회의 때 제안하기.', time: '오늘 09:12', color: '', actionable: true },
  { id: 2, title: '읽을 아티클', body: '타임블로킹 관련 글 저장해두기', time: '어제 21:40', color: 'blue' },
  { id: 3, title: '장보기 목록', body: '우유, 계란, 바나나, 커피 원두', time: '8/22', color: 'mint' },
  { id: 4, title: '회고 메모', body: '이번 주는 계획 대비 실행률이 낮았다. 다음 주엔 오전 집중시간을 늘려보자.', time: '8/18', color: '' },
])
export const diaries = localCollection('diaries', [])
