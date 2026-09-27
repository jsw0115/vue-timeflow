<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import ListFilterBar from '../../components/ListFilterBar.vue'
import RichText from '../../components/RichText.vue'
import { posts, myPosts, parseTags, parseMentions, ME } from '../../store/tagging'

/** 내 글 모아보기 — 메모·다이어리·게시글을 종류 구분 없이 내가 쓴 것만 모은다. */
const router = useRouter()
const query = ref('')
const filters = ref({ kind: '전체', sort: '최신순' })
const FILTER_GROUPS = computed(() => [
  {
    id: 'kind',
    all: '전체',
    options: [{ value: '전체', label: '전체 종류' }, ...[...new Set(myPosts.value.map((p) => p.kind))].map((k) => ({ value: k, label: k }))],
  },
  {
    id: 'sort',
    all: '최신순',
    options: [
      { value: '최신순', label: '최신순' },
      { value: '오래된순', label: '오래된순' },
    ],
  },
])

const visible = computed(() => {
  const k = query.value.trim()
  const list = myPosts.value.filter((p) => {
    if (filters.value.kind !== '전체' && p.kind !== filters.value.kind) return false
    if (k && !p.title.includes(k) && !p.body.includes(k)) return false
    return true
  })
  return [...list].sort((a, b) => (filters.value.sort === '오래된순' ? a.at.localeCompare(b.at) : b.at.localeCompare(a.at)))
})

const byKind = computed(() => {
  const map = new Map()
  myPosts.value.forEach((p) => map.set(p.kind, (map.get(p.kind) ?? 0) + 1))
  return [...map.entries()].map(([kind, count]) => ({ kind, count }))
})
const myTags = computed(() => {
  const map = new Map()
  myPosts.value.forEach((p) => parseTags(p.title + ' ' + p.body).forEach((t) => map.set(t, (map.get(t) ?? 0) + 1)))
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)
})
const mentionedCount = computed(() => myPosts.value.filter((p) => parseMentions(p.body).length).length)
const share = computed(() => (posts.value.length ? Math.round((myPosts.value.length / posts.value.length) * 100) : 0))
</script>

<template>
  <div class="page-tools">
    <b style="font-size: 1rem">내 글 모아보기</b>
    <span class="form-note" style="margin: 0">{{ ME }}님이 쓴 글</span>
    <span></span>
    <button class="review" style="margin: 0" @click="router.push('/tags')">태그로 보기</button>
  </div>

  <div class="metrics" style="grid-template-columns: repeat(4, 1fr); margin-bottom: 16px">
    <article><span>내 글</span><b class="figure">{{ myPosts.length }}<small>개</small></b><small>전체의 {{ share }}%</small></article>
    <article v-for="b in byKind.slice(0, 2)" :key="b.kind"><span>{{ b.kind }}</span><b class="figure">{{ b.count }}<small>개</small></b></article>
    <article><span>사람을 언급한 글</span><b class="figure">{{ mentionedCount }}<small>개</small></b></article>
  </div>

  <section v-if="myTags.length" class="card" style="margin-bottom: 16px">
    <h3>자주 쓴 태그</h3>
    <div class="tag-cloud">
      <button v-for="[t, n] in myTags" :key="t" class="tag-chip" @click="router.push({ path: '/tags', query: { tag: t } })">
        #{{ t }}<em>{{ n }}</em>
      </button>
    </div>
  </section>

  <ListFilterBar
    v-model:query="query"
    v-model:filters="filters"
    :groups="FILTER_GROUPS"
    placeholder="제목·본문 검색"
    :result-count="visible.length"
    :total-count="myPosts.length"
  />

  <section class="card">
    <article v-for="p in visible" :key="p.id" class="post-row" @click="router.push(p.link)">
      <div class="post-row-head">
        <span class="tag">{{ p.kind }}</span>
        <b>{{ p.title }}</b>
        <small class="figure" style="margin-left: auto">{{ p.at }}</small>
      </div>
      <p><RichText :text="p.body" /></p>
    </article>
    <p v-if="!visible.length" class="form-note" style="margin: 0">조건에 맞는 글이 없어요.</p>
  </section>
</template>
