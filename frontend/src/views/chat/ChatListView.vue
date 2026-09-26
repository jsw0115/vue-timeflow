<script setup>
import TagMentionInput from '../../components/TagMentionInput.vue'
import RichText from '../../components/RichText.vue'
import { computed, nextTick, ref, watch } from 'vue'
import Modal from '../../components/Modal.vue'
import ListFilterBar from '../../components/ListFilterBar.vue'
import PersonTag from '../../components/PersonTag.vue'
import { chatRooms, openRoom, sendMessage, unreadChats, openProfile } from '../../store/people'
import { contacts, isBlocked } from '../../store/contacts'

/**
 * 채팅 — 헤더 우측 패널과 같은 people 스토어를 쓴다.
 * 어느 쪽에서 읽거나 보내도 양쪽에 동일하게 반영된다.
 */
const query = ref('')
const filters = ref({ kind: '전체' })
const FILTER_GROUPS = [
  {
    id: 'kind',
    all: '전체',
    options: [
      { value: '전체', label: '전체' },
      { value: 'dm', label: '개인' },
      { value: 'group', label: '그룹' },
      { value: '안 읽음', label: '안 읽음' },
    ],
  },
]

const visible = computed(() => {
  const k = query.value.trim()
  return chatRooms.value.filter((r) => {
    const f = filters.value.kind
    if (f === '안 읽음' && !r.unread) return false
    if ((f === 'dm' || f === 'group') && r.kind !== f) return false
    if (k && !r.name.includes(k) && !r.messages.some((m) => m.body.includes(k))) return false
    return true
  })
})

const activeId = ref(chatRooms.value[0]?.id ?? null)
const activeRoom = computed(() => chatRooms.value.find((r) => r.id === activeId.value) ?? null)
const draft = ref('')
const bodyEl = ref(null)

function pick(room) {
  activeId.value = room.id
  openRoom(room)
  scrollDown()
}
function scrollDown() {
  nextTick(() => bodyEl.value?.scrollTo(0, bodyEl.value.scrollHeight))
}
function send() {
  if (!activeRoom.value || !sendMessage(activeRoom.value, draft.value)) return
  draft.value = ''
  scrollDown()
}
watch(activeRoom, (r) => r && openRoom(r), { immediate: true })

/* 새 채팅 — 주소록에서 상대를 고른다 */
const showNew = ref(false)
const pickerQuery = ref('')
const candidates = computed(() => {
  const k = pickerQuery.value.trim()
  return contacts.value.filter(
    (c) => !isBlocked(c.id) && (!k || c.name.includes(k)) && !chatRooms.value.some((r) => r.kind === 'dm' && r.name === c.name),
  )
})
function startChat(contact) {
  const id = Math.max(0, ...chatRooms.value.map((r) => r.id)) + 1
  chatRooms.value.unshift({ id, name: contact.name, kind: 'dm', unread: 0, messages: [] })
  activeId.value = id
  showNew.value = false
  pickerQuery.value = ''
}
</script>

<template>
  <div class="page-tools">
    <b style="font-size: 16px">채팅</b>
    <span class="form-note" style="margin: 0">안 읽은 대화 {{ unreadChats }}건</span>
    <span></span>
    <button class="primary" @click="showNew = true">+ 새 채팅</button>
  </div>

  <ListFilterBar
    v-model:query="query"
    v-model:filters="filters"
    :groups="FILTER_GROUPS"
    placeholder="대화 상대·내용 검색"
    :result-count="visible.length"
    :total-count="chatRooms.length"
  />

  <section class="card chat-pattern">
    <div class="chat-threads">
      <button
        class="chat-thread"
        :class="{ active: activeId === r.id }"
        v-for="r in visible"
        :key="r.id"
        @click="pick(r)"
      >
        <i>{{ r.name[0] }}</i>
        <span><b>{{ r.name }}<small v-if="r.kind === 'group'"> · 그룹</small></b><small>{{ r.messages.at(-1)?.body ?? '대화를 시작해보세요' }}</small></span>
        <span class="unread" v-if="r.unread">{{ r.unread }}</span>
      </button>
      <p v-if="!visible.length" class="form-note" style="padding: 12px">조건에 맞는 대화가 없어요.</p>
    </div>

    <div class="chat-room" v-if="activeRoom">
      <div class="chat-room-head">
        <b>{{ activeRoom.name }}</b>
        <PersonTag v-if="activeRoom.kind === 'dm'" :name="activeRoom.name" />
        <small style="margin-left: auto; color: var(--color-muted)">{{ activeRoom.messages.length }}개 메시지</small>
      </div>
      <div class="chat-bubbles" ref="bodyEl">
        <div v-for="m in activeRoom.messages" :key="m.id" class="bubble" :class="{ mine: m.mine }"><RichText :text="m.body" /></div>
        <p v-if="!activeRoom.messages.length" class="form-note" style="align-self: center">첫 메시지를 보내보세요.</p>
      </div>
      <div class="chat-input">
        <TagMentionInput v-model="draft" :rows="2" placeholder="메시지 입력 · #태그 @이름 (Ctrl+Enter 전송)" @keydown.ctrl.enter.prevent="send" />
        <button class="primary" :disabled="!draft.trim()" @click="send">전송</button>
      </div>
    </div>
    <div class="chat-room chat-empty" v-else>대화를 선택해주세요</div>
  </section>

  <Modal v-if="showNew" title="새 채팅" @close="showNew = false">
    <input v-model="pickerQuery" placeholder="이름으로 검색" autofocus />
    <div class="picker-list invite-list" style="margin-top: 10px">
      <button class="picker-row" v-for="c in candidates" :key="c.id" style="width: 100%" @click="startChat(c)">
        <i>{{ c.name[0] }}</i>
        <span style="flex: 1; text-align: left"><b>{{ c.name }}</b><small>{{ c.relation }} · {{ c.email }}</small></span>
        <span class="tag">대화 시작</span>
      </button>
      <p v-if="!candidates.length" class="form-note" style="margin: 8px 0 0">새로 대화할 수 있는 상대가 없어요.</p>
    </div>
    <p class="form-note">차단한 사용자와 이미 대화 중인 상대는 표시되지 않아요.</p>
  </Modal>
</template>
