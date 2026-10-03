import { computed, reactive, ref, watch } from 'vue'
import { authorizedFetch, session } from '../../auth/session'
import { chatApi } from '../api/chatApi'
import { chatUserId, isChatPreview } from './chatIdentity'
import { createSseParser, mergeMessages } from '../domain/messages'

export const chat = reactive({ rooms: [], roomCursor: null, selectedId: null, messages: {}, synced: {}, older: {}, pending: {}, drafts: {}, typing: {}, presence: {}, searchHit: null, loading: false, historyLoading: false, error: '', connection: 'idle' })
export const activeRoom = computed(() => chat.rooms.find(room => room.id === chat.selectedId))
export const unreadChats = computed(() => chat.rooms.reduce((total, room) => total + room.unreadCount, 0))
export const hasUnreadMentions = ref(false)
export async function refreshMentionBadge() {
  const user = chatUserId.value
  if (!user) { hasUnreadMentions.value = false; return }
  try { const page = await chatApi.mentions({ unread: true, limit: 1 }); if (user === chatUserId.value) hasUnreadMentions.value = !!page.items.length }
  catch { /* Keep the last known state until the next successful read. */ }
}
let running = false, stream, poll, reconnect, generation = 0, synchronizing = false, again = false
let owner = chatUserId.value
let messengerActive = false, presenceTimer, clientId, presenceChain = Promise.resolve()
export function setMessengerActive(value) { messengerActive = value; if (running) void refreshPresence() }
export function refreshPresence() {
  const user = chatUserId.value
  if (!user || isChatPreview.value) return Promise.resolve()
  clientId ||= crypto.randomUUID()
  const active = messengerActive && !document.hidden
  presenceChain = presenceChain.catch(() => {}).then(async () => {
    if (user !== chatUserId.value) return
    await chatApi.presence(clientId, active)
    const ids = [...new Set(chat.rooms.flatMap(room => room.members.map(member => member.userId)))].slice(0, 100)
    if (!ids.length) return
    const statuses = await chatApi.peoplePresence(ids)
    if (user !== chatUserId.value) return
    for (const status of statuses) chat.presence[status.userId] = { ...status, validUntil: Date.now() + 30000 }
  }).catch(() => {})
  return presenceChain
}
function upsert(room) {
  const index = chat.rooms.findIndex(item => item.id === room.id)
  if (index >= 0) chat.rooms[index] = room
  else chat.rooms.unshift(room)
}
export async function loadRooms(more = false) {
  const user = chatUserId.value
  const page = await chatApi.rooms(more ? chat.roomCursor : null)
  if (user !== chatUserId.value) return
  if (!more) {
    const boundary = page.items.at(-1)?.id
    chat.rooms = page.hasNext ? chat.rooms.filter(room => room.id < boundary) : []
  }
  for (const room of page.items) upsert(room)
  chat.roomCursor = page.nextCursor
  void refreshMentionBadge()
}
export async function selectRoom(id) {
  chat.selectedId = id
  chat.error = ''
  chat.loading = true
  const user = chatUserId.value
  try {
    const [room, page] = await Promise.all([chatApi.room(id), chatApi.messages(id)])
    if (user !== chatUserId.value) return
    upsert(room)
    chat.messages[id] = page.items
    chat.synced[id] = page.items.at(-1)?.sequence || '0'
    chat.older[id] = page.nextCursor
  } catch (error) { if (id === chat.selectedId) chat.error = error.message }
  finally { if (id === chat.selectedId) chat.loading = false }
}
export async function loadOlder() {
  const id = chat.selectedId, cursor = chat.older[id], user = chatUserId.value
  if (!cursor || chat.historyLoading) return
  chat.historyLoading = true
  try {
    const page = await chatApi.messages(id, { before: cursor })
    if (user !== chatUserId.value) return
    chat.messages[id] = mergeMessages(chat.messages[id] || [], page.items)
    chat.older[id] = page.nextCursor
  } catch (error) { chat.error = error.message }
  finally { chat.historyLoading = false }
}
export async function reconcile() {
  if (synchronizing) { again = true; return }
  synchronizing = true
  const user = chatUserId.value
  try {
    do {
      again = false
      await loadRooms()
      const id = chat.selectedId
      if (!id) continue
      const room = await chatApi.room(id)
      if (user !== chatUserId.value) return
      upsert(room)
      // A send ACK can arrive ahead of other messages. Only REST pages advance this cursor.
      let after = chat.synced[id] || '0', page
      do {
        page = await chatApi.messages(id, { after })
        if (user !== chatUserId.value) return
        chat.messages[id] = mergeMessages(chat.messages[id] || [], page.items)
        if (page.items.length) chat.synced[id] = page.items.at(-1).sequence
        after = page.nextCursor
      } while (page.hasNext && running && id === chat.selectedId)
    } while (again && running)
    chat.error = ''
  } catch (error) {
    if (user !== chatUserId.value) return
    if (error.status === 404 && chat.selectedId) {
      chat.rooms = chat.rooms.filter(room => room.id !== chat.selectedId)
      chat.selectedId = null
    }
    chat.error = error.message
  } finally { synchronizing = false }
}
export async function sendMessage(roomId, body, retry, mentionUserIds = []) {
  if (!body.trim() || body.length > 4000) return false
  const pending = retry || { clientMessageId: crypto.randomUUID(), body: body.trim(), mentionUserIds, status: 'sending' }
  chat.pending[roomId] ||= []
  if (!retry) chat.pending[roomId].push(pending)
  pending.status = 'sending'
  const user = chatUserId.value
  try {
    const saved = await chatApi.send(roomId, { clientMessageId: pending.clientMessageId, body: pending.body, mentionUserIds: pending.mentionUserIds || [] })
    if (user !== chatUserId.value) return false
    chat.messages[roomId] = mergeMessages(chat.messages[roomId] || [], [saved])
    chat.pending[roomId] = chat.pending[roomId].filter(item => item.clientMessageId !== pending.clientMessageId)
    void chatApi.room(roomId).then(room => { if (user === chatUserId.value) upsert(room) }).catch(() => {})
    return true
  } catch (error) { pending.status = 'failed'; pending.error = error.message; return false }
}
export async function markRead(id, sequence) {
  const room = chat.rooms.find(item => item.id === id)
  const me = room?.members.find(member => member.userId === chatUserId.value)
  if (!me || BigInt(me.lastReadSequence) >= BigInt(sequence)) return
  try {
    const state = await chatApi.read(id, sequence)
    me.lastReadSequence = state.lastReadSequence
    room.unreadCount = (chat.messages[id] || []).filter(message => message.senderId !== chatUserId.value && BigInt(message.sequence) > BigInt(state.lastReadSequence)).length
  } catch (error) { chat.error = error.message }
}
async function listen(epoch) {
  stream = new AbortController()
  chat.connection = 'connecting'
  try {
    const response = await authorizedFetch('/api/chat/events', { headers: { Accept: 'text/event-stream' }, signal: stream.signal })
    if (!response.ok) throw new Error('연결을 다시 확인하고 있어요.')
    chat.connection = 'connected'
    const parse = createSseParser((event, data) => {
      if (event === 'connected') void reconcile()
      if (event !== 'changed') return
      if (data.type === 'TYPING') { if (data.userId !== chatUserId.value) { chat.typing[data.roomId] ||= {}; chat.typing[data.roomId][data.userId] = Date.now() + 3500 } }
      else void reconcile()
    })
    const reader = response.body.getReader(), decoder = new TextDecoder()
    while (running && epoch === generation) {
      const result = await reader.read()
      if (result.done) break
      parse(decoder.decode(result.value, { stream: true }))
    }
    await reader.cancel().catch(() => {})
  } catch (error) { if (error.name !== 'AbortError') chat.connection = 'reconnecting' }
  finally {
    if (running && epoch === generation) {
      chat.connection = 'reconnecting'
      reconnect = setTimeout(() => listen(epoch), 2000 + Math.random() * 1500)
    }
  }
}
export async function startChat() {
  if (running) return
  running = true
  const epoch = ++generation
  chat.loading = true
  try { await loadRooms() } catch (error) { chat.error = error.message }
  finally { chat.loading = false }
  if (!running || epoch !== generation) return
  if (isChatPreview.value) chat.connection = 'preview'
  else void listen(epoch)
  poll = setInterval(() => { if (!document.hidden) void reconcile() }, 15000)
  presenceTimer = setInterval(refreshPresence, 10000)
  document.addEventListener('visibilitychange', refreshPresence)
  void refreshPresence()
}
export function stopChat() { messengerActive = false; void refreshPresence(); running = false; generation++; stream?.abort(); clearInterval(poll); clearInterval(presenceTimer); clearTimeout(reconnect); document.removeEventListener('visibilitychange', refreshPresence); chat.connection = 'idle' }
watch(() => chatUserId.value, value => {
  if (value === owner) return
  const restart = running
  const wasActive = messengerActive
  stopChat(); owner = value
  hasUnreadMentions.value = false
  Object.assign(chat, { rooms: [], roomCursor: null, selectedId: null, messages: {}, synced: {}, older: {}, pending: {}, drafts: {}, typing: {}, presence: {}, searchHit: null, error: '' })
  if (restart && value) { messengerActive = wasActive; void startChat() }
})
