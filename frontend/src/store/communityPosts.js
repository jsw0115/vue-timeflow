import { localCollection } from './localCollection'

export const communityPosts = localCollection('community-posts', [
  { id: 1, name: '김지수', time: '방금 전', body: '오늘도 6km 완주! 타임바 플래너에 자동으로 기록됐어요.', auto: true, likes: 12, comments: 3, liked: false },
  { id: 2, name: '이서연', time: '32분 전', body: '아침 스트레칭 15분 완료! 다들 화이팅이에요', auto: false, likes: 8, comments: 1, liked: false },
])
