<!-- 커뮤니티 챌린지. 만들기·참여(기록 공개 동의)·하루 인증(직접 또는 실제 기록)·참여 취소를 서버에 저장한다. 커뮤니티를 고르지 않았으면 내 커뮤니티를 보인다(PR-10 3b-2, Q-26). -->
<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import SubPageHeader from '../../components/SubPageHeader.vue'
import ShareSignIn from '../../components/share/ShareSignIn.vue'
import CommunityPicker from '../../components/community/CommunityPicker.vue'
import Modal from '../../components/Modal.vue'
import { session } from '../../features/auth/session.js'
import { challengeClient } from '../../features/community/community.js'
import { useCommunity } from '../../features/community/useCommunity.js'
import { challengeBody, challengeDraftError, challengeErrorText, challengePeriod, challengeRule, checkinState, emptyChallengeDraft, sessionsForCheckin } from '../../features/community/challengeClient.mjs'
import { localDate } from '../../utils/postValidation.mjs'

const router = useRouter()
const { id, community, status, isMember, tabs, load } = useCommunity()
const today = ref(localDate())
const list = ref([])
const listStatus = ref('idle')
const notice = ref('')
const error = ref('')
const busy = ref('')

const ORDER = { ongoing: 0, upcoming: 1, ended: 2 }
const sorted = computed(() => list.value
  .map((c) => ({ ...c, period: challengePeriod(c, today.value), state: checkinState(c, today.value) }))
  .sort((a, b) => ORDER[a.period.state] - ORDER[b.period.state] || String(b.startDate).localeCompare(String(a.startDate))))

async function loadList() {
  if (status.value !== 'ready' || !isMember.value) { list.value = []; listStatus.value = 'idle'; return }
  if (listStatus.value !== 'ready') listStatus.value = 'loading'
  today.value = localDate()
  try { list.value = (await challengeClient.list(id.value)) ?? []; listStatus.value = 'ready' } catch (e) { error.value = challengeErrorText(e); listStatus.value = 'error' }
}
watch(() => [status.value, isMember.value, id.value], loadList, { immediate: true })

async function run(key, task, done) {
  if (busy.value) return false
  busy.value = key
  notice.value = ''
  error.value = ''
  try { await task(); if (done) notice.value = done; return true } catch (e) { error.value = challengeErrorText(e); return false } finally { busy.value = '' }
}

function daysUntil(date) { return Math.round((new Date(`${date}T00:00:00`) - new Date(`${today.value}T00:00:00`)) / 86400000) }
function badge(c) {
  if (c.period.state === 'ended') return '끝남'
  if (c.period.state === 'upcoming') return `D-${daysUntil(c.period.start)} 시작`
  if (!c.joined) return '모집 중'
  return c.state === 'done' ? '오늘 인증함' : '참여 중'
}
const percent = (c) => Math.min(100, Math.round((c.myDays / c.days) * 100))
function clock(iso) {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// 만들기
const creating = ref(false)
const draft = ref(emptyChallengeDraft(localDate()))
const draftError = computed(() => challengeDraftError(draft.value))
const tried = ref(false)
function openCreate() { draft.value = emptyChallengeDraft(localDate()); tried.value = false; error.value = ''; creating.value = true }
async function create() {
  tried.value = true
  if (draftError.value) return
  if (await run('create', () => challengeClient.create(id.value, challengeBody(draft.value)), '챌린지를 만들었어요. 참여하기를 눌러 함께 시작하세요.')) { creating.value = false; await loadList() }
}

// 참여·참여 취소. 기록 공개 챌린지는 동의 창을 거친다.
const consentFor = ref(null)
const consent = ref(false)
function join(c) {
  if (c.openRecords) { consentFor.value = c; consent.value = false; error.value = ''; return }
  joinNow(c, false)
}
async function joinNow(c, agreed) {
  if (await run('join:' + c.id, () => challengeClient.join(id.value, c.id, agreed), '챌린지에 참여했어요.')) { consentFor.value = null; await loadList() }
}
async function leave(c) {
  const text = c.openRecords
    ? '참여를 취소할까요? 지금까지의 인증과 공개한 기록이 모두 지워지고 다른 회원에게 더 보이지 않아요.'
    : '참여를 취소할까요? 지금까지의 인증이 모두 지워져요.'
  if (!window.confirm(text)) return
  if (await run('leave:' + c.id, () => challengeClient.leave(id.value, c.id), '참여를 취소했어요.')) await loadList()
}

// 인증. 날짜를 고르고 직접 인증하거나 그날의 실제 기록을 붙인다.
const checking = ref(null)
const checkDate = ref('')
const sessions = ref([])
const sessionStatus = ref('idle')
const picked = ref('')
const candidates = computed(() => (checking.value ? sessionsForCheckin(sessions.value, checking.value, checkDate.value) : []))
const lastDate = computed(() => (checking.value && checking.value.period.end < today.value ? checking.value.period.end : today.value))
const recordOnly = computed(() => checking.value?.verify === 'record')
async function openCheckin(c) {
  checking.value = c
  checkDate.value = lastDate.value
  picked.value = ''
  error.value = ''
  sessionStatus.value = 'loading'
  try { sessions.value = (await challengeClient.recordings()) ?? []; sessionStatus.value = 'ready' } catch { sessions.value = []; sessionStatus.value = 'error' }
}
watch(checkDate, () => { picked.value = '' })
async function submitCheckin(withRecord) {
  if (withRecord && !picked.value) return
  const c = checking.value
  if (await run('checkin', () => challengeClient.checkin(id.value, c.id, checkDate.value, withRecord ? picked.value : ''), withRecord ? '실제 기록으로 인증했어요.' : '인증을 남겼어요.')) {
    checking.value = null
    await loadList()
  }
}
</script>

<template>
  <ShareSignIn v-if="!session.userId" message="챌린지는 커뮤니티 회원끼리 함께해요. 로그인하면 내 커뮤니티의 챌린지에 참여할 수 있어요." />
  <CommunityPicker v-else-if="!id" path="/community/challenge" intro="챌린지는 커뮤니티마다 따로 열려요. 챌린지를 볼 커뮤니티를 골라 주세요." />
  <p v-else-if="status === 'loading'" class="input-field-help" role="status">커뮤니티를 불러오는 중이에요.</p>
  <section v-else-if="status === 'missing'" class="card">
    <div class="empty-state" role="status"><p>커뮤니티를 찾을 수 없어요. 비공개이거나 없어진 커뮤니티일 수 있어요.</p><button type="button" class="button-secondary" @click="router.push('/community')">커뮤니티 목록으로</button></div>
  </section>
  <section v-else-if="status === 'error'" class="card">
    <div class="empty-state" role="status"><p>커뮤니티를 불러오지 못했어요. 연결을 확인하고 다시 시도해 주세요.</p><button type="button" class="button-secondary" @click="load">다시 시도</button></div>
  </section>
  <template v-else-if="community">
    <SubPageHeader title="챌린지" :parent="community.title" fallback="/community" :tabs="tabs" />
    <section v-if="!isMember" class="card">
      <div class="empty-state" role="status"><p>챌린지는 회원만 볼 수 있어요. 커뮤니티 홈에서 가입하면 챌린지에 참여할 수 있어요.</p><button type="button" class="button-secondary" @click="router.push({ path: '/community/home', query: { id } })">커뮤니티 홈으로</button></div>
    </section>
    <template v-else>
      <div class="challenge-tools">
        <p class="input-field-help">실제 기록 확인 챌린지는 플래너에서 '실제 기록'으로 시작하고 끝낸 기록만 인증으로 받아요.</p>
        <button type="button" class="primary" @click="openCreate">챌린지 만들기</button>
      </div>
      <p v-if="notice" class="input-field-help challenge-message" data-state="success" role="status">{{ notice }}</p>
      <p v-if="error && !creating && !checking && !consentFor" class="input-field-help challenge-message" data-state="error" role="alert">{{ error }}</p>

      <p v-if="listStatus === 'loading'" class="input-field-help" role="status">챌린지를 불러오는 중이에요.</p>
      <section v-else-if="listStatus === 'error'" class="card">
        <div class="empty-state" role="status"><p>챌린지를 불러오지 못했어요. 연결을 확인하고 다시 시도해 주세요.</p><button type="button" class="button-secondary" @click="loadList">다시 시도</button></div>
      </section>
      <template v-else>
        <section v-for="c in sorted" :key="c.id" class="card challenge" :class="{ ended: c.period.state === 'ended' }">
          <div class="challenge-head">
            <h3>{{ c.title }}</h3>
            <span class="tag">{{ badge(c) }}</span>
          </div>
          <p class="challenge-rule">{{ challengeRule(c) }}</p>
          <p class="challenge-meta"><span class="figure">{{ c.period.start }}</span> ~ <span class="figure">{{ c.period.end }}</span> · 참여 <span class="figure">{{ c.members }}</span>명</p>
          <p v-if="c.desc" class="challenge-desc">{{ c.desc }}</p>
          <template v-if="c.joined">
            <div class="progress" role="img" :aria-label="`${c.days}일 중 ${c.myDays}일 인증`"><em :style="{ width: percent(c) + '%' }"></em></div>
            <p class="challenge-meta"><span class="figure">{{ c.myDays }}</span> / <span class="figure">{{ c.days }}</span>일 인증</p>
          </template>
          <div class="challenge-actions">
            <button v-if="!c.joined && c.period.state !== 'ended'" type="button" class="button-secondary" :disabled="!!busy" @click="join(c)">참여하기</button>
            <button v-if="c.joined && c.period.state === 'ongoing'" type="button" class="button-secondary" :disabled="!!busy" @click="openCheckin(c)">인증하기</button>
            <button type="button" class="button-secondary" @click="router.push({ path: '/community/ranking', query: { id, challenge: c.id } })">랭킹·인증 내역</button>
            <button v-if="c.joined" type="button" class="button-secondary" :disabled="!!busy" @click="leave(c)">참여 취소</button>
          </div>
        </section>
        <p v-if="!sorted.length" class="empty-state">아직 열린 챌린지가 없어요. 위에서 첫 챌린지를 만들어 보세요.</p>
      </template>
    </template>
  </template>

  <Modal v-if="creating" title="챌린지 만들기" @close="creating = false">
    <form id="challenge-create" class="challenge-form" @submit.prevent="create">
      <label>챌린지 이름<input v-model="draft.title" maxlength="200" placeholder="예: 21일 아침 러닝" /></label>
      <label>설명<input v-model="draft.desc" maxlength="200" placeholder="함께할 규칙을 짧게 적어 주세요" /></label>
      <div class="form-row">
        <label>시작 날짜<input v-model="draft.startDate" type="date" /></label>
        <label>기간(일)<input v-model.number="draft.days" type="number" min="3" max="100" /></label>
      </div>
      <fieldset class="challenge-choice">
        <legend>인증 방식</legend>
        <label class="challenge-option"><input v-model="draft.verify" type="radio" value="self" /><span><b>직접 인증</b><small>하루 한 번 인증 버튼을 눌러요. 원하면 실제 기록을 붙여 확인받을 수 있어요.</small></span></label>
        <label class="challenge-option"><input v-model="draft.verify" type="radio" value="record" /><span><b>실제 기록으로 확인</b><small>실시간으로 시작하고 끝낸 실제 기록만 받아요. 나중에 적은 시간은 쓸 수 없어요.</small></span></label>
      </fieldset>
      <template v-if="draft.verify === 'record'">
        <label>최소 기록 시간(분)<input v-model.number="draft.minMinutes" type="number" min="1" max="600" /></label>
        <label class="challenge-option"><input v-model="draft.useWindow" type="checkbox" /><span><b>인증 시간대 정하기</b><small>그 시간대 안에서 기록한 분만 셉니다.</small></span></label>
        <div v-if="draft.useWindow" class="form-row">
          <label>시작<input v-model="draft.windowStart" type="time" /></label>
          <label>끝<input v-model="draft.windowEnd" type="time" /></label>
        </div>
        <label class="challenge-option"><input v-model="draft.openRecords" type="checkbox" /><span><b>기록 공개 챌린지</b><small>참여자는 기록 제목·시작과 끝 시각·분을 회원에게 보이는 데 동의해야 참여할 수 있어요.</small></span></label>
      </template>
      <p class="input-field-help" :data-state="tried && draftError ? 'error' : undefined" role="status">{{ tried && draftError ? draftError : '만든 뒤에는 규칙을 바꿀 수 없어요.' }}</p>
      <p v-if="error" class="input-field-help" data-state="error" role="alert">{{ error }}</p>
    </form>
    <template #footer>
      <button type="button" class="button-secondary" @click="creating = false">취소</button>
      <button type="submit" form="challenge-create" class="primary" :disabled="busy === 'create'" :aria-busy="busy === 'create' ? 'true' : undefined">{{ busy === 'create' ? '만드는 중' : '챌린지 만들기' }}</button>
    </template>
  </Modal>

  <Modal v-if="consentFor" title="기록 공개 동의" @close="consentFor = null">
    <p><b>{{ consentFor.title }}</b>은 기록 공개 챌린지예요. 인증에 쓴 실제 기록의 제목, 시작과 끝 시각, 기록한 분이 이 커뮤니티 회원에게 보여요.</p>
    <p>참여를 취소하면 지금까지의 인증과 공개한 기록이 바로 지워져요.</p>
    <label class="challenge-option"><input v-model="consent" type="checkbox" /><span><b>위 내용에 동의해요</b></span></label>
    <p v-if="error" class="input-field-help" data-state="error" role="alert">{{ error }}</p>
    <template #footer>
      <button type="button" class="button-secondary" @click="consentFor = null">취소</button>
      <button type="button" class="primary" :disabled="!consent || !!busy" :aria-busy="busy ? 'true' : undefined" @click="joinNow(consentFor, true)">{{ busy ? '참여하는 중' : '동의하고 참여하기' }}</button>
    </template>
  </Modal>

  <Modal v-if="checking" :title="checking.title + ' 인증'" @close="checking = null">
    <label>인증 날짜<input v-model="checkDate" type="date" :min="checking.period.start" :max="lastDate" /></label>
    <p class="input-field-help">{{ challengeRule(checking) }}</p>
    <fieldset class="challenge-choice">
      <legend>{{ recordOnly ? '인증에 쓸 실제 기록' : '붙일 실제 기록(선택)' }}</legend>
      <p v-if="sessionStatus === 'loading'" class="input-field-help" role="status">실제 기록을 불러오는 중이에요.</p>
      <p v-else-if="sessionStatus === 'error'" class="input-field-help" data-state="error" role="alert">실제 기록을 불러오지 못했어요. 창을 닫고 다시 열어 주세요.</p>
      <template v-else>
        <label v-for="s in candidates" :key="s.id" class="challenge-option" :class="{ off: !s.eligible }">
          <input v-model="picked" type="radio" name="challenge-session" :value="s.id" :disabled="!s.eligible" />
          <span><b>{{ s.title || '제목 없는 기록' }}</b><small><span class="figure">{{ clock(s.startedAt) }}~{{ clock(s.endedAt) }}</span> · {{ checking.windowStart ? '시간대 안 ' : '' }}<span class="figure">{{ s.minutes }}</span>분{{ s.eligible ? '' : ` · ${s.need}분 이상이어야 해요` }}</small></span>
        </label>
        <div v-if="!candidates.length" class="challenge-none">
          <p class="input-field-help">이 날짜에 쓸 수 있는 실제 기록이 없어요. 플래너에서 '실제 기록'을 시작하고 끝내면 여기에 보여요.</p>
          <button type="button" class="button-secondary" @click="router.push('/planner/daily')">플래너 열기</button>
        </div>
      </template>
    </fieldset>
    <p v-if="error" class="input-field-help" data-state="error" role="alert">{{ error }}</p>
    <template #footer>
      <button type="button" class="button-secondary" @click="checking = null">취소</button>
      <button v-if="!recordOnly" type="button" :class="picked ? 'button-secondary' : 'primary'" :disabled="!!busy" @click="submitCheckin(false)">직접 인증하기</button>
      <button type="button" :class="picked || recordOnly ? 'primary' : 'button-secondary'" :disabled="!picked || !!busy" :aria-busy="busy === 'checkin' ? 'true' : undefined" @click="submitCheckin(true)">{{ busy === 'checkin' ? '인증하는 중' : '기록으로 인증하기' }}</button>
    </template>
  </Modal>
</template>

<style scoped>
.challenge-tools { display: flex; flex-wrap: wrap; gap: var(--space-lg); align-items: center; justify-content: space-between; margin-bottom: var(--space-xl); }
.challenge-tools .input-field-help { flex: 1 1 260px; margin: 0; }
.challenge-message { margin: 0 0 var(--space-lg); }
.challenge { margin-bottom: var(--space-xl); }
.challenge.ended { background: var(--color-surface); box-shadow: none; }
.challenge-head { display: flex; flex-wrap: wrap; gap: var(--space-md); align-items: baseline; justify-content: space-between; }
.challenge-head h3 { margin: 0; word-break: keep-all; }
.challenge-rule { margin: var(--space-sm) 0 0; font-weight: 600; }
.challenge-meta { margin: var(--space-xs) 0 0; color: var(--color-muted); }
.challenge.ended .challenge-meta { color: var(--color-foreground); }
.challenge-desc { margin: var(--space-md) 0 0; }
.challenge-actions { display: flex; flex-wrap: wrap; gap: var(--space-md); margin-top: var(--space-lg); }
.challenge-form { display: grid; gap: var(--space-lg); }
.challenge-form .form-row > label { flex: 1 1 140px; min-width: 0; }
.challenge-choice { border: 0; padding: 0; margin: var(--space-lg) 0 0; display: grid; gap: var(--space-md); min-width: 0; }
.challenge-choice legend { font-weight: 600; margin-bottom: var(--space-sm); }
.challenge-option { display: flex; gap: var(--space-md); align-items: flex-start; font-weight: 400; }
.challenge-option input { flex: none; width: auto; margin-top: var(--space-xs); }
.challenge-option span { display: grid; gap: var(--space-xs); min-width: 0; }
.challenge-option small { color: var(--color-muted); }
.challenge-option.off { opacity: var(--opacity-disabled); cursor: not-allowed; }
.challenge-none { display: grid; gap: var(--space-md); justify-items: start; }
</style>
