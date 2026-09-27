<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import ListFilterBar from '../../components/ListFilterBar.vue'
import RichText from '../../components/RichText.vue'
import PersonTag from '../../components/PersonTag.vue'
import { mentions, unreadMentions, markMentionRead, markAllMentionsRead, removeMention } from '../../store/tagging'

/** 멘션함 — 나를 @로 언급한 글을 한곳에 모아 확인한다. */
const router = useRouter()
const query = ref('')
const filters = ref({ state: '전체', kind: '전체' })
const FILTER_GROUPS = computed(() => [
  {
    id: 'state',
    all: '전체',
    options: [
      { value: '전체', label: '전체' },
      { value: '안 읽음', label: '안 읽음' },
      { value: '읽음', label: '읽음' },
    ],
  },
  {
    id: 'kind',
    all: '전체',
    options: [{ value: '전체', label: '모든 종류' }, ...[...new Set(mentions.value.map((m) => m.kind))].map((k) => ({ value: k, label: k }))],
  },
])

const visible = computed(() => {
  const k = query.value.trim()
  return mentions.value.filter((m) => {
    if (filters.value.state === '안 읽음' && m.read) return false
    if (filters.value.state === '읽음' && !m.read) return false
    if (filters.value.kind !== '전체' && m.kind !== filters.value.kind) return false
    if (k && !m.excerpt.includes(k) && !m.from.includes(k)) return false
    return true
  })
})

function open(m) {
  markMentionRead(m)
  router.push(m.link)
}
function onRemove(m) {
  if (!window.confirm('이 멘션을 목록에서 지울까요?')) return
  removeMention(m.id)
}
</script>

<template>
  <div class="page-tools">
    <b style="font-size: 1rem">멘션함</b>
    <span class="form-note" style="margin: 0">나를 언급한 글 {{ mentions.length }}건 · 안 읽음 {{ unreadMentions }}건</span>
    <span></span>
    <button class="primary" :disabled="!unreadMentions" @click="markAllMentionsRead">모두 읽음 처리</button>
  </div>

  <ListFilterBar
    v-model:query="query"
    v-model:filters="filters"
    :groups="FILTER_GROUPS"
    placeholder="보낸 사람·내용 검색"
    :result-count="visible.length"
    :total-count="mentions.length"
  />

  <section class="card">
    <div v-for="m in visible" :key="m.id" class="mention-row" :class="{ unread: !m.read }">
      <button class="mention-main" @click="open(m)">
        <span class="mention-top">
          <span class="tag">{{ m.kind }}</span>
          <PersonTag :name="m.from" />
          <small class="figure" style="margin-left: auto">{{ m.at }}</small>
        </span>
        <span class="mention-body"><RichText :text="m.excerpt" :clickable="false" /></span>
      </button>
      <button v-if="!m.read" class="review" style="margin: 0" @click="markMentionRead(m)">읽음</button>
      <button class="person-info" title="삭제" aria-label="삭제" @click="onRemove(m)">×</button>
    </div>
    <p v-if="!visible.length" class="form-note" style="margin: 0">조건에 맞는 멘션이 없어요.</p>
  </section>

  <p class="form-note" style="margin-top: 12px">
    글에 <b>@이름</b>을 적으면 그 사람의 멘션함으로 전달돼요. 주소록에 있고 차단하지 않은 사용자만 언급할 수 있어요.
  </p>
</template>
