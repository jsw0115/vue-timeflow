<script setup>
import { computed, ref, watch } from 'vue'
import Modal from './Modal.vue'
import { useRouter, useRoute } from 'vue-router'
import {
  sidePanel, closePanel, notifications, unreadNotifications, markRead, markAllRead, removeNotification,

} from '../store/people'

/** 우측에서 슬라이드로 열리는 채팅·알림 패널 (화면 전환 없이 고정 영역에 표시) */
const router = useRouter()
const route = useRoute()
watch(() => route.fullPath, closePanel)
const NOTIF_FILTERS = ['전체', '안 읽음']
const notifFilter = ref('전체')
const visibleNotifs = computed(() =>
  notifFilter.value === '안 읽음' ? notifications.value.filter((n) => !n.read) : notifications.value,
)

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
      <p class="form-note">대화와 멘션, 태그를 채팅 화면에서 함께 확인할 수 있어요.</p>
      <button class="primary" @click="closePanel(); router.push('/chat')">채팅 열기</button>
      <button @click="closePanel(); router.push('/chat/mentions')">멘션함</button>
      <button @click="closePanel(); router.push('/chat/tags')">태그함</button>
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
