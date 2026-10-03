<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { chatUserId, isChatPreview } from '../../chat/model/chatIdentity'
import { chatApi } from '../../chat/api/chatApi'
import { refreshMentionBadge } from '../../chat/model/chatStore'
import { localTaggedEntries, localMentionEntries, readLocalMention } from '../model/localEntries'
import { chatEntry, contentKinds, filterEntries, matchesKind, normalizeTag } from '../model/entries.mjs'
import '../../chat/styles/chat.css'
import '../styles/inbox.css'

const route = useRoute()
const isMentions = computed(() => route.path.endsWith('mentions'))
const rows = ref([]), remoteTags = ref([]), tag = ref(normalizeTag(route.query.tag)), tagInput = ref(tag.value), kind = ref('전체'), query = ref(''), unread = ref(false)
const cursor = ref(null), tagCursor = ref(null), loading = ref(false), error = ref('')
let version = 0, tagsVersion = 0
const localRows = computed(() => isMentions.value ? localMentionEntries.value : localTaggedEntries.value.filter(item => !tag.value || item.tags.includes(tag.value)))
const visible = computed(() => filterEntries([...localRows.value, ...rows.value.map(chatEntry)], { kind: kind.value, query: query.value, unread: isMentions.value && unread.value }))
const tags = computed(() => {
  const counts = new Map()
  for (const item of localTaggedEntries.value.filter(item => matchesKind(item.kind, kind.value))) for (const name of item.tags) counts.set(name, (counts.get(name) || 0) + 1)
  if (matchesKind('채팅', kind.value)) for (const item of remoteTags.value) counts.set(item.name, (counts.get(item.name) || 0) + item.messageCount)
  return [...counts].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
})
async function load(more = false) {
  const run = ++version, user = chatUserId.value
  loading.value = true; error.value = ''
  if (!more) { rows.value = []; cursor.value = null }
  try {
    if (!isMentions.value && !tag.value) return
    const options = { ...(more && cursor.value ? { before: cursor.value } : {}), ...(isMentions.value ? { unread: unread.value } : { tag: tag.value }) }
    const page = isMentions.value ? await chatApi.mentions(options) : await chatApi.tagged(options)
    if (run !== version || user !== chatUserId.value) return
    rows.value = more ? [...rows.value, ...page.items] : page.items; cursor.value = page.nextCursor
  } catch (err) { if (run === version) error.value = `채팅을 불러오지 못했어요. 다른 글은 계속 볼 수 있어요. ${err.message}` }
  finally { if (run === version) loading.value = false }
}
async function loadTags(more = false) {
  const run = ++tagsVersion, user = chatUserId.value
  try {
    const page = await chatApi.tags(more ? tagCursor.value : null)
    if (run !== tagsVersion || user !== chatUserId.value) return
    remoteTags.value = more ? [...remoteTags.value, ...page.items] : page.items; tagCursor.value = page.nextCursor
    if (!tag.value && tags.value.length) choose(tags.value[0].name)
  } catch (err) { if (run === tagsVersion) { error.value = '채팅 태그를 불러오지 못했어요. 이 브라우저의 글은 계속 볼 수 있어요.'; if (!tag.value && tags.value.length) choose(tags.value[0].name) } }
}
async function read(item) {
  if (item.local) { readLocalMention(item); return }
  try { await chatApi.readMention(item.chatId); const row = rows.value.find(row => row.message.id === item.chatId); if (row) row.read = true; void refreshMentionBadge() }
  catch (err) { error.value = err.message }
}
function choose(value) { tag.value = normalizeTag(value); tagInput.value = tag.value; void load() }
function refresh() { void load(); if (!isMentions.value) void loadTags() }
function date(value) { const parsed = new Date(value); return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString('ko-KR') }
watch(() => [route.path, route.query.tag], () => { version++; tag.value = normalizeTag(route.query.tag); tagInput.value = tag.value; rows.value = []; cursor.value = null; refresh() })
watch(() => chatUserId.value, () => { version++; tagsVersion++; rows.value = []; remoteTags.value = []; cursor.value = null; tagCursor.value = null; refresh() })
onMounted(refresh)
watch(kind, () => { if (!isMentions.value && tags.value.length && !tags.value.some(item => item.name === tag.value)) choose(tags.value[0].name) })
</script>
<template>
  <div class="chat-workspace unified-inbox">
    <header class="chat-page-head"><div><p class="chat-eyebrow">{{ isMentions ? 'MENTIONS' : 'COLLECTIONS' }}</p><h1>{{ isMentions ? '나를 부른 이야기' : '주제로 모은 글' }}</h1><p>채팅부터 플래너, 일정, 다이어리까지 한곳에서 확인해요.</p></div><button @click="refresh">새로고침</button></header>
    <nav class="chat-nav" aria-label="글 모아보기"><router-link to="/mentions" :aria-current="isMentions ? 'page' : undefined">멘션함</router-link><router-link to="/tags" :aria-current="!isMentions ? 'page' : undefined">태그함</router-link></nav>
    <p v-if="error" class="chat-banner" role="alert">{{ error }}</p>
    <div class="inbox-filters">
      <label>글 종류<select v-model="kind" aria-label="글 종류"><option v-for="value in contentKinds" :key="value">{{ value }}</option></select></label>
      <label class="inbox-search">제목·내용·작성자<input v-model="query" type="search" placeholder="찾고 싶은 글을 입력하세요" /></label>
      <label v-if="isMentions" class="chat-inbox-filter"><input v-model="unread" type="checkbox" @change="load()" /> 안 읽은 멘션만 보기</label>
    </div>
    <section v-if="!isMentions" class="chat-tag-catalog" aria-label="태그 목록"><form class="chat-tag-filter" @submit.prevent="choose(tagInput)"><label for="inbox-tag">태그 검색</label><input id="inbox-tag" v-model="tagInput" placeholder="태그 이름" maxlength="32" /><button>찾기</button></form><div class="chat-tag-cloud"><button v-for="item in tags" :key="item.name" :aria-pressed="tag === item.name" @click="choose(item.name)">#{{ item.name }} <small>{{ item.count }}</small></button><button v-if="tagCursor && matchesKind('채팅', kind)" @click="loadTags(true)">채팅 태그 더 보기</button></div></section>
    <p class="chat-note">{{ visible.length }}개 표시 · 글의 원래 종류로 구분해요. 플래너 필터에는 일정·할 일·루틴도 포함돼요.</p>
    <section class="chat-inbox-list" :aria-label="isMentions ? '내 멘션' : '태그 검색 결과'" aria-live="polite">
      <article v-for="item in visible" :key="item.key" class="chat-inbox-item" :data-kind="item.kind"><div class="chat-inbox-top"><span class="inbox-kind">{{ item.kind }}</span><strong>{{ item.author }}</strong><span>{{ item.local ? '이 브라우저의 글' : (isChatPreview ? '샘플 대화' : '참여 중인 대화') }}</span><small>{{ date(item.at) }}</small><span v-if="isMentions && !item.read" class="chat-count" aria-label="안 읽음">N</span></div><h2 class="inbox-title">{{ item.title }}</h2><p>{{ item.body }}</p><div class="chat-inbox-actions"><router-link :to="item.link">{{ item.kind === '채팅' ? '대화 열기 ↗' : '원문 열기 ↗' }}</router-link><button v-if="isMentions && !item.read" @click="read(item)">읽음으로 표시</button><router-link v-for="name in item.tags" :key="name" :to="{ path: '/tags', query: { tag: name } }">#{{ name }}</router-link></div></article>
      <p v-if="loading" class="chat-list-empty" role="status">불러오는 중…</p><div v-else-if="!visible.length" class="chat-list-empty"><h2>{{ isMentions ? (unread ? '새 멘션을 모두 확인했어요' : '조건에 맞는 멘션이 없어요') : '조건에 맞는 태그 글이 없어요' }}</h2><p>글 종류·검색어·태그를 바꿔보세요.</p></div>
      <button v-if="cursor && matchesKind('채팅', kind)" class="chat-more" :disabled="loading" @click="load(true)">채팅 결과 더 보기</button>
    </section>
  </div>
</template>
