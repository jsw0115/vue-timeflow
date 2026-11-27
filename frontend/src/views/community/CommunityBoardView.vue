<!-- 커뮤니티 회원 전용 게시판. 인증 글·댓글·좋아요를 서버에 저장하고, 회원이 아니면 글 대신 가입 안내를 보인다(PR-10 3단계, UF-114). -->
<script setup>
import { tr } from '../../store/locale'
import { computed, reactive, ref, useId, watch } from 'vue'
import { useRouter } from 'vue-router'
import SubPageHeader from '../../components/SubPageHeader.vue'
import RichText from '../../components/RichText.vue'
import ShareSignIn from '../../components/share/ShareSignIn.vue'
import { session } from '../../features/auth/session.js'
import { communityClient } from '../../features/community/community.js'
import { communityErrorText, localTime } from '../../features/community/communityClient.mjs'
import { useCommunity } from '../../features/community/useCommunity.js'

const router = useRouter()
const { id, community, status, isMember, isOwner, tabs, load } = useCommunity()
const posts = ref([])
const postStatus = ref('idle')
const draft = ref('')
const draftError = ref('')
const notice = ref('')
const error = ref('')
const busy = ref('')
const draftHelp = useId()
// 글마다 펼친 댓글과 쓰는 중인 댓글
const open = reactive({})
const replies = reactive({})

const sorted = computed(() => [...posts.value].sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''))))

async function loadPosts() {
  if (status.value !== 'ready' || !isMember.value) { posts.value = []; postStatus.value = 'idle'; return }
  if (postStatus.value !== 'ready') postStatus.value = 'loading'
  try { posts.value = await communityClient.posts(id.value); postStatus.value = 'ready' } catch (e) { error.value = communityErrorText(e); postStatus.value = 'error' }
}
watch(() => [status.value, isMember.value, id.value], loadPosts, { immediate: true })

async function run(key, task, done) {
  if (busy.value) return false
  busy.value = key
  notice.value = ''
  error.value = ''
  try { await task(); if (done) notice.value = done; return true } catch (e) { error.value = communityErrorText(e); return false } finally { busy.value = '' }
}
async function write() {
  if (!draft.value.trim()) { draftError.value = tr('인증 내용을 입력해 주세요.'); return }
  draftError.value = ''
  if (await run('post', () => communityClient.createPost(id.value, draft.value.trim()), tr('인증 글을 남겼어요.'))) { draft.value = ''; await loadPosts() }
}
async function toggleLike(post) {
  if (await run('like:' + post.id, () => communityClient.like(id.value, post.id, !post.liked))) await loadPosts()
}
async function remove(post) {
  if (!window.confirm(tr('이 글을 삭제할까요? 댓글과 좋아요도 함께 지워져요.'))) return
  if (await run('delete:' + post.id, () => communityClient.deletePost(id.value, post), tr('글을 삭제했어요.'))) await loadPosts()
}
/* 다른 사람 글 신고. 사유는 운영자만 보고, 처리 결과는 신고한 사람에게 따로 알리지 않는다(서버에 알림이 없다) */
const reporting = reactive({})
function openReport(post) {
  if (post.id in reporting) delete reporting[post.id]
  else reporting[post.id] = ''
}
async function sendReport(post) {
  const reason = String(reporting[post.id] ?? '').trim()
  if (!reason) { error.value = tr('신고 사유를 적어 주세요.'); return }
  if (await run('report:' + post.id, () => communityClient.report(id.value, post.id, reason), tr('신고했어요. 운영자가 확인해요.'))) delete reporting[post.id]
}
async function toggleComments(post) {
  if (open[post.id]) { delete open[post.id]; return }
  open[post.id] = { status: 'loading', items: [] }
  try { open[post.id] = { status: 'ready', items: await communityClient.comments(id.value, post.id) } } catch { open[post.id] = { status: 'error', items: [] } }
}
async function reply(post) {
  const text = (replies[post.id] ?? '').trim()
  if (!text) return
  if (await run('comment:' + post.id, () => communityClient.comment(id.value, post.id, text))) {
    replies[post.id] = ''
    open[post.id] = { status: 'ready', items: await communityClient.comments(id.value, post.id) }
    await loadPosts()
  }
}
const canDelete = (post) => post.authorId === session.userId || isOwner.value
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
    <SubPageHeader :title="tr('인증 게시판')" :parent="community.title" fallback="/community" :tabs="tabs" />
    <section v-if="!isMember" class="card">
      <div class="empty-state" role="status"><p>{{ tr('게시판 글은 회원만 볼 수 있어요. 커뮤니티 홈에서 가입하면 글을 보고 남길 수 있어요.') }}</p><button type="button" class="button-secondary" @click="router.push({ path: '/community/home', query: { id } })">{{ tr('커뮤니티 홈으로') }}</button></div>
    </section>
    <template v-else>
      <form class="card board-compose" @submit.prevent="write">
        <label class="input-field">{{ tr('오늘의 인증') }}<textarea v-model="draft" maxlength="20000" rows="3" :placeholder="tr('오늘 한 일을 남겨 보세요')" :aria-invalid="draftError ? 'true' : undefined" :aria-describedby="draftHelp"></textarea><span :id="draftHelp" class="input-field-help" :data-state="draftError ? 'error' : undefined">{{ draftError || tr('회원에게만 보여요.') }}</span></label>
        <button type="submit" class="primary" :disabled="busy === 'post'" :aria-busy="busy === 'post' ? 'true' : undefined">{{ busy === 'post' ? tr('남기는 중') : tr('인증 남기기') }}</button>
      </form>
      <p v-if="notice" class="input-field-help board-message" data-state="success" role="status">{{ tr(notice) }}</p>
      <p v-if="error" class="input-field-help board-message" data-state="error" role="alert">{{ tr(error) }}</p>

      <p v-if="postStatus === 'loading'" class="input-field-help" role="status">{{ tr('글을 불러오는 중이에요.') }}</p>
      <section v-else-if="postStatus === 'error'" class="card">
        <div class="empty-state" role="status"><p>{{ tr('글을 불러오지 못했어요. 연결을 확인하고 다시 시도해 주세요.') }}</p><button type="button" class="button-secondary" @click="loadPosts">{{ tr('다시 시도') }}</button></div>
      </section>
      <template v-else>
        <section v-for="p in sorted" :id="`post-${p.id}`" :key="p.id" class="card feed-post board-post">
          <div class="board-author"><b>{{ p.name || tr('이름 없음') }}</b><time class="figure">{{ localTime(p.createdAt) }}</time></div>
          <p><RichText :text="p.body" /></p>
          <div class="board-actions">
            <button type="button" class="button-secondary" :disabled="!!busy" @click="toggleLike(p)">{{ p.liked ? tr('좋아요 취소') : tr('좋아요') }} <span class="figure">{{ p.likes }}</span></button>
            <button type="button" class="button-secondary" :aria-expanded="!!open[p.id]" @click="toggleComments(p)">{{ tr('댓글') }} <span class="figure">{{ p.comments }}</span></button>
            <button v-if="canDelete(p)" type="button" class="button-secondary" :disabled="!!busy" @click="remove(p)">{{ tr('삭제') }}</button>
            <button v-if="p.authorId !== session.userId" type="button" class="button-text" :aria-expanded="reporting[p.id] !== undefined" @click="openReport(p)">{{ tr('신고') }}</button>
          </div>
          <form v-if="reporting[p.id] !== undefined" class="board-reply" @submit.prevent="sendReport(p)">
            <label class="input-field">{{ tr('신고 사유(운영자만 봐요)') }}<input v-model="reporting[p.id]" maxlength="200" required :placeholder="tr('예: 광고성 게시물')" /></label>
            <button type="submit" class="button-secondary" :disabled="!!busy || !String(reporting[p.id] ?? '').trim()">{{ tr('신고하기') }}</button>
          </form>
          <div v-if="open[p.id]" class="board-comments">
            <p v-if="open[p.id].status === 'loading'" class="input-field-help" role="status">{{ tr('댓글을 불러오는 중이에요.') }}</p>
            <p v-else-if="open[p.id].status === 'error'" class="input-field-help" data-state="error" role="alert">{{ tr('댓글을 불러오지 못했어요. 댓글 버튼을 다시 눌러 주세요.') }}</p>
            <div v-for="c in open[p.id].items" :key="c.id" class="event"><span class="board-name"><b>{{ c.name || tr('이름 없음') }}</b><small>{{ c.body }}</small></span></div>
            <p v-if="open[p.id].status === 'ready' && !open[p.id].items.length" class="input-field-help">{{ tr('아직 댓글이 없어요.') }}</p>
            <form class="board-reply" @submit.prevent="reply(p)">
              <label class="input-field">{{ tr('댓글') }}<input v-model="replies[p.id]" maxlength="20000" :placeholder="tr('응원 한마디를 남겨 보세요')" /></label>
              <button type="submit" class="button-secondary" :disabled="!!busy">{{ tr('댓글 남기기') }}</button>
            </form>
          </div>
        </section>
        <p v-if="!sorted.length" class="empty-state">{{ tr('아직 남긴 인증 글이 없어요. 위에서 첫 인증을 남겨 보세요.') }}</p>
      </template>
    </template>
  </template>
</template>

<style scoped>
.board-compose { display: grid; gap: var(--space-lg); margin-bottom: var(--space-xl); }
.board-compose .primary { justify-self: start; }
.board-message { margin: 0 0 var(--space-lg); }
.board-post { margin-bottom: var(--space-xl); }
.board-author { display: flex; flex-wrap: wrap; gap: var(--space-md); align-items: baseline; }
.board-author time { font-size: var(--type-caption-size); color: var(--color-muted); }
.board-actions { display: flex; flex-wrap: wrap; gap: var(--space-md); }
.board-comments { margin-top: var(--space-lg); }
.board-name { flex: 1; min-width: 0; }
.board-reply { display: flex; flex-wrap: wrap; gap: var(--space-md); align-items: flex-end; margin-top: var(--space-lg); }
.board-reply .input-field { flex: 1 1 200px; min-width: 0; }
</style>
