<script setup>
// 루틴 수행 이력 화면. 지금은 수치와 칸이 모두 시연용 예시라 화면 위에 예시라고 밝힌다(계정 기록으로 계산하지 않음).
import { tr, unit } from '../../store/locale'
const done = Array.from({ length: 84 }, (_, i) => ![2, 10, 16, 21].includes(i))
</script>

<template>
  <p class="sample-label">{{ tr('이 화면의 루틴 기록은 시연용 예시 데이터예요. 계정 기록으로 계산하지 않아요.') }}</p>
  <div class="crumbs">{{ tr('아침 스트레칭 · 매일 07:00 · 지난 12주') }}</div>
  <div class="metrics" style="--metric-cols: 3; margin-bottom: 16px">
    <article><span>{{ tr('달성률') }}</span><b>86<small>%</small></b></article>
    <article><span>{{ tr('현재 연속') }}</span><b>12<small>{{ unit('일') }}</small></b></article>
    <article><span>{{ tr('최장 연속') }}</span><b>28<small>{{ unit('일') }}</small></b></article>
  </div>
  <section class="card heatmap-pattern">
    <div class="head">
      <h3>{{ tr('수행 이력') }}</h3>
      <div class="legend">{{ tr('미수행') }} <i style="background: var(--color-surface)"></i><i style="background: var(--color-data)"></i> {{ tr('수행') }}</div>
    </div>
    <div class="heat-cells streak">
      <i v-for="(d, i) in done" :key="i" :class="{ done: d }"></i>
    </div>
  </section>
</template>
