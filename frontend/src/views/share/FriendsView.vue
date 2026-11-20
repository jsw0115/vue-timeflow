<!-- 친구·받은 요청·보낸 요청·차단을 서버에서 불러와 관리한다. 친구는 이메일 정확 일치로 찾는다(PR-10 2단계, UF-110·Q-24). -->
<script setup>
import { computed, ref, watch } from 'vue'
import Modal from '../../components/Modal.vue'
import PersonFinder from '../../components/share/PersonFinder.vue'
import ShareSignIn from '../../components/share/ShareSignIn.vue'
import { session } from '../../features/auth/session.js'
import { shareClient } from '../../features/share/share.js'
import { splitFriends, shareErrorText } from '../../features/share/shareClient.mjs'
import PageActions from '../../components/PageActions.vue'

const tab = ref('친구')
const rows = ref([])
const blocks = ref([])
const status = ref('idle')
const notice = ref('')
const error = ref('')
const busy = ref('')
const showFinder = ref(false)
const split = computed(() => splitFriends(rows.value, session.userId))

async function load() {
  if (!session.userId) { rows.value = []; blocks.value = []; status.value = 'idle'; return }
  if (status.value !== 'ready') status.value = 'loading'
  try {
    const [friends, blocked] = await Promise.all([shareClient.friends(), shareClient.blocks()])
    rows.value = friends
    blocks.value = blocked
    status.value = 'ready'
  } catch (e) { error.value = shareErrorText(e); status.value = 'error' }
}
watch(() => session.userId, load, { immediate: true })

/** 서버 변경 하나를 보내고 목록을 다시 불러온다. 성공하면 true다. */
async function act(key, run, done) {
  if (busy.value) return false
  busy.value = key
  error.value = ''
  notice.value = ''
  try { await run(); notice.value = done; await load(); return true } catch (e) { error.value = shareErrorText(e); return false } finally { busy.value = '' }
}
const request = (person) => act('invite', () => shareClient.inviteFriend(person.id), person.nickname + '님에게 친구 요청을 보냈어요.')
const accept = (row) => act(row.id, () => shareClient.acceptFriend(row.id), row.friendName + '님과 친구가 됐어요.')
function reject(row) {
  if (window.confirm(row.friendName + '님의 친구 요청을 거절할까요?')) act(row.id, () => shareClient.rejectFriend(row.id), '친구 요청을 거절했어요.')
}
function cancel(row) {
  if (window.confirm(row.friendName + '님에게 보낸 친구 요청을 취소할까요?')) act(row.id, () => shareClient.removeFriend(row.id), '보낸 친구 요청을 취소했어요.')
}
function unfriend(row) {
  if (window.confirm(row.friendName + '님을 친구 목록에서 삭제할까요?')) act(row.id, () => shareClient.removeFriend(row.id), row.friendName + '님을 친구 목록에서 삭제했어요.')
}
async function block(userId, name) {
  if (!window.confirm(name + '님을 차단할까요? 친구 관계가 끊기고, 내가 만든 그룹에서 빠지며, 서로 초대할 수 없어요.')) return
  if (await act('block', () => shareClient.block(userId), name + '님을 차단했어요.')) showFinder.value = false
}
const unblock = (row) => act(row.userId, () => shareClient.unblock(row.userId), row.nickname + '님의 차단을 풀었어요.')
function openFinder() {
  notice.value = ''
  error.value = ''
  showFinder.value = true
}
</script>

<template>
  <ShareSignIn v-if="!session.userId" />
  <template v-else>
    <div class="page-tools">
      <div class="tabs">
        <button type="button" :aria-pressed="tab === '친구'" @click="tab = '친구'">친구 {{ split.friends.length }}</button>
        <button type="button" :aria-pressed="tab === '요청'" @click="tab = '요청'">요청 {{ split.received.length + split.sent.length }}</button>
        <button type="button" :aria-pressed="tab === '차단'" @click="tab = '차단'">차단 {{ blocks.length }}</button>
      </div>
      <span></span>
      <PageActions><button type="button" class="primary" @click="openFinder">+ 친구 찾기</button></PageActions>
    </div>
    <p v-if="notice && !showFinder" class="input-field-help share-message" data-state="success" role="status">{{ notice }}</p>
    <p v-if="error && status === 'ready' && !showFinder" class="input-field-help share-message" data-state="error" role="alert">{{ error }}</p>

    <section class="card">
      <p v-if="status === 'loading'" class="input-field-help" role="status">친구 목록을 불러오는 중이에요.</p>
      <div v-else-if="status === 'error'" class="empty-state" role="status"><p>친구 목록을 불러오지 못했어요. 연결을 확인하고 다시 시도해 주세요.</p><button type="button" class="button-secondary" @click="load">다시 시도</button></div>

      <template v-else-if="tab === '요청'">
        <div class="event" v-for="r in split.received" :key="r.id">
          <span class="share-name"><b>{{ r.friendName }}</b><small>받은 요청</small></span>
          <button type="button" class="button-secondary" :disabled="!!busy" @click="reject(r)">거절</button>
          <button type="button" class="button-secondary" :disabled="!!busy" :aria-busy="busy === r.id ? 'true' : undefined" @click="accept(r)">수락</button>
        </div>
        <div class="event" v-for="r in split.sent" :key="r.id">
          <span class="share-name"><b>{{ r.friendName }}</b><small>보낸 요청 · 상대가 수락하기를 기다려요</small></span>
          <button type="button" class="button-secondary" :disabled="!!busy" @click="cancel(r)">요청 취소</button>
        </div>
        <p v-if="!split.received.length && !split.sent.length" class="empty-state">주고받은 친구 요청이 없어요. '+ 친구 찾기'로 먼저 요청을 보내 보세요.</p>
      </template>

      <template v-else-if="tab === '차단'">
        <div class="event" v-for="b in blocks" :key="b.userId">
          <span class="share-name"><b>{{ b.nickname || '이름 없음' }}</b><small>차단함</small></span>
          <button type="button" class="button-secondary" :disabled="!!busy" @click="unblock(b)">차단 해제</button>
        </div>
        <p v-if="!blocks.length" class="empty-state">차단한 사용자가 없어요. 친구 목록이나 친구 찾기에서 차단할 수 있어요.</p>
      </template>

      <template v-else>
        <div class="event" v-for="f in split.friends" :key="f.id">
          <span class="share-name"><b>{{ f.friendName }}</b><small>친구</small></span>
          <button type="button" class="button-secondary" :disabled="!!busy" @click="unfriend(f)">삭제</button>
          <button type="button" class="button-secondary" :disabled="!!busy" @click="block(f.friendId, f.friendName)">차단</button>
        </div>
        <p v-if="!split.friends.length" class="empty-state">아직 친구가 없어요. '+ 친구 찾기'에서 이메일로 친구를 찾아 보세요.</p>
      </template>
    </section>

    <Modal v-if="showFinder" title="친구 찾기" @close="showFinder = false">
      <PersonFinder v-slot="{ person }">
        <button type="button" class="button-secondary" :disabled="!!busy" @click="block(person.id, person.nickname)">차단</button>
        <button type="button" class="button-secondary" :disabled="!!busy" :aria-busy="busy === 'invite' ? 'true' : undefined" @click="request(person)">{{ busy === 'invite' ? '보내는 중' : '친구 요청' }}</button>
      </PersonFinder>
      <p v-if="notice" class="input-field-help" data-state="success" role="status">{{ notice }}</p>
      <p v-if="error" class="input-field-help" data-state="error" role="alert">{{ error }}</p>
    </Modal>
  </template>
</template>

<style scoped>
.share-name { flex: 1; min-width: 0; }
.share-message { margin: 0 0 var(--space-lg); }
.event { flex-wrap: wrap; }
</style>
