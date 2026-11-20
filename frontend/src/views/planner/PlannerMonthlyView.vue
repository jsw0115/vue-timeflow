<script setup>
// 월간 플래너: 이 달의 계획 대비 실행 히트맵과 요약. 수치는 아직 시연용 예시 데이터라 화면 위에 그렇게 밝힌다.
import { monthGrid } from '../../store/plannerDate'
import { localDate } from '../../utils/postValidation.mjs'

const todayKey = localDate()
// 히트맵 단계는 색 진하기와 점 개수로 함께 보인다(DESIGN.md 2장 색만으로 구분하지 않는다)
const LEVELS = ['기록 없음', '낮음', '보통', '높음']
// 카테고리 비중(예시). 데이터 색 하나 + 중립 단계를 쓰고 범례에 이름과 비율을 함께 적는다
const CATEGORIES = [
  { label: '업무', share: 42, color: 'var(--color-data)' },
  { label: '공부', share: 22, color: 'var(--color-foreground)' },
  { label: '건강', share: 18, color: 'var(--color-control-border)' },
  { label: '휴식', share: 18, color: 'var(--color-hairline)' },
]
let acc = 0
const donut = 'conic-gradient(' + CATEGORIES.map((c) => { const from = acc; acc += c.share; return c.color + ' ' + from + '% ' + acc + '%' }).join(', ') + ')'
</script>

<template>
  <!-- 기간 이동은 앱이 그리는 PlannerViewSettings 한 줄에 있다 -->
  <p class="sample-label planner-sample">이 화면의 실행률·비중은 시연용 예시 데이터예요. 실제 기록으로 계산하지 않아요.</p>
  <div class="planner planner-month">
    <section class="card" aria-labelledby="month-heat-title">
      <div class="head">
        <div><h3 id="month-heat-title">계획 대비 실행</h3><p>칸이 진하고 점이 많을수록 계획을 잘 지킨 날이에요</p></div>
        <ul class="heat-legend" aria-label="범례">
          <li v-for="(name, level) in LEVELS" :key="level"><i class="heat-swatch" :class="'l' + level" aria-hidden="true"></i>{{ name }}</li>
        </ul>
      </div>
      <div class="month-heat month-weekdays" aria-hidden="true">
        <span class="weekday" v-for="w in ['일', '월', '화', '수', '목', '금', '토']" :key="w">{{ w }}</span>
      </div>
      <div class="month-heat" role="list">
        <div
          v-for="d in monthGrid"
          :key="d.key"
          role="listitem"
          class="cell"
          :class="['heat-l' + d.level, { 'heat-out': d.out, today: d.key === todayKey }]"
          :aria-label="d.out ? undefined : `${d.date}일 실행 ${LEVELS[d.level]}`"
          :title="d.out ? undefined : `실행 ${LEVELS[d.level]}`"
        >
          <b>{{ d.date }}</b>
          <small v-if="!d.out && d.level" class="heat-dots" aria-hidden="true">{{ '•'.repeat(d.level) }}</small>
        </div>
      </div>
    </section>
    <div class="planner-month-side">
      <section class="card" aria-labelledby="month-summary-title">
        <h3 id="month-summary-title">이번 달 요약</h3>
        <p class="month-rate"><b class="figure">76<small>%</small></b><span>평균 실행률</span></p>
        <div class="progress" role="img" aria-label="평균 실행률 76%"><em style="width: 76%"></em></div>
        <dl class="month-facts">
          <div><dt>최고 달성일</dt><dd class="figure">12일 (92%)</dd></div>
          <div><dt>연속 기록일</dt><dd>9일째</dd></div>
        </dl>
      </section>
      <section class="card" aria-labelledby="month-cat-title">
        <h3 id="month-cat-title">카테고리 비중</h3>
        <div class="donut-wrap">
          <div class="donut" :style="{ background: donut }" role="img" :aria-label="CATEGORIES.map(c => `${c.label} ${c.share}%`).join(', ')"><span class="figure">{{ CATEGORIES.length }}개</span></div>
          <ul class="donut-legend">
            <li v-for="c in CATEGORIES" :key="c.label"><i :style="{ background: c.color }" aria-hidden="true"></i>{{ c.label }}<b class="figure">{{ c.share }}%</b></li>
          </ul>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.planner-sample { display: block; margin: 0 0 var(--space-lg); }
.planner-month { grid-template-columns: minmax(0, 1fr) minmax(280px, 340px); align-items: start; }
.planner-month-side { display: grid; gap: var(--space-xl); }
.heat-legend { display: flex; flex-wrap: wrap; gap: var(--space-md); margin: 0; padding: 0; list-style: none; font-size: var(--type-caption-size); color: var(--color-body); }
.heat-legend li { display: flex; align-items: center; gap: var(--space-xs); }
.month-weekdays { margin: var(--space-xl) 0 var(--space-sm); }
.month-heat { grid-template-columns: repeat(7, minmax(0, 1fr)); }
.month-heat .cell { min-width: 0; overflow: hidden; }
.month-heat .cell.heat-out { color: var(--color-muted); opacity: .5; }
@media (max-width: 600px) { .month-heat { gap: 3px; } .month-heat .cell { padding: 3px; } }
.heat-dots { letter-spacing: 1px; line-height: 1; }
.month-rate { display: flex; align-items: baseline; gap: var(--space-sm); margin: var(--space-lg) 0 var(--space-sm); }
.month-rate b { font-size: 1.75rem; font-weight: 500; color: var(--color-foreground); }
.month-rate small { font-size: var(--type-body-sm-size); }
.month-rate span { color: var(--color-body); font-size: var(--type-body-sm-size); }
.month-facts { display: grid; margin: var(--space-lg) 0 0; }
.month-facts > div { display: flex; justify-content: space-between; gap: var(--space-md); padding: var(--space-lg) 0; border-top: 1px solid var(--color-hairline); font-size: var(--type-body-sm-size); }
.month-facts dt { color: var(--color-body); }
.month-facts dd { margin: 0; font-weight: 600; }
@media (max-width: 1150px) { .planner-month { grid-template-columns: minmax(0, 1fr); } }
</style>
