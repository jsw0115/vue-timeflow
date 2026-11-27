<!-- 커뮤니티 회원 목록을 서버에서 보이고, 방장은 이메일로 초대하거나 회원을 내보낸다. 서버에 없는 역할 변경·공지 고정은 두지 않는다(PR-10 3단계, UF-114). -->
<script setup>
import { tr } from '../../store/locale'
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import SubPageHeader from '../../components/SubPageHeader.vue'
import Modal from '../../components/Modal.vue'
import PersonFinder from '../../components/share/PersonFinder.vue'
import ShareSignIn from '../../components/share/ShareSignIn.vue'
import { session } from '../../features/auth/session.js'
import { communityClient } from '../../features/community/community.js'
import { communityErrorText } from '../../features/community/communityClient.mjs'
import { useCommunity } from '../../features/community/useCommunity.js'

const router = useRouter()
const { id, community, status, isMember, isOwner, tabs, load } = useCommunity()
const members = ref([])
const listStatus = ref('idle')
const notice = ref('')
const error = ref('')
const busy = ref('')
const showInvite = ref(false)

async function loadMembers() {
  if (status.value !== 'ready' || !isMember.value) { members.value = []; listStatus.value = 'idle'; return }
  if (listStatus.value !== 'ready') listStatus.value = 'loading'
  try { members.value = await communityClient.members(id.value); listStatus.value = 'ready' } catch (e) { error.value = communityErrorText(e); listStatus.value = 'error' }
}
watch(() => [status.value, isMember.value, id.value], loadMembers, { immediate: true })

async function invite(person) {
  if (busy.value) return
  busy.value = 'invite'
  notice.value = ''
  error.value = ''
  try { await communityClient.invite(id.value, person.id); notice.value = tr('{name}님을 초대했어요. 커뮤니티 목록에서 초대를 수락하면 회원이 돼요.', { name: person.nickname }) } catch (e) { error.value = communityErrorText(e) } finally { busy.value = '' }
}
function openInvite() {
  notice.value = ''
  error.value = ''
  showInvite.value = true
}
async function kick(m) {
  if (busy.value || !window.confirm(tr('{name}님을 내보낼까요? 다시 들어오려면 가입 절차를 거쳐야 해요.', { name: m.nickname || tr('이 회원') }))) return
  busy.value = m.userId
  notice.value = ''
  error.value = ''
  try { await communityClient.removeMember(id.value, m.userId); notice.value = tr('{name}님을 내보냈어요.', { name: m.nickname || tr('이 회원') }); await Promise.all([loadMembers(), load()]) } catch (e) { error.value = communityErrorText(e) } finally { busy.value = '' }
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
    <SubPageHeader :title="tr('멤버')" :parent="community.title" :meta="tr('전체 {n}명', { n: community.members })" fallback="/community" :tabs="tabs">
      <template v-if="isOwner" #actions><button type="button" class="primary" @click="openInvite">{{ tr('이메일로 초대') }}</button></template>
    </SubPageHeader>
    <section v-if="!isMember" class="card">
      <div class="empty-state" role="status"><p>{{ tr('멤버 목록은 회원만 볼 수 있어요. 커뮤니티 홈에서 가입하면 함께하는 사람을 볼 수 있어요.') }}</p><button type="button" class="button-secondary" @click="router.push({ path: '/community/home', query: { id } })">{{ tr('커뮤니티 홈으로') }}</button></div>
    </section>
    <template v-else>
      <p v-if="notice && !showInvite" class="input-field-help members-message" data-state="success" role="status">{{ tr(notice) }}</p>
      <p v-if="error && !showInvite" class="input-field-help members-message" data-state="error" role="alert">{{ tr(error) }}</p>
      <section class="card">
        <p v-if="listStatus === 'loading'" class="input-field-help" role="status">{{ tr('멤버를 불러오는 중이에요.') }}</p>
        <div v-else-if="listStatus === 'error'" class="empty-state" role="status"><p>{{ tr('멤버를 불러오지 못했어요. 연결을 확인하고 다시 시도해 주세요.') }}</p><button type="button" class="button-secondary" @click="loadMembers">{{ tr('다시 시도') }}</button></div>
        <template v-else>
          <div class="event" v-for="m in members" :key="m.userId">
            <span class="members-name"><b>{{ m.nickname || tr('이름 없음') }}<template v-if="m.userId === session.userId"> {{ tr('(나)') }}</template></b><small>{{ m.role === 'owner' ? tr('방장') : tr('멤버') }}</small></span>
            <button v-if="isOwner && m.role !== 'owner'" type="button" class="button-secondary" :disabled="!!busy" :aria-busy="busy === m.userId ? 'true' : undefined" @click="kick(m)">{{ tr('내보내기') }}</button>
          </div>
        </template>
      </section>
    </template>
    <Modal v-if="showInvite" :title="tr('이메일로 초대')" @close="showInvite = false">
      <PersonFinder v-slot="{ person }">
        <button type="button" class="button-secondary" :disabled="!!busy" :aria-busy="busy === 'invite' ? 'true' : undefined" @click="invite(person)">{{ busy === 'invite' ? tr('초대하는 중') : tr('초대') }}</button>
      </PersonFinder>
      <p v-if="notice" class="input-field-help" data-state="success" role="status">{{ tr(notice) }}</p>
      <p v-if="error" class="input-field-help" data-state="error" role="alert">{{ tr(error) }}</p>
      <p class="input-field-help">{{ tr('비공개 커뮤니티는 초대받은 사람만 찾고 들어올 수 있어요. 차단한 사이에서는 초대할 수 없어요.') }}</p>
    </Modal>
  </template>
</template>

<style scoped>
.members-message { margin: 0 0 var(--space-lg); }
.members-name { flex: 1; min-width: 0; }
</style>
