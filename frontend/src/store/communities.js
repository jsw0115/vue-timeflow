import { computed, ref } from 'vue'
import { localCollection } from './localCollection'
export const communityComposer = ref(false)
export const communities = localCollection('communities', [
  { id: 1, emoji: '🏃', title: '운동 갓생방', desc: '매일 아침 운동 인증', category: '운동', members: 128, todayPosts: 24, createdDays: 120, joined: false },
  { id: 2, emoji: '📚', title: '고요한 독서방', desc: '주 3회 독서 인증', category: '공부', members: 42, todayPosts: 6, createdDays: 64, joined: true },
  { id: 3, emoji: '✨', title: '미라클모닝 챌린지', desc: '기상 인증 챌린지', category: '갓생', members: 260, todayPosts: 41, createdDays: 210, joined: false },
  { id: 4, emoji: '🍱', title: '집밥 기록방', desc: '직접 해먹은 한 끼 남기기', category: '일상', members: 73, todayPosts: 11, createdDays: 18, joined: false },
  { id: 5, emoji: '🧘', title: '저녁 스트레칭', desc: '자기 전 10분 스트레칭', category: '운동', members: 55, todayPosts: 9, createdDays: 7, joined: false },
  { id: 6, emoji: '💻', title: '사이드 프로젝트 빌더', desc: '주말마다 만든 것 공유', category: '공부', members: 96, todayPosts: 15, createdDays: 45, joined: true },
])
export const joinedCommunities = computed(() => communities.value.filter(c => c.joined))
export const challenges = localCollection('challenges', [
  { id: 1, title: '21일 아침 러닝 챌린지', desc: '3주간 매일 아침 인증하면 뱃지 획득', days: 21, doneDays: 12, members: 46, joined: true, startsIn: 0 },
  { id: 2, title: '미라클모닝 7일 챌린지', desc: '7일 연속 오전 6시 기상 인증', days: 7, doneDays: 0, members: 18, joined: false, startsIn: 2 },
])
export const finishedChallenges = localCollection('finished-challenges', [{ id: 100, title: '7월 물 2L 마시기 챌린지', result: '완주 · 뱃지 획득' }])
export function toggleMembership(group) {
  if (!group.joined && group.joinPolicy === 'approval') { group.pending = !group.pending; return }
  group.joined = !group.joined
  group.members = Math.max(1, group.members + (group.joined ? 1 : -1))
}
