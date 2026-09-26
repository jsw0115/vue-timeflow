<script setup>
import { computed, ref } from 'vue'

/** 카테고리 통계 — 탭을 고르면 추이 그래프와 지표가 함께 바뀐다. */
const CATS = [
  { label: '업무', avgMin: 1100, series: [90, 80, 95, 60, 70, 40, 55, 30, 45], change: 12 },
  { label: '공부', avgMin: 370, series: [40, 55, 45, 70, 60, 75, 65, 80, 72], change: 8 },
  { label: '건강', avgMin: 280, series: [30, 35, 50, 45, 60, 55, 70, 62, 75], change: 21 },
  { label: '휴식', avgMin: 425, series: [70, 65, 60, 68, 55, 62, 58, 66, 60], change: -4 },
]

const active = ref('업무')
const current = computed(() => CATS.find((c) => c.label === active.value))

/** 시리즈를 SVG polyline 좌표로 바꾼다(값이 클수록 위로) */
const points = computed(() =>
  current.value.series.map((v, i) => (i * 400) / (current.value.series.length - 1) + ',' + (150 - (v / 100) * 130)).join(' '),
)
const peak = computed(() => Math.max(...current.value.series))
const low = computed(() => Math.min(...current.value.series))

function hm(min) {
  return Math.floor(min / 60) + 'h ' + String(min % 60).padStart(2, '0') + 'm'
}
</script>

<template>
  <div class="crumbs">최근 8주 · 카테고리별 추이</div>

  <section class="card" style="margin-bottom: 16px">
    <div class="filter" style="width: fit-content; margin-bottom: 16px">
      <button v-for="c in CATS" :key="c.label" :class="{ selected: active === c.label }" @click="active = c.label">{{ c.label }}</button>
    </div>

    <div class="head">
      <div>
        <h3 style="margin: 0">{{ current.label }} 시간 추이</h3>
        <p style="margin: 4px 0 0">주 평균 {{ hm(current.avgMin) }}</p>
      </div>
      <span class="badge" :class="current.change >= 0 ? 'ok' : 'warn'">
        지난 기간 대비 {{ current.change >= 0 ? '+' : '' }}{{ current.change }}%
      </span>
    </div>

    <svg viewBox="0 0 400 150" style="width: 100%; height: 190px">
      <polyline :points="points" fill="none" stroke="var(--color-accent)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
      <circle
        v-for="(v, i) in current.series"
        :key="i"
        :cx="(i * 400) / (current.series.length - 1)"
        :cy="150 - (v / 100) * 130"
        r="3.5"
        fill="var(--color-canvas)"
        stroke="var(--color-accent)"
        stroke-width="2"
      />
    </svg>
  </section>

  <div class="metrics">
    <article><span>{{ current.label }} 주 평균</span><b class="figure">{{ hm(current.avgMin) }}</b></article>
    <article><span>최대 주</span><b class="figure">{{ peak }}<small>%</small></b><small>목표 대비</small></article>
    <article><span>최소 주</span><b class="figure">{{ low }}<small>%</small></b><small>목표 대비</small></article>
    <article><span>변화</span><b class="figure">{{ current.change >= 0 ? '+' : '' }}{{ current.change }}<small>%</small></b></article>
  </div>

  <section class="card" style="margin-top: 16px">
    <h3>카테고리 비교</h3>
    <div v-for="c in CATS" :key="c.label" class="rate-row">
      <button class="cat-compare" :class="{ selected: active === c.label }" @click="active = c.label">{{ c.label }}</button>
      <div class="progress"><em :style="{ width: (c.avgMin / 1100) * 100 + '%' }"></em></div>
      <b class="figure">{{ hm(c.avgMin) }}</b>
    </div>
  </section>
</template>
