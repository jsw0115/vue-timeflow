<script setup>
import { computed, ref, watch } from 'vue'
import Modal from './Modal.vue'
import { tr, bodyLocale } from '../store/locale'
import { useRouter, useRoute } from 'vue-router'
import {
  sidePanel, closePanel, notifications, unreadNotifications, markRead, markAllRead, removeNotification, actOnNotification, notificationState,

} from '../store/people'
import { canAct, relativeLabelIn, relativeTimeIn } from '../features/notifications/notificationClient.mjs'

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
// 알림 시각: 한국어는 저장한 문구, 다른 언어는 서버 시각으로 다시 만들고 시연 알림은 저장한 문구를 바꾼다('{n}분 전'은 사전에서 다른 뜻이다)
const atText = (n) => (bodyLocale.value === 'ko' ? n.at : n.createdAt ? relativeTimeIn(n.createdAt, bodyLocale.value) : relativeLabelIn(n.at, bodyLocale.value))
</script>

<template>
  <Modal v-if="sidePanel" :title="sidePanel === 'chat' ? tr('채팅') : tr('알림')" wide @close="closePanel">
  <div class="message-modal">
    <!-- 채팅 -->
    <template v-if="sidePanel === 'chat'">
      <p class="form-note">{{ tr('대화와 멘션, 태그를 채팅 화면에서 함께 확인할 수 있어요.') }}</p>
      <button class="primary" @click="closePanel(); router.push('/chat')">{{ tr('채팅 열기') }}</button>
      <button @click="closePanel(); router.push('/chat/mentions')">{{ tr('멘션함') }}</button>
      <button @click="closePanel(); router.push('/chat/tags')">{{ tr('태그함') }}</button>
    </template>

    <!-- 알림 -->
    <template v-else>
      <div class="side-panel-head">
        <b>{{ tr('알림') }}<small v-if="unreadNotifications"> · {{ tr('안 읽음 {n}', { n: unreadNotifications }) }}</small></b>
        <button class="review" style="margin: 0" @click="markAllRead">{{ tr('모두 읽음') }}</button>
        <button class="icon side-panel-close" :aria-label="tr('닫기')" @click="closePanel">×</button>
      </div>
      <div class="side-panel-subhead">
        <div class="filter">
          <button v-for="f in NOTIF_FILTERS" :key="f" :class="{ selected: notifFilter === f }" @click="notifFilter = f">{{ tr(f) }}</button>
        </div>
      </div>
      <div class="side-panel-body">
        <div v-for="n in visibleNotifs" :key="n.id" class="notif-row" :class="{ unread: !n.read }">
          <button class="notif-main" @click="goNotif(n)">
            <span class="tag">{{ tr(n.kind) }}</span>
            <span><b>{{ n.title }}</b><small>{{ atText(n) }}</small></span>
          </button>
          <!-- 알림에서 바로 처리(UF-126). 처리 결과는 서버 알림에 남아 다른 기기에서도 처리됨으로 보인다 -->
          <span v-if="canAct(n)" class="notif-actions">
            <button type="button" class="button-secondary" :aria-label="tr('{name} 할 일 완료', { name: n.title })" @click="actOnNotification(n, 'complete')">{{ tr('완료') }}</button>
            <button type="button" class="button-text" :aria-label="tr('{name} 10분 뒤 다시 알림', { name: n.title })" @click="actOnNotification(n, 'snooze')">{{ tr('10분 뒤') }}</button>
          </span>
          <span v-else-if="n.handled" class="badge ok">{{ tr('처리됨') }}</span>
          <button class="person-info" :title="tr('삭제')" :aria-label="tr('삭제')" @click="removeNotification(n.id)">×</button>
        </div>
        <p v-if="notificationState.message" class="input-field-help" role="status">{{ tr(notificationState.message) }}</p>
        <p v-if="!visibleNotifs.length" class="empty-state">{{ tr('표시할 알림이 없어요. 받을 알림 종류는 알림 설정에서 고를 수 있어요.') }}</p>
      </div>
    </template>
  </div>
  </Modal>
</template>

<style scoped>
.notif-actions { display: inline-flex; flex-wrap: wrap; gap: var(--space-xs); }
</style>
