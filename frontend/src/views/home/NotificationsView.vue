<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import ListFilterBar from '../../components/ListFilterBar.vue'
import { notifications, unreadNotifications, markRead, markAllRead, removeNotification } from '../../store/people'

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

function open(n) {
  markRead(n)
  router.push(n.link)
}
</script>

<template>
  <div class="page-tools">
    <b style="font-size: 16px">알림</b>
    <span class="form-note" style="margin: 0">안 읽음 {{ unreadNotifications }}건</span>
    <span></span>
    <button class="primary" :disabled="!unreadNotifications" @click="markAllRead">모두 읽음 처리</button>
  </div>

  <ListFilterBar
    v-model:query="query"
    v-model:filters="filters"
    :groups="FILTER_GROUPS"
    placeholder="알림 내용 검색"
    :result-count="visible.length"
    :total-count="notifications.length"
  />

  <section class="card">
    <div class="notif-row" v-for="n in visible" :key="n.id" :class="{ unread: !n.read }">
      <button class="notif-main" @click="open(n)">
        <span class="tag">{{ n.kind }}</span>
        <span><b>{{ n.title }}</b><small>{{ n.at }}</small></span>
      </button>
      <button v-if="!n.read" class="review" style="margin: 0" @click="markRead(n)">읽음</button>
      <button class="person-info" title="삭제" aria-label="삭제" @click="removeNotification(n.id)">×</button>
    </div>
    <p v-if="!visible.length" class="form-note" style="margin: 0">조건에 맞는 알림이 없어요.</p>
  </section>
</template>
