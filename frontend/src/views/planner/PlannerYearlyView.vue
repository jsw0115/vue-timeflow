<script setup>
import { yearLabel, shift, goToday } from '../../store/plannerDate'
import { useRouter } from 'vue-router'

const router = useRouter()
const months = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월']
function cellColor(m, d) {
  const seed = (m * 7 + d * 3) % 5
  if (seed === 0) return '#2f5d46'
  if (seed === 1 || seed === 2) return '#c3d6c9'
  return 'var(--color-hairline)'
}
</script>

<template>
  <div class="toolbar">
    <button aria-label="이전 해" @click="shift('year', -1)">‹</button>
    <b>◑ {{ yearLabel }}</b>
    <button aria-label="다음 해" @click="shift('year', 1)">›</button>
    <button class="review" style="margin: 0; padding: 5px 10px" @click="goToday">올해</button>
    <span></span>
  </div>
  <div class="metrics">
    <article><span>올해 총 집중 시간</span><b>612h</b></article>
    <article><span>연간 평균 실행률</span><b>71<small>%</small></b></article>
    <article><span>완료한 D-Day</span><b>9<small>건</small></b></article>
    <article><span>최장 연속 기록</span><b>23<small>일</small></b></article>
  </div>
  <section class="card">
    <h3>월별 히트맵</h3>
    <div class="year-heatmap">
      <div class="year-month" v-for="(m, mi) in months" :key="m" :class="{ card: m === '8월' }">
        <small>{{ m }}{{ m === '8월' ? ' · 진행중' : '' }}</small>
        <div class="heat-cells mini">
          <i v-for="d in 14" :key="d" :style="{ background: cellColor(mi, d) }"></i>
        </div>
      </div>
    </div>
  </section>
</template>
