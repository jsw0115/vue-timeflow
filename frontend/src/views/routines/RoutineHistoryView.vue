<script setup>
const done = Array.from({ length: 84 }, (_, i) => ![2, 10, 16, 21].includes(i))
</script>

<template>
  <div class="crumbs">아침 스트레칭 · 매일 07:00 · 지난 12주</div>
  <div class="metrics" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 16px">
    <article><span>달성률</span><b>86<small>%</small></b></article>
    <article><span>현재 연속</span><b>12<small>일</small></b></article>
    <article><span>최장 연속</span><b>28<small>일</small></b></article>
  </div>
  <section class="card heatmap-pattern">
    <div class="head">
      <h3>수행 이력</h3>
      <div class="legend">미수행 <i style="background: var(--color-surface)"></i><i style="background: var(--color-accent)"></i> 수행</div>
    </div>
    <div class="heat-cells streak">
      <i v-for="(d, i) in done" :key="i" :class="{ done: d }"></i>
    </div>
  </section>
</template>
