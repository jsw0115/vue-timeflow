import { computed, ref } from 'vue'

/** 주소록 · 차단 목록 · 캘린더 그룹을 한 곳에서 관리해 서로 연동되게 한다. */
export const contacts = ref([
  { id: 1, name: '박민준', relation: '동료', email: 'minjun@timebar.kr', favorite: true },
  { id: 2, name: '이서연', relation: '친구', email: 'seoyeon@timebar.kr', favorite: true },
  { id: 3, name: '최지우', relation: '동료', email: 'jiwoo@timebar.kr', favorite: false },
  { id: 4, name: '아빠', relation: '가족', email: 'dad@family.kr', favorite: false },
  { id: 5, name: '이현우', relation: '지인', email: 'hyunwoo@timebar.kr', favorite: false },
])

/** 차단된 사용자 id 집합 — 주소록·그룹 초대 후보에서 자동으로 제외된다. */
export const blockedIds = ref([5])

export const groups = ref([
  { id: 1, title: '스터디 크루', role: '방장', memberIds: [1, 2, 3], description: '주 3회 저녁 스터디' },
  { id: 2, title: '가족 일정', role: '멤버', memberIds: [4], description: '가족 행사와 기념일' },
])

export const availableContacts = computed(() => contacts.value.filter((c) => !blockedIds.value.includes(c.id)))

export function isBlocked(id) {
  return blockedIds.value.includes(id)
}
export function toggleBlock(id) {
  if (isBlocked(id)) blockedIds.value = blockedIds.value.filter((b) => b !== id)
  else {
    blockedIds.value.push(id)
    // 차단하면 모든 그룹에서도 함께 빠진다
    groups.value.forEach((g) => {
      g.memberIds = g.memberIds.filter((m) => m !== id)
    })
  }
}
export function contactById(id) {
  return contacts.value.find((c) => c.id === id)
}
export function groupById(id) {
  return groups.value.find((g) => String(g.id) === String(id))
}
export function membersOf(group) {
  return group.memberIds.map(contactById).filter(Boolean)
}
export function addGroup({ title, description }) {
  const id = Math.max(0, ...groups.value.map((g) => g.id)) + 1
  groups.value.push({ id, title, description: description ?? '', role: '방장', memberIds: [] })
  return id
}
export function toggleMember(group, contactId) {
  if (isBlocked(contactId)) return
  group.memberIds = group.memberIds.includes(contactId)
    ? group.memberIds.filter((m) => m !== contactId)
    : [...group.memberIds, contactId]
}
