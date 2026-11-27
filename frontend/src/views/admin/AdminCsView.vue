<script setup>
// 1:1 문의 관리. 서버의 모든 계정 문의를 불러 상태를 바꾸고 답변을 저장한다. 감사 로그는 서버가 남긴다(PR-10 UF-117).
import { bodyLocale, tr, unit } from '../../store/locale'
import { computed, onMounted, ref } from 'vue'
import Modal from '../../components/Modal.vue'
import { apiRequest } from '../../features/auth/apiRequest.js'
import { adminClient } from '../../features/admin/admin.js'
import { adminErrorText } from '../../features/admin/adminClient.mjs'
import {
  REPLY_TEMPLATES, TICKET_STATUSES, createSupportClient, daysOpen, isOverdue, sortForTriage, statusLabel, statusOf, ticketMetrics,
} from '../../features/support/tickets.mjs'

const support = createSupportClient({ request: apiRequest })
const tickets = ref([])
const names = ref(new Map())
const status = ref('loading')
const loadError = ref('')
async function load() {
  status.value = 'loading'
  loadError.value = ''
  try {
    tickets.value = (await support.all()) ?? []
    status.value = 'ready'
  } catch (error) { loadError.value = adminErrorText(error); status.value = 'error'; return }
  // 문의자 이름은 계정 목록으로 찾는다. 실패해도 문의 처리는 할 수 있게 ID로 보인다
  try {
    const page = await adminClient.allUsers()
    names.value = new Map((page?.items ?? []).map((user) => [user.id, user.nickname || user.email || user.id]))
  } catch { names.value = new Map() }
}
onMounted(load)
const who = (ticket) => names.value.get(ticket.ownerId) ?? tr('계정 {id}', { id: String(ticket.ownerId ?? '').slice(0, 8) })

const filter = ref('ALL')
const FILTERS = [{ id: 'ALL', label: '전체' }, ...TICKET_STATUSES]
const now = ref(Date.now())
const metrics = computed(() => ticketMetrics(tickets.value, now.value))
const visible = computed(() => sortForTriage(filter.value === 'ALL' ? tickets.value : tickets.value.filter((ticket) => statusOf(ticket) === filter.value)))

const replying = ref(null)
const saving = ref({ state: 'idle', message: '' })
function openReply(ticket) {
  saving.value = { state: 'idle', message: '' }
  replying.value = { ticket, reply: ticket.reply ?? '', status: statusOf(ticket) === 'OPEN' ? 'ANSWERED' : statusOf(ticket) }
}
const needsReply = computed(() => replying.value?.status === 'ANSWERED' && !replying.value.reply.trim())
async function save() {
  if (!replying.value || needsReply.value || saving.value.state === 'saving') return
  saving.value = { state: 'saving', message: '' }
  const { ticket, reply, status: next } = replying.value
  try {
    const row = await support.reply(ticket, { reply, status: next })
    tickets.value = tickets.value.map((item) => (item.id === ticket.id && item.ownerId === ticket.ownerId ? { ...row, ownerId: ticket.ownerId } : item))
    replying.value = null
    saving.value = { state: 'idle', message: '' }
  } catch (error) {
    saving.value = { state: 'failed', message: error?.status === 409 ? tr('다른 관리자가 먼저 이 문의를 고쳤어요. 목록을 새로 불러온 뒤 다시 답변해 주세요.') : tr(adminErrorText(error)) }
  }
}
async function reloadAfterConflict() { replying.value = null; await load() }
</script>

<template>
  <div class="admin-page-head">
    <div><h2>{{ tr('1:1 문의') }}</h2><p>{{ tr('사용자가 남긴 문의의 처리 상태와 답변을 관리해요') }}</p></div>
    <span v-if="status === 'ready'" class="badge" :class="metrics.overdue ? 'danger' : 'ok'">{{ tr('미답변 {n}건 · 48시간 초과 {m}건', { n: metrics.open, m: metrics.overdue }) }}</span>
  </div>

  <p v-if="status === 'loading'" class="input-field-help" role="status">{{ tr('문의를 불러오는 중이에요.') }}</p>
  <div v-else-if="status === 'error'" class="empty-state" role="status"><p>{{ tr(loadError) }}</p><button type="button" class="button-secondary" @click="load">{{ tr('다시 시도') }}</button></div>
  <template v-else>
    <div class="metrics" style="--metric-cols: 3; margin-bottom: 16px">
      <article><span>{{ tr('전체 문의') }}</span><b class="figure">{{ metrics.total }}<small v-if="bodyLocale === 'ko'">건</small></b></article>
      <article><span>{{ tr('미답변') }}</span><b class="figure">{{ metrics.open }}<small v-if="bodyLocale === 'ko'">건</small></b><small>{{ tr('답변 완료가 아닌 문의') }}</small></article>
      <article><span>{{ tr('48시간 초과') }}</span><b class="figure">{{ metrics.overdue }}<small v-if="bodyLocale === 'ko'">건</small></b><small>{{ tr('접수 후 48시간이 지난 미답변') }}</small></article>
    </div>

    <div class="page-tools">
      <div class="filter" role="group" :aria-label="tr('처리 상태 거르기')">
        <button v-for="f in FILTERS" :key="f.id" type="button" :class="{ selected: filter === f.id }" :aria-pressed="filter === f.id" @click="filter = f.id">{{ tr(f.label) }}</button>
      </div>
      <button type="button" class="button-secondary" @click="load">{{ tr('새로 불러오기') }}</button>
    </div>

    <section class="card list">
      <div class="list-head cs-row"><span>{{ tr('문의자') }}</span><span>{{ tr('제목') }}</span><span>{{ tr('접수일') }}</span><span>{{ tr('경과') }}</span><span>{{ tr('상태 · 처리') }}</span></div>
      <div v-for="ticket in visible" :key="ticket.ownerId + ':' + ticket.id" class="row cs-row">
        <label>{{ who(ticket) }}</label>
        <span class="cs-title">{{ ticket.title }}<small v-if="ticket.reply">{{ tr('답변 있음') }}</small></span>
        <span class="figure">{{ String(ticket.createdAt ?? '').slice(0, 10) }}</span>
        <span class="figure">{{ daysOpen(ticket, now) ?? '—' }}{{ unit('일', daysOpen(ticket, now)) }}<small v-if="isOverdue(ticket, now)" class="cs-over">{{ tr('48시간 초과') }}</small></span>
        <span class="cs-actions"><span class="tag">{{ tr(statusLabel(ticket)) }}</span><button type="button" class="review" style="margin: 0" :aria-label="tr('{name} 문의 {title} 처리', { name: who(ticket), title: ticket.title })" @click="openReply(ticket)">{{ tr('처리') }}</button></span>
      </div>
      <p v-if="!visible.length" class="empty-state" role="status">{{ tickets.length ? tr('이 상태의 문의가 없어요. 다른 상태를 골라 보세요.') : tr('아직 들어온 문의가 없어요. 사용자가 환경설정 > 고객지원에서 문의를 남기면 여기에 보여요.') }}</p>
    </section>
  </template>

  <Modal v-if="replying" :title="who(replying.ticket) + ' · ' + replying.ticket.title" wide @close="replying = null">
    <div class="cs-question"><b>{{ tr('문의 내용') }}</b><p>{{ replying.ticket.body }}</p></div>
    <label>{{ tr('처리 상태') }}<select v-model="replying.status"><option v-for="s in TICKET_STATUSES" :key="s.id" :value="s.id">{{ tr(s.label) }}</option></select></label>
    <span class="cs-template-label">{{ tr('답변 템플릿') }}</span>
    <div class="filter" style="width: fit-content; margin: 6px 0 12px">
      <button v-for="tpl in REPLY_TEMPLATES" :key="tpl.id" type="button" @click="replying.reply = tpl.body">{{ tr(tpl.label) }}</button>
    </div>
    <label>{{ tr('답변 내용') }}<textarea v-model="replying.reply" rows="6" maxlength="20000" :aria-invalid="needsReply ? 'true' : undefined" aria-describedby="cs-reply-help"></textarea></label>
    <p id="cs-reply-help" class="input-field-help" :data-state="needsReply ? 'error' : undefined">{{ needsReply ? tr('답변 완료로 바꾸려면 답변을 입력해 주세요.') : tr('저장하면 사용자의 고객지원 화면에 이 답변과 상태가 보여요. 서버가 감사 로그를 남겨요.') }}</p>
    <p v-if="saving.state === 'failed'" class="input-field-help" data-state="error" role="alert">{{ tr(saving.message) }}</p>
    <template #footer>
      <button v-if="saving.state === 'failed'" type="button" class="modal-secondary" @click="reloadAfterConflict">{{ tr('목록 새로 불러오기') }}</button>
      <button type="button" class="modal-secondary" @click="replying = null">{{ tr('취소') }}</button>
      <button type="button" class="primary" :disabled="needsReply || saving.state === 'saving'" :aria-busy="saving.state === 'saving' ? 'true' : undefined" @click="save">{{ saving.state === 'saving' ? tr('저장하는 중') : tr('저장하기') }}</button>
    </template>
  </Modal>
</template>

<style scoped>
/* 지표 카드의 설명 문구는 숫자 아래 줄에 둔다(숫자 단위 small은 그대로 숫자 옆) */
.metrics article > small { display: block; margin-top: var(--space-xs); color: var(--color-muted); }
.cs-row { grid-template-columns: minmax(0, 1fr) minmax(0, 2fr) minmax(0, .9fr) minmax(0, .9fr) minmax(0, 1.3fr); }
.cs-title { overflow-wrap: anywhere; }
.cs-title small, .cs-over { display: block; color: var(--color-muted); font-size: var(--type-caption-size); }
.cs-over { color: var(--color-status-warning); }
.cs-actions { display: flex; flex-wrap: wrap; gap: var(--space-xs); align-items: center; }
.cs-actions .tag { padding: 0 var(--space-xs); }
.cs-question { margin-bottom: var(--space-md); padding: var(--space-sm) var(--space-md); border-radius: var(--radius-sm); background: var(--color-surface); }
.cs-question p { margin: var(--space-xs) 0 0; white-space: pre-wrap; overflow-wrap: anywhere; }
.cs-template-label { display: block; font-weight: 600; }
</style>
