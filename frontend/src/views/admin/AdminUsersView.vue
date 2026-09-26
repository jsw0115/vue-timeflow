<script setup>
import { computed, ref } from 'vue'
import ListFilterBar from '../../components/ListFilterBar.vue'
import { audit } from '../../store/adminOps'

/** 사용자 관리 — 검색·필터가 동작하고 상태 변경이 감사 로그에 남는다. */
const users = ref([
  { id: 1, name: '김지수', email: 'jisu@timebar.app', state: '활성', joined: '2024-01-02' },
  { id: 2, name: '박민준', email: 'minjun@mail.com', state: '활성', joined: '2024-02-11' },
  { id: 3, name: '정우진', email: 'wj@mail.com', state: '정지', joined: '2024-03-19' },
  { id: 4, name: '이서연', email: 'seoyeon@mail.com', state: '활성', joined: '2024-05-04' },
  { id: 5, name: '한소율', email: 'soyul@mail.com', state: '휴면', joined: '2023-11-27' },
])

const query = ref('')
const filters = ref({ state: '전체' })
const FILTER_GROUPS = [
  {
    id: 'state',
    all: '전체',
    options: [
      { value: '전체', label: '전체' },
      { value: '활성', label: '활성' },
      { value: '정지', label: '정지' },
      { value: '휴면', label: '휴면' },
    ],
  },
]
const visible = computed(() => {
  const k = query.value.trim()
  return users.value.filter((u) => {
    if (filters.value.state !== '전체' && u.state !== filters.value.state) return false
    if (k && !u.name.includes(k) && !u.email.includes(k)) return false
    return true
  })
})
const counts = computed(() => ({
  total: users.value.length,
  active: users.value.filter((u) => u.state === '활성').length,
  blocked: users.value.filter((u) => u.state === '정지').length,
  dormant: users.value.filter((u) => u.state === '휴면').length,
}))

function stateClass(s) {
  return s === '활성' ? 'ok' : s === '정지' ? 'danger' : ''
}
function toggleBlock(u) {
  const next = u.state === '정지' ? '활성' : '정지'
  if (!window.confirm(u.name + '님을 ' + next + ' 상태로 바꿀까요?')) return
  const before = u.state
  u.state = next
  audit('제재', next === '정지' ? '사용자 정지' : '정지 해제', u.name + ' (' + u.email + ')', before + ' → ' + next)
}
function forceLogout(u) {
  if (!window.confirm(u.name + '님을 모든 기기에서 로그아웃할까요?')) return
  audit('제재', '강제 로그아웃', u.name + ' (' + u.email + ')')
}
</script>

<template>
  <div class="admin-page-head">
    <div><h2>사용자 관리</h2><p>계정 상태를 확인하고 제재를 적용해요</p></div>
    <span class="badge" :class="counts.blocked ? 'warn' : 'ok'">정지 {{ counts.blocked }}명</span>
  </div>

  <div class="metrics" style="grid-template-columns: repeat(4, 1fr); margin-bottom: 16px">
    <article><span>전체 사용자</span><b class="figure">{{ counts.total }}</b></article>
    <article><span>활성</span><b class="figure">{{ counts.active }}</b></article>
    <article><span>정지</span><b class="figure">{{ counts.blocked }}</b></article>
    <article><span>휴면</span><b class="figure">{{ counts.dormant }}</b></article>
  </div>

  <ListFilterBar
    v-model:query="query"
    v-model:filters="filters"
    :groups="FILTER_GROUPS"
    placeholder="이메일 또는 닉네임 검색"
    :result-count="visible.length"
    :total-count="users.length"
  />

  <section class="card list">
    <div class="list-head" style="grid-template-columns: 1.2fr 1.8fr .8fr 1fr 1.6fr">
      <span>사용자</span><span>이메일</span><span>상태</span><span>가입일</span><span>관리</span>
    </div>
    <div class="row" style="grid-template-columns: 1.2fr 1.8fr .8fr 1fr 1.6fr" v-for="u in visible" :key="u.id">
      <label>{{ u.name }}</label>
      <span>{{ u.email }}</span>
      <span class="badge" :class="stateClass(u.state)">{{ u.state }}</span>
      <span class="figure">{{ u.joined }}</span>
      <span style="display: flex; gap: 6px">
        <button class="review" style="margin: 0" @click="toggleBlock(u)">{{ u.state === '정지' ? '정지 해제' : '정지' }}</button>
        <button class="review" style="margin: 0" @click="forceLogout(u)">강제 로그아웃</button>
      </span>
    </div>
    <p v-if="!visible.length" class="form-note" style="margin: 12px 0 0">조건에 맞는 사용자가 없어요.</p>
  </section>
  <p class="form-note" style="margin-top: 12px">상태 변경과 강제 로그아웃은 감사 로그에 기록돼요.</p>
</template>
