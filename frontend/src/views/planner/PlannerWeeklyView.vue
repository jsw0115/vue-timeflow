<script setup>
// 주간 플래너: 일주일 시간표와 카테고리별 시간, 계획 대비 실제 비율. 블록과 수치는 아직 시연용 예시 데이터다.
import { weekDays } from '../../store/plannerDate'
import { localDate } from '../../utils/postValidation.mjs'

const todayKey = localDate()
// 08~23시를 그린다. 블록의 top·height는 그 범위 안의 비율(%)이다
const HOURS = [8, 11, 14, 17, 20, 23]
const hourTop = (h) => ((h - 8) / 15) * 100 + '%'
// 블록 색은 카테고리(콘텐츠) 색이고 서비스 accent와 따로다(DESIGN.md 2장 Category and chart colors)
const CATEGORY = {
  업무: 'var(--color-content-slate)',
  공부: 'var(--color-content-steel)',
  건강: 'var(--color-content-sage)',
  휴식: 'var(--color-content-ochre)',
  개인: 'var(--color-content-rose)',
}
const blocksByDay = {
  월: [{ top: 20, height: 12, title: '팀회의', category: '업무' }, { top: 60, height: 10, title: '헬스', category: '건강' }],
  화: [{ top: 15, height: 15, title: '스터디', category: '공부' }],
  수: [{ top: 25, height: 10, title: '기획 리뷰', category: '업무' }, { top: 70, height: 8, title: '요가', category: '건강' }],
  목: [{ top: 30, height: 18, title: '고객 미팅', category: '업무' }],
  금: [{ top: 18, height: 10, title: '친구 약속', category: '개인' }],
  토: [{ top: 40, height: 20, title: '등산', category: '건강' }],
  일: [],
}
const top5 = [
  { label: '업무', hours: 14 },
  { label: '공부', hours: 6 },
  { label: '건강', hours: 4 },
  { label: '휴식', hours: 3 },
  { label: '개인', hours: 2 },
]
const maxHours = Math.max(...top5.map((c) => c.hours))
const PLAN_HOURS = 32
const ACTUAL_HOURS = 25
const syncRate = Math.round((ACTUAL_HOURS / PLAN_HOURS) * 100)
</script>

<template>
  <!-- 기간 이동은 앱이 그리는 PlannerViewSettings 한 줄에 있다 -->
  <p class="sample-label planner-sample">이 화면의 시간표·시간 합계는 시연용 예시 데이터예요. 실제 기록으로 계산하지 않아요.</p>
  <div class="planner planner-week">
    <section class="card" aria-labelledby="week-table-title">
      <div class="head"><div><h3 id="week-table-title">주간 시간표</h3><p>요일마다 08~23시 기록을 같은 시간축에 놓았어요</p></div></div>
      <div class="week-table">
        <div class="week-corner" aria-hidden="true"></div>
        <div v-for="d in weekDays" :key="d.key" class="week-day-head" :class="{ today: d.key === todayKey }">
          <span>{{ d.label }}</span><b class="figure">{{ d.date }}</b>
        </div>
        <div class="week-hours" aria-hidden="true"><small v-for="h in HOURS" :key="h" class="figure" :style="{ top: hourTop(h) }">{{ String(h).padStart(2, '0') }}</small></div>
        <div v-for="d in weekDays" :key="d.key + '-col'" class="week-col" :class="{ today: d.key === todayKey }" role="list" :aria-label="`${d.label}요일 ${d.date}일`">
          <div
            v-for="(b, i) in blocksByDay[d.label]"
            :key="i"
            class="week-block"
            role="listitem"
            :style="{ top: b.top + '%', height: b.height + '%', '--content-color': CATEGORY[b.category] }"
            :title="`${b.title} · ${b.category}`"
          ><b>{{ b.title }}</b><small>{{ b.category }}</small></div>
        </div>
      </div>
    </section>
    <div class="planner-week-side">
      <section class="card" aria-labelledby="week-top-title">
        <h3 id="week-top-title">이번 주 카테고리 시간</h3>
        <ul class="hour-bars">
          <li v-for="c in top5" :key="c.label">
            <span class="hour-bar-label"><i :style="{ background: CATEGORY[c.label] }" aria-hidden="true"></i>{{ c.label }}</span>
            <span class="hour-bar-track" aria-hidden="true"><em :style="{ width: (c.hours / maxHours) * 100 + '%' }"></em></span>
            <b class="figure">{{ c.hours }}시간</b>
          </li>
        </ul>
      </section>
      <section class="card" aria-labelledby="week-sync-title">
        <h3 id="week-sync-title">계획 대비 실제</h3>
        <p class="week-sync"><b class="figure">{{ syncRate }}<small>%</small></b><span>계획한 시간 중 실제로 기록한 비율</span></p>
        <dl class="plan-actual-bars">
          <div><dt>계획</dt><dd><span class="pa-bar pa-plan" style="width: 100%"></span><b class="figure">{{ PLAN_HOURS }}시간</b></dd></div>
          <div><dt>실제 기록</dt><dd><span class="pa-bar pa-actual" :style="{ width: syncRate + '%' }"></span><b class="figure">{{ ACTUAL_HOURS }}시간</b></dd></div>
        </dl>
      </section>
    </div>
  </div>
</template>

<style scoped>
.planner-sample { display: block; margin: 0 0 var(--space-lg); }
.planner-week { grid-template-columns: minmax(0, 1fr) minmax(280px, 340px); align-items: start; }
.planner-week-side { display: grid; gap: var(--space-xl); }
.week-table { display: grid; grid-template-columns: 40px repeat(7, minmax(72px, 1fr)); grid-template-rows: auto 480px; column-gap: var(--space-xs); margin-top: var(--space-xl); overflow-x: auto; }
.week-day-head { display: flex; flex-direction: column; align-items: center; gap: 2px; padding-bottom: var(--space-sm); font-size: var(--type-caption-size); color: var(--color-muted); }
.week-day-head b { font-size: var(--type-body-sm-size); font-weight: 600; color: var(--color-foreground); }
.week-day-head.today b { display: grid; place-items: center; width: 28px; height: 28px; border-radius: var(--radius-full); box-shadow: inset 0 0 0 2px var(--color-accent); color: var(--color-accent); }
.week-day-head.today span::after { content: ' · 오늘'; }
.week-hours { position: relative; }
.week-hours small { position: absolute; right: var(--space-xs); transform: translateY(-50%); font-size: var(--type-caption-size); color: var(--color-muted); }
.week-hours small:first-child { transform: none; }
.week-col { position: relative; border-left: 1px solid var(--color-hairline); background: repeating-linear-gradient(to bottom, var(--color-hairline) 0, var(--color-hairline) 1px, transparent 1px, transparent 20%); }
.week-col.today { background-color: var(--color-accent-soft); }
.week-block { position: absolute; left: var(--space-xs); right: var(--space-xs); min-height: 32px; display: flex; flex-direction: column; gap: 2px; padding: var(--space-xs) var(--space-sm); overflow: hidden; border: 1px solid var(--color-hairline); border-left: 3px solid var(--content-color, var(--color-data)); border-radius: var(--radius-sm); background: var(--color-card); font-size: var(--type-caption-size); line-height: 1.3; }
.week-block b { font-size: var(--type-caption-size); font-weight: 600; color: var(--color-foreground); word-break: keep-all; }
.week-block small { color: var(--color-muted); }
.hour-bars { display: grid; gap: var(--space-lg); margin: var(--space-xl) 0 0; padding: 0; list-style: none; }
.hour-bars li { display: grid; grid-template-columns: 72px minmax(0, 1fr) 56px; align-items: center; gap: var(--space-md); font-size: var(--type-body-sm-size); }
.hour-bar-label { display: flex; align-items: center; gap: var(--space-sm); }
.hour-bar-label i { width: 10px; height: 10px; border-radius: var(--radius-xs); flex: none; }
.hour-bar-track { height: 8px; border-radius: var(--radius-full); background: var(--color-surface); overflow: hidden; }
.hour-bar-track em { display: block; height: 100%; border-radius: var(--radius-full); background: var(--color-data); }
.hour-bars b { text-align: right; font-weight: 500; }
.week-sync { display: flex; flex-wrap: wrap; align-items: baseline; gap: var(--space-sm); margin: var(--space-lg) 0; }
.week-sync b { font-size: 1.75rem; font-weight: 500; color: var(--color-foreground); }
.week-sync small { font-size: var(--type-body-sm-size); }
.week-sync span { color: var(--color-body); font-size: var(--type-body-sm-size); }
.plan-actual-bars { display: grid; gap: var(--space-md); margin: 0; }
.plan-actual-bars > div { display: grid; grid-template-columns: 64px minmax(0, 1fr); align-items: center; gap: var(--space-md); font-size: var(--type-body-sm-size); }
.plan-actual-bars dt { color: var(--color-body); }
.plan-actual-bars dd { display: flex; align-items: center; gap: var(--space-sm); margin: 0; }
.plan-actual-bars b { flex: none; font-weight: 500; }
/* 계획은 점선 테두리, 실제 기록은 데이터 색 채움(DESIGN.md 4장 Plan and Actual) */
.pa-bar { display: block; flex: 0 1 auto; min-width: 0; height: 14px; border-radius: var(--radius-xs); }
.pa-bar.pa-plan { border: 1px dashed var(--color-control-border); background: var(--color-card); }
.pa-bar.pa-actual { background: var(--color-data); }
@media (max-width: 1150px) { .planner-week { grid-template-columns: minmax(0, 1fr); } }
</style>
