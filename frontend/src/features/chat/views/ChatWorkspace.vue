<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Modal from '../../../components/Modal.vue'
import SearchPanel from '../../../components/SearchPanel.vue'
import { logout, session } from '../../auth/session'
import { chatApi } from '../api/chatApi'
import { chatUserId, isChatPreview } from '../model/chatIdentity'
import { activeRoom, chat, loadOlder, loadRooms, markRead, reconcile, selectRoom, sendMessage, setMessengerActive, startChat, stopChat, unreadChats } from '../model/chatStore'
import ChatComposer from '../components/ChatComposer.vue'
import NewConversationDialog from '../components/NewConversationDialog.vue'
import '../styles/chat.css'

const props = defineProps({ embedded: Boolean, active: { type: Boolean, default: true } })
const route = useRoute(), router = useRouter()
const showSearch = ref(false), messageQuery = ref('')
const showUnifiedSearch = ref(false), searchResults = ref([]), searchCursor = ref(null), searchBusy = ref(false), searchError = ref('')
const showPresence = ref(false)
const searchIndexing = ref(false)
let searchTimer, searchVersion = 0
async function searchMessages(more = false) {
  const version = ++searchVersion, roomId = chat.selectedId, q = messageQuery.value.trim()
  if (!q || !roomId) { searchResults.value = []; searchCursor.value = null; searchBusy.value = false; return }
  searchBusy.value = true; searchError.value = ''
  try {
    const page = await chatApi.search({ q, roomId, ...(more && searchCursor.value ? { before: searchCursor.value } : {}) })
    if (version !== searchVersion || roomId !== chat.selectedId) return
    searchResults.value = more ? [...page.items.map(hit => hit.message), ...searchResults.value] : page.items.map(hit => hit.message)
    searchResults.value.sort((a, b) => BigInt(a.sequence) < BigInt(b.sequence) ? -1 : 1)
    searchCursor.value = page.nextCursor
    searchIndexing.value = !!page.indexing
  } catch (cause) { if (version === searchVersion) searchError.value = cause.message }
  finally { if (version === searchVersion) searchBusy.value = false }
}
watch(messageQuery, () => { searchVersion++; clearTimeout(searchTimer); searchResults.value = []; searchCursor.value = null; searchBusy.value = !!messageQuery.value.trim(); searchTimer = setTimeout(() => searchMessages(), 180) })
const query = ref(''), filter = ref('ALL'), showNew = ref(false), showDetails = ref(false), nextOwner = ref(''), confirmLeave = ref(false), detailError = ref('')
const scroll = ref(null), nearBottom = ref(true), hasNew = ref(false), now = ref(Date.now())
const messages = computed(() => chat.messages[chat.selectedId] || [])
const mentionDrafts = ref({}), tagFilter = ref(''), tagQuery = ref(''), tagResults = ref([]), tagCursor = ref(null), tagBusy = ref(false), tagError = ref('')
let tagRequest = 0
const mentionIds = computed(() => mentionDrafts.value[chat.selectedId] || [])
const displayed = computed(() => messageQuery.value.trim() ? searchResults.value : chat.searchHit?.message.roomId === chat.selectedId ? [chat.searchHit.message] : tagFilter.value ? tagResults.value : messages.value)
async function filterTag(tag, more = false) {
  tagFilter.value = tag; tagQuery.value = tag; tagError.value = ''
  const request = ++tagRequest, room = chat.selectedId
  if (!tag || !room) { tagResults.value = []; tagCursor.value = null; return }
  tagBusy.value = true
  try {
    const page = await chatApi.messages(room, { tag, ...(more && tagCursor.value ? { before: tagCursor.value } : {}) })
    if (request !== tagRequest || room !== chat.selectedId) return
    tagResults.value = more ? [...page.items, ...tagResults.value] : page.items
    tagCursor.value = page.nextCursor
  } catch (error) { tagError.value = error.message }
  finally { if (request === tagRequest) tagBusy.value = false }
}
function mention(member) {
  mentionDrafts.value[chat.selectedId] = [...new Set([...mentionIds.value, member.userId])]
}
const pending = computed(() => (chat.pending[chat.selectedId] || []).filter(item => !messages.value.some(message => message.clientMessageId === item.clientMessageId && message.senderId === chatUserId.value)))
const draft = computed({ get: () => chat.drafts[chat.selectedId] || '', set: value => { chat.drafts[chat.selectedId] = value } })
watch(draft, value => { if (chat.selectedId) mentionDrafts.value[chat.selectedId] = mentionIds.value.filter(id => activeRoom.value?.members.some(member => member.userId === id && value.includes('@' + member.nickname))) })
const visible = computed(() => chat.rooms.filter(room => {
  if (filter.value === 'UNREAD' && !room.unreadCount) return false
  if (['DM', 'GROUP'].includes(filter.value) && room.kind !== filter.value) return false
  return room.name.toLocaleLowerCase().includes(query.value.trim().toLocaleLowerCase())
}).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)))
const typing = computed(() => activeRoom.value?.members.filter(member => member.userId !== chatUserId.value && (chat.typing[chat.selectedId]?.[member.userId] || 0) > now.value).map(member => member.nickname).join(', ') || '')
function presenceLabel(userId) { const state = chat.presence[userId]; return isChatPreview.value ? '미리보기' : state?.validUntil > now.value ? state.active ? '메신저 활성' : '메신저 닫힘' : '상태 확인 중' }
function isActive(userId) { return chat.presence[userId]?.validUntil > now.value && chat.presence[userId]?.active }
const participants = computed(() => [...new Map(chat.rooms.flatMap(room => room.members).map(member => [member.userId, member])).values()])
const activeParticipants = computed(() => participants.value.filter(member => isActive(member.userId)))
const connection = computed(() => ({ idle: '대화를 연결해주세요', preview: '샘플 대화 미리보기', connecting: '연결하는 중', connected: '대화가 연결되었어요', reconnecting: '연결을 다시 확인하는 중' }[chat.connection]))
const dateLabel = value => new Date(value).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })
const timeLabel = value => new Date(value).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
function dayStart(index) { return !index || dateLabel(displayed.value[index].createdAt) !== dateLabel(displayed.value[index - 1].createdAt) }
function unreadFor(message) { return activeRoom.value?.members.filter(member => member.userId !== chatUserId.value && BigInt(member.lastReadSequence) < BigInt(message.sequence)).length || 0 }
async function bottom() {
  await nextTick()
  scroll.value?.scrollTo({ top: scroll.value.scrollHeight })
  nearBottom.value = true; hasNew.value = false
  readVisible()
}
function readVisible() {
  if (typeof document === 'undefined') return
  if (props.active && !chat.searchHit && !tagFilter.value && !messageQuery.value.trim() && !document.hidden && nearBottom.value && chat.selectedId && messages.value.length) void markRead(chat.selectedId, chat.synced[chat.selectedId] || '0')
}
function scrolled() {
  const el = scroll.value
  nearBottom.value = el.scrollHeight - el.scrollTop - el.clientHeight < 70
  if (nearBottom.value) { hasNew.value = false; readVisible() }
}
async function pick(id) {
  chat.searchHit = null
  nearBottom.value = true; hasNew.value = false
  if (props.embedded) { await selectRoom(id); await bottom() }
  else await router.replace({ path: '/chat', query: { room: id } })
}
async function history() {
  const el = scroll.value, height = el?.scrollHeight || 0, top = el?.scrollTop || 0
  nearBottom.value = false
  await loadOlder(); await nextTick()
  if (el) el.scrollTop = top + el.scrollHeight - height
}
function send() {
  const body = draft.value, id = chat.selectedId
  if (!id || !body.trim() || body.length > 4000) return
  draft.value = ''; nearBottom.value = true
  const recipients = mentionIds.value.filter(userId => activeRoom.value?.members.some(member => member.userId === userId && body.includes('@' + member.nickname))); mentionDrafts.value[id] = []
  void sendMessage(id, body, null, recipients).then(() => { if (id === chat.selectedId) { void bottom(); if (tagFilter.value) void filterTag(tagFilter.value) } })
  void bottom()
}
async function created(room) { showNew.value = false; await loadRooms(); await pick(room.id) }
async function transfer() {
  detailError.value = ''
  try { await chatApi.transfer(chat.selectedId, nextOwner.value); await reconcile(); nextOwner.value = '' }
  catch (error) { detailError.value = error.message }
}
async function leave() {
  if (!confirmLeave.value) { confirmLeave.value = true; return }
  try {
    await chatApi.leave(chat.selectedId)
    chat.rooms = chat.rooms.filter(room => room.id !== chat.selectedId)
    chat.selectedId = null; showDetails.value = false
    if (!props.embedded) await router.replace('/chat')
  } catch (error) { detailError.value = error.message }
}
async function signOut() { try { await logout() } finally { await router.push('/auth/login?redirect=/chat') } }
function backToList() {
  if (props.embedded) chat.selectedId = null
  else void router.replace('/chat')
}
watch(() => props.active, value => { setMessengerActive(value); if (value) void bottom() }, { immediate: true })
watch(() => chat.selectedId, () => {
  tagFilter.value = ''; tagQuery.value = ''; tagRequest++
  tagBusy.value = false; tagError.value = ''
  messageQuery.value = ''; showSearch.value = false
})
watch(() => route.query.room, async id => {
  if (props.embedded) return
  tagFilter.value = ''; tagQuery.value = ''; tagRequest++
  if (typeof id === 'string') { await selectRoom(id); await bottom() }
  else chat.selectedId = null
})
watch(() => messages.value.length, () => {
  if (chat.historyLoading) return
  if (tagFilter.value) { void filterTag(tagFilter.value); return }
  if (nearBottom.value) void bottom()
  else hasNew.value = true
})
watch(() => chat.synced[chat.selectedId], readVisible)
let clock
onMounted(async () => {
  clock = setInterval(() => { now.value = Date.now() }, 1000)
  document.addEventListener('visibilitychange', readVisible)
  await startChat()
  if (props.embedded) { if (chat.selectedId) await bottom(); return }
  if (typeof route.query.room === 'string') { await selectRoom(route.query.room); await bottom() }
  else if (isChatPreview.value) { await pick('preview-group') }
})
onBeforeUnmount(() => { stopChat(); clearInterval(clock); clearTimeout(searchTimer); searchVersion++; document.removeEventListener('visibilitychange', readVisible) })
</script>

<template>
  <div class="chat-workspace chat-workspace-live" :class="{ 'in-conversation': activeRoom, 'chat-messenger': embedded }">
    <header v-if="!embedded || !activeRoom" class="chat-page-head">
      <div><h1>{{ embedded ? '채팅' : '함께 나누는 하루' }} <span v-if="embedded && unreadChats" class="chat-count">{{ unreadChats > 99 ? '99+' : unreadChats }}</span></h1></div>
      <button class="chat-detail-button" aria-label="통합 검색" @click="showUnifiedSearch = true">⌕ 검색</button>
      <button class="chat-primary" @click="showNew = true"><span aria-hidden="true">＋</span> 새 대화</button>
    </header>
    <nav v-if="!embedded" class="chat-nav" aria-label="채팅 기능"><router-link to="/chat" aria-current="page">대화</router-link><router-link to="/chat/mentions">멘션함</router-link><router-link to="/chat/tags">태그함</router-link><button v-if="session.accessToken" class="chat-signout" @click="signOut">로그아웃</button></nav>
      <div v-if="chat.error" class="chat-banner" role="alert"><span>{{ chat.error }}</span><button @click="reconcile">다시 불러오기</button></div>
      <section class="chat-layout" :class="{ 'has-room': activeRoom }" aria-label="채팅">
        <aside class="chat-sidebar" aria-label="대화 목록">
          <div v-if="!embedded" class="chat-sidebar-title"><h2>대화</h2><span v-if="unreadChats" class="chat-count">{{ unreadChats > 99 ? '99+' : unreadChats }}</span><small>{{ chat.rooms.length }}개</small></div>
          <label class="chat-search"><span class="chat-sr">대화 이름 검색</span><input v-model="query" type="search" placeholder="대화 이름 검색" /></label>
          <div class="chat-filters" aria-label="대화 필터"><button v-for="item in [{ id: 'ALL', label: '전체' }, { id: 'UNREAD', label: '안 읽음' }, { id: 'DM', label: '개인' }, { id: 'GROUP', label: '그룹' }]" :key="item.id" :aria-pressed="filter === item.id" @click="filter = item.id">{{ item.label }}</button></div>
          <div class="chat-room-list">
            <p v-if="chat.loading && !chat.rooms.length" class="chat-note" role="status">대화를 불러오고 있어요…</p>
            <button v-for="room in visible" :key="room.id" class="chat-room-item" :class="{ selected: chat.selectedId === room.id }" :aria-current="chat.selectedId === room.id ? 'true' : undefined" @click="pick(room.id)">
              <span class="chat-avatar" aria-hidden="true">{{ room.name.slice(0, 1) }}<i v-if="room.members.some(member => member.userId !== chatUserId && isActive(member.userId))" class="chat-presence-dot"></i></span>
              <span class="chat-room-copy"><span><strong>{{ room.name }}</strong><time v-if="room.lastMessage">{{ timeLabel(room.lastMessage.createdAt) }}</time></span><small>{{ room.lastMessage?.body || '첫 이야기를 나눠보세요' }}</small><span v-if="room.kind === 'GROUP'" class="chat-room-meta">그룹 · {{ room.members.length }}명</span></span>
              <span v-if="room.unreadCount" class="chat-count">{{ room.unreadCount > 99 ? '99+' : room.unreadCount }}</span>
            </button>
            <div v-if="!visible.length && !chat.loading" class="chat-list-empty"><strong>{{ query || filter !== 'ALL' ? '조건에 맞는 대화가 없어요' : '아직 나눈 이야기가 없어요' }}</strong><p>{{ query || filter !== 'ALL' ? '검색어나 필터를 바꿔보세요.' : '새 대화에서 상대를 찾아보세요.' }}</p></div>
            <button v-if="chat.roomCursor" class="chat-more" @click="loadRooms(true).catch(error => chat.error = error.message)">대화 더 불러오기</button>
          </div>
          <button class="chat-sidebar-foot chat-presence-open" @click="showPresence = true">{{ isChatPreview ? '참여자 상태' : '메신저 활성 ' + activeParticipants.length + '명' }} · 확인하기</button>
        </aside>
        <section v-if="activeRoom" class="chat-conversation" :aria-label="`${activeRoom.name} 대화`">
          <header class="chat-conversation-head">
            <button class="chat-back" aria-label="대화 목록으로" @click="backToList">←</button><span class="chat-avatar" aria-hidden="true">{{ activeRoom.name.slice(0, 1) }}</span>
            <div><h2>{{ activeRoom.name }}</h2><p role="status"><span class="chat-status-dot" :class="{ connected: chat.connection === 'connected' }"></span>{{ connection }} · {{ activeRoom.members.length }}명</p></div>
            <button class="chat-detail-button" aria-label="통합 검색" @click="showUnifiedSearch = true">⌕</button>
            <button class="chat-detail-button chat-search-toggle" aria-label="메시지 검색" :aria-expanded="showSearch" @click="showSearch = !showSearch"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg></button>
            <button class="chat-detail-button" @click="showDetails = true; confirmLeave = false; detailError = ''">참여자</button>
          </header>
          <label v-if="showSearch" class="chat-message-search"><span class="chat-sr">메시지 검색</span><input v-model="messageQuery" type="search" placeholder="이 대화에서 메시지 검색" /></label>
          <form v-if="tagFilter" class="chat-tag-filter" @submit.prevent="filterTag(tagQuery)"><label for="chat-filter-tag">태그</label><input id="chat-filter-tag" v-model="tagQuery" maxlength="32" placeholder="태그 이름" /><button :disabled="tagBusy">찾기</button><button type="button" @click="filterTag('')">전체 메시지</button></form>
          <p v-if="tagError" role="alert" class="chat-note">{{ tagError }}</p>
          <div v-if="chat.searchHit?.message.roomId === chat.selectedId" class="chat-search-match"><span>검색한 메시지</span><button @click="chat.searchHit = null; bottom()">최근 대화로</button></div>
          <p v-if="searchBusy || searchError" class="chat-note" role="status">{{ searchBusy ? '검색 중…' : searchError }}</p>
          <p v-if="messageQuery.trim() && searchIndexing" class="chat-note" role="status">이전 메시지의 검색 색인을 준비하고 있어요. <button @click="searchMessages()">다시 검색</button></p>
          <div ref="scroll" class="chat-message-list" role="log" aria-label="메시지" aria-live="polite" aria-relevant="additions" @scroll="scrolled">
            <button v-if="!tagFilter && !messageQuery.trim() && !chat.searchHit && chat.older[chat.selectedId]" class="chat-more" :disabled="chat.historyLoading" @click="history">{{ chat.historyLoading ? '불러오는 중…' : '이전 메시지 보기' }}</button>
            <button v-if="messageQuery.trim() && searchCursor" class="chat-more" :disabled="searchBusy" @click="searchMessages(true)">이전 검색 결과</button>
            <button v-if="tagFilter && tagCursor" class="chat-more" :disabled="tagBusy" @click="filterTag(tagFilter, true)">이전 검색 결과</button>
            <p v-if="tagFilter && !displayed.length" class="chat-note">{{ tagBusy ? '태그를 찾는 중…' : '이 태그가 포함된 메시지가 없어요.' }}</p>
            <p v-if="messageQuery.trim() && !displayed.length && !searchBusy && !searchError && !searchIndexing" class="chat-note">검색한 메시지가 없어요.</p>
            <p v-if="chat.loading" class="chat-note" role="status">메시지를 불러오고 있어요…</p>
            <div v-if="!messages.length && !chat.loading" class="chat-first"><h3>이야기의 시작</h3><p>가벼운 인사부터 건네보세요.</p></div>
            <template v-for="(message, index) in displayed" :key="message.id">
              <div v-if="dayStart(index)" class="chat-date"><span>{{ dateLabel(message.createdAt) }}</span></div>
              <article class="chat-message" :class="{ mine: message.senderId === chatUserId }">
                <span v-if="message.senderId !== chatUserId && embedded" class="chat-message-avatar" aria-hidden="true">{{ message.senderName?.slice(0, 1) }}</span>
                <span v-if="message.senderId !== chatUserId" class="chat-sender">{{ message.senderName }}</span><p>{{ message.body }}</p>
                <div v-if="message.tags?.length" class="chat-message-tags"><button v-for="tag in message.tags" :key="tag" @click="filterTag(tag)">#{{ tag }}</button></div>
                <small v-if="message.mentionUserIds?.includes(chatUserId)" class="chat-mention-label">나를 멘션한 메시지</small>
                <div class="chat-message-meta"><time :datetime="message.createdAt">{{ timeLabel(message.createdAt) }}</time><span v-if="message.senderId === chatUserId">{{ unreadFor(message) ? `${unreadFor(message)}명 안 읽음` : '모두 읽음' }}</span></div>
              </article>
            </template>
            <article v-for="message in pending" :key="message.clientMessageId" class="chat-message mine pending"><p>{{ message.body }}</p><div class="chat-message-meta"><span>{{ message.status === 'sending' ? '보내는 중…' : message.error }}</span><button v-if="message.status === 'failed'" @click="sendMessage(chat.selectedId, message.body, message)">다시 보내기</button></div></article>
          </div>
          <button v-if="hasNew" class="chat-new-messages" @click="bottom">새 메시지 ↓</button>
          <div class="chat-typing" role="status">{{ typing ? typing + '님이 입력 중이에요…' : '' }}</div>
          <ChatComposer v-model="draft" :disabled="chat.loading" :members="activeRoom.members.filter(member => member.userId !== chatUserId)" :mentions="mentionIds" @mention="mention" @unmention="id => mentionDrafts[chat.selectedId] = mentionIds.filter(item => item !== id)" @send="send" @typing="chatApi.typing(chat.selectedId).catch(() => {})" />
        </section>
        <section v-else class="chat-no-selection"><span class="chat-empty-symbol" aria-hidden="true">“</span><h2>오늘의 이야기를 나눠요</h2><p>대화를 선택하거나 새로 시작해보세요.<br />함께하는 계획은 조금 더 가벼워질 거예요.</p><button @click="showNew = true">새 대화 시작하기 ↗</button></section>
      </section>
    <Modal v-if="showUnifiedSearch" title="통합 검색" @close="showUnifiedSearch = false"><SearchPanel @room="showUnifiedSearch = false" @close="showUnifiedSearch = false" /><template #footer><button class="modal-secondary" @click="showUnifiedSearch = false">닫기</button></template></Modal>
    <Modal v-if="showPresence" title="메신저 활성 상태" @close="showPresence = false"><p class="form-note">함께 대화하는 참여자의 메신저 상태를 표시해요.</p><ul class="chat-members"><li v-for="member in participants" :key="member.userId"><span>{{ member.nickname }}{{ member.userId === chatUserId ? ' (나)' : '' }}</span><small :class="{ 'chat-presence-active': isActive(member.userId) }">{{ presenceLabel(member.userId) }}</small></li></ul><template #footer><button class="modal-secondary" @click="showPresence = false">닫기</button></template></Modal>
    <NewConversationDialog v-if="showNew" @close="showNew = false" @created="created" />
    <Modal v-if="showDetails && activeRoom" title="대화 참여자" @close="showDetails = false">
      <ul class="chat-members"><li v-for="member in activeRoom.members" :key="member.userId"><span>{{ member.nickname }}{{ member.userId === chatUserId ? ' (나)' : '' }}</span><small :class="{ 'chat-presence-active': isActive(member.userId) }">{{ presenceLabel(member.userId) }}</small><small v-if="member.userId === activeRoom.ownerId && activeRoom.kind === 'GROUP'">방장</small></li></ul>
      <template v-if="activeRoom.kind === 'GROUP'">
        <div v-if="activeRoom.ownerId === chatUserId && activeRoom.members.length > 1" class="chat-owner"><label>방장 넘기기<select v-model="nextOwner"><option disabled value="">참여자 선택</option><option v-for="member in activeRoom.members.filter(item => item.userId !== chatUserId)" :key="member.userId" :value="member.userId">{{ member.nickname }}</option></select></label></div>
        <p v-if="confirmLeave" class="chat-note">나가면 이 대화의 메시지를 더 이상 볼 수 없어요. 계속할까요?</p>
      </template>
      <p v-if="detailError" role="alert">{{ detailError }}</p>
      <template #footer><button class="modal-secondary" @click="showDetails = false">닫기</button><button v-if="activeRoom.kind === 'GROUP' && activeRoom.ownerId === chatUserId && activeRoom.members.length > 1" class="modal-secondary" :disabled="!nextOwner" @click="transfer">방장 넘기기</button><button v-if="activeRoom.kind === 'GROUP'" class="chat-leave" @click="leave">{{ confirmLeave ? '확인하고 대화 나가기' : '대화 나가기' }}</button></template>
    </Modal>
  </div>
</template>
