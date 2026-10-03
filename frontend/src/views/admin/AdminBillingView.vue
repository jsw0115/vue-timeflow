<script setup>
import { computed, ref } from 'vue'
import Modal from '../../components/Modal.vue'
import { payments, billingMetrics, approveRefund, rejectRefund, retryPayment } from '../../store/adminOps'

const STATES = ['전체', '결제완료', '환불 요청', '환불완료', '환불거절', '결제실패']
const filter = ref('전체')
const visible = computed(() => (filter.value === '전체' ? payments.value : payments.value.filter((p) => p.state === filter.value)))
const won = (n) => n.toLocaleString('ko-KR') + '원'

const rejecting = ref(null)
const reason = ref('')
function openReject(p) {
  rejecting.value = p
  reason.value = ''
}
function confirmReject() {
  rejectRefund(rejecting.value, reason.value.trim() || '사유 미기재')
  rejecting.value = null
}
function stateClass(s) {
  if (s === '결제완료' || s === '환불완료') return 'ok'
  if (s === '환불 요청') return 'warn'
  if (s === '결제실패' || s === '환불거절') return 'danger'
  return ''
}
</script>

<template>
  <div class="admin-page-head">
    <div><h2>구독 · 결제</h2><p>환불 요청과 결제 실패를 놓치지 않도록 모아봐요</p></div>
    <span class="badge" :class="billingMetrics.refundRequests || billingMetrics.failed ? 'warn' : 'ok'">
      환불 대기 {{ billingMetrics.refundRequests }}건 · 결제 실패 {{ billingMetrics.failed }}건
    </span>
  </div>

  <div class="metrics" style="grid-template-columns: repeat(5, 1fr); margin-bottom: 16px">
    <article><span>유료 구독자</span><b class="figure">{{ billingMetrics.subscribers.toLocaleString('ko-KR') }}</b></article>
    <article><span>결제 완료 합계</span><b class="figure" style="font-size: 1.0625rem">{{ won(billingMetrics.revenue) }}</b></article>
    <article><span>해지율</span><b class="figure">{{ billingMetrics.churn }}<small>%</small></b></article>
    <article><span>환불 요청</span><b class="figure">{{ billingMetrics.refundRequests }}<small>건</small></b></article>
    <article><span>결제 실패</span><b class="figure">{{ billingMetrics.failed }}<small>건</small></b></article>
  </div>

  <div class="page-tools">
    <div class="filter">
      <button v-for="s in STATES" :key="s" :class="{ selected: filter === s }" @click="filter = s">{{ s }}</button>
    </div>
  </div>

  <section class="card list">
    <div class="list-head" style="grid-template-columns: 1fr 1.4fr 1fr 1fr 1fr 1.4fr">
      <span>사용자</span><span>플랜</span><span>결제일</span><span>금액</span><span>상태</span><span>처리</span>
    </div>
    <div class="row" style="grid-template-columns: 1fr 1.4fr 1fr 1fr 1fr 1.4fr" v-for="p in visible" :key="p.id">
      <label>{{ p.name }}</label>
      <span>{{ p.plan }}</span>
      <span class="figure">{{ p.date }}</span>
      <span class="figure">{{ won(p.amount) }}</span>
      <span class="badge" :class="stateClass(p.state)">{{ p.state }}</span>
      <span style="display: flex; gap: 6px">
        <template v-if="p.state === '환불 요청'">
          <button class="primary" style="padding: 5px 10px" @click="approveRefund(p)">환불 승인</button>
          <button class="review" style="margin: 0" @click="openReject(p)">거절</button>
        </template>
        <button v-else-if="p.state === '결제실패'" class="review" style="margin: 0" @click="retryPayment(p)">재결제</button>
        <small v-else style="color: var(--color-muted)">처리 완료</small>
      </span>
    </div>
    <p v-if="!visible.length" class="form-note" style="margin: 12px 0 0">해당 상태의 결제가 없어요.</p>
  </section>
  <p class="form-note" style="margin-top: 12px">환불 승인·거절·재결제는 모두 감사 로그에 기록돼요.</p>

  <Modal v-if="rejecting" title="환불 거절" @close="rejecting = null">
    <p class="form-note" style="margin-top: 0">{{ rejecting.name }}님의 환불 요청을 거절해요. 사유는 사용자에게 전달됩니다.</p>
    <label>거절 사유<textarea v-model="reason" placeholder="예: 이용 기간이 이미 경과했어요" autofocus></textarea></label>

    <template #footer>
      <button type="button" class="modal-secondary" @click="rejecting = null">취소</button>
      <button class="primary" @click="confirmReject">거절 처리</button>
    </template>
  </Modal>
</template>
