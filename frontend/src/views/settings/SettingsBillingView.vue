<script setup>
import { computed, ref } from 'vue'
import Modal from '../../components/Modal.vue'

/** 구독/멤버십 — 결제수단 변경과 해지가 실제로 동작한다. */
const plan = ref({ name: '프리미엄 · 연간', price: '59,900원/년', nextAt: '2027년 3월 12일', active: true })
const method = ref({ brand: '국민카드', last4: '4821' })
const notice = ref('')
function flash(t) {
  notice.value = t
  setTimeout(() => (notice.value = ''), 3000)
}

const showMethod = ref(false)
const draft = ref({ brand: '', number: '', expiry: '' })
const methodError = computed(() => {
  if (!draft.value.brand.trim()) return '카드사를 입력해주세요.'
  if (!/^\d{4}$/.test(draft.value.number.trim())) return '카드 뒷 4자리를 입력해주세요.'
  if (!/^\d{2}\/\d{2}$/.test(draft.value.expiry.trim())) return '유효기간을 MM/YY 형식으로 입력해주세요.'
  return ''
})
function openMethod() {
  draft.value = { brand: '', number: '', expiry: '' }
  showMethod.value = true
}
function saveMethod() {
  if (methodError.value) return
  method.value = { brand: draft.value.brand.trim(), last4: draft.value.number.trim() }
  showMethod.value = false
  flash('결제수단을 변경했어요.')
}

const showCancel = ref(false)
const cancelReason = ref('')
const REASONS = ['잘 안 쓰게 돼요', '가격이 부담돼요', '필요한 기능이 없어요', '다른 서비스를 써요']
function confirmCancel() {
  plan.value.active = false
  showCancel.value = false
  flash('해지를 접수했어요. ' + plan.value.nextAt + '까지는 계속 이용할 수 있어요.')
}
function resume() {
  plan.value.active = true
  flash('구독을 다시 시작했어요.')
}
</script>

<template>
  <div>
    <section class="card plan-current" style="margin-bottom: 16px">
      <span class="pill">현재 플랜</span>
      <div class="head" style="margin-top: 10px; align-items: baseline">
        <h2 style="font-size: 1.1875rem">{{ plan.name }}</h2>
        <b style="color: var(--color-accent)">{{ plan.price }}</b>
      </div>
      <p>
        {{ plan.active ? '다음 결제일: ' + plan.nextAt : '해지 예약됨 · ' + plan.nextAt + '까지 이용 가능' }}
        · 카드 결제 ({{ method.brand }} •••• {{ method.last4 }})
      </p>
      <span v-if="notice" class="badge ok" style="margin-top: 10px; display: inline-block">{{ notice }}</span>
    </section>
    <section class="card" style="margin-bottom: 16px">
      <h3>요금제 비교</h3>
      <div class="plan-compare" style="margin-top: 14px">
        <div><b>무료</b><p>기본 플래너·통계</p></div>
        <div class="selected"><b style="color: var(--color-accent)">프리미엄</b><p>AI 리포트·무제한 커뮤니티</p></div>
        <div><b>팀 플랜</b><p>공유 캘린더 무제한</p></div>
      </div>
    </section>
    <section class="card" style="margin-bottom: 16px">
      <h3>결제 내역</h3>
      <div class="trow"><b>프리미엄 연간 결제</b><span>2026.03.12</span><span style="color: var(--color-accent); font-weight: 700">영수증</span></div>
      <div class="trow"><b>프리미엄 연간 결제</b><span>2025.03.12</span><span style="color: var(--color-accent); font-weight: 700">영수증</span></div>
    </section>
    <div class="form-row">
      <button class="review" style="margin: 0; flex: 1" @click="openMethod">결제수단 변경</button>
      <button v-if="plan.active" class="review" style="margin: 0; flex: 1" @click="showCancel = true">구독 해지</button>
      <button v-else class="primary" style="flex: 1" @click="resume">구독 다시 시작</button>
    </div>
    <p style="text-align: center; margin-top: 10px">해지해도 남은 결제 기간까지는 프리미엄 기능을 계속 이용할 수 있어요</p>
  </div>

  <Modal v-if="showMethod" title="결제수단 변경" @close="showMethod = false">
    <label>카드사<input v-model="draft.brand" placeholder="예: 신한카드" autofocus /></label>
    <div class="form-row">
      <label style="flex: 1">카드 뒷 4자리<input v-model="draft.number" inputmode="numeric" maxlength="4" placeholder="1234" /></label>
      <label style="flex: 1">유효기간<input v-model="draft.expiry" placeholder="MM/YY" maxlength="5" /></label>
    </div>
    <p v-if="methodError" class="form-note">{{ methodError }}</p>
    <p class="form-note">카드 전체 번호는 저장하지 않아요.</p>

    <template #footer>
      <button type="button" class="modal-secondary" @click="showMethod = false">취소</button>
      <button class="primary" :disabled="Boolean(methodError)" @click="saveMethod">변경하기</button>
    </template>
  </Modal>

  <Modal v-if="showCancel" title="구독 해지" @close="showCancel = false">
    <div class="callout">
      <b>{{ plan.nextAt }}까지는 계속 이용할 수 있어요</b>
      <p>해지해도 남은 결제 기간 동안은 프리미엄 기능이 그대로 유지되고, 그 전에 언제든 취소할 수 있어요.</p>
    </div>
    <div class="section-label">해지 사유 (선택)</div>
    <div class="filter" style="width: fit-content; flex-wrap: wrap; margin-top: 6px">
      <button v-for="r in REASONS" :key="r" type="button" :class="{ selected: cancelReason === r }" @click="cancelReason = r">{{ r }}</button>
    </div>

    <template #footer>
      <button class="primary" @click="confirmCancel">해지하기</button>
      <button class="review" style="width: 100%; margin-top: 8px" @click="showCancel = false">계속 이용하기</button>
    </template>
  </Modal>
</template>
