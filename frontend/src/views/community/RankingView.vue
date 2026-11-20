<!-- 챌린지 인증 랭킹과 인증 내역. 인증 일수와 실제 기록으로 확인한 일수로 순위를 매기고, 회원이 서로의 인증 방식을 점검할 수 있게 한다. 개인 기록은 집계하지 않는다(PR-10 3b-2, Q-26). -->
<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SubPageHeader from '../../components/SubPageHeader.vue'
import ShareSignIn from '../../components/share/ShareSignIn.vue'
import CommunityPicker from '../../components/community/CommunityPicker.vue'
import { session } from '../../features/auth/session.js'
import { challengeClient } from '../../features/community/community.js'
import { useCommunity } from '../../features/community/useCommunity.js'
import { challengeErrorText, challengeRule, rankRows } from '../../features/community/challengeClient.mjs'

const route = useRoute()
const router = useRouter()
const { id, community, status, isMember, tabs, load } = useCommunity()
const challengeId = computed(() => String(route.query.challenge ?? ''))
const challenges = ref([])
const ranking = ref([])
const checkins = ref([])
const who = ref('')
const dataStatus = ref('idle')
const logStatus = ref('idle')
const error = ref('')

const current = computed(() => challenges.value.find((c) => c.id === challengeId.value) ?? null)
const rows = computed(() => rankRows(ranking.value, session.userId))

async function loadChallenges() {
  if (status.value !== 'ready' || !isMember.value) { challenges.value = []; dataStatus.value = 'idle'; return }
  dataStatus.value = 'loading'
  try {
    challenges.value = (await challengeClient.list(id.value)) ?? []
    if (challengeId.value && challenges.value.some((c) => c.id === challengeId.value)) {
      ranking.value = (await challengeClient.ranking(id.value, challengeId.value)) ?? []
      await loadLog()
    } else { ranking.value = []; checkins.value = [] }
    dataStatus.value = 'ready'
  } catch (e) { error.value = challengeErrorText(e); dataStatus.value = 'error' }
}
async function loadLog() {
  logStatus.value = 'loading'
  try { checkins.value = (await challengeClient.checkins(id.value, challengeId.value, who.value)) ?? []; logStatus.value = 'ready' } catch (e) { error.value = challengeErrorText(e); logStatus.value = 'error' }
}
watch(() => [status.value, isMember.value, id.value, challengeId.value], () => { who.value = ''; loadChallenges() }, { immediate: true })
watch(who, () => { if (current.value) loadLog() })

function pick(event) { router.push({ path: '/community/ranking', query: { id: id.value, ...(event.target.value ? { challenge: event.target.value } : {}) } }) }
function clock(iso) {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
</script>

<template>
  <ShareSignIn v-if="!session.userId" message="랭킹은 커뮤니티 챌린지 참여자끼리 봐요. 로그인하면 내 커뮤니티의 챌린지 랭킹을 볼 수 있어요." />
  <CommunityPicker v-else-if="!id" path="/community/ranking" intro="랭킹은 챌린지마다 따로 매겨요. 랭킹을 볼 커뮤니티를 골라 주세요." />
  <p v-else-if="status === 'loading'" class="input-field-help" role="status">커뮤니티를 불러오는 중이에요.</p>
  <section v-else-if="status === 'missing'" class="card">
    <div class="empty-state" role="status"><p>커뮤니티를 찾을 수 없어요. 비공개이거나 없어진 커뮤니티일 수 있어요.</p><button type="button" class="button-secondary" @click="router.push('/community')">커뮤니티 목록으로</button></div>
  </section>
  <section v-else-if="status === 'error'" class="card">
    <div class="empty-state" role="status"><p>커뮤니티를 불러오지 못했어요. 연결을 확인하고 다시 시도해 주세요.</p><button type="button" class="button-secondary" @click="load">다시 시도</button></div>
  </section>
  <template v-else-if="community">
    <SubPageHeader title="챌린지 랭킹" :parent="community.title" fallback="/community" :tabs="tabs" />
    <section v-if="!isMember" class="card">
      <div class="empty-state" role="status"><p>랭킹은 회원만 볼 수 있어요. 커뮤니티 홈에서 가입하면 챌린지 랭킹을 볼 수 있어요.</p><button type="button" class="button-secondary" @click="router.push({ path: '/community/home', query: { id } })">커뮤니티 홈으로</button></div>
    </section>
    <p v-else-if="dataStatus === 'loading'" class="input-field-help" role="status">챌린지를 불러오는 중이에요.</p>
    <section v-else-if="dataStatus === 'error'" class="card">
      <div class="empty-state" role="status"><p>{{ error }}</p><button type="button" class="button-secondary" @click="loadChallenges">다시 시도</button></div>
    </section>
    <template v-else-if="dataStatus === 'ready'">
      <div v-if="!challenges.length" class="card empty-state"><p>아직 열린 챌린지가 없어요. 챌린지 탭에서 첫 챌린지를 만들어 보세요.</p><button type="button" class="button-secondary" @click="router.push({ path: '/community/challenge', query: { id } })">챌린지로 가기</button></div>
      <template v-else>
        <label class="ranking-pick">챌린지
          <select :value="challengeId" @change="pick">
            <option value="">챌린지를 골라 주세요</option>
            <option v-for="c in challenges" :key="c.id" :value="c.id">{{ c.title }}</option>
          </select>
        </label>
        <p v-if="!current" class="empty-state" role="status">아직 고른 챌린지가 없어요. 위 목록에서 랭킹을 볼 챌린지를 골라 주세요.</p>
        <template v-else>
          <p class="ranking-rule"><b>{{ challengeRule(current) }}</b> · <span class="figure">{{ current.days }}</span>일</p>
          <p class="input-field-help">순위는 인증한 날 수로 매기고, 같으면 실제 기록으로 확인한 날이 많은 쪽이 앞서요. 개인 기록은 집계하지 않아요.</p>

          <section class="card ranking">
            <h3>순위</h3>
            <div v-for="r in rows" :key="r.userId" class="event ranking-row" :class="{ mine: r.me }">
              <b class="figure ranking-rank">{{ r.rank }}</b>
              <span class="ranking-name">{{ r.nickname || '이름 없음' }}<small v-if="r.me"> · 나</small></span>
              <span class="ranking-count"><b class="figure">{{ r.doneDays }}</b>일 인증<small> · 기록 확인 <span class="figure">{{ r.verifiedDays }}</span>일</small></span>
            </div>
            <p v-if="!rows.length" class="empty-state">아직 참여한 회원이 없어요. 챌린지 탭에서 참여하면 순위에 보여요.</p>
          </section>

          <section class="card ranking">
            <div class="ranking-log-head">
              <h3>인증 내역</h3>
              <label class="ranking-pick">참여자
                <select v-model="who">
                  <option value="">모두</option>
                  <option v-for="r in rows" :key="r.userId" :value="r.userId">{{ r.nickname || '이름 없음' }}</option>
                </select>
              </label>
            </div>
            <p class="input-field-help">{{ current.openRecords ? '기록 공개에 동의한 참여자의 기록 제목과 시각이 보여요.' : '다른 회원에게는 인증한 날과 방식만 보여요. 기록 제목과 시각은 본인에게만 보여요.' }}</p>
            <p v-if="logStatus === 'loading'" class="input-field-help" role="status">인증 내역을 불러오는 중이에요.</p>
            <p v-else-if="logStatus === 'error'" class="input-field-help" data-state="error" role="alert">{{ error }}</p>
            <template v-else>
              <div v-for="c in checkins" :key="c.userId + c.date" class="event ranking-row">
                <span class="figure ranking-date">{{ c.date }}</span>
                <span class="ranking-name">{{ c.nickname || '이름 없음' }}</span>
                <span class="tag">{{ c.method === 'record' ? '기록 확인' : '직접 인증' }}</span>
                <small v-if="c.startedAt" class="ranking-detail"><span class="figure">{{ clock(c.startedAt) }}~{{ clock(c.endedAt) }}</span> · <span class="figure">{{ c.minutes }}</span>분<template v-if="c.title"> · {{ c.title }}</template></small>
              </div>
              <p v-if="!checkins.length" class="empty-state" role="status">아직 남긴 인증이 없어요. 챌린지 탭에서 인증하면 여기에 쌓여요.</p>
            </template>
          </section>
        </template>
      </template>
    </template>
  </template>
</template>

<style scoped>
.ranking-pick { display: inline-flex; flex-wrap: wrap; gap: var(--space-md); align-items: center; font-weight: 600; margin-bottom: var(--space-lg); }
.ranking-pick select { min-width: 0; max-width: 100%; }
.ranking-rule { margin: 0 0 var(--space-xs); }
.ranking { margin-top: var(--space-xl); }
.ranking h3 { margin: 0 0 var(--space-md); }
.ranking-log-head { display: flex; flex-wrap: wrap; gap: var(--space-md); align-items: baseline; justify-content: space-between; }
.ranking-row { flex-wrap: wrap; gap: var(--space-md); align-items: baseline; }
/* 전역 .event span(grid)이 숫자 span을 따로 줄에 세우지 않게 안쪽 span은 글자 흐름에 둔다 */
.ranking-row span { display: inline; }
.ranking-row.mine { font-weight: 600; }
.ranking-rank { width: 2ch; }
.ranking-name { flex: 1 1 120px; min-width: 0; }
.ranking-name small, .ranking-count small, .ranking-detail { color: var(--color-muted); }
.ranking-detail { flex-basis: 100%; }
</style>
