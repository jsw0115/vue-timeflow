<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ListFilterBar from '../../components/ListFilterBar.vue'
import RichText from '../../components/RichText.vue'
import PersonTag from '../../components/PersonTag.vue'
import { posts, tagCounts, postsByTag, parseTags, ME } from '../../store/tagging'

/** 해시태그 모아보기 — 태그를 고르면 그 태그가 달린 모든 글을 종류 구분 없이 모아 본다. */
const route = useRoute()
const router = useRouter()

const activeTag = ref(route.query.tag ?? '')
watch(() => route.query.tag, (t) => (activeTag.value = t ?? ''))

const query = ref('')
const filters = ref({ kind: '전체', scope: '전체' })
const FILTER_GROUPS = computed(() => [
  {
    id: 'kind',
    all: '전체',
    options: [{ value: '전체', label: '전체 종류' }, ...[...new Set(posts.value.map((p) => p.kind))].map((k) => ({ value: k, label: k }))],
  },
  {
    id: 'scope',
    all: '전체',
    options: [
      { value: '전체', label: '모두' },
      { value: '내 글', label: '내 글' },
    ],
  },
])

const base = computed(() => (activeTag.value ? postsByTag(activeTag.value) : posts.value))
const visible = computed(() => {
  const k = query.value.trim()
  return base.value.filter((p) => {
    if (filters.value.kind !== '전체' && p.kind !== filters.value.kind) return false
    if (filters.value.scope === '내 글' && p.author !== ME) return false
    if (k && !p.title.includes(k) && !p.body.includes(k)) return false
    return true
  })
})

function selectTag(tag) {
  const next = activeTag.value === tag ? '' : tag
  router.push({ path: '/tags', query: next ? { tag: next } : {} })
}
/** 지금 보고 있는 글들에 함께 쓰인 태그 — 연관 태그 탐색용 */
const relatedTags = computed(() => {
  if (!activeTag.value) return []
  const map = new Map()
  base.value.forEach((p) =>
    parseTags(p.title + ' ' + p.body)
      .filter((t) => t !== activeTag.value)
      .forEach((t) => map.set(t, (map.get(t) ?? 0) + 1)),
  )
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)
})
</script>

<template>
  <div class="page-tools">
    <b style="font-size: 1rem">태그 모아보기</b>
    <span class="form-note" style="margin: 0">태그 {{ tagCounts.length }}종 · 글 {{ posts.length }}개</span>
    <span></span>
    <button v-if="activeTag" class="review" style="margin: 0" @click="router.push('/tags')">태그 해제</button>
  </div>

  <section class="card" style="margin-bottom: 16px">
    <h3>태그 클라우드</h3>
    <div class="tag-cloud">
      <button
        v-for="t in tagCounts"
        :key="t.tag"
        class="tag-chip"
        :class="{ selected: activeTag === t.tag }"
        :style="{ fontSize: (14 + Math.min(t.count, 5)) / 16 + 'rem' }"
        @click="selectTag(t.tag)"
      >
        #{{ t.tag }}<em>{{ t.count }}</em>
      </button>
      <p v-if="!tagCounts.length" class="form-note" style="margin: 0">아직 태그가 달린 글이 없어요.</p>
    </div>
  </section>

  <section v-if="activeTag" class="card" style="margin-bottom: 16px">
    <div class="head">
      <div><h3 style="margin: 0">#{{ activeTag }}</h3><p style="margin: 4px 0 0">{{ base.length }}개 글에 쓰였어요</p></div>
    </div>
    <div v-if="relatedTags.length" class="tag-cloud" style="margin-top: 12px">
      <small style="color: var(--color-muted); margin-right: 4px">함께 쓰인 태그</small>
      <button v-for="[t, n] in relatedTags" :key="t" class="tag-chip" @click="selectTag(t)">#{{ t }}<em>{{ n }}</em></button>
    </div>
  </section>

  <ListFilterBar
    v-model:query="query"
    v-model:filters="filters"
    :groups="FILTER_GROUPS"
    placeholder="제목·본문 검색"
    :result-count="visible.length"
    :total-count="base.length"
  />

  <section class="card">
    <article v-for="p in visible" :key="p.id" class="post-row" @click="router.push(p.link)">
      <div class="post-row-head">
        <span class="tag">{{ p.kind }}</span>
        <b>{{ p.title }}</b>
        <small class="figure" style="margin-left: auto">{{ p.at }}</small>
      </div>
      <p><RichText :text="p.body" /></p>
      <div class="post-row-meta">
        <PersonTag :name="p.author" />
        <span v-if="p.author === ME" class="badge ok">내 글</span>
      </div>
    </article>
    <p v-if="!visible.length" class="form-note" style="margin: 0">조건에 맞는 글이 없어요.</p>
  </section>
</template>
