<script setup>
import { ref } from 'vue'
import { communityPosts as posts } from '../../store/communityPosts'
import SubPageHeader from '../../components/SubPageHeader.vue'
import Modal from '../../components/Modal.vue'
import TagMentionInput from '../../components/TagMentionInput.vue'
import RichText from '../../components/RichText.vue'
import { addPost, parseTags } from '../../store/tagging'

const COMMUNITY_TABS = [
  { label: '커뮤니티 홈', path: '/community/home' },
  { label: '게시판', path: '/community/board' },
  { label: '챌린지', path: '/community/challenge' },
  { label: '멤버', path: '/community/members' },
  { label: '채팅', path: '/community/chat' },
]

const showPost = ref(false)
const draft = ref('')
function submitPost() {
  if (!draft.value.trim()) return
  posts.value.unshift({
    id: Math.max(0, ...posts.value.map((p) => p.id)) + 1,
    name: '김지수',
    time: '방금',
    body: draft.value.trim(),
    auto: false,
    likes: 0,
    comments: 0,
    liked: false,
  })
  draft.value = ''
  showPost.value = false
}
function toggleLike(p) {
  p.liked = !p.liked
  p.likes += p.liked ? 1 : -1
}
</script>

<template>
  <SubPageHeader title="인증 게시판" parent="운동 갓생방 커뮤니티" fallback="/community" :tabs="COMMUNITY_TABS">
    <template #actions><button class="primary" @click="showPost = true">+ 인증하기</button></template>
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

  <Modal v-if="showPost" title="인증하기" @close="showPost = false">
    <label>오늘의 인증</label>
    <TagMentionInput v-model="draft" placeholder="무엇을 해냈는지 짧게 적어주세요. #태그 와 @이름 을 쓸 수 있어요" />
    <p class="form-note">플래너에 기록된 활동이 있으면 자동 인증 배지가 함께 달려요.</p>
    <button class="primary" @click="submitPost">인증 올리기</button>
  </Modal>
</template>
