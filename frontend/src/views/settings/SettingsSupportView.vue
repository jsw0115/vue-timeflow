<script setup>
// 고객지원. 로그인하면 1:1 문의를 서버(/api/support/tickets)에 남기고 내 문의의 처리 상태와 답변을 본다(PR-10 UF-117).
import { tr } from '../../store/locale'
import { computed, ref, watch } from 'vue'
import { session } from '../../features/auth/session.js'
import { apiRequest } from '../../features/auth/apiRequest.js'
import { createSupportClient, statusLabel, statusOf } from '../../features/support/tickets.mjs'

const client = createSupportClient({ request: apiRequest })
const signedIn = computed(() => Boolean(session.userId))
const tickets = ref([])
const load = ref({ state: 'idle', message: '' })
async function reload() {
  if (!signedIn.value) { tickets.value = []; return }
  load.value = { state: 'loading', message: '' }
  try {
    tickets.value = await client.mine()
    load.value = { state: 'ready', message: '' }
  } catch {
    load.value = { state: 'error', message: '내 문의를 불러오지 못했어요. 연결을 확인하고 다시 시도해 주세요.' }
  }
}
watch(() => session.userId, reload, { immediate: true })

const writing = ref(false)
const draft = ref({ title: '', body: '' })
const send = ref({ state: 'idle', message: '' })
const canSend = computed(() => draft.value.title.trim() && draft.value.body.trim() && send.value.state !== 'saving')
async function submit() {
  if (!canSend.value) return
  send.value = { state: 'saving', message: '' }
  try {
    await client.create(draft.value)
    draft.value = { title: '', body: '' }
    writing.value = false
    send.value = { state: 'saved', message: '문의를 보냈어요. 답변이 오면 아래 목록에서 볼 수 있어요.' }
    await reload()
  } catch (error) {
    send.value = { state: 'failed', message: error?.status === 400 ? '보내지 못했어요. 제목은 200자, 내용은 20,000자까지 쓸 수 있어요.' : '문의를 보내지 못했어요. 쓴 내용은 그대로 두었으니 다시 시도해 주세요.' }
  }
}
const sorted = computed(() => [...tickets.value].sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''))))
const dateOf = (ticket) => String(ticket.createdAt ?? '').slice(0, 10)
</script>

<template>
  <section class="card setting-content">
    <h2>{{ tr('고객지원') }}</h2>
    <div class="section-label">{{ tr('자주 묻는 질문') }}</div>
    <div class="trow"><b>{{ tr('데이터는 얼마나 안전하게 보관되나요?') }}</b><span>›</span></div>
    <div class="trow"><b>{{ tr('플랜을 변경하고 싶어요') }}</b><span>›</span></div>
    <div class="trow"><b>{{ tr('계정을 삭제하면 어떻게 되나요?') }}</b><span>›</span></div>

    <div class="section-label" id="support-inquiry">{{ tr('1:1 문의') }}</div>
    <template v-if="!signedIn">
      <p class="form-note">{{ tr('1:1 문의는 로그인한 계정으로 남기고, 답변도 그 계정에서 확인해요.') }}</p>
      <router-link class="button-secondary" to="/auth/login">{{ tr('로그인') }}</router-link>
    </template>
    <template v-else>
      <button v-if="!writing" type="button" class="button-secondary" @click="writing = true; send = { state: 'idle', message: '' }">{{ tr('문의하기') }}</button>
      <form v-else class="support-form" aria-labelledby="support-inquiry" @submit.prevent="submit">
        <label>{{ tr('제목') }}<input v-model="draft.title" maxlength="200" required /></label>
        <label>{{ tr('내용') }}<textarea v-model="draft.body" rows="5" maxlength="20000" required></textarea></label>
        <p class="form-note">{{ tr('문의 내용은 운영 관리자만 볼 수 있어요. 비밀번호나 결제 카드 번호는 적지 마세요.') }}</p>
        <div class="support-actions">
          <button type="button" class="button-secondary" @click="writing = false">{{ tr('취소') }}</button>
          <button type="submit" class="primary" :disabled="!canSend" :aria-busy="send.state === 'saving' ? 'true' : undefined">{{ send.state === 'saving' ? tr('보내는 중') : tr('문의 보내기') }}</button>
        </div>
      </form>
      <p v-if="send.message" class="input-field-help" role="status" :data-state="send.state === 'failed' ? 'error' : 'success'">{{ tr(send.message) }}</p>

      <h3 class="support-subhead">{{ tr('내 문의') }}</h3>
      <p v-if="load.state === 'loading'" class="input-field-help" role="status">{{ tr('내 문의를 불러오는 중이에요.') }}</p>
      <div v-else-if="load.state === 'error'" class="empty-state" role="status"><p>{{ tr(load.message) }}</p><button type="button" class="button-secondary" @click="reload">{{ tr('다시 시도') }}</button></div>
      <p v-else-if="!sorted.length" class="empty-state">{{ tr('아직 남긴 문의가 없어요. 궁금한 점이 있으면 문의하기를 눌러 남겨 주세요.') }}</p>
      <ul v-else class="support-list">
        <li v-for="ticket in sorted" :key="ticket.id">
          <div class="support-row"><b>{{ ticket.title }}</b><span class="tag" :data-status="statusOf(ticket)">{{ tr(statusLabel(ticket)) }}</span></div>
          <p class="input-field-help"><span class="figure">{{ dateOf(ticket) }}</span> {{ tr('접수') }}</p>
          <p class="support-body">{{ ticket.body }}</p>
          <div v-if="ticket.reply" class="support-reply"><b>{{ tr('답변') }}</b><p>{{ ticket.reply }}</p></div>
        </li>
      </ul>
    </template>
    <router-link to="/legal" custom v-slot="{ navigate }"><div class="trow" @click="navigate" style="cursor: pointer"><b>{{ tr('이용약관 및 개인정보처리방침') }}</b><span>›</span></div></router-link>
  </section>
</template>

<style scoped>
.support-form { display: grid; gap: var(--space-sm); }
.support-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: var(--space-sm); }
.support-subhead { margin: var(--space-lg) 0 var(--space-sm); font-size: var(--type-body-size); }
.support-list { display: grid; gap: 0; margin: 0 0 var(--space-lg); padding: 0; list-style: none; }
.support-list li { display: grid; gap: var(--space-xs); padding: var(--space-md) 0; border-top: 1px solid var(--color-hairline); }
.support-list li:first-child { border-top: 0; }
.support-row { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: var(--space-sm); }
.support-row b { overflow-wrap: anywhere; }
.support-list p { margin: 0; }
.support-body { white-space: pre-wrap; overflow-wrap: anywhere; color: var(--color-body); }
.support-reply { padding: var(--space-sm) var(--space-md); border-left: 3px solid var(--color-accent); background: var(--color-surface); border-radius: var(--radius-sm); }
.support-reply p { margin: var(--space-xs) 0 0; white-space: pre-wrap; overflow-wrap: anywhere; }
.figure { font-family: var(--font-mono); font-size: var(--type-time-size); font-variant-numeric: tabular-nums; }
</style>
