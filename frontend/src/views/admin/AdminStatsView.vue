<script setup></script>

<template>
  <div class="admin-page-head">
    <div><h2>서비스 지표</h2><p>가입·활성·리텐션 추이를 확인해요</p></div>
  </div>
  <div class="metrics" style="grid-template-columns: repeat(4, 1fr); margin: 16px 0">
    <article><span>DAU</span><b style="font-size: 20px">4,820</b></article>
    <article><span>MAU</span><b style="font-size: 20px">18,204</b></article>
    <article><span>7일 리텐션</span><b style="font-size: 20px; color: var(--color-accent)">62%</b></article>
    <article><span>30일 리텐션</span><b style="font-size: 20px; color: #8a6a3c">38%</b></article>
  </div>
  <section class="card">
    <h3>최근 4주 DAU 추이</h3>
    <div class="chart">
      <div><i style="height: 55%"></i><small>3주 전</small></div>
      <div><i style="height: 62%"></i><small>2주 전</small></div>
      <div><i style="height: 58%"></i><small>1주 전</small></div>
      <div><b style="height: 74%"></b><small>이번주</small></div>
    </div>
  </section>
</template>
