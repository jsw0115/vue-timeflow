<!-- 커뮤니티 채팅. 서버가 커뮤니티 활성 회원으로 채팅방 멤버를 맞추고, 대화는 채팅 화면에서 이어간다(PR-10 3b-3, Q-25). -->
<script setup>
import { bodyLocale, tr } from '../../store/locale'
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import SubPageHeader from '../../components/SubPageHeader.vue'
import ShareSignIn from '../../components/share/ShareSignIn.vue'
import { session } from '../../features/auth/session.js'
import { communityClient } from '../../features/community/community.js'
import { localTime } from '../../features/community/communityClient.mjs'
import { useCommunity } from '../../features/community/useCommunity.js'

const router = useRouter()
const { id, community, status, isMember, tabs, load } = useCommunity()
const room = ref(null)
const roomStatus = ref('idle')
const roomError = ref('')

function chatErrorText(error) {
  if (error?.status == null || error.status === 0) return tr('채팅 서버에 연결하지 못했어요. 연결을 확인하고 다시 시도해 주세요.')
  if (error.status === 403) return tr('커뮤니티 회원만 채팅에 들어올 수 있어요. 가입 상태를 확인해 주세요.')
  if (error.status === 404) return tr('채팅을 열 수 없어요. 이 환경에서 채팅이 꺼져 있거나 커뮤니티가 없어졌을 수 있어요.')
  if (error.status === 503) return tr('채팅 서버가 잠시 응답하지 않아요. 잠시 뒤 다시 시도해 주세요.')
  return error.message || tr('채팅방을 열지 못했어요. 잠시 뒤 다시 시도해 주세요.')
}
async function openRoom() {
  if (status.value !== 'ready' || !isMember.value) { room.value = null; roomStatus.value = 'idle'; return }
  roomStatus.value = 'loading'
  try { room.value = await communityClient.chatRoom(id.value); roomStatus.value = 'ready' } catch (e) { roomError.value = chatErrorText(e); roomStatus.value = 'error' }
}
watch(() => [status.value, isMember.value, id.value], openRoom, { immediate: true })
</script>

<template>
  <ShareSignIn v-if="!session.userId" message="커뮤니티 채팅은 회원끼리 해요. 로그인하면 내 커뮤니티의 채팅방에 들어갈 수 있어요." />
  <p v-else-if="status === 'loading'" class="input-field-help" role="status">{{ tr('커뮤니티를 불러오는 중이에요.') }}</p>
  <section v-else-if="status === 'missing'" class="card">
    <div class="empty-state" role="status"><p>{{ tr('커뮤니티를 찾을 수 없어요. 비공개이거나 없어진 커뮤니티일 수 있어요.') }}</p><button type="button" class="button-secondary" @click="router.push('/community')">{{ tr('커뮤니티 목록으로') }}</button></div>
  </section>
  <section v-else-if="status === 'error'" class="card">
    <div class="empty-state" role="status"><p>{{ tr('커뮤니티를 불러오지 못했어요. 연결을 확인하고 다시 시도해 주세요.') }}</p><button type="button" class="button-secondary" @click="load">{{ tr('다시 시도') }}</button></div>
  </section>
  <template v-else-if="community">
    <SubPageHeader :title="tr('커뮤니티 채팅')" :parent="community.title" fallback="/community" :tabs="tabs" />
    <section v-if="!isMember" class="card">
      <div class="empty-state" role="status"><p>{{ tr('채팅은 회원만 쓸 수 있어요. 커뮤니티 홈에서 가입하면 채팅방에 자동으로 들어와요.') }}</p><button type="button" class="button-secondary" @click="router.push({ path: '/community/home', query: { id } })">{{ tr('커뮤니티 홈으로') }}</button></div>
    </section>
    <p v-else-if="roomStatus === 'loading'" class="input-field-help" role="status">{{ tr('채팅방을 여는 중이에요.') }}</p>
    <section v-else-if="roomStatus === 'error'" class="card">
      <div class="empty-state" role="status"><p>{{ tr(roomError) }}</p><button type="button" class="button-secondary" @click="openRoom">{{ tr('다시 시도') }}</button></div>
    </section>
    <section v-else-if="room" class="card community-chat">
      <div class="community-chat-head">
        <h3>{{ room.name }}</h3>
        <span class="tag">{{ tr('참여') }} <span class="figure">{{ room.members.length }}</span><template v-if="bodyLocale === 'ko'">명</template></span>
        <span v-if="room.unreadCount" class="tag">{{ tr('안 읽은 메시지') }} <span class="figure">{{ room.unreadCount }}</span></span>
      </div>
      <p class="community-chat-rule">{{ tr('커뮤니티 회원은 이 채팅방에 자동으로 들어와요. 커뮤니티를 나가거나 내보내지면 채팅방에서도 바로 나가져요.') }}</p>
      <p v-if="room.lastMessage" class="community-chat-last"><b>{{ room.lastMessage.senderName || tr('이름 없음') }}</b> {{ room.lastMessage.body }} <time class="figure">{{ localTime(room.lastMessage.createdAt) }}</time></p>
      <p v-else class="empty-state">{{ tr('아직 나눈 이야기가 없어요. 채팅방을 열어 첫 인사를 남겨 보세요.') }}</p>
      <button type="button" class="primary" @click="router.push({ path: '/chat', query: { room: room.id } })">{{ tr('채팅방 열기') }}</button>
    </section>
  </template>
</template>

<style scoped>
.community-chat { display: grid; gap: var(--space-lg); justify-items: start; }
.community-chat-head { display: flex; flex-wrap: wrap; gap: var(--space-md); align-items: baseline; }
.community-chat-head h3 { margin: 0; word-break: keep-all; }
.community-chat-rule, .community-chat-last { margin: 0; }
.community-chat-last { overflow-wrap: anywhere; }
.community-chat-last time { font-size: var(--type-caption-size); color: var(--color-muted); margin-left: var(--space-sm); }
</style>
