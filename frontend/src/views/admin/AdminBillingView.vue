<script setup>
import { bodyLocale, tr } from '../../store/locale'
import { formatWon } from '../../features/i18n/locale.mjs'
import { computed, ref } from 'vue'
import Modal from '../../components/Modal.vue'
import { payments, billingMetrics, approveRefund, rejectRefund, retryPayment } from '../../store/adminOps'

const STATES = ['전체', '결제완료', '환불 요청', '환불완료', '환불거절', '결제실패']
const filter = ref('전체')
const visible = computed(() => (filter.value === '전체' ? payments.value : payments.value.filter((p) => p.state === filter.value)))
// 금액은 원화다. 한국어는 예전처럼 "6,900원", 다른 언어는 통화 기호로 보인다
const won = (n) => (bodyLocale.value === 'ko' ? n.toLocaleString('ko-KR') + '원' : formatWon(n, bodyLocale.value))

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
    <div><h2>{{ tr('구독 · 결제') }}</h2><p>{{ tr('환불 요청과 결제 실패를 놓치지 않도록 모아봐요') }}</p></div>
    <span class="badge" :class="billingMetrics.refundRequests || billingMetrics.failed ? 'warn' : 'ok'">
      {{ tr('환불 대기 {n}건 · 결제 실패 {m}건', { n: billingMetrics.refundRequests, m: billingMetrics.failed }) }}
    </span>
  </div>

  <div class="metrics" style="--metric-cols: 5; margin-bottom: 16px">
    <article><span>{{ tr('유료 구독자') }}</span><b class="figure">{{ billingMetrics.subscribers.toLocaleString('ko-KR') }}</b></article>
    <article><span>{{ tr('결제 완료 합계') }}</span><b class="figure" style="font-size: 1.0625rem">{{ won(billingMetrics.revenue) }}</b></article>
    <article><span>{{ tr('해지율') }}</span><b class="figure">{{ billingMetrics.churn }}<small>%</small></b></article>
    <article><span>{{ tr('환불 요청') }}</span><b class="figure">{{ billingMetrics.refundRequests }}<small v-if="bodyLocale === 'ko'">건</small></b></article>
    <article><span>{{ tr('결제 실패') }}</span><b class="figure">{{ billingMetrics.failed }}<small v-if="bodyLocale === 'ko'">건</small></b></article>
  </div>

  <div class="page-tools">
    <div class="filter">
      <button v-for="s in STATES" :key="s" :class="{ selected: filter === s }" @click="filter = s">{{ tr(s) }}</button>
    </div>
  </div>

  <section class="card list">
    <div class="list-head" style="grid-template-columns: 1fr 1.4fr 1fr 1fr 1fr 1.4fr">
      <span>{{ tr('사용자') }}</span><span>{{ tr('플랜') }}</span><span>{{ tr('결제일') }}</span><span>{{ tr('금액') }}</span><span>{{ tr('상태') }}</span><span>{{ tr('처리') }}</span>
    </div>
    <div class="row" style="grid-template-columns: 1fr 1.4fr 1fr 1fr 1fr 1.4fr" v-for="p in visible" :key="p.id">
      <label>{{ p.name }}</label>
      <span>{{ tr(p.plan) }}</span>
      <span class="figure">{{ p.date }}</span>
      <span class="figure">{{ won(p.amount) }}</span>
      <span class="badge" :class="stateClass(p.state)">{{ tr(p.state) }}</span>
      <span style="display: flex; gap: 6px">
        <template v-if="p.state === '환불 요청'">
          <button class="primary" style="padding: 5px 10px" @click="approveRefund(p)">{{ tr('환불 승인') }}</button>
          <button class="review" style="margin: 0" @click="openReject(p)">{{ tr('거절') }}</button>
        </template>
        <button v-else-if="p.state === '결제실패'" class="review" style="margin: 0" @click="retryPayment(p)">{{ tr('재결제') }}</button>
        <small v-else style="color: var(--color-muted)">{{ tr('처리 완료') }}</small>
      </span>
    </div>
    <p v-if="!visible.length" class="empty-state" role="status">{{ tr('이 상태의 결제가 없어요. 다른 상태를 골라 보세요.') }}</p>
  </section>
  <p class="form-note" style="margin-top: 12px">{{ tr('환불 승인·거절·재결제는 모두 감사 로그에 기록돼요.') }}</p>

  <Modal v-if="rejecting" :title="tr('환불 거절')" @close="rejecting = null">
    <p class="form-note" style="margin-top: 0">{{ tr('{name}님의 환불 요청을 거절해요. 사유는 사용자에게 전달됩니다.', { name: rejecting.name }) }}</p>
    <label>{{ tr('거절 사유') }}<textarea v-model="reason" :placeholder="tr('예: 이용 기간이 이미 경과했어요')" autofocus></textarea></label>

    <template #footer>
      <button type="button" class="modal-secondary" @click="rejecting = null">{{ tr('취소') }}</button>
      <button class="primary" @click="confirmReject">{{ tr('거절 처리') }}</button>
    </template>
  </Modal>
</template>
