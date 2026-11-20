<!-- 커뮤니티 목록을 서버에서 불러와 분류·검색·정렬하고, 가입·신청·나가기를 서버에 보낸다. 비공개 커뮤니티는 회원에게만 보인다(PR-10 3단계, UF-114). -->
<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import ShareSignIn from '../../components/share/ShareSignIn.vue'
import { session } from '../../features/auth/session.js'
import { communityClient } from '../../features/community/community.js'
import { COMMUNITY_CATEGORIES, communityErrorText, filterCommunities, membershipAction } from '../../features/community/communityClient.mjs'
import { communityComposer } from '../../store/communities'
import PageActions from '../../components/PageActions.vue'

const router = useRouter()
const SORTS = [
  { id: 'members', label: '멤버순' },
  { id: 'new', label: '최신순' },
]
const category = ref('')
const sort = ref('members')
const query = ref('')
const list = ref([])
const status = ref('idle')
const notice = ref('')
const error = ref('')
const busy = ref('')

const visible = computed(() => filterCommunities(list.value, { category: category.value, query: query.value, sort: sort.value }))
const mine = computed(() => list.value.filter((c) => c.membership === 'ACTIVE'))

async function load() {
  if (!session.userId) { list.value = []; status.value = 'idle'; return }
  if (status.value !== 'ready') status.value = 'loading'
  try { list.value = await communityClient.list(); status.value = 'ready' } catch (e) { error.value = communityErrorText(e); status.value = 'error' }
}
watch(() => session.userId, load, { immediate: true })
// 만들기 창이 닫히면 새 커뮤니티가 보이게 다시 불러온다
watch(communityComposer, (open) => { if (!open) load() })

function open(c) {
  router.push({ path: '/community/home', query: { id: c.id } })
}
async function act(c) {
  const { action } = membershipAction(c)
  if (busy.value || action === 'none') return
  if (action === 'apply') { router.push({ path: '/community/join', query: { id: c.id } }); return }
  if (action === 'leave' && !window.confirm('‘' + c.title + '’ 커뮤니티에서 나갈까요? 다시 들어오려면 가입 절차를 거쳐야 해요.')) return
  if (action === 'cancel' && !window.confirm('‘' + c.title + '’ 가입 신청을 취소할까요?')) return
  busy.value = c.id
  notice.value = ''
  error.value = ''
  try {
    if (action === 'join') await communityClient.join(c.id)
    else await communityClient.removeMember(c.id, session.userId)
    notice.value = { join: '‘' + c.title + '’ 커뮤니티에 들어갔어요.', leave: '‘' + c.title + '’ 커뮤니티에서 나왔어요.', cancel: '가입 신청을 취소했어요.' }[action]
    await load()
  } catch (e) { error.value = communityErrorText(e) } finally { busy.value = '' }
}
</script>

<template>
  <ShareSignIn v-if="!session.userId" message="커뮤니티는 로그인한 계정끼리 함께해요. 로그인하면 커뮤니티를 찾고 가입할 수 있어요." />
  <template v-else>
    <div class="page-tools community-tools">
      <div class="filter" role="group" aria-label="분류">
        <button type="button" :aria-pressed="category === ''" @click="category = ''">전체</button>
        <button v-for="c in COMMUNITY_CATEGORIES" :key="c" type="button" :aria-pressed="category === c" @click="category = c">{{ c }}</button>
      </div>
      <div class="filter" role="group" aria-label="정렬">
        <button v-for="s in SORTS" :key="s.id" type="button" :aria-pressed="sort === s.id" @click="sort = s.id">{{ s.label }}</button>
      </div>
      <input v-model="query" type="search" placeholder="커뮤니티 검색" aria-label="커뮤니티 검색" />
      <PageActions><button type="button" class="primary" @click="communityComposer = true">+ 커뮤니티 만들기</button></PageActions>
    </div>
    <p v-if="notice" class="input-field-help community-message" data-state="success" role="status">{{ notice }}</p>
    <p v-if="error && status === 'ready'" class="input-field-help community-message" data-state="error" role="alert">{{ error }}</p>

    <p v-if="status === 'loading'" class="input-field-help" role="status">커뮤니티를 불러오는 중이에요.</p>
    <section v-else-if="status === 'error'" class="card">
      <div class="empty-state" role="status"><p>커뮤니티를 불러오지 못했어요. 연결을 확인하고 다시 시도해 주세요.</p><button type="button" class="button-secondary" @click="load">다시 시도</button></div>
    </section>
    <template v-else>
      <section v-if="mine.length" class="card community-mine" aria-labelledby="mine-title">
        <div id="mine-title" class="section-label">참여 중인 커뮤니티 <span class="figure">{{ mine.length }}</span></div>
        <div class="event" v-for="c in mine" :key="c.id">
          <span class="community-name"><b>{{ c.title }}</b><small>멤버 {{ c.members }}명{{ c.role === 'owner' ? ' · 방장' : '' }}</small></span>
          <button type="button" class="button-secondary" @click="open(c)">들어가기</button>
        </div>
      </section>

      <div class="comm-grid">
        <section class="card comm-card" v-for="c in visible" :key="c.id">
          <h3 class="comm-title"><button type="button" class="card-link" @click="open(c)">{{ c.title }}</button></h3>
          <p>{{ c.desc || '소개가 없어요' }}</p>
          <div class="comm-meta">
            <span v-if="c.category" class="tag">{{ c.category }}</span>
            <span class="tag">{{ c.visibility === 'private' ? '비공개' : '공개' }}</span>
            <span class="tag">{{ c.joinPolicy === 'approval' ? '승인 후 가입' : '자유 가입' }}</span>
            <span class="tag">멤버 {{ c.members }}/{{ c.capacity }}명</span>
          </div>
          <p v-if="membershipAction(c).state" class="input-field-help">{{ membershipAction(c).state }}</p>
          <div class="community-actions">
            <!-- 카드마다 같은 무게 버튼 두 개 대신: 가입이 대표 행동(보조 버튼), 둘러보기는 낮은 우선순위 글자 버튼 -->
            <button v-if="membershipAction(c).action !== 'none'" type="button" class="button-secondary" :disabled="!!busy" :aria-busy="busy === c.id ? 'true' : undefined" @click="act(c)">{{ membershipAction(c).label }}</button>
            <button type="button" class="button-text" @click="open(c)">둘러보기</button>
          </div>
        </section>
      </div>
      <p v-if="!visible.length && list.length" class="empty-state" role="status">조건에 맞는 커뮤니티가 없어요. 분류나 검색어를 바꿔 보세요.</p>
      <p v-else-if="!list.length" class="empty-state">아직 볼 수 있는 커뮤니티가 없어요. '+ 커뮤니티 만들기'로 직접 만들어 보세요.</p>
    </template>
  </template>
</template>

<style scoped>
.community-tools { flex-wrap: wrap; }
.community-message { margin: 0 0 var(--space-lg); }
.community-mine { margin-bottom: var(--space-xl); }
.community-name { flex: 1; min-width: 0; }
.community-actions { display: flex; flex-wrap: wrap; gap: var(--space-md); margin-top: var(--space-lg); }
.comm-title { margin: 0; font-size: var(--type-title-md-size); }
.comm-title .card-link { padding: 0; font: inherit; text-align: left; }
</style>
