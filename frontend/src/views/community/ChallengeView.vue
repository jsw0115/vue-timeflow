<script setup>
import { computed, ref } from 'vue'
import { challenges, finishedChallenges as finished, communities, joinedCommunities } from '../../store/communities'
import { challengeError, localDate } from '../../utils/postValidation.mjs'
import TagMentionInput from '../../components/TagMentionInput.vue'
import RichText from '../../components/RichText.vue'
import { syncPostCollection } from '../../store/tagging'
import Modal from '../../components/Modal.vue'


const ongoing = computed(() => challenges.value.filter((c) => c.doneDays < c.days))
function startDays(c) {
  return c.startDate ? Math.max(0, Math.round((new Date(c.startDate + 'T00:00:00') - new Date(localDate() + 'T00:00:00')) / 86400000)) : c.startsIn
}
function progress(c) {
  return Math.round((c.doneDays / c.days) * 100)
}
function join(c) {
  if (c.joined) return
  c.joined = true
  c.members += 1
}
function checkIn(c) {
  if (!c.joined || startDays(c) > 0 || c.lastCheckIn === localDate() || c.doneDays >= c.days) return
  c.lastCheckIn = localDate()
  c.doneDays += 1
  if (c.doneDays >= c.days) {
    finished.value.unshift({ id: c.id, title: c.title, result: '완주 · 뱃지 획득' })
    challenges.value = challenges.value.filter((x) => x.id !== c.id)
  }
}
function leave(c) {
  c.joined = false
  c.members = Math.max(0, c.members - 1)
}

const showCreate = ref(false)
const draft = ref({ title: '', desc: '', days: 21, startsIn: 0, communityId: '' })
const createError = computed(() => challengeError(draft.value, communities.value))
const communityName = id => communities.value.find(c => c.id === id)?.title ?? '커뮤니티 미지정 (샘플)'
function openCreate() { draft.value.communityId = joinedCommunities.value[0]?.id ?? ''; showCreate.value = true }
function createChallenge() {
  if (createError.value) return
  const start = new Date()
  start.setDate(start.getDate() + draft.value.startsIn)
  challenges.value.unshift({
    startDate: localDate(start),
    id: Math.max(0, ...challenges.value.map((c) => c.id), ...finished.value.map(c => c.id)) + 1,
    communityId: draft.value.communityId,
    title: draft.value.title.trim(),
    desc: draft.value.desc.trim() || draft.value.days + '일 동안 매일 인증해요',
    days: draft.value.days,
    doneDays: 0,
    members: 1,
    joined: true,
    startsIn: draft.value.startsIn,
  })
  syncPostCollection('challenge', challenges.value, '챌린지', '/community/challenge')
  draft.value = { title: '', desc: '', days: 21, startsIn: 0, communityId: '' }
  showCreate.value = false
}
</script>

<template>
  <div class="page-tools">
    <b style="font-size: 1rem">진행중인 챌린지</b>
    <span></span>
    <button class="primary" @click="openCreate">+ 챌린지 만들기</button>
  </div>

  <div class="comm-grid" style="grid-template-columns: 1fr 1fr">
    <section class="card" v-for="c in ongoing" :key="c.id">
      <div class="head">
        <b>{{ c.title }}</b>
        <span class="badge" :class="c.joined ? 'ok' : 'warn'">{{ c.joined ? '참여중' : startDays(c) ? 'D-' + startDays(c) + ' 시작' : '모집중' }}</span>
      </div>
      <p class="tag">{{ communityName(c.communityId) }}</p><p><RichText :text="c.desc" /></p>
      <div class="progress"><em :style="{ width: progress(c) + '%' }"></em></div>
      <p class="figure">{{ c.doneDays }}/{{ c.days }}일 완료 · 참여자 {{ c.members }}명</p>
      <div class="form-row" style="margin-top: 10px">
        <button v-if="!c.joined" class="primary" style="flex: 1" @click="join(c)">참여 신청하기</button>
        <template v-else>
          <button class="primary" style="flex: 1"  :disabled="startDays(c) > 0 || c.lastCheckIn === localDate()" @click="checkIn(c)">{{ c.lastCheckIn === localDate() ? '오늘 인증 완료' : '오늘 인증하기' }}</button>
          <button class="review" style="margin: 0" @click="leave(c)">참여 취소</button>
        </template>
      </div>
    </section>
    <p v-if="!ongoing.length" class="form-note">진행중인 챌린지가 없어요. 새로 만들어보세요.</p>
  </div>

  <section class="card" style="margin-top: 16px">
    <h3>완료한 챌린지</h3>
    <div class="event" v-for="f in finished" :key="f.id" style="border-bottom: none">
      <span style="flex: 1">{{ f.title }}</span><small>{{ f.result }}</small>
    </div>
    <p v-if="!finished.length" class="form-note" style="margin: 0">아직 완주한 챌린지가 없어요.</p>
  </section>

  <Modal v-if="showCreate" title="챌린지 만들기" @close="showCreate = false">
    <label>참여 중인 커뮤니티<select v-model="draft.communityId"><option disabled value="">커뮤니티 선택</option><option v-for="g in joinedCommunities" :key="g.id" :value="g.id">{{ g.title }}</option></select></label>
    <p v-if="!joinedCommunities.length" class="form-note">먼저 커뮤니티에 가입하거나 새로 만들어주세요.</p>
    <label>챌린지 이름<input v-model="draft.title" placeholder="예: 30일 독서 챌린지" autofocus @keyup.enter="createChallenge" /></label>
    <label>설명 · 태그 · 멘션<TagMentionInput v-model="draft.desc" /></label>
    <div class="form-row">
      <label style="flex: 1">기간(일)<input type="number" min="3" max="100" v-model.number="draft.days" /></label>
      <label style="flex: 1">시작까지(일)<input type="number" min="0" max="30" v-model.number="draft.startsIn" /></label>
    </div>
    <p class="form-note">만들면 바로 참여 상태가 되고, 매일 “오늘 인증하기”로 진행률이 올라가요.</p>
    <p class="form-note" role="status">{{ createError }}</p>
    <button class="primary" :disabled="!!createError" @click="createChallenge">챌린지 만들기</button>
  </Modal>
</template>
