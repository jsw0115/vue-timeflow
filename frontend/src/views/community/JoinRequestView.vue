<!-- 승인제 커뮤니티에 가입을 신청한다. 신청 메시지는 방장의 가입 요청함에 그대로 보이고, 승인 전에는 신청을 취소할 수 있다(PR-10 3단계, UF-114). -->
<script setup>
import { tr } from '../../store/locale'
import { ref, useId } from 'vue'
import { useRouter } from 'vue-router'
import SubPageHeader from '../../components/SubPageHeader.vue'
import ShareSignIn from '../../components/share/ShareSignIn.vue'
import { session } from '../../features/auth/session.js'
import { communityClient } from '../../features/community/community.js'
import { communityErrorText } from '../../features/community/communityClient.mjs'
import { useCommunity } from '../../features/community/useCommunity.js'

const router = useRouter()
const { id, community, status, tabs, load } = useCommunity()
const message = ref('')
const busy = ref(false)
const error = ref('')
const notice = ref('')
const helpId = useId()

async function submit() {
  if (busy.value) return
  busy.value = true
  error.value = ''
  notice.value = ''
  try {
    const result = await communityClient.join(id.value, message.value.trim())
    // 자유 가입이면 바로 회원이 된다
    if (result?.membership === 'ACTIVE') { router.push({ path: '/community/home', query: { id: id.value } }); return }
    notice.value = tr('가입을 신청했어요. 방장이 승인하면 알림으로 알려 드려요.')
    await load()
  } catch (e) { error.value = communityErrorText(e) } finally { busy.value = false }
}
async function cancel() {
  if (busy.value || !window.confirm(tr('가입 신청을 취소할까요?'))) return
  busy.value = true
  error.value = ''
  try { await communityClient.removeMember(id.value, session.userId); notice.value = tr('가입 신청을 취소했어요.'); await load() } catch (e) { error.value = communityErrorText(e) } finally { busy.value = false }
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
    <SubPageHeader :title="tr('가입 신청')" :parent="community.title" :fallback="'/community/home?id=' + encodeURIComponent(id)" :tabs="tabs" />
    <div class="form-pattern">
      <section class="card form-card">
        <h2>{{ tr('{name} 가입 신청', { name: community.title }) }}</h2>
        <template v-if="community.membership === 'PENDING'">
          <p class="input-field-help" data-state="success" role="status">{{ notice || tr('가입을 신청했어요. 방장이 승인하면 알림으로 알려 드려요.') }}</p>
          <button type="button" class="button-secondary" :disabled="busy" :aria-busy="busy ? 'true' : undefined" @click="cancel">{{ busy ? tr('취소하는 중') : tr('신청 취소') }}</button>
        </template>
        <p v-else-if="community.membership === 'ACTIVE'" class="input-field-help" role="status">{{ tr('이미 이 커뮤니티 회원이에요. 게시판에서 인증 글을 남겨 보세요.') }}</p>
        <form v-else @submit.prevent="submit">
          <p v-if="notice" class="input-field-help" data-state="success" role="status">{{ tr(notice) }}</p>
          <p v-if="community.membership === 'REJECTED'" class="input-field-help" role="status">{{ tr('이전 신청은 승인되지 않았어요. 다시 신청할 수 있어요.') }}</p>
          <label class="input-field">{{ tr('방장에게 남길 말(선택)') }}<textarea v-model="message" maxlength="2000" rows="4" :placeholder="tr('어떤 목표로 함께하고 싶은지 적어 주세요')" :aria-describedby="helpId"></textarea><span :id="helpId" class="input-field-help">{{ tr('방장의 가입 요청함에 그대로 보여요. 최대 2,000자예요.') }}</span></label>
          <p v-if="error" class="input-field-help" data-state="error" role="alert">{{ tr(error) }}</p>
          <button type="submit" class="primary" :disabled="busy" :aria-busy="busy ? 'true' : undefined">{{ busy ? '보내는 중' : community.joinPolicy === 'approval' ? tr('신청 보내기') : tr('가입하기') }}</button>
        </form>
      </section>
    </div>
  </template>
</template>
