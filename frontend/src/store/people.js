import { computed, reactive, ref, watch } from 'vue'
import { session } from '../features/auth/session.js'
import { apiRequest } from '../features/auth/apiRequest.js'
import { actionErrorText, createNotificationClient, fromServer, isVisible } from '../features/notifications/notificationClient.mjs'
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
// 로그아웃 상태의 예시 알림. 로그인하면 계정 알림함(서버)을 쓴다(Q-32)
const demoNotifications = ref([
  { id: 5, kind: '일정', title: '디자인 싱크 미팅 10분 전', at: '방금', read: false, link: '/events' },
  { id: 4, kind: '루틴', title: '‘하루 회고 5분’ 아직 안 했어요', at: '30분 전', read: false, link: '/routines' },
  { id: 3, kind: '공유', title: '이서연님이 ‘스터디 크루’에 초대했어요', at: '2시간 전', read: false, link: '/share/groups' },
  { id: 2, kind: '커뮤니티', title: '내 인증글에 댓글 3개가 달렸어요', at: '어제', read: true, link: '/community/board' },
  { id: 1, kind: 'D-Day', title: '‘자격증 시험’ D-7', at: '어제', read: true, link: '/dday' },
])
const notificationClient = createNotificationClient(apiRequest)
const serverNotifications = ref([])
export const notificationState = reactive({ status: 'idle', message: '' })
// 1분마다 바뀌는 시각으로 "10분 뒤"로 미룬 알림을 다시 보인다
const clockTick = ref(Date.now())
if (typeof window !== 'undefined') setInterval(() => { clockTick.value = Date.now() }, 60000)
export const notifications = computed(() => (session.userId ? serverNotifications.value.filter((n) => isVisible(n, clockTick.value)) : demoNotifications.value))
export const unreadNotifications = computed(() => notifications.value.filter((n) => !n.read).length)
/** 앱을 열 때·알림함을 볼 때 부른다. 서버가 마감 알림을 계산한 뒤 목록을 읽는다(같은 사용자는 5분에 한 번만 계산). */
export async function loadNotifications() {
  if (!session.userId) { serverNotifications.value = []; notificationState.status = 'idle'; return }
  const owner = session.userId
  notificationState.status = 'loading'
  try {
    const rows = await notificationClient.load()
    if (session.userId === owner) { serverNotifications.value = rows; notificationState.status = 'ready' }
  } catch { notificationState.status = 'error'; notificationState.message = '알림을 불러오지 못했어요.' }
}
watch(() => session.userId, () => { void loadNotifications() }, { immediate: true })
async function onServer(run) {
  try { await run(); notificationState.message = '' } catch { notificationState.message = '알림을 바꾸지 못했어요. 다시 시도해 주세요.'; await loadNotifications() }
}
export function markRead(n) {
  if (n.read) return
  if (!session.userId) { n.read = true; return }
  n.read = true
  void onServer(() => notificationClient.read(n))
}
export function markAllRead() {
  if (!session.userId) { demoNotifications.value.forEach((n) => (n.read = true)); return }
  serverNotifications.value.forEach((n) => (n.read = true))
  void onServer(() => notificationClient.readAll())
}
/** 알림에서 바로 처리(UF-126). action: complete | snooze. 결과는 서버 알림에 남아 다른 기기에서도 처리됨으로 보인다(UF-127) */
export async function actOnNotification(n, action) {
  notificationState.message = ''
  try {
    const result = await notificationClient.act(n, action)
    const next = fromServer(result.notification)
    serverNotifications.value = serverNotifications.value.map((row) => (row.id === n.id ? next : row))
    notificationState.message = result.result === 'already' ? '이미 완료된 할 일이었어요. 알림을 처리됨으로 바꿨어요.' : result.result === 'snoozed' ? '10분 뒤에 다시 알려 드릴게요.' : '할 일을 완료했어요.'
    return result.result
  } catch (error) {
    notificationState.message = actionErrorText(error)
    await loadNotifications()
    return null
  }
}
export function removeNotification(id) {
  if (!session.userId) { demoNotifications.value = demoNotifications.value.filter((n) => n.id !== id); return }
  const row = serverNotifications.value.find((n) => n.id === id)
  if (!row) return
  serverNotifications.value = serverNotifications.value.filter((n) => n.id !== id)
  void onServer(() => notificationClient.remove(row))
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
