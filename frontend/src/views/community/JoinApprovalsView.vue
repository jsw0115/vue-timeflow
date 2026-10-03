<script setup>
import { computed, ref } from 'vue'
import SubPageHeader from '../../components/SubPageHeader.vue'
import Modal from '../../components/Modal.vue'

const COMMUNITY_TABS = [
  { label: '커뮤니티 홈', path: '/community/home' },
  { label: '게시판', path: '/community/board' },
  { label: '챌린지', path: '/community/challenge' },
  { label: '멤버', path: '/community/members' },
  { label: '채팅', path: '/community/chat' },
]

/** 가입 요청함 — 승인/거절이 실제로 반영되고, 방장이 확인할 항목을 함께 보여준다. */
const requests = ref([
  { id: 1, name: '최지우', date: '8/24', msg: '아침 러닝 꾸준히 하고 싶어요', goal: '주 5회', route: '친구 초대', state: null, reason: '' },
  { id: 2, name: '한소율', date: '8/23', msg: '친구 추천으로 왔어요!', goal: '주 3회', route: '검색', state: null, reason: '' },
  { id: 3, name: '정우진', date: '8/22', msg: '-', goal: '주 2회', route: '검색', state: '승인됨', reason: '' },
])
const filter = ref('대기중')
const FILTERS = ['대기중', '승인됨', '거절됨', '전체']
const visible = computed(() =>
  requests.value.filter((r) => {
    if (filter.value === '전체') return true
    if (filter.value === '대기중') return !r.state
    return r.state === filter.value
  }),
)
const pendingCount = computed(() => requests.value.filter((r) => !r.state).length)

function approve(r) {
  r.state = '승인됨'
  r.reason = ''
}
const rejecting = ref(null)
const rejectReason = ref('')
function openReject(r) {
  rejecting.value = r
  rejectReason.value = ''
}
function confirmReject() {
  if (!rejecting.value) return
  rejecting.value.state = '거절됨'
  rejecting.value.reason = rejectReason.value.trim() || '사유 미기재'
  rejecting.value = null
}
function revert(r) {
  r.state = null
  r.reason = ''
}
</script>

<template>
  <SubPageHeader title="가입 요청함" parent="운동 갓생방 커뮤니티" :meta="'대기 ' + pendingCount + '건'" fallback="/community" :tabs="COMMUNITY_TABS" />

  <div class="page-tools">
    <div class="filter">
      <button v-for="f in FILTERS" :key="f" :class="{ selected: filter === f }" @click="filter = f">{{ f }}</button>
    </div>
    <span class="badge warn">모집 마감까지 D-5</span>
  </div>

  <section class="card list">
    <div class="list-head" style="grid-template-columns: 1fr .7fr 1.6fr .8fr .8fr 1.4fr">
      <span>신청자</span><span>신청일</span><span>메시지</span><span>목표</span><span>유입</span><span>처리</span>
    </div>
    <div class="row" style="grid-template-columns: 1fr .7fr 1.6fr .8fr .8fr 1.4fr" v-for="r in visible" :key="r.id">
      <label>{{ r.name }}</label>
      <span class="figure">{{ r.date }}</span>
      <span>{{ r.msg }}<small v-if="r.reason" style="display: block; color: var(--color-muted)">거절 사유: {{ r.reason }}</small></span>
      <span class="tag">{{ r.goal }}</span>
      <span class="tag">{{ r.route }}</span>
      <span style="display: flex; gap: 6px">
        <template v-if="!r.state">
          <button class="primary" style="padding: 5px 10px" @click="approve(r)">승인</button>
          <button class="review" style="margin: 0" @click="openReject(r)">거절</button>
        </template>
        <template v-else>
          <span class="badge" :class="r.state === '승인됨' ? 'ok' : 'danger'">{{ r.state }}</span>
          <button class="review" style="margin: 0" @click="revert(r)">되돌리기</button>
        </template>
      </span>
    </div>
    <p v-if="!visible.length" class="form-note" style="margin: 12px 0 0">해당 상태의 신청이 없어요.</p>
  </section>

  <Modal v-if="rejecting" title="가입 거절" @close="rejecting = null">
    <p class="form-note" style="margin-top: 0">{{ rejecting.name }}님의 신청을 거절해요. 사유는 신청자에게 전달됩니다.</p>
    <label>거절 사유<textarea v-model="rejectReason" placeholder="예: 이번 기수 모집이 마감되었어요" autofocus></textarea></label>

    <template #footer>
      <button type="button" class="modal-secondary" @click="rejecting = null">취소</button>
      <button class="primary" @click="confirmReject">거절 처리</button>
    </template>
  </Modal>
</template>
