<script setup>
import { computed, ref } from 'vue'
import SubPageHeader from '../../components/SubPageHeader.vue'

const COMMUNITY_TABS = [
  { label: '커뮤니티 홈', path: '/community/home' },
  { label: '게시판', path: '/community/board' },
  { label: '챌린지', path: '/community/challenge' },
  { label: '멤버', path: '/community/members' },
  { label: '채팅', path: '/community/chat' },
]

const pinned = ref(true)
const members = ref([
  { id: 1, name: '김지수', role: '방장' },
  { id: 2, name: '이서연', role: '운영진' },
  { id: 3, name: '최지우', role: '멤버' },
  { id: 4, name: '박민준', role: '멤버' },
])
const ROLES = ['방장', '운영진', '멤버']
const counts = computed(() =>
  ROLES.map((r) => ({ role: r, n: members.value.filter((m) => m.role === r).length })),
)

function changeRole(m) {
  if (m.role === '방장') {
    window.alert('방장 권한은 위임 기능으로만 넘길 수 있어요.')
    return
  }
  const next = m.role === '운영진' ? '멤버' : '운영진'
  if (!window.confirm(m.name + '님의 역할을 ' + next + '(으)로 변경할까요?')) return
  m.role = next
}
function kick(m) {
  if (m.role === '방장') {
    window.alert('방장은 강퇴할 수 없어요.')
    return
  }
  if (!window.confirm(m.name + '님을 강퇴할까요? 다시 가입 신청을 해야 들어올 수 있어요.')) return
  members.value = members.value.filter((x) => x.id !== m.id)
}
</script>

<template>
  <SubPageHeader title="멤버 관리" parent="운동 갓생방 커뮤니티" :meta="'전체 ' + members.length + '명'" fallback="/community" :tabs="COMMUNITY_TABS" />

  <div class="metrics" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 16px">
    <article v-for="c in counts" :key="c.role"><span>{{ c.role }}</span><b class="figure">{{ c.n }}<small>명</small></b></article>
  </div>

  <section class="card list" style="margin-bottom: 16px">
    <div class="list-head" style="grid-template-columns: 2fr 1fr 1.4fr"><span>멤버</span><span>역할</span><span>관리</span></div>
    <div class="row" style="grid-template-columns: 2fr 1fr 1.4fr" v-for="m in members" :key="m.id">
      <label>{{ m.name }}</label>
      <span class="badge" :class="m.role === '방장' ? 'brand' : m.role === '운영진' ? 'info' : ''">{{ m.role }}</span>
      <span style="display: flex; gap: 6px">
        <button class="review" style="margin: 0" @click="changeRole(m)">권한 변경</button>
        <button class="review" style="margin: 0" @click="kick(m)">강퇴</button>
      </span>
    </div>
  </section>

  <section class="card">
    <label style="display: flex; align-items: center; gap: 10px"><button type="button" role="switch" class="toggle" :aria-checked="pinned" :class="{ on: pinned }" @click="pinned = !pinned"><em></em></button>공지 상단 고정 활성화</label>
  </section>
</template>
