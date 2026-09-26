<script setup>
import { computed, ref } from 'vue'

/** 외부 캘린더 동기화 — 연결 토글, 지금 동기화, 충돌 해결이 실제로 동작한다. */
const providers = ref([
  { id: 'google', name: 'Google 캘린더', connected: true, lastSync: '3분 전', direction: '양방향' },
  { id: 'outlook', name: 'Outlook 캘린더', connected: false, lastSync: '-', direction: '가져오기만' },
  { id: 'apple', name: 'Apple 캘린더', connected: false, lastSync: '-', direction: '가져오기만' },
])

const conflicts = ref([
  {
    id: 1,
    title: '팀 회의',
    mine: { label: '타임바 다이어리', detail: '09:00 ~ 10:00 · 회의실 A' },
    theirs: { label: 'Google 캘린더', detail: '10:00 ~ 11:00 · 회의실 B' },
    resolved: null,
  },
])
const openConflicts = computed(() => conflicts.value.filter((c) => !c.resolved))

const logs = ref([
  { id: 1, text: '일정 12건 동기화 완료', time: '3분 전' },
  { id: 2, text: '일정 8건 동기화 완료', time: '어제' },
])
function addLog(text) {
  logs.value.unshift({ id: Math.max(0, ...logs.value.map((l) => l.id)) + 1, text, time: '방금' })
}

const syncing = ref(false)
function syncNow(p) {
  if (!p.connected || syncing.value) return
  syncing.value = true
  setTimeout(() => {
    p.lastSync = '방금'
    syncing.value = false
    addLog(p.name + ' 일정 ' + (3 + Math.floor(Math.random() * 9)) + '건 동기화 완료')
  }, 600)
}
function toggleConnect(p) {
  p.connected = !p.connected
  p.lastSync = p.connected ? '방금' : '-'
  addLog(p.name + (p.connected ? ' 연결됨' : ' 연결 해제됨'))
}
function cycleDirection(p) {
  const order = ['양방향', '가져오기만', '내보내기만']
  p.direction = order[(order.indexOf(p.direction) + 1) % order.length]
  addLog(p.name + ' 동기화 방향을 ' + p.direction + '으로 변경')
}
function resolve(c, side) {
  c.resolved = side
  addLog('‘' + c.title + '’ 충돌을 ' + (side === 'mine' ? c.mine.label : c.theirs.label) + ' 버전으로 해결')
}
function undoResolve(c) {
  c.resolved = null
  addLog('‘' + c.title + '’ 충돌 해결을 되돌림')
}
</script>

<template>
  <div class="page-tools">
    <b style="font-size: 16px">동기화</b>
    <span class="form-note" style="margin: 0">연결한 캘린더와 일정이 오가는 상태를 관리해요</span>
    <span></span>
  </div>

  <section class="card list">
    <div class="list-head" style="grid-template-columns: 1.6fr 1fr 1fr 1.4fr"><span>서비스</span><span>마지막 동기화</span><span>방향</span><span>관리</span></div>
    <div class="row" style="grid-template-columns: 1.6fr 1fr 1fr 1.4fr" v-for="p in providers" :key="p.id">
      <label>{{ p.name }}<small style="display: block; color: var(--color-muted)">{{ p.connected ? '연결됨' : '연결 안 됨' }}</small></label>
      <span class="figure">{{ p.lastSync }}</span>
      <span><button class="review" style="margin: 0" @click="cycleDirection(p)">{{ p.direction }}</button></span>
      <span style="display: flex; gap: 6px">
        <button class="review" style="margin: 0" :disabled="!p.connected || syncing" @click="syncNow(p)">{{ syncing ? '동기화 중…' : '지금 동기화' }}</button>
        <button class="review" style="margin: 0" @click="toggleConnect(p)">{{ p.connected ? '연결 해제' : '연결' }}</button>
      </span>
    </div>
  </section>

  <h3 style="margin: 24px 0 12px">충돌 해결 {{ openConflicts.length ? '· ' + openConflicts.length + '건' : '' }}</h3>
  <section class="card" v-for="c in conflicts" :key="c.id" style="margin-bottom: 12px">
    <div class="head">
      <b>‘{{ c.title }}’ 일정이 서로 다르게 수정됐어요</b>
      <span class="badge" :class="c.resolved ? 'ok' : 'warn'">{{ c.resolved ? '해결됨' : '확인 필요' }}</span>
    </div>
    <div class="three" style="grid-template-columns: 1fr 1fr; margin-top: 12px">
      <div class="card conflict-option" :class="{ picked: c.resolved === 'mine' }">
        <small>{{ c.mine.label }}</small>
        <p>{{ c.mine.detail }}</p>
        <button class="primary" style="width: 100%" :disabled="c.resolved === 'mine'" @click="resolve(c, 'mine')">
          {{ c.resolved === 'mine' ? '유지됨' : '이 버전 유지' }}
        </button>
      </div>
      <div class="card conflict-option" :class="{ picked: c.resolved === 'theirs' }">
        <small>{{ c.theirs.label }}</small>
        <p>{{ c.theirs.detail }}</p>
        <button class="primary" style="width: 100%" :disabled="c.resolved === 'theirs'" @click="resolve(c, 'theirs')">
          {{ c.resolved === 'theirs' ? '유지됨' : '이 버전 유지' }}
        </button>
      </div>
    </div>
    <button v-if="c.resolved" class="review" style="margin-top: 10px" @click="undoResolve(c)">되돌리기</button>
  </section>
  <p v-if="!conflicts.length" class="form-note">해결할 충돌이 없어요.</p>

  <h3 style="margin: 24px 0 12px">동기화 로그</h3>
  <section class="card">
    <div class="event" v-for="l in logs" :key="l.id">
      <span style="flex: 1">{{ l.text }}</span><small>{{ l.time }}</small>
    </div>
  </section>
</template>
