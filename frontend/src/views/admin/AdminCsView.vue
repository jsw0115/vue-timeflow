<script setup>
import { computed, ref } from 'vue'
import Modal from '../../components/Modal.vue'
import { tickets, csMetrics, CS_STATES, CS_TEMPLATES, replyTicket, setTicketState } from '../../store/adminOps'

const filter = ref('전체')
const FILTERS = ['전체', ...CS_STATES]
const visible = computed(() => (filter.value === '전체' ? tickets.value : tickets.value.filter((t) => t.state === filter.value)))

const replying = ref(null)
const draft = ref('')
const notice = ref('')

function openReply(t) {
  replying.value = t
  draft.value = ''
}
function useTemplate(tpl) {
  draft.value = tpl.body
}
function submit() {
  if (!replyTicket(replying.value, draft.value)) {
    notice.value = '답변 내용을 입력해주세요.'
    setTimeout(() => (notice.value = ''), 2000)
    return
  }
  replying.value = null
}
function daysOpen(t) {
  return Math.floor((Date.now() - new Date(t.date).getTime()) / 86400000)
}
</script>

<template>
  <div class="admin-page-head">
    <div><h2>1:1 문의</h2><p>답변 상태와 SLA를 함께 관리해요</p></div>
    <span class="badge" :class="csMetrics.overdue ? 'danger' : 'ok'">
      미답변 {{ csMetrics.open }}건 · 48시간 초과 {{ csMetrics.overdue }}건
    </span>
  </div>

  <div class="metrics" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 16px">
    <article><span>전체 문의</span><b class="figure">{{ csMetrics.total }}<small>건</small></b></article>
    <article><span>미답변</span><b class="figure">{{ csMetrics.open }}<small>건</small></b></article>
    <article><span>SLA 초과</span><b class="figure">{{ csMetrics.overdue }}<small>건</small></b><small>접수 후 48시간</small></article>
  </div>

  <div class="page-tools">
    <div class="filter">
      <button v-for="f in FILTERS" :key="f" :class="{ selected: filter === f }" @click="filter = f">{{ f }}</button>
    </div>
  </div>

  <section class="card list">
    <div class="list-head" style="grid-template-columns: 1fr 2fr .9fr .8fr .9fr 1.2fr">
      <span>문의자</span><span>제목</span><span>접수일</span><span>경과</span><span>우선순위</span><span>상태 · 처리</span>
    </div>
    <div class="row" style="grid-template-columns: 1fr 2fr .9fr .8fr .9fr 1.2fr" v-for="t in visible" :key="t.id">
      <label>{{ t.name }}</label>
      <span>{{ t.title }}<small v-if="t.replies.length" style="display: block; color: var(--color-muted)">답변 {{ t.replies.length }}건</small></span>
      <span class="figure">{{ t.date }}</span>
      <span class="figure" :class="{ 'sla-over': daysOpen(t) > 2 && t.state !== '답변 완료' }">{{ daysOpen(t) }}일</span>
      <span class="tag">{{ t.priority }}</span>
      <span style="display: flex; gap: 6px; align-items: center">
        <select :value="t.state" @change="setTicketState(t, $event.target.value)" class="mini-select">
          <option v-for="s in CS_STATES" :key="s">{{ s }}</option>
        </select>
        <button class="review" style="margin: 0" @click="openReply(t)">답변</button>
      </span>
    </div>
    <p v-if="!visible.length" class="form-note" style="margin: 12px 0 0">해당 상태의 문의가 없어요.</p>
  </section>

  <Modal v-if="replying" :title="replying.name + ' · ' + replying.title" wide @close="replying = null">
    <div v-if="replying.replies.length" class="card" style="box-shadow: none; margin-bottom: 12px">
      <span class="pill">이전 답변</span>
      <p v-for="(r, i) in replying.replies" :key="i" style="margin-top: 8px">{{ r.admin }} · {{ r.at }}<br />{{ r.body }}</p>
    </div>
    <label>답변 템플릿</label>
    <div class="filter" style="width: fit-content; margin: 6px 0 12px">
      <button v-for="tpl in CS_TEMPLATES" :key="tpl.id" type="button" @click="useTemplate(tpl)">{{ tpl.label }}</button>
    </div>
    <label>답변 내용<textarea v-model="draft" placeholder="답변을 입력하세요" autofocus rows="6"></textarea></label>
    <p v-if="notice" class="badge warn" style="display: inline-block">{{ notice }}</p>
    <p class="form-note">답변을 보내면 상태가 ‘답변 완료’로 바뀌고 감사 로그에 기록돼요.</p>
    <button class="primary" @click="submit">답변 보내기</button>
  </Modal>
</template>
