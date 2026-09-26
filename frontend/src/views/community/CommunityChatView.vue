<script setup>
import TagMentionInput from '../../components/TagMentionInput.vue'
import RichText from '../../components/RichText.vue'
import { ref } from 'vue'
import SubPageHeader from '../../components/SubPageHeader.vue'

const COMMUNITY_TABS = [
  { label: '커뮤니티 홈', path: '/community/home' },
  { label: '게시판', path: '/community/board' },
  { label: '챌린지', path: '/community/challenge' },
  { label: '멤버', path: '/community/members' },
  { label: '채팅', path: '/community/chat' },
]

const messages = ref([
  { id: 1, kind: 'notice', text: '📌 공지: 이번 주 목표는 5일 인증! 화이팅' },
  { id: 2, kind: 'them', text: '오늘 다들 몇 시에 뛰시나요?' },
  { id: 3, kind: 'them', text: '저는 아침 6시반이요!' },
  { id: 4, kind: 'mine', text: '저도 그 시간에 나갈게요 👍' },
  { id: 5, kind: 'system', text: '시스템 · 정우진님이 입장했습니다' },
])
const draft = ref('')
function send() {
  if (!draft.value.trim()) return
  messages.value.push({ id: Math.max(0, ...messages.value.map((m) => m.id)) + 1, kind: 'mine', text: draft.value.trim() })
  draft.value = ''
}
</script>

<template>
  <SubPageHeader title="커뮤니티 채팅" parent="운동 갓생방 커뮤니티" meta="멤버 128명" fallback="/community" :tabs="COMMUNITY_TABS" />

  <section class="card chat-pattern" style="flex-direction: column; height: auto">
    <div class="chat-bubbles">
      <template v-for="m in messages" :key="m.id">
        <span v-if="m.kind === 'notice'" class="chat-notice">{{ m.text }}</span>
        <span v-else-if="m.kind === 'system'" class="chat-system">{{ m.text }}</span>
        <div v-else class="bubble" :class="{ mine: m.kind === 'mine' }"><RichText :text="m.text" /></div>
      </template>
    </div>
    <div class="chat-input">
      <TagMentionInput v-model="draft" :rows="2" placeholder="메시지 입력 · #태그 @이름 (Ctrl+Enter 전송)" @keydown.ctrl.enter.prevent="send" />
      <button class="primary" :disabled="!draft.trim()" @click="send">전송</button>
    </div>
  </section>
</template>
