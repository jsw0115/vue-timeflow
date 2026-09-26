<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { communities as groups, communityComposer, toggleMembership } from '../../store/communities'

/**
 * 커뮤니티 — 카테고리 필터·검색·정렬이 실제로 동작하고, 가입/탈퇴 상태가 즉시 바뀐다.
 */
const router = useRouter()
const CATEGORIES = ['추천', '운동', '공부', '일상', '갓생']
const SORTS = [
  { id: 'active', label: '활동순' },
  { id: 'members', label: '멤버순' },
  { id: 'new', label: '최신순' },
]

const category = ref('추천')
const sort = ref('active')
const query = ref('')


const visible = computed(() => {
  const k = query.value.trim()
  let list = groups.value.filter((g) => category.value === '추천' || g.category === category.value)
  if (k) list = list.filter((g) => g.title.includes(k) || g.desc.includes(k))
  const sorted = [...list]
  if (sort.value === 'members') sorted.sort((a, b) => b.members - a.members)
  else if (sort.value === 'new') sorted.sort((a, b) => a.createdDays - b.createdDays)
  else sorted.sort((a, b) => b.todayPosts - a.todayPosts)
  return sorted
})

const myGroups = computed(() => groups.value.filter((g) => g.joined))

function toggleJoin(g) {
  if (g.joined && !window.confirm('‘' + g.title + '’ 커뮤니티에서 나갈까요?')) return
  toggleMembership(g)
}
function open(g) {
  router.push({ path: '/community/home', query: { id: g.id } })
}
</script>

<template>
  <div class="page-tools">
    <div class="filter">
      <button v-for="c in CATEGORIES" :key="c" :class="{ selected: category === c }" @click="category = c">{{ c }}</button>
    </div>
    <div class="filter">
      <button v-for="s in SORTS" :key="s.id" :class="{ selected: sort === s.id }" @click="sort = s.id">{{ s.label }}</button>
    </div>
    <input v-model="query" placeholder="커뮤니티 검색" />
    <button class="primary" @click="communityComposer = true">+ 커뮤니티 만들기</button>
  </div>

  <section v-if="myGroups.length" class="card" style="margin-bottom: 16px">
    <div class="head">
      <div><h3 style="margin: 0">참여중인 커뮤니티</h3><p style="margin: 4px 0 0">{{ myGroups.length }}개</p></div>
    </div>
    <div class="event" v-for="g in myGroups" :key="g.id">
      <i></i>
      <span style="flex: 1"><b>{{ g.emoji }} {{ g.title }}</b><small>오늘 인증 {{ g.todayPosts }}건 · 멤버 {{ g.members }}명</small></span>
      <button class="review" style="margin: 0" @click="open(g)">들어가기</button>
      <button class="review" style="margin: 0" @click="toggleJoin(g)">나가기</button>
    </div>
  </section>

  <div class="comm-grid">
    <section class="card comm-card" v-for="g in visible" :key="g.id" role="button" tabindex="0" @click="open(g)" @keyup.enter="open(g)">
      <div class="cover">{{ g.emoji }}</div>
      <b>{{ g.title }}</b>
      <p>{{ g.desc }} · 멤버 {{ g.members }}명</p>
      <div class="comm-meta">
        <span class="tag">{{ g.category }}</span>
        <span class="badge" :class="g.todayPosts > 20 ? 'ok' : ''">오늘 {{ g.todayPosts }}건</span>
        <span v-if="g.createdDays < 30" class="badge new">신규</span>
      </div>
      <button class="primary" style="width: 100%; margin-top: 12px" @click.stop="toggleJoin(g)">
        {{ g.joined ? '참여중 · 나가기' : g.pending ? '가입 신청 취소' : g.joinPolicy === 'approval' ? '가입 신청' : '가입하기' }}
      </button>
    </section>
  </div>
  <p v-if="!visible.length" class="form-note">조건에 맞는 커뮤니티가 없어요. 직접 만들어보세요.</p>
</template>
