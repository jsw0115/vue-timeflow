<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const tab = ref('개인정보처리방침')

/** 확인 후 이전 화면으로 — 히스토리가 없으면 홈으로 */
function close() {
  if (window.history.state?.back) router.back()
  else router.push('/')
}
</script>

<template>
  <div class="auth-page" style="align-items: flex-start">
    <div class="legal-doc">
      <div class="legal-doc-head">
        <div style="display: flex; align-items: center; gap: 12px">
          <span style="cursor: pointer" @click="router.back()">←</span>
          <div>
            <p class="eyebrow" style="margin: 0">약관/정책 뷰어</p>
            <h1 style="font-size: 1.0625rem; margin-top: 4px">{{ tab }}</h1>
          </div>
          <small style="margin-left: auto; color: var(--color-muted)">v2.3 · 2026.06.01 시행</small>
        </div>
        <div class="filter" style="margin-top: 14px; width: fit-content">
          <button :class="{ selected: tab === '개인정보처리방침' }" @click="tab = '개인정보처리방침'">개인정보처리방침</button>
          <button :class="{ selected: tab === '이용약관' }" @click="tab = '이용약관'">이용약관</button>
          <button :class="{ selected: tab === '오픈소스 라이선스' }" @click="tab = '오픈소스 라이선스'">오픈소스 라이선스</button>
        </div>
      </div>
      <div class="legal-doc-body">
        <h3>1. 수집하는 개인정보 항목</h3>
        <p>타임바 다이어리(이하 "회사")는 회원가입, 서비스 이용 과정에서 다음과 같은 정보를 수집합니다: 이메일, 닉네임, 프로필 사진(선택), 서비스 이용 기록, 접속 로그.</p>
        <h3>2. 개인정보의 수집 및 이용 목적</h3>
        <p>회사는 수집한 개인정보를 다음의 목적을 위해 활용합니다: 회원 관리, 서비스 제공 및 개선, 신규 서비스 개발, 고객 문의 대응.</p>
        <h3>3. 개인정보의 보유 및 이용 기간</h3>
        <p>회원 탈퇴 시 즉시 파기하는 것을 원칙으로 하되, 관계 법령에 따라 일정 기간 보관이 필요한 정보는 해당 기간 동안 보관합니다.</p>
        <h3>4. 개정 이력</h3>
        <p>2026.06.01 v2.3 — 커뮤니티 기능 관련 조항 추가 · 2026.01.15 v2.2 — 최초 시행</p>
      </div>
      <div style="padding: 20px 32px; border-top: 1px solid var(--color-hairline); background: var(--color-surface)">
        <button class="primary" style="width: 100%" @click="close">확인했어요</button>
      </div>
    </div>
  </div>
</template>
