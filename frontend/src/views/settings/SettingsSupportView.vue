<script setup>
</script>

<template>
  <section class="card setting-content">
    <h2>고객지원</h2>
    <div class="section-label">자주 묻는 질문</div>
    <div class="trow"><b>데이터는 얼마나 안전하게 보관되나요?</b><span>›</span></div>
    <div class="trow"><b>플랜을 변경하고 싶어요</b><span>›</span></div>
    <div class="trow"><b>계정을 삭제하면 어떻게 되나요?</b><span>›</span></div>
    <div class="section-label">문의</div>
    <div class="trow"><b>1:1 문의하기</b><span style="color: var(--color-accent); font-weight: 700; font-size: 0.8125rem">문의하기</span></div>
    <router-link to="/legal" custom v-slot="{ navigate }"><div class="trow" @click="navigate" style="cursor: pointer"><b>이용약관 및 개인정보처리방침</b><span>›</span></div></router-link>
  </section>
</template>
