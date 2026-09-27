import { computed, reactive, ref } from 'vue'
import { contacts, isBlocked, toggleBlock, groups } from './contacts'

/**
 * 사용자 프로필 · 채팅 · 알림 공용 스토어.
 * 화면 어디서든 이름 옆 ⓘ 아이콘으로 같은 프로필 모달을 띄우기 위해 여기로 모았다.
 */

/** 주소록에 없는 사람(커뮤니티 멤버 등)까지 포함한 프로필 정보 */
const EXTRA_PROFILES = {
  김지수: { relation: '나', email: 'jisoo@timebar.kr' },
  한소율: { relation: '커뮤니티', email: 'soyul@timebar.kr' },
  정우진: { relation: '커뮤니티', email: 'woojin@timebar.kr' },
  운영자A: { relation: '운영자', email: 'admin-a@timebar.kr' },
  운영자B: { relation: '운영자', email: 'admin-b@timebar.kr' },
}

const PROFILE_DETAIL = {
  박민준: { intro: '아침형 개발자 · 러닝 3년차', streak: 42, mode: 'J', joined: '2025.03' },
  이서연: { intro: '기록으로 하루를 정리하는 기획자', streak: 28, mode: 'B', joined: '2025.06' },
  최지우: { intro: '주 3회 독서 인증중', streak: 12, mode: 'P', joined: '2026.01' },
  아빠: { intro: '가족 일정 담당', streak: 5, mode: 'B', joined: '2025.11' },
  이현우: { intro: '', streak: 0, mode: 'P', joined: '2026.02' },
  김지수: { intro: '기록으로 팀의 리듬을 만드는 프로덕트 엔지니어', streak: 61, mode: 'J', joined: '2025.01' },
  한소율: { intro: '홈트 3개월차', streak: 9, mode: 'P', joined: '2026.03' },
  정우진: { intro: '주말 등산러', streak: 3, mode: 'P', joined: '2026.04' },
}

/** 이름으로 프로필을 찾는다 — 주소록에 있으면 그 정보를, 없으면 보조 표를 쓴다 */
export function profileOf(name) {
  const contact = contacts.value.find((c) => c.name === name)
  const extra = EXTRA_PROFILES[name] ?? {}
  const detail = PROFILE_DETAIL[name] ?? {}
  return {
    name,
    id: contact?.id ?? null,
    relation: contact?.relation ?? extra.relation ?? '알 수 없음',
    email: contact?.email ?? extra.email ?? '비공개',
    favorite: contact?.favorite ?? false,
    intro: detail.intro ?? '',
    streak: detail.streak ?? 0,
    mode: detail.mode ?? 'B',
    joined: detail.joined ?? '-',
    blocked: contact ? isBlocked(contact.id) : false,
    groups: contact ? groups.value.filter((g) => g.memberIds.includes(contact.id)).map((g) => g.title) : [],
  }
}

/** 어느 화면에서든 ⓘ를 누르면 열리는 전역 프로필 모달 상태 */
export const profileModal = reactive({ open: false, name: '' })
export function openProfile(name) {
  profileModal.name = name
  profileModal.open = true
}
export function closeProfile() {
  profileModal.open = false
}
export function blockFromProfile(name) {
  const p = profileOf(name)
  if (!p.id) return false
  toggleBlock(p.id)
  return true
}

/* ---------------- 알림 ---------------- */
export const notifications = ref([
  { id: 5, kind: '일정', title: '디자인 싱크 미팅 10분 전', at: '방금', read: false, link: '/events' },
  { id: 4, kind: '루틴', title: '‘하루 회고 5분’ 아직 안 했어요', at: '30분 전', read: false, link: '/routines' },
  { id: 3, kind: '공유', title: '이서연님이 ‘스터디 크루’에 초대했어요', at: '2시간 전', read: false, link: '/share/groups' },
  { id: 2, kind: '커뮤니티', title: '내 인증글에 댓글 3개가 달렸어요', at: '어제', read: true, link: '/community/board' },
  { id: 1, kind: 'D-Day', title: '‘자격증 시험’ D-7', at: '어제', read: true, link: '/dday' },
])
export const unreadNotifications = computed(() => notifications.value.filter((n) => !n.read).length)
export function markRead(n) {
  n.read = true
}
export function markAllRead() {
  notifications.value.forEach((n) => (n.read = true))
}
export function removeNotification(id) {
  notifications.value = notifications.value.filter((n) => n.id !== id)
}

/* ---------------- 채팅 ---------------- */
export { unreadChats } from '../features/chat/model/chatStore'

/** 우측 슬라이드 패널 — 'chat' | 'notif' | null */
export const sidePanel = ref(null)
export function togglePanel(kind) {
  sidePanel.value = sidePanel.value === kind ? null : kind
}
export function closePanel() {
  sidePanel.value = null
}
