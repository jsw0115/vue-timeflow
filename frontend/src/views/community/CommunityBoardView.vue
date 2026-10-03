<script setup>
import { communityPosts as posts } from '../../store/communityPosts'
import SubPageHeader from '../../components/SubPageHeader.vue'
import { openPostComposer } from '../../store/appState'
import RichText from '../../components/RichText.vue'

const COMMUNITY_TABS = [
  { label: '커뮤니티 홈', path: '/community/home' },
  { label: '게시판', path: '/community/board' },
  { label: '챌린지', path: '/community/challenge' },
  { label: '멤버', path: '/community/members' },
  { label: '채팅', path: '/community/chat' },
]

function toggleLike(p) {
  p.liked = !p.liked
  p.likes += p.liked ? 1 : -1
}
</script>

<template>
  <SubPageHeader title="인증 게시판" parent="운동 갓생방 커뮤니티" fallback="/community" :tabs="COMMUNITY_TABS">
    <template #actions><button class="primary" @click="openPostComposer('커뮤니티 글')">+ 인증하기</button></template>
  </SubPageHeader>

  <section :id="`post-${p.id}`" class="card feed-post" v-for="p in posts" :key="p.id">
    <div class="event" style="border-bottom: none">
      <i>{{ p.name[0] }}</i>
      <span style="flex: 1"><b>{{ p.name }}</b><small>{{ p.time }}</small></span>
      <span v-if="p.auto" class="badge ok">자동 인증됨</span>
    </div>
    <p><RichText :text="p.body" /></p>
    <div class="stat-row">
      <button class="review" style="margin: 0" @click="toggleLike(p)">{{ p.liked ? '♥' : '♡' }} {{ p.likes }}</button>
      <span>💬 {{ p.comments }}</span>
    </div>
  </section>

</template>
