<!-- 방장이 승인을 기다리는 가입 신청을 서버에서 불러와 승인·거절한다. 거절 사유는 신청자 멤버 기록에 남는다(PR-10 3단계, UF-114). -->
<script setup>
import { tr } from '../../store/locale'
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import SubPageHeader from '../../components/SubPageHeader.vue'
import Modal from '../../components/Modal.vue'
import ShareSignIn from '../../components/share/ShareSignIn.vue'
import { session } from '../../features/auth/session.js'
import { communityClient } from '../../features/community/community.js'
import { communityErrorText } from '../../features/community/communityClient.mjs'
import { useCommunity } from '../../features/community/useCommunity.js'

const router = useRouter()
const { id, community, status, isOwner, tabs, load } = useCommunity()
const requests = ref([])
const listStatus = ref('idle')
const notice = ref('')
const error = ref('')
const busy = ref('')
const rejecting = ref(null)
const rejectReason = ref('')

async function loadRequests() {
  if (status.value !== 'ready' || !isOwner.value) { requests.value = []; listStatus.value = 'idle'; return }
  if (listStatus.value !== 'ready') listStatus.value = 'loading'
  try { requests.value = await communityClient.requests(id.value); listStatus.value = 'ready' } catch (e) { error.value = communityErrorText(e); listStatus.value = 'error' }
}
watch(() => [status.value, isOwner.value, id.value], loadRequests, { immediate: true })

async function decide(r, approved, reason = '') {
  if (busy.value) return
  busy.value = r.userId
  notice.value = ''
  error.value = ''
  try {
    await communityClient.decide(id.value, r.userId, approved, reason)
    notice.value = approved ? tr('{name}님의 가입을 승인했어요.', { name: r.nickname || tr('신청자') }) : tr('{name}님의 신청을 거절했어요.', { name: r.nickname || tr('신청자') })
    rejecting.value = null
    await Promise.all([loadRequests(), load()])
  } catch (e) { error.value = communityErrorText(e) } finally { busy.value = '' }
}
function openReject(r) {
  rejecting.value = r
  rejectReason.value = ''
}
</script>

<template>
  <ShareSignIn v-if="!session.userId" message="커뮤니티는 로그인한 계정끼리 함께해요. 로그인하면 커뮤니티를 찾고 가입할 수 있어요." />
  <p v-else-if="status === 'loading'" class="input-field-help" role="status">{{ tr('커뮤니티를 불러오는 중이에요.') }}</p>
  <section v-else-if="status === 'missing'" class="card">
    <div class="empty-state" role="status"><p>{{ tr('커뮤니티를 찾을 수 없어요. 비공개이거나 없어진 커뮤니티일 수 있어요.') }}</p><button type="button" class="button-secondary" @click="router.push('/community')">{{ tr('커뮤니티 목록으로') }}</button></div>
  </section>
  <section v-else-if="status === 'error'" class="card">
    <div class="empty-state" role="status"><p>{{ tr('커뮤니티를 불러오지 못했어요. 연결을 확인하고 다시 시도해 주세요.') }}</p><button type="button" class="button-secondary" @click="load">{{ tr('다시 시도') }}</button></div>
  </section>
  <template v-else-if="community">
    <SubPageHeader :title="tr('가입 요청함')" :parent="community.title" :meta="tr('대기 {n}건', { n: requests.length })" fallback="/community" :tabs="tabs" />
    <section v-if="!isOwner" class="card">
      <div class="empty-state" role="status"><p>{{ tr('가입 요청함은 방장만 볼 수 있어요. 커뮤니티 홈에서 소개와 가입 상태를 확인해 보세요.') }}</p><button type="button" class="button-secondary" @click="router.push({ path: '/community/home', query: { id } })">{{ tr('커뮤니티 홈으로') }}</button></div>
    </section>
    <template v-else>
      <p v-if="notice" class="input-field-help approvals-message" data-state="success" role="status">{{ tr(notice) }}</p>
      <p v-if="error && !rejecting" class="input-field-help approvals-message" data-state="error" role="alert">{{ tr(error) }}</p>
      <section class="card">
        <p v-if="listStatus === 'loading'" class="input-field-help" role="status">{{ tr('가입 신청을 불러오는 중이에요.') }}</p>
        <div v-else-if="listStatus === 'error'" class="empty-state" role="status"><p>{{ tr('가입 신청을 불러오지 못했어요. 연결을 확인하고 다시 시도해 주세요.') }}</p><button type="button" class="button-secondary" @click="loadRequests">{{ tr('다시 시도') }}</button></div>
        <template v-else>
          <div class="event" v-for="r in requests" :key="r.userId">
            <span class="approvals-name"><b>{{ r.nickname || tr('이름 없음') }}</b><small>{{ r.message || tr('남긴 말이 없어요') }}</small></span>
            <button type="button" class="button-secondary" :disabled="!!busy" @click="openReject(r)">{{ tr('거절') }}</button>
            <button type="button" class="button-secondary" :disabled="!!busy" :aria-busy="busy === r.userId ? 'true' : undefined" @click="decide(r, true)">{{ tr('승인') }}</button>
          </div>
          <p v-if="!requests.length" class="empty-state">{{ tr('승인을 기다리는 가입 신청이 없어요. 새 신청이 오면 알림과 함께 여기에 보여요.') }}</p>
        </template>
      </section>
    </template>

    <Modal v-if="rejecting" :title="tr('가입 거절')" @close="rejecting = null">
      <p class="input-field-help">{{ tr('{name}님의 신청을 거절해요. 신청자는 다시 신청할 수 있어요.', { name: rejecting.nickname || tr('신청자') }) }}</p>
      <label class="input-field">{{ tr('거절 사유(선택)') }}<textarea v-model="rejectReason" maxlength="2000" :placeholder="tr('예: 이번 기수 모집이 마감됐어요')" autofocus></textarea></label>
      <p v-if="error" class="input-field-help" data-state="error" role="alert">{{ tr(error) }}</p>
      <template #footer>
        <button type="button" class="modal-secondary" @click="rejecting = null">{{ tr('취소') }}</button>
        <button type="button" class="primary" :disabled="!!busy" :aria-busy="busy ? 'true' : undefined" @click="decide(rejecting, false, rejectReason.trim())">{{ tr('거절하기') }}</button>
      </template>
    </Modal>
  </template>
</template>

<style scoped>
.approvals-message { margin: 0 0 var(--space-lg); }
.approvals-name { flex: 1; min-width: 0; }
.event { flex-wrap: wrap; }
</style>
