<script setup>
import { monthLabel, monthGrid, shift, goToday } from '../../store/plannerDate'
import { useRouter } from 'vue-router'

const router = useRouter()
// 8월 1일은 토요일 기준 목업 데이터: 앞뒤 다른 달 날짜는 회색으로 표시
</script>

<template>
  <div class="toolbar">
    <button aria-label="이전 달" @click="shift('month', -1)">‹</button>
    <b>▥ {{ monthLabel }}</b>
    <button aria-label="다음 달" @click="shift('month', 1)">›</button>
    <button class="review" style="margin: 0; padding: 5px 10px" @click="goToday">이번 달</button>
    <span></span>
    <button @click="router.push('/planner')">일간</button>
    <button @click="router.push('/planner/weekly')">주간</button>
    <button class="selected">월간</button>
    <button @click="router.push('/planner/yearly')">연간</button>
  </div>
  <div class="planner">
    <section class="card">
      <div class="head">
        <div><h3>계획 대비 실행 히트맵</h3><p>색이 진할수록 계획을 잘 지킨 날이에요</p></div>
        <div class="legend">낮음 <i class="heat-swatch l0"></i><i class="heat-swatch l1"></i><i class="heat-swatch l2"></i><i class="heat-swatch l3"></i> 높음</div>
      </div>
      <div class="month-heat" style="margin-bottom: 6px">
        <span class="weekday" v-for="w in ['일', '월', '화', '수', '목', '금', '토']" :key="w">{{ w }}</span>
      </div>
      <div class="month-heat">
        <div
          v-for="d in monthGrid"
          :key="d.key"
          class="cell"
          :class="['heat-l' + d.level, { 'heat-out': d.out }]"
        >
          <b>{{ d.date }}</b>
        </div>
      </div>
    </section>
    <div style="display: grid; gap: 16px">
      <section class="card">
        <h3>이번 달 요약</h3>
        <div style="display: flex; align-items: baseline; gap: 4px; margin: 10px 0">
          <b style="font-size: 25px; letter-spacing: -1px">76<small>%</small></b><span style="color: var(--color-muted); font-size: 12px">평균 실행률</span>
        </div>
        <div class="progress"><em style="width: 76%"></em></div>
        <div class="event"><span style="color: var(--color-muted)">최고 달성일</span><b style="margin-left: auto">8/12 (92%)</b></div>
        <div class="event" style="border-bottom: none"><span style="color: var(--color-muted)">연속 기록일</span><b style="margin-left: auto">9일째</b></div>
      </section>
      <section class="card cat">
        <h3 style="text-align: left">카테고리 비중</h3>
        <strong>&nbsp;</strong>
      </section>
    </div>
  </div>
</template>
