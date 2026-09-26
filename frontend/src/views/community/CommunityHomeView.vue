<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import SubPageHeader from '../../components/SubPageHeader.vue'
import RichText from '../../components/RichText.vue'
import { communities, toggleMembership } from '../../store/communities'
const route = useRoute()
const group = computed(() => communities.value.find(c => String(c.id) === String(route.query.id)) ?? communities.value[0])
const tabs = [{ label: '커뮤니티 목록', path: '/community' }, { label: '게시판', path: '/community/board' }, { label: '챌린지', path: '/community/challenge' }]
function join() {
  if (group.value.joined && !confirm('이 커뮤니티에서 나갈까요?')) return
  toggleMembership(group.value)
}
</script>
<template>
  <template v-if="group">
    <SubPageHeader :title="group.title" parent="커뮤니티" :meta="'멤버 ' + group.members + '명'" fallback="/community" :tabs="tabs">
      <template #actions><button class="primary" @click="join">{{ group.joined ? '참여중 · 나가기' : group.pending ? '가입 신청 취소' : group.joinPolicy === 'approval' ? '가입 신청' : '가입하기' }}</button></template>
    </SubPageHeader>
    <section class="card">
      <span class="tag">{{ group.category }}</span><h3 style="margin-top: 16px">커뮤니티 소개</h3>
      <p><RichText :text="group.desc" /></p>
      <p>정원 {{ group.capacity ?? '제한 없음' }} · {{ group.visibility === 'private' ? '비공개' : '공개' }} · {{ group.joinPolicy === 'approval' ? '승인 후 가입' : '자유 가입' }}</p>
      <p v-if="group.deadline">모집 마감 {{ group.deadline }}</p>
      <p class="form-note">로컬 시연 데이터입니다. 공개범위·가입 승인에 대한 실제 접근 제어는 서버 연동이 필요합니다.</p>
    </section>
  </template>
</template>
