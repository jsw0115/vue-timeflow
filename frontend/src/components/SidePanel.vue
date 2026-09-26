<script setup>
import { computed, ref, nextTick, watch } from 'vue'
import Modal from './Modal.vue'
import TagMentionInput from './TagMentionInput.vue'
import RichText from './RichText.vue'
import { useRouter, useRoute } from 'vue-router'
import {
  sidePanel, closePanel, notifications, unreadNotifications, markRead, markAllRead, removeNotification,
  chatRooms, openRoom, sendMessage, openProfile,
} from '../store/people'

/** 우측에서 슬라이드로 열리는 채팅·알림 패널 (화면 전환 없이 고정 영역에 표시) */
const router = useRouter()
const route = useRoute()
watch(() => route.fullPath, closePanel)
const activeRoomId = ref(null)
const draft = ref('')
const bodyEl = ref(null)

const activeRoom = computed(() => chatRooms.value.find((r) => r.id === activeRoomId.value))
const NOTIF_FILTERS = ['전체', '안 읽음']
const notifFilter = ref('전체')
const visibleNotifs = computed(() =>
  notifFilter.value === '안 읽음' ? notifications.value.filter((n) => !n.read) : notifications.value,
)

function pickRoom(room) {
  if (activeRoomId.value !== room.id) draft.value = ''
  activeRoomId.value = room.id
  openRoom(room)
  nextTick(() => bodyEl.value?.scrollTo(0, bodyEl.value.scrollHeight))
}
function send() {
  if (!activeRoom.value || !sendMessage(activeRoom.value, draft.value)) return
  draft.value = ''
  nextTick(() => bodyEl.value?.scrollTo(0, bodyEl.value.scrollHeight))
}
function goNotif(n) {
  markRead(n)
  closePanel()
  router.push(n.link)
}
</script>

<template>
  <Modal v-if="sidePanel" :title="sidePanel === 'chat' ? '채팅' : '알림'" wide @close="closePanel">
  <div class="message-modal">
    <!-- 채팅 -->
    <template v-if="sidePanel === 'chat'">
      <p class="form-note">로컬 시연 대화입니다. 실제 상대방에게 전송되지 않아요.</p>
      <div class="side-panel-head">
        <b>{{ activeRoom ? '대화' : '대화 목록' }}</b>
        <button v-if="activeRoom" class="review" style="margin: 0" @click="activeRoomId = null">‹ 목록</button>
        
      </div>

      <div v-if="!activeRoom" class="side-panel-body">
        <button v-for="r in chatRooms" :key="r.id" class="chat-room-row" @click="pickRoom(r)">
          <i>{{ r.name[0] }}</i>
          <span>
            <b>{{ r.name }}<small v-if="r.kind === 'group'"> · 그룹</small></b>
            <small>{{ r.messages.at(-1)?.body ?? '대화를 시작해보세요' }}</small>
          </span>
          <em v-if="r.unread" class="chat-unread">{{ r.unread }}</em>
        </button>
      </div>

      <template v-else>
        <div class="side-panel-subhead">
          <b>{{ activeRoom.name }}</b>
          <button v-if="activeRoom.kind === 'dm'" class="person-info" @click="openProfile(activeRoom.name)">ⓘ</button>
        </div>
        <div class="side-panel-body" ref="bodyEl">
          <div class="chat-bubbles" style="height: auto">
            <div v-for="m in activeRoom.messages" :key="m.id" class="bubble" :class="{ mine: m.mine }"><RichText :text="m.body" /></div>
          </div>
        </div>
        <div class="chat-input">
          <TagMentionInput v-model="draft" :rows="2" placeholder="메시지 입력 · #태그 @이름 (Ctrl+Enter 전송)" @keydown.ctrl.enter.prevent="send" />
          <button class="primary" :disabled="!draft.trim()" @click="send">전송</button>
        </div>
      </template>
    </template>

    <!-- 알림 -->
    <template v-else>
      <div class="side-panel-head">
        <b>알림<small v-if="unreadNotifications"> · 안 읽음 {{ unreadNotifications }}</small></b>
        <button class="review" style="margin: 0" @click="markAllRead">모두 읽음</button>
        <button class="icon side-panel-close" @click="closePanel">×</button>
      </div>
      <div class="side-panel-subhead">
        <div class="filter">
          <button v-for="f in NOTIF_FILTERS" :key="f" :class="{ selected: notifFilter === f }" @click="notifFilter = f">{{ f }}</button>
        </div>
      </div>
      <div class="side-panel-body">
        <div v-for="n in visibleNotifs" :key="n.id" class="notif-row" :class="{ unread: !n.read }">
          <button class="notif-main" @click="goNotif(n)">
            <span class="tag">{{ n.kind }}</span>
            <span><b>{{ n.title }}</b><small>{{ n.at }}</small></span>
          </button>
          <button class="person-info" title="삭제" aria-label="삭제" @click="removeNotification(n.id)">×</button>
        </div>
        <p v-if="!visibleNotifs.length" class="form-note">표시할 알림이 없어요.</p>
      </div>
    </template>
  </div>
  </Modal>
</template>
