<script setup>
import { weekLabel, shift, goToday } from '../../store/plannerDate'
import { useRouter } from 'vue-router'

const router = useRouter()
const days = ['월', '화', '수', '목', '금', '토', '일']
const blocksByDay = {
  월: [{ top: 20, height: 12, title: '팀회의', color: 'purple' }, { top: 60, height: 10, title: '헬스', color: 'amber' }],
  화: [{ top: 15, height: 15, title: '스터디', color: 'blue' }],
  수: [{ top: 25, height: 10, title: '기획 리뷰', color: 'purple' }, { top: 70, height: 8, title: '요가', color: 'mint' }],
  목: [{ top: 30, height: 18, title: '고객 미팅', color: 'purple' }],
  금: [{ top: 18, height: 10, title: '친구 약속', color: 'amber' }],
  토: [{ top: 40, height: 20, title: '등산', color: 'mint' }],
  일: [],
}
const top5 = [
  { label: '업무', color: 'purple', hours: '14h' },
  { label: '공부', color: 'blue', hours: '6h' },
  { label: '건강', color: 'mint', hours: '4h' },
  { label: '휴식', color: 'amber', hours: '3h' },
  { label: '개인', color: 'pink', hours: '2h' },
]
</script>

<template>
  <div class="toolbar">
    <button aria-label="이전 주" @click="shift('week', -1)">‹</button>
    <b>▤ {{ weekLabel }}</b>
    <button aria-label="다음 주" @click="shift('week', 1)">›</button>
    <button class="review" style="margin: 0; padding: 5px 10px" @click="goToday">이번 주</button>
    <span></span>
    <button @click="router.push('/planner')">일간</button>
    <button class="selected">주간</button>
    <button @click="router.push('/planner/monthly')">월간</button>
    <button @click="router.push('/planner/yearly')">연간</button>
  </div>
  <div class="planner">
    <section class="card">
      <div class="head"><div><h3>주간 타임테이블</h3><p>일주일의 계획과 실제를 한눈에</p></div></div>
      <div class="timetable">
        <div class="tt-hours"><small v-for="h in ['9', '12', '15', '18', '21']" :key="h">{{ h }}시</small></div>
        <div class="tt-day" v-for="d in days" :key="d">
          <small>{{ d }}</small>
          <div class="grid tt-grid">
            <div v-for="(b, i) in blocksByDay[d]" :key="i" :class="['block', b.color]" :style="{ top: b.top + '%', height: b.height + '%' }"><b>{{ b.title }}</b></div>
          </div>
        </div>
      </div>
    </section>
    <div style="display: grid; gap: 16px">
      <section class="card">
        <h3>이번 주 TOP 5 카테고리</h3>
        <div class="event" v-for="c in top5" :key="c.label" style="border-bottom: 1px solid var(--color-surface)">
          <i :class="['block', c.color]" style="width: 8px; height: 8px; position: static; border-radius: 2px"></i>
          <span style="flex: 1"><b>{{ c.label }}</b></span>
          <b>{{ c.hours }}</b>
        </div>
      </section>
      <section class="card cat">
        <h3 style="text-align: left">Plan vs Actual</h3>
        <strong>78%</strong>
        <p>계획 대비 실행 싱크로율</p>
      </section>
    </div>
  </div>
</template>
