<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { SETTINGS_SECTIONS } from '../router/settingsSections'
import { posts } from '../store/tagging'
import '../store/postIndex'
import { wiki } from '../store/wiki'
import { useIndexedSearch } from '../composables/useIndexedSearch'
import { chatApi } from '../features/chat/api/chatApi'
import { chat, selectRoom } from '../features/chat/model/chatStore'
const props = defineProps({ roomId: String, chatOnly: Boolean })
const emit = defineEmits(['close', 'room'])
const router = useRouter(), query = ref(''), scope = ref(props.chatOnly ? '채팅' : '전체')
const entries = computed(() => [
  ...SETTINGS_SECTIONS.map(section => ({ id: 'setting:' + section.id, kind: '메뉴·설정', title: section.label, body: section.desc, meta: '환경설정', path: '/settings/' + section.id })),
  ...router.getRoutes().filter(route => !route.path.includes(':') && !route.meta.admin && !route.meta.bare && (route.meta.label || route.meta.title)).map(route => ({ id: 'menu:' + route.path, kind: '메뉴·설정', title: route.meta.label ?? route.name ?? '플래너', body: route.meta.title, meta: '메뉴·설정', path: route.path })),
  ...posts.value.map(post => ({ id: 'post:' + post.id, kind: post.kind, title: post.title, body: post.body, meta: [post.kind, post.author, post.at].filter(Boolean).join(' · '), path: post.link })),
  ...wiki.docs.map(doc => ({ id: 'wiki:' + doc.id, kind: '업무 위키', title: doc.title, body: doc.body, meta: doc.space, path: '/work/wiki?id=' + doc.id })),
])
const scopes = computed(() => ['전체', '채팅', ...new Set(entries.value.map(entry => entry.kind))])
const { result, busy: localBusy, offset, search: searchLocal } = useIndexedSearch(entries, query, scope)
const chatHits = ref([]), chatCursor = ref(null), chatBusy = ref(false), error = ref('')
const indexing = ref(false)
let timer, epoch = 0
const includeChat = computed(() => scope.value === '전체' || scope.value === '채팅')
async function searchChat(more = false) {
  const version = ++epoch, keyword = query.value.trim(), roomId = props.roomId
  if (!keyword || !includeChat.value) { chatHits.value = []; chatCursor.value = null; chatBusy.value = false; return }
  chatBusy.value = true; error.value = ''
  try {
    const page = await chatApi.search({ q: keyword, limit: 40, ...(roomId ? { roomId } : {}), ...(more && chatCursor.value ? { before: chatCursor.value } : {}) })
    if (version !== epoch) return
    chatHits.value = more ? [...chatHits.value, ...page.items] : page.items
    chatCursor.value = page.nextCursor
    indexing.value = !!page.indexing
  } catch (cause) { if (version === epoch) error.value = cause.message }
  finally { if (version === epoch) chatBusy.value = false }
}
watch([query, scope, () => props.roomId], () => { epoch++; clearTimeout(timer); chatHits.value = []; chatCursor.value = null; error.value = ''; chatBusy.value = !!query.value.trim() && includeChat.value; timer = setTimeout(() => searchChat(), 180) })
onBeforeUnmount(() => { epoch++; clearTimeout(timer) })
function go(entry) { void router.push(entry.path); emit('close') }
async function openHit(hit) {
  chat.searchHit = hit
  await selectRoom(hit.message.roomId)
  if (chat.error) { chat.searchHit = null; error.value = chat.error; return }
  // Show the matched message even when it is older than the latest loaded page.
  emit('room', hit); emit('close')
  if (!props.chatOnly) await router.push({ path: '/chat', query: { room: hit.message.roomId, message: hit.message.id } })
}
</script>
<template>
  <div class="unified-search-panel">
    <label class="unified-search-input"><span>{{ roomId ? '이 대화 검색' : '통합 검색' }}</span><input v-model="query" type="search" maxlength="100" autofocus :placeholder="chatOnly ? '모든 대화의 메시지 검색' : '메뉴, 글, 메모, 일정, 채팅 메시지 검색'" /></label>
    <label v-if="!chatOnly" class="unified-search-scope">검색 범위<select v-model="scope"><option v-for="kind in scopes" :key="kind">{{ kind }}</option></select></label>
    <p v-if="!query.trim()" class="form-note">{{ chatOnly ? '이전 메시지도 함께 찾아요.' : '제목과 본문, 태그와 멘션을 함께 찾아요.' }}</p>
    <p v-if="localBusy || chatBusy" class="form-note" role="status">검색 중…</p>
    <p v-if="includeChat && indexing" class="form-note" role="status">이전 메시지의 검색 색인을 준비하고 있어요. <button type="button" @click="searchChat()">다시 검색</button></p>
    <p v-if="error" class="form-note" role="alert">{{ error }} <button type="button" @click="searchChat()">다시 시도</button></p>
    <div class="unified-search-hits">
      <template v-if="!chatOnly && scope !== '채팅'">
        <p v-if="result.total" class="form-note">내 기록 {{ result.total.toLocaleString() }}개 · {{ offset + 1 }}–{{ offset + result.items.length }}</p>
        <button v-for="entry in result.items" :key="entry.id" type="button" class="unified-search-hit" @click="go(entry)"><span class="tag">{{ entry.kind }}</span><span><b>{{ entry.title }}</b><small>{{ entry.meta }}</small><span>{{ entry.body?.slice(0, 140) }}</span></span></button>
        <div v-if="result.total > 40" class="unified-search-pagination"><button :disabled="offset === 0" @click="offset -= 40; searchLocal()">이전</button><button :disabled="offset + 40 >= result.total" @click="offset += 40; searchLocal()">다음</button></div>
      </template>
      <template v-if="includeChat">
        <p v-if="chatHits.length" class="form-note">채팅 {{ chatHits.length }}개{{ chatCursor ? ' 이상' : '' }}</p>
        <button v-for="hit in chatHits" :key="hit.message.id" type="button" class="unified-search-hit" @click="openHit(hit)"><span class="tag">채팅</span><span><b>{{ hit.roomName }} · {{ hit.message.senderName }}</b><small>{{ new Date(hit.message.createdAt).toLocaleString('ko-KR') }}</small><span>{{ hit.message.body }}</span></span></button>
        <button v-if="chatCursor" type="button" :disabled="chatBusy" class="review" @click="searchChat(true)">이전 검색 결과 더 보기</button>
      </template>
    </div>
    <p v-if="query.trim() && !localBusy && !chatBusy && !error && !indexing && !chatHits.length && (chatOnly || !result.total)" class="form-note">검색 결과가 없어요.</p>
  </div>
</template>
<style>
.unified-search-panel { min-width: 0; }.unified-search-input { display: block; margin: 0 0 12px; }.unified-search-scope { display: flex; align-items: center; gap: 12px; font-size: .8125rem; }.unified-search-scope select { flex: 1; min-width: 0; margin: 0; }
.unified-search-hits { display: grid; gap: 8px; }.unified-search-hit { display: flex; gap: 12px; padding: 14px 0; border-bottom: 1px solid var(--color-hairline); text-align: left; min-width: 0; }.unified-search-hit > span:last-child { flex: 1; min-width: 0; }.unified-search-hit b, .unified-search-hit small, .unified-search-hit span span { display: block; overflow-wrap: anywhere; }.unified-search-hit b { font-size: .875rem; }.unified-search-hit small { color: var(--color-muted); font-size: .75rem; margin: 4px 0; }.unified-search-hit span span { white-space: pre-wrap; font-size: .8125rem; max-height: 7em; overflow: hidden; }.unified-search-pagination { display: flex; justify-content: space-between; gap: 12px; }
</style>
