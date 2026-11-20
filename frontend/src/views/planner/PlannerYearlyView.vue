<script setup>
// 연간 플래너: 올해 수치와 열두 달 실행 히트맵. 수치와 칸 단계는 아직 시연용 예시 데이터다.
import { computed } from 'vue'
import { cursor } from '../../store/plannerDate'

const LEVELS = ['기록 없음', '낮음', '보통', '높음']
const now = new Date()
// 보는 해가 올해면 이번 달을 '진행 중', 그 뒤 달은 '예정'으로 둔다. 지난해는 모두 지난 달이다
const months = computed(() => {
  const year = cursor.value.getFullYear()
  return Array.from({ length: 12 }, (_, i) => {
    const state = year < now.getFullYear() || (year === now.getFullYear() && i < now.getMonth()) ? 'past' : year === now.getFullYear() && i === now.getMonth() ? 'current' : 'future'
    // 예시 단계는 달·칸 번호로 정해 화면이 흔들리지 않게 한다
    const cells = Array.from({ length: 14 }, (_, d) => (state === 'future' ? 0 : [3, 1, 2, 0, 1][(i * 7 + d * 3) % 5]))
    return { label: i + 1 + '월', state, cells }
  })
})
</script>

<template>
  <!-- 기간 이동은 앱이 그리는 PlannerViewSettings 한 줄에 있다 -->
  <p class="sample-label planner-sample">이 화면의 연간 수치·히트맵은 시연용 예시 데이터예요. 실제 기록으로 계산하지 않아요.</p>
  <div class="metrics">
    <article><span>올해 총 집중 시간</span><b>612<small>시간</small></b></article>
    <article><span>연간 평균 실행률</span><b>71<small>%</small></b></article>
    <article><span>완료한 D-Day</span><b>9<small>건</small></b></article>
    <article><span>최장 연속 기록</span><b>23<small>일</small></b></article>
  </div>
  <section class="card" aria-labelledby="year-heat-title">
    <div class="head">
      <div><h3 id="year-heat-title">월별 실행</h3><p>칸마다 그 달 2주 단위 기록이에요</p></div>
      <ul class="heat-legend" aria-label="범례">
        <li v-for="(name, level) in LEVELS" :key="level"><i class="heat-swatch" :class="'l' + level" aria-hidden="true"></i>{{ name }}</li>
      </ul>
    </div>
    <ol class="year-grid">
      <li v-for="m in months" :key="m.label" class="year-month" :class="m.state" :aria-current="m.state === 'current' ? 'date' : undefined">
        <span class="year-month-label">{{ m.label }}<small v-if="m.state === 'current'"> · 진행 중</small><small v-else-if="m.state === 'future'"> · 예정</small></span>
        <div class="year-cells" role="img" :aria-label="m.state === 'future' ? `${m.label} 예정` : `${m.label} 실행 높음 ${m.cells.filter(c => c === 3).length}칸, 보통 ${m.cells.filter(c => c === 2).length}칸`">
          <i v-for="(level, d) in m.cells" :key="d" class="heat-swatch" :class="'l' + level"></i>
        </div>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.planner-sample { display: block; margin: 0 0 var(--space-lg); }
.heat-legend { display: flex; flex-wrap: wrap; gap: var(--space-md); margin: 0; padding: 0; list-style: none; font-size: var(--type-caption-size); color: var(--color-body); }
.heat-legend li { display: flex; align-items: center; gap: var(--space-xs); }
.year-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: var(--space-lg); margin: var(--space-xl) 0 0; padding: 0; list-style: none; }
.year-month { display: grid; gap: var(--space-sm); padding: var(--space-lg); border: 1px solid transparent; border-radius: var(--radius-md); }
.year-month.current { border-color: var(--color-control-border); background: var(--color-card); box-shadow: inset 2px 0 0 var(--color-accent); }
.year-month.future { opacity: .6; }
.year-month-label { font-size: var(--type-body-sm-size); font-weight: 600; }
.year-month-label small { color: var(--color-muted); font-weight: 500; }
.year-cells { display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px; }
.year-cells .heat-swatch { width: auto; aspect-ratio: 1; margin: 0; border-radius: var(--radius-xs); }
.year-cells .heat-swatch.l0 { background: var(--color-surface); box-shadow: inset 0 0 0 1px var(--color-hairline); }
</style>
