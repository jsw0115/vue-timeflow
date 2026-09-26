<script setup>
import { computed, ref } from 'vue'
import SubPageHeader from '../../components/SubPageHeader.vue'

const COMMUNITY_TABS = [
  { label: '커뮤니티 홈', path: '/community/home' },
  { label: '게시판', path: '/community/board' },
  { label: '챌린지', path: '/community/challenge' },
  { label: '멤버', path: '/community/members' },
  { label: '채팅', path: '/community/chat' },
]

/** 가입 신청 — 그룹이 요구하는 필수 항목을 모두 채워야 제출된다. */
const message = ref('아침 러닝을 꾸준히 하고 싶어서 신청합니다! 잘 부탁드려요 :)')
const goal = ref('')
const agreeRules = ref(false)
const sent = ref(false)
const GOALS = ['주 2회', '주 3회', '주 5회', '매일']

const canSubmit = computed(() => message.value.trim().length >= 10 && goal.value && agreeRules.value)
function submit() {
  if (!canSubmit.value) return
  sent.value = true
}
</script>

<template>
  <SubPageHeader title="가입 신청" parent="운동 갓생방 커뮤니티" fallback="/community/home" :tabs="COMMUNITY_TABS" />

  <div class="form-pattern">
    <section class="card form-card">
      <h2>운동 갓생방 가입 신청</h2>
      <p class="form-note" style="margin-top: 0">방장이 확인하는 항목이에요. 세 가지를 모두 채워야 신청할 수 있어요.</p>

      <label>가입 신청 메시지 <small style="color: var(--color-muted)">(10자 이상)</small>
        <textarea v-model="message" :disabled="sent"></textarea>
      </label>

      <label>인증 목표 <small style="color: var(--color-muted)">(필수)</small></label>
      <div class="filter" style="width: fit-content; margin-bottom: 12px">
        <button v-for="g in GOALS" :key="g" type="button" :class="{ selected: goal === g }" :disabled="sent" @click="goal = g">{{ g }}</button>
      </div>

      <label class="task" style="border: 0">
        <input type="checkbox" v-model="agreeRules" :disabled="sent" />
        <span style="flex: 1"><b>커뮤니티 규칙에 동의합니다</b><small>매일 인증 · 주 5회 이상 참여 · 응원 댓글 남기기</small></span>
      </label>

      <button class="primary" :disabled="!canSubmit || sent" @click="submit">{{ sent ? '신청 완료 · 승인 대기중' : '신청 보내기' }}</button>
      <p v-if="!canSubmit && !sent" class="form-note">메시지 10자 이상, 인증 목표 선택, 규칙 동의가 모두 필요해요.</p>
    </section>
  </div>

  <div style="display: flex; justify-content: center; margin-top: 16px">
    <section class="card chat-pattern" style="width: min(480px, 100%); height: auto; flex-direction: column">
      <div class="chat-room-head"><b>방장과의 대화 (자동 생성)</b></div>
      <div class="chat-bubbles" style="overflow: visible">
        <div class="bubble mine">{{ message }}</div>
        <div class="bubble">환영해요! 승인 검토 중입니다 :)</div>
        <span class="badge" :class="sent ? 'warn' : ''" style="align-self: center">{{ sent ? '대기중' : '아직 보내지 않음' }}</span>
      </div>
    </section>
  </div>
</template>
