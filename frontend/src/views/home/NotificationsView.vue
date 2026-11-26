<script setup>
import { tr, bodyLocale } from '../../store/locale'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import ListFilterBar from '../../components/ListFilterBar.vue'
import { notifications, unreadNotifications, markRead, markAllRead, removeNotification, loadNotifications, notificationState, actOnNotification } from '../../store/people'
import { canAct, relativeLabelIn, relativeTimeIn } from '../../features/notifications/notificationClient.mjs'
import { session } from '../../features/auth/session.js'
import PageActions from '../../components/PageActions.vue'

/** 알림 — 헤더 우측 패널과 같은 people 스토어를 공유한다. */
const router = useRouter()
const query = ref('')
const filters = ref({ kind: '전체', state: '전체' })
const FILTER_GROUPS = computed(() => [
  {
    id: 'kind',
    all: '전체',
    options: [{ value: '전체', label: '전체' }, ...[...new Set(notifications.value.map((n) => n.kind))].map((k) => ({ value: k, label: k }))],
  },
  {
    id: 'state',
    all: '전체',
    options: [
      { value: '전체', label: '모든 상태' },
      { value: '안 읽음', label: '안 읽음' },
      { value: '읽음', label: '읽음' },
    ],
  },
])

const visible = computed(() => {
  const k = query.value.trim()
  return notifications.value.filter((n) => {
    if (filters.value.kind !== '전체' && n.kind !== filters.value.kind) return false
    if (filters.value.state === '안 읽음' && n.read) return false
    if (filters.value.state === '읽음' && !n.read) return false
    if (k && !n.title.includes(k)) return false
    return true
  })
})

// 알림함을 열 때마다 서버가 다가오는 마감 알림을 계산하게 하고 목록을 새로 읽는다(Q-32)
onMounted(() => { if (session.userId) void loadNotifications() })

function open(n) {
  markRead(n)
  router.push(n.link)
}
// 알림 시각: 한국어는 저장한 문구, 다른 언어는 서버 시각으로 다시 만들고 시연 알림은 저장한 문구를 바꾼다('{n}분 전'은 사전에서 다른 뜻이다)
const atText = (n) => (bodyLocale.value === 'ko' ? n.at : n.createdAt ? relativeTimeIn(n.createdAt, bodyLocale.value) : relativeLabelIn(n.at, bodyLocale.value))
</script>

<template>
  <div class="page-tools">
    <span class="form-note" style="margin: 0">{{ tr('안 읽음 {n}건', { n: unreadNotifications }) }}</span>
    <span></span>
    <PageActions><button class="primary" :disabled="!unreadNotifications" @click="markAllRead">{{ tr('모두 읽음 처리') }}</button></PageActions>
  </div>

  <ListFilterBar
    v-model:query="query"
    v-model:filters="filters"
    :groups="FILTER_GROUPS"
    :placeholder="tr('알림 내용 검색')"
    :result-count="visible.length"
    :total-count="notifications.length"
  />

  <p v-if="notificationState.status === 'loading' && !notifications.length" class="input-field-help" role="status">{{ tr('알림을 불러오는 중이에요.') }}</p>
  <p v-if="notificationState.status === 'error' || notificationState.message" class="input-field-help" role="status" :data-state="notificationState.status === 'error' ? 'error' : undefined">{{ tr(notificationState.message || '알림을 불러오지 못했어요.') }} <button v-if="notificationState.status === 'error'" type="button" class="button-text" @click="loadNotifications">{{ tr('다시 시도') }}</button></p>
  <p v-if="!session.userId" class="input-field-help">{{ tr('지금 보이는 알림은 예시예요. 로그인하면 계정 알림과 할 일·지원 마감 알림을 받아요.') }}</p>
  <section class="card">
    <div class="notif-row" v-for="n in visible" :key="n.id" :class="{ unread: !n.read }">
      <button class="notif-main" @click="open(n)">
        <span class="tag">{{ tr(n.kind) }}</span>
        <span><b>{{ n.title }}</b><small>{{ atText(n) }}</small></span>
      </button>
      <template v-if="canAct(n)">
        <button type="button" class="button-secondary" :aria-label="tr('{name} 할 일 완료', { name: n.title })" @click="actOnNotification(n, 'complete')">{{ tr('완료') }}</button>
        <button type="button" class="button-text" :aria-label="tr('{name} 10분 뒤 다시 알림', { name: n.title })" @click="actOnNotification(n, 'snooze')">{{ tr('10분 뒤') }}</button>
      </template>
      <span v-else-if="n.handled" class="badge ok">{{ tr('처리됨') }}</span>
      <button v-if="!n.read" class="review" style="margin: 0" @click="markRead(n)">{{ tr('읽음') }}</button>
      <button class="person-info" :title="tr('삭제')" :aria-label="tr('삭제')" @click="removeNotification(n.id)">×</button>
    </div>
    <p v-if="!visible.length" class="empty-state" role="status">{{ tr('조건에 맞는 알림이 없어요. 필터를 바꿔 보세요.') }}</p>
  </section>
</template>
