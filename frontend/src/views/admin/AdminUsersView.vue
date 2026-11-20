<script setup>
import { computed, onMounted, ref } from 'vue'
import ListFilterBar from '../../components/ListFilterBar.vue'
import { session } from '../../features/auth/session.js'
import { adminClient } from '../../features/admin/admin.js'
import { adminErrorText, toUserRow } from '../../features/admin/adminClient.mjs'

/** 사용자 관리. 서버 계정 목록을 불러 정지·해제와 강제 로그아웃을 한다. 감사 로그는 서버가 남긴다(PR-10 5단계, UF-117). */
const users = ref([])
const total = ref(0)
const status = ref('loading')
const loadError = ref('')
async function load() {
  status.value = 'loading'
  loadError.value = ''
  try {
    const page = await adminClient.allUsers()
    users.value = (page?.items ?? []).map(toUserRow)
    total.value = page?.total ?? users.value.length
    status.value = 'ready'
  } catch (e) { loadError.value = adminErrorText(e); status.value = 'error' }
}
onMounted(load)

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
      { value: '삭제', label: '삭제' },
    ],
  },
]
const visible = computed(() => {
  const k = query.value.trim().toLowerCase()
  return users.value.filter((u) => {
    if (filters.value.state !== '전체' && u.state !== filters.value.state) return false
    if (k && !u.name.toLowerCase().includes(k) && !u.email.toLowerCase().includes(k)) return false
    return true
  })
})
const counts = computed(() => ({
  total: users.value.length,
  active: users.value.filter((u) => u.status === 'ACTIVE').length,
  blocked: users.value.filter((u) => u.status === 'SUSPENDED').length,
  deleted: users.value.filter((u) => u.status === 'DELETED').length,
}))

function stateClass(s) {
  return s === 'ACTIVE' ? 'ok' : s === 'SUSPENDED' ? 'danger' : ''
}
const busy = ref('')
const notice = ref('')
const actionError = ref('')
async function act(key, task, done) {
  if (busy.value) return
  busy.value = key
  actionError.value = ''
  notice.value = ''
  try { await task(); notice.value = done; await load() } catch (e) { actionError.value = adminErrorText(e) } finally { busy.value = '' }
}
function toggleBlock(u) {
  const next = u.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED'
  const label = next === 'SUSPENDED' ? '정지' : '활성'
  if (!window.confirm(u.name + '님을 ' + label + ' 상태로 바꿀까요? 바꾸면 그 계정은 모든 기기에서 다시 로그인해야 해요.')) return
  act('status:' + u.id, () => adminClient.setStatus(u, next), u.name + '님을 ' + label + ' 상태로 바꿨어요.')
}
function forceLogout(u) {
  if (!window.confirm(u.name + '님을 모든 기기에서 로그아웃할까요?')) return
  act('logout:' + u.id, () => adminClient.forceLogout(u), u.name + '님을 모든 기기에서 로그아웃했어요.')
}
</script>

<template>
  <div class="admin-page-head">
    <div><h2>사용자 관리</h2><p>계정 상태를 확인하고 제재를 적용해요</p></div>
    <span class="badge" :class="counts.blocked ? 'warn' : 'ok'">정지 {{ counts.blocked }}명</span>
  </div>

  <div class="metrics" style="--metric-cols: 4; margin-bottom: 16px">
    <article><span>전체 사용자</span><b class="figure">{{ counts.total }}</b></article>
    <article><span>활성</span><b class="figure">{{ counts.active }}</b></article>
    <article><span>정지</span><b class="figure">{{ counts.blocked }}</b></article>
    <article><span>삭제</span><b class="figure">{{ counts.deleted }}</b></article>
  </div>

  <ListFilterBar
    v-model:query="query"
    v-model:filters="filters"
    :groups="FILTER_GROUPS"
    placeholder="이메일 또는 닉네임 검색"
    :result-count="visible.length"
    :total-count="users.length"
  />
  <p v-if="notice" class="badge ok" style="display: inline-block; margin-bottom: 12px" role="status">{{ notice }}</p>
  <p v-if="actionError" class="input-field-help" data-state="error" role="alert">{{ actionError }}</p>
  <p v-if="status === 'loading' && !users.length" class="input-field-help" role="status">사용자를 불러오는 중이에요.</p>
  <section v-else-if="status === 'error'" class="card">
    <div class="empty-state" role="status"><p>{{ loadError }}</p><button type="button" class="button-secondary" @click="load">다시 시도</button></div>
  </section>

  <section v-else class="card list">
    <div class="list-head" style="grid-template-columns: 1.2fr 1.8fr .8fr 1fr 1.6fr">
      <span>사용자</span><span>이메일</span><span>상태</span><span>가입일</span><span>관리</span>
    </div>
    <div class="row" style="grid-template-columns: 1.2fr 1.8fr .8fr 1fr 1.6fr" v-for="u in visible" :key="u.id">
      <label>{{ u.name }}<small v-if="u.role === 'ADMIN'" class="tag" style="margin-left: 6px">{{ u.roleLabel }}</small></label>
      <span>{{ u.email }}</span>
      <span class="badge" :class="stateClass(u.status)">{{ u.state }}</span>
      <span class="figure">{{ u.joined }}</span>
      <span v-if="u.id === session.userId" class="form-note" style="margin: 0">내 계정</span>
      <span v-else-if="u.status === 'DELETED'" class="form-note" style="margin: 0">삭제된 계정</span>
      <span v-else style="display: flex; gap: 6px">
        <button class="review" style="margin: 0" :disabled="!!busy" :aria-busy="busy === 'status:' + u.id ? 'true' : undefined" @click="toggleBlock(u)">{{ busy === 'status:' + u.id ? '바꾸는 중' : u.status === 'SUSPENDED' ? '정지 해제' : '정지' }}</button>
        <button class="review" style="margin: 0" :disabled="!!busy" :aria-busy="busy === 'logout:' + u.id ? 'true' : undefined" @click="forceLogout(u)">{{ busy === 'logout:' + u.id ? '처리하는 중' : '강제 로그아웃' }}</button>
      </span>
    </div>
    <p v-if="!visible.length" class="empty-state" role="status">조건에 맞는 사용자가 없어요. 검색어나 필터를 바꿔 보세요.</p>
  </section>
  <p class="form-note" style="margin-top: 12px">상태 변경과 강제 로그아웃은 서버 감사 로그에 남아요.{{ total > users.length ? ' 지금은 ' + users.length + '명까지만 보여요.' : '' }}</p>
</template>
