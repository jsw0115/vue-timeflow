<script setup>
// 신고 처리. 회원이 신고한 커뮤니티 글을 조회 시점 내용과 함께 보고 게시글 삭제 또는 문제없음으로 처리한다(PR-10 UF-117 7-7).
// 처리는 한 번만 할 수 있고 서버가 감사 로그를 남긴다. 금칙어·매니저 관리는 서버 기능이 없어 두지 않는다.
import { tr } from '../../store/locale'
import { computed, onMounted, ref } from 'vue'
import { apiRequest } from '../../features/auth/apiRequest.js'
import { adminClient } from '../../features/admin/admin.js'
import { adminErrorText } from '../../features/admin/adminClient.mjs'
import { DECISIONS, createModerationClient, decisionLabel, isPending } from '../../features/admin/moderation.mjs'

const client = createModerationClient({ request: apiRequest })
const reports = ref([])
const names = ref(new Map())
const status = ref('loading')
const loadError = ref('')
const listMessage = ref('')
const busy = ref('')
async function load() {
  status.value = 'loading'
  loadError.value = ''
  try { reports.value = (await client.all()) ?? []; status.value = 'ready' } catch (error) { loadError.value = adminErrorText(error); status.value = 'error'; return }
  try {
    const page = await adminClient.allUsers()
    names.value = new Map((page?.items ?? []).map((user) => [user.id, user.nickname || user.email || user.id]))
  } catch { names.value = new Map() }
}
onMounted(load)
const who = (id) => names.value.get(id) ?? tr('계정 {id}', { id: String(id ?? '').slice(0, 8) })

const filter = ref('pending')
const pendingCount = computed(() => reports.value.filter(isPending).length)
const visible = computed(() => reports.value
  .filter((report) => (filter.value === 'pending' ? isPending(report) : !isPending(report)))
  .sort((a, b) => String(a.createdAt ?? '').localeCompare(String(b.createdAt ?? ''))))

async function decide(report, action) {
  if (action === 'REMOVE' && !window.confirm(tr('신고된 글을 삭제할까요? 삭제한 글은 되돌릴 수 없어요.'))) return
  listMessage.value = ''
  busy.value = report.id
  try {
    const row = await client.decide(report, action)
    reports.value = reports.value.map((item) => (item.id === report.id && item.ownerId === report.ownerId ? { ...item, ...row, postBody: action === 'REMOVE' ? null : item.postBody } : item))
  } catch (error) {
    listMessage.value = error?.status === 409 ? tr('다른 관리자가 먼저 처리했거나 내용이 바뀌었어요. 목록을 새로 불러왔어요.') : tr(adminErrorText(error))
    if (error?.status === 409) await load()
  } finally { busy.value = '' }
}
</script>

<template>
  <div class="admin-page-head">
    <div><h2>{{ tr('신고 처리') }}</h2><p>{{ tr('회원이 신고한 커뮤니티 글을 확인하고 처리해요. 처리는 한 번만 할 수 있어요') }}</p></div>
    <span v-if="status === 'ready'" class="badge" :class="pendingCount ? 'warn' : 'ok'">{{ tr('처리 대기 {n}건', { n: pendingCount }) }}</span>
  </div>

  <p v-if="status === 'loading'" class="input-field-help" role="status">{{ tr('신고를 불러오는 중이에요.') }}</p>
  <div v-else-if="status === 'error'" class="empty-state" role="status"><p>{{ tr(loadError) }}</p><button type="button" class="button-secondary" @click="load">{{ tr('다시 시도') }}</button></div>
  <template v-else>
    <div class="page-tools">
      <div class="filter" role="group" :aria-label="tr('처리 상태 거르기')">
        <button type="button" :class="{ selected: filter === 'pending' }" :aria-pressed="filter === 'pending'" @click="filter = 'pending'">{{ tr('처리 대기') }}</button>
        <button type="button" :class="{ selected: filter === 'done' }" :aria-pressed="filter === 'done'" @click="filter = 'done'">{{ tr('처리 완료') }}</button>
      </div>
      <button type="button" class="button-secondary" @click="load">{{ tr('새로 불러오기') }}</button>
    </div>
    <p v-if="listMessage" class="input-field-help" data-state="error" role="alert">{{ tr(listMessage) }}</p>

    <section class="card list">
      <div class="list-head mod-row"><span>{{ tr('신고된 글') }}</span><span>{{ tr('커뮤니티') }}</span><span>{{ tr('사유 · 신고자') }}</span><span>{{ tr('접수') }}</span><span>{{ tr('처리') }}</span></div>
      <div v-for="report in visible" :key="report.ownerId + ':' + report.id" class="row mod-row">
        <span class="mod-body">
          <template v-if="report.postBody !== null && report.postBody !== undefined">{{ report.postBody }}</template>
          <em v-else>{{ tr('글이 삭제되어 내용을 볼 수 없어요') }}</em>
        </span>
        <span>{{ report.communityTitle || tr('삭제된 커뮤니티') }}</span>
        <span class="mod-reason">{{ report.reason }}<small>{{ who(report.ownerId) }}</small></span>
        <span class="figure">{{ String(report.createdAt ?? '').slice(0, 10) }}</span>
        <span class="mod-actions">
          <template v-if="isPending(report)">
            <button type="button" class="review" style="margin: 0" :disabled="busy === report.id || report.postBody === null" :aria-label="tr('신고된 글 삭제: {reason}', { reason: report.reason })" @click="decide(report, 'REMOVE')">{{ tr('게시글 삭제') }}</button>
            <button type="button" class="review" style="margin: 0" :disabled="busy === report.id" :aria-label="tr('문제없음으로 처리: {reason}', { reason: report.reason })" @click="decide(report, 'IGNORE')">{{ tr('문제없음') }}</button>
          </template>
          <span v-else class="tag">{{ tr(decisionLabel(report)) }}</span>
        </span>
      </div>
      <p v-if="!visible.length" class="empty-state" role="status">{{ filter === 'pending' ? tr('처리할 신고가 없어요. 회원이 커뮤니티 글을 신고하면 여기에 보여요.') : tr('아직 처리한 신고가 없어요. 처리 대기에서 신고를 처리해 보세요.') }}</p>
    </section>
    <p class="form-note mod-foot">{{ tr('{action}를 고르면 커뮤니티에서 그 글이 바로 지워져요. 처리 결과는 신고한 회원에게 따로 알리지 않아요.', { action: tr(DECISIONS.REMOVE) }) }}</p>
  </template>
</template>

<style scoped>
.mod-row { grid-template-columns: minmax(0, 2.2fr) minmax(0, 1fr) minmax(0, 1.4fr) minmax(0, .8fr) minmax(0, 1.4fr); }
.mod-body { white-space: pre-wrap; overflow-wrap: anywhere; }
.mod-body em { color: var(--color-muted); font-style: normal; }
.mod-reason { display: grid; gap: var(--space-xs); overflow-wrap: anywhere; }
.mod-reason small { color: var(--color-muted); }
.mod-actions { display: flex; flex-wrap: wrap; gap: var(--space-xs); align-items: center; }
.mod-foot { margin-top: var(--space-sm); }
</style>
