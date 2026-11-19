<!-- 커뮤니티 하나의 공개 정보(소개·정원·공개 범위·가입 방식)를 서버에서 보이고 가입 상태를 바꾼다. 볼 수 없는 커뮤니티는 없는 것과 같게 안내한다(PR-10 3단계, UF-114·UT-196). -->
<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import SubPageHeader from '../../components/SubPageHeader.vue'
import RichText from '../../components/RichText.vue'
import ShareSignIn from '../../components/share/ShareSignIn.vue'
import { session } from '../../features/auth/session.js'
import { communityClient } from '../../features/community/community.js'
import { communityErrorText, membershipAction } from '../../features/community/communityClient.mjs'
import { useCommunity } from '../../features/community/useCommunity.js'

const router = useRouter()
const { community, status, isMember, tabs, load } = useCommunity()
const notice = ref('')
const error = ref('')
const busy = ref(false)

async function act() {
  const c = community.value
  const { action } = membershipAction(c)
  if (busy.value || action === 'none') return
  if (action === 'apply') { router.push({ path: '/community/join', query: { id: c.id } }); return }
  if (action === 'leave' && !window.confirm('‘' + c.title + '’ 커뮤니티에서 나갈까요? 다시 들어오려면 가입 절차를 거쳐야 해요.')) return
  if (action === 'cancel' && !window.confirm('가입 신청을 취소할까요?')) return
  busy.value = true
  notice.value = ''
  error.value = ''
  try {
    if (action === 'join') await communityClient.join(c.id)
    else await communityClient.removeMember(c.id, session.userId)
    notice.value = { join: '커뮤니티에 들어갔어요. 게시판에서 인증 글을 남겨 보세요.', leave: '커뮤니티에서 나왔어요.', cancel: '가입 신청을 취소했어요.' }[action]
    await load()
  } catch (e) { error.value = communityErrorText(e) } finally { busy.value = false }
}
</script>

<template>
  <ShareSignIn v-if="!session.userId" message="커뮤니티는 로그인한 계정끼리 함께해요. 로그인하면 커뮤니티를 찾고 가입할 수 있어요." />
  <p v-else-if="status === 'loading'" class="input-field-help" role="status">커뮤니티를 불러오는 중이에요.</p>
  <section v-else-if="status === 'missing'" class="card">
    <div class="empty-state" role="status"><p>커뮤니티를 찾을 수 없어요. 비공개이거나 없어진 커뮤니티일 수 있어요.</p><button type="button" class="button-secondary" @click="router.push('/community')">커뮤니티 목록으로</button></div>
  </section>
  <section v-else-if="status === 'error'" class="card">
    <div class="empty-state" role="status"><p>커뮤니티를 불러오지 못했어요. 연결을 확인하고 다시 시도해 주세요.</p><button type="button" class="button-secondary" @click="load">다시 시도</button></div>
  </section>
  <template v-else-if="community">
    <SubPageHeader :title="community.title" parent="커뮤니티" :meta="'멤버 ' + community.members + '명'" fallback="/community" :tabs="tabs">
      <template #actions>
        <button v-if="membershipAction(community).action !== 'none'" type="button" class="primary" :disabled="busy" :aria-busy="busy ? 'true' : undefined" @click="act">{{ membershipAction(community).label }}</button>
      </template>
    </SubPageHeader>
    <p v-if="notice" class="input-field-help home-message" data-state="success" role="status">{{ notice }}</p>
    <p v-if="error" class="input-field-help home-message" data-state="error" role="alert">{{ error }}</p>
    <section class="card">
      <div class="comm-meta">
        <span v-if="community.category" class="tag">{{ community.category }}</span>
        <span v-if="membershipAction(community).state" class="tag">{{ membershipAction(community).state }}</span>
      </div>
      <h3 class="home-heading">커뮤니티 소개</h3>
      <p><RichText :text="community.desc || '소개가 없어요.'" /></p>
      <dl class="home-facts">
        <dt>정원</dt><dd><span class="figure">{{ community.members }}/{{ community.capacity }}</span>명</dd>
        <dt>공개 범위</dt><dd>{{ community.visibility === 'private' ? '비공개. 초대받은 사람만 찾고 들어올 수 있어요' : '공개. 누구나 찾고 소개를 볼 수 있어요' }}</dd>
        <dt>가입 방식</dt><dd>{{ community.joinPolicy === 'approval' ? '방장이 승인하면 가입돼요' : '가입하면 바로 들어가요' }}</dd>
        <template v-if="community.deadline"><dt>모집 마감</dt><dd class="figure">{{ community.deadline }}</dd></template>
      </dl>
      <p v-if="!isMember" class="input-field-help">게시판 글은 회원만 볼 수 있어요. 가입하면 다른 회원의 인증 글을 보고 남길 수 있어요.</p>
    </section>
  </template>
</template>

<style scoped>
.home-message { margin: 0 0 var(--space-lg); }
.home-heading { margin: var(--space-xl) 0 var(--space-md); }
.home-facts { display: grid; grid-template-columns: max-content minmax(0, 1fr); gap: var(--space-sm) var(--space-lg); margin: var(--space-xl) 0; font-size: var(--type-body-size); }
.home-facts dt { font-weight: 600; }
.home-facts dd { margin: 0; }
@media (max-width: 600px) { .home-facts { grid-template-columns: minmax(0, 1fr); } }
</style>
