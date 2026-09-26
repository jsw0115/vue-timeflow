<script setup>
import { ref } from 'vue'
import { localCollection } from '../../store/localCollection'
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

const posts = localCollection('community-posts', [
  { id: 1, name: '김지수', time: '방금 전', body: '오늘도 6km 완주! 타임바 플래너에 자동으로 기록됐어요.', auto: true, likes: 12, comments: 3, liked: false },
  { id: 2, name: '이서연', time: '32분 전', body: '아침 스트레칭 15분 완료! 다들 화이팅이에요', auto: false, likes: 8, comments: 1, liked: false },
])

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
  // 태그·멘션 인덱스에도 등록해 태그 모아보기·멘션함에서 함께 보이게 한다
  const firstLine = draft.value.trim().split(/\r?\n/)[0].slice(0, 24)
  addPost({ kind: '게시글', title: firstLine, body: draft.value.trim(), link: '/community/board' })
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

  <section class="card feed-post" v-for="p in posts" :key="p.id">
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
