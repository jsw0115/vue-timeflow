<script setup>
import { bodyLocale, tr } from '../../store/locale'
import { modeText } from '../../features/i18n/locale.mjs'
import { computed, ref } from 'vue'
import { modeState, modeMeta, modeContent } from '../../store/modeProfiles'
import { session } from '../../features/auth/session.js'
import DueReminderSettings from '../../components/DueReminderSettings.vue'

const channels = ref([
  { id: 'push', title: '푸시 알림', desc: '앱과 브라우저 알림', on: true },
  { id: 'email', title: '이메일 알림', desc: '', on: false },
  { id: 'kakao', title: '카카오톡 알림톡', desc: '중요한 알림을 카카오톡으로 받아요', on: false },
])
const kakao = ref({ phone: '', verified: false, code: '', sending: false, notice: '', consent: false })
const kakaoChannel = computed(() => channels.value.find((c) => c.id === 'kakao'))
// 알림톡은 번호 인증과 수신 동의를 모두 마쳐야 켤 수 있다
const kakaoReady = computed(() => kakao.value.verified && kakao.value.consent)

function sendCode() {
  if (!/^01[0-9]-?\d{3,4}-?\d{4}$/.test(kakao.value.phone.trim())) {
    kakao.value.notice = '휴대폰 번호 형식을 확인해주세요. (예: 010-1234-5678)'
    return
  }
  kakao.value.sending = true
  // 알림톡 발송은 아직 연결되지 않았다(503 경계). 실제로 보낸 것처럼 안내하지 않는다
  kakao.value.notice = '시연 화면이에요. 실제 인증번호는 보내지 않아요. 4자리 이상 숫자를 넣으면 다음 단계를 볼 수 있어요.'
}
function verifyCode() {
  if (kakao.value.code.trim().length < 4) {
    kakao.value.notice = '인증번호 4자리 이상을 입력해주세요.'
    return
  }
  kakao.value.verified = true
  kakao.value.sending = false
  kakao.value.notice = '시연용 번호 확인을 마쳤어요. 실제 카카오톡 연결은 아직 준비 중이에요.'
}
function resetKakao() {
  kakao.value = { phone: '', verified: false, code: '', sending: false, notice: '', consent: false }
  if (kakaoChannel.value) kakaoChannel.value.on = false
}
function toggleChannel(c) {
  if (c.id === 'kakao' && !c.on && !kakaoReady.value) {
    kakao.value.notice = '번호 인증과 수신 동의를 먼저 완료해주세요.'
    return
  }
  c.on = !c.on
}
// 알림톡으로 보낼 수 있는 알림 유형 (정보성만 — 광고성은 별도 동의 대상이라 제외)
const KAKAO_TEMPLATES = [
  { id: 'dday', label: 'D-Day 알림', desc: '설정한 시점마다 남은 일수를 보내요' },
  { id: 'event', label: '일정 리마인더', desc: '시작 전에 일정 제목과 시간을 보내요' },
  { id: 'approval', label: '가입 승인 결과', desc: '그룹 가입이 승인·거절되면 알려요' },
]
const kakaoTemplates = ref({ dday: true, event: true, approval: false })

const defaults = modeContent(modeState.activeMode).notifications.defaults
const categories = ref([
  { title: '일정 리마인더', on: defaults['일정 리마인더'] ?? true },
  { title: '루틴 리마인더', on: defaults['루틴 리마인더'] ?? true },
  { title: '회고 작성 알림', on: defaults['회고 작성 알림'] ?? false },
  { title: '공유/초대 요청', on: true },
  { title: '커뮤니티 활동 (댓글·좋아요)', on: false },
  { title: '채팅 메시지', on: true },
  { title: '랭킹·챌린지 소식', on: false },
])
const dnd = ref({ on: true, from: '22:00', to: '07:00' })

/* 저장 — 모든 상태가 선언된 뒤에 스냅샷을 만든다(선언 전 참조 방지) */
function snapshot() {
  return JSON.stringify({
    channels: channels.value.map((c) => ({ id: c.id, on: c.on })),
    categories: categories.value.map((c) => ({ title: c.title, on: c.on })),
    templates: kakaoTemplates.value,
    dnd: dnd.value,
  })
}
const savedSnapshot = ref(snapshot())
const isDirty = computed(() => savedSnapshot.value !== snapshot())
const savedNotice = ref('')
function save() {
  savedSnapshot.value = snapshot()
  savedNotice.value = tr('이 화면에서만 바꿨어요. 계정에는 저장되지 않아요.')
  setTimeout(() => (savedNotice.value = ''), 2500)
}
</script>

<template>
  <section class="card setting-content">
    <h2>{{ tr('알림 설정') }}</h2>
    <!-- 마감 알림(Q-32)은 계정 설정에 바로 저장한다. 아래 채널·카테고리·방해 금지는 아직 이 화면의 예시다 -->
    <DueReminderSettings v-if="session.userId" />
    <p class="sample-label">{{ tr('아래 채널·카카오톡 알림톡·카테고리별 알림·방해 금지는 아직 저장되지 않는 예시예요. 실제 알림을 보내지 않아요.') }}</p>
    <div class="section-label">{{ tr('채널') }}</div>
    <div class="trow" v-for="c in channels" :key="c.id">
      <span style="flex: 1">
        <b style="display: block">{{ tr(c.title) }}</b>
        <!-- 이메일 채널은 시연 주소 대신 로그인한 계정 이메일을 보인다 -->
        <small style="color: var(--color-muted)">{{ c.id === 'email' ? (session.email || tr('로그인한 계정 이메일로 받아요')) : tr(c.desc) }}</small>
      </span>
      <button type="button" role="switch" class="toggle" :aria-label="tr(c.title)" :aria-checked="c.on" :class="{ on: c.on }" @click="toggleChannel(c)"><em></em></button>
    </div>

    <!-- 카카오톡 알림톡 설정 -->
    <div class="kakao-box">
      <div class="head">
        <div><b>{{ tr('카카오톡 알림톡 설정') }}</b><p style="margin: 4px 0 0">{{ tr('번호 인증과 수신 동의를 마치면 채널을 켤 수 있어요') }}</p></div>
        <span class="badge" :class="kakaoReady ? 'ok' : 'warn'">{{ kakaoReady ? tr('사용 가능') : tr('설정 필요') }}</span>
      </div>

      <template v-if="!kakao.verified">
        <div class="form-row" style="margin-top: 12px">
          <label style="flex: 1">{{ tr('휴대폰 번호') }}<input v-model="kakao.phone" placeholder="010-1234-5678" inputmode="tel" /></label>
          <button class="review" style="margin: 0; align-self: flex-end" @click="sendCode">{{ tr('인증번호 받기') }}</button>
        </div>
        <div class="form-row" v-if="kakao.sending">
          <label style="flex: 1">{{ tr('인증번호') }}<input v-model="kakao.code" :placeholder="tr('숫자 4~6자리')" inputmode="numeric" /></label>
          <button type="button" class="button-secondary" style="align-self: flex-end" @click="verifyCode">{{ tr('확인') }}</button>
        </div>
      </template>
      <template v-else>
        <div class="form-row" style="margin-top: 12px; align-items: center">
          <span class="badge ok">{{ tr('인증 완료 · {phone}', { phone: kakao.phone }) }}</span>
          <button class="review" style="margin: 0" @click="resetKakao">{{ tr('번호 변경') }}</button>
        </div>
      </template>

      <label class="task" style="border: 0; display: inline-flex;">
        <input type="checkbox" v-model="kakao.consent" />
        <span style="flex: 1"><b>{{ tr('알림톡 수신에 동의합니다') }}</b><small>{{ tr('정보성 알림만 보내며, 광고·마케팅 메시지는 보내지 않아요') }}</small></span>
      </label>

      <div class="section-label">{{ tr('알림톡으로 받을 알림') }}</div>
      <div class="trow" v-for="t in KAKAO_TEMPLATES" :key="t.id">
        <span style="flex: 1"><b style="display: block">{{ tr(t.label) }}</b><small style="color: var(--color-muted)">{{ tr(t.desc) }}</small></span>
        <button type="button" role="switch" class="toggle" :aria-label="tr(t.label)" :aria-checked="kakaoTemplates[t.id] && kakaoChannel.on" :class="{ on: kakaoTemplates[t.id] && kakaoChannel.on }" @click="kakaoTemplates[t.id] = !kakaoTemplates[t.id]"><em></em></button>
      </div>

      <p v-if="kakao.notice" class="badge warn" style="display: inline-block">{{ tr(kakao.notice) }}</p>
    </div>
    <div class="section-label">
      {{ tr('카테고리별 알림') }} <span class="badge new">{{ tr('보충 반영 · SET-004-F03') }}</span>
      <span class="form-note">{{ tr('{mode} 추천 기본값이 적용돼 있어요', { mode: modeText(modeState.activeMode, bodyLocale, modeMeta(modeState.activeMode)).name }) }}</span>
    </div>
    <div class="trow" v-for="c in categories" :key="c.title"><b>{{ tr(c.title) }}</b><button type="button" role="switch" class="toggle" :aria-label="tr('{name} 알림', { name: tr(c.title) })" :aria-checked="c.on" :class="{ on: c.on }" @click="c.on = !c.on"><em></em></button></div>
    <div class="section-label">{{ tr('방해 금지') }}</div>
    <label class="task" style="border: 0; display: inline-flex;">
      <input type="checkbox" v-model="dnd.on" />
      <span style="flex: 1"><b>{{ tr('방해 금지 시간 사용') }}</b><small>{{ tr('이 시간에는 알림을 보내지 않아요') }}</small></span>
    </label>
    <div class="form-row" v-if="dnd.on">
      <label style="flex: 1">{{ tr('시작') }}<input type="time" v-model="dnd.from" /></label>
      <label style="flex: 1">{{ tr('종료') }}<input type="time" v-model="dnd.to" /></label>
    </div>

    <button class="primary" :disabled="!isDirty" @click="save">{{ tr('저장하기') }}</button>
    <p v-if="savedNotice" class="badge ok" style="display: inline-block; margin-top: 8px">{{ savedNotice }}</p>
    <p v-else-if="isDirty" class="form-note">{{ tr('저장하지 않은 변경사항이 있어요.') }}</p>
  </section>
</template>
