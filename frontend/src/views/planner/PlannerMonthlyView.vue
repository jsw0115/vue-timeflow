<script setup>
// 월간 플래너: 이 달의 계획 대비 실행 히트맵과 요약.
// 로그인 상태는 실행률·히트맵·최고 달성일을 서버가 계정 기록으로 계산한다(PR-19 UF-136, Q-40). 카테고리 비중과 로그아웃 상태는 시연용 예시다.
import { computed, ref, watch } from 'vue'
import { cursor, monthGrid } from '../../store/plannerDate'
import { localDate } from '../../utils/postValidation.mjs'
import { session } from '../../features/auth/session.js'
import { apiRequest } from '../../features/auth/apiRequest.js'
import { LEVELS as REAL_LEVELS, bestDay, fetchExecution, hoursText, monthRange, rateLevel } from '../../features/planner/executionRate.mjs'

const todayKey = localDate()
// 히트맵 단계는 색 진하기와 점 개수로 함께 보인다(DESIGN.md 2장 색만으로 구분하지 않는다)
const DEMO_LEVELS = ['기록 없음', '낮음', '보통', '높음']
const execution = ref(null)
const status = ref('idle')
async function loadExecution() {
  if (!session.userId) { execution.value = null; status.value = 'idle'; return }
  const { from, to } = monthRange(cursor.value.getFullYear(), cursor.value.getMonth())
  status.value = 'loading'
  try { execution.value = await fetchExecution(apiRequest, from, to); status.value = 'ready' } catch { execution.value = null; status.value = 'error' }
}
watch(() => [session.userId, cursor.value.getFullYear(), cursor.value.getMonth()], loadExecution, { immediate: true })
const real = computed(() => !!execution.value)
const LEVELS = computed(() => (real.value ? REAL_LEVELS : DEMO_LEVELS))
const byDate = computed(() => new Map((execution.value?.days ?? []).map((d) => [d.date, d])))
const cells = computed(() => monthGrid.value.map((d) => (real.value ? { ...d, level: d.out ? 0 : rateLevel(byDate.value.get(d.key)?.rate), info: byDate.value.get(d.key) } : d)))
const totals = computed(() => execution.value?.totals ?? null)
const best = computed(() => bestDay(execution.value?.days))
const cellLabel = (d) => (real.value && d.info ? `${d.date}일 ${d.info.rate == null ? '계획 없음' : '실행률 ' + d.info.rate + '%'}` : `${d.date}일 실행 ${LEVELS.value[d.level]}`)
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
  <p v-if="real" class="input-field-help planner-sample">실행률은 계획 시간(일정·계획 블록) 중 실제 기록이 겹친 시간의 비율이에요. 계획 밖에서 한 활동은 실패로 세지 않고 실제 활동 시간에만 넣어요. 카테고리 비중은 아직 예시예요.</p>
  <p v-else class="sample-label planner-sample">이 화면의 실행률·비중은 시연용 예시 데이터예요. {{ session.userId ? (status === 'loading' ? '계정 기록을 불러오는 중이에요.' : '계정 기록을 불러오지 못했어요.') : '로그인하면 실행률을 계정 기록으로 계산해요.' }}</p>
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
          v-for="d in cells"
          :key="d.key"
          role="listitem"
          class="cell"
          :class="['heat-l' + d.level, { 'heat-out': d.out, today: d.key === todayKey }]"
          :aria-label="d.out ? undefined : cellLabel(d)"
          :title="d.out ? undefined : cellLabel(d)"
        >
          <b>{{ d.date }}</b>
          <small v-if="!d.out && d.level" class="heat-dots" aria-hidden="true">{{ '•'.repeat(d.level) }}</small>
        </div>
      </div>
    </section>
    <div class="planner-month-side">
      <section class="card" aria-labelledby="month-summary-title">
        <h3 id="month-summary-title">이번 달 요약</h3>
        <template v-if="real">
          <p class="month-rate"><b class="figure">{{ totals.rate == null ? '–' : totals.rate }}<small v-if="totals.rate != null">%</small></b><span>{{ totals.rate == null ? '이 달은 계획이 없어요' : '이 달 실행률' }}</span></p>
          <div v-if="totals.rate != null" class="progress" role="img" :aria-label="`이 달 실행률 ${totals.rate}%`"><em :style="{ width: Math.min(100, totals.rate) + '%' }"></em></div>
          <dl class="month-facts">
            <div><dt>계획 시간</dt><dd class="figure">{{ hoursText(totals.plannedMinutes) }}</dd></div>
            <div><dt>계획대로 한 시간</dt><dd class="figure">{{ hoursText(totals.executedMinutes) }}</dd></div>
            <div><dt>실제 활동 시간</dt><dd class="figure">{{ hoursText(totals.actualMinutes) }}</dd></div>
            <div><dt>최고 달성일</dt><dd class="figure">{{ best ? `${Number(best.date.slice(8))}일 (${best.rate}%)` : '없음' }}</dd></div>
          </dl>
        </template>
        <template v-else>
          <p class="month-rate"><b class="figure">76<small>%</small></b><span>평균 실행률(예시)</span></p>
          <div class="progress" role="img" aria-label="평균 실행률 예시 76%"><em style="width: 76%"></em></div>
          <dl class="month-facts">
            <div><dt>최고 달성일</dt><dd class="figure">12일 (92%)</dd></div>
            <div><dt>연속 기록일</dt><dd>9일째</dd></div>
          </dl>
        </template>
      </section>
      <section class="card" aria-labelledby="month-cat-title">
        <h3 id="month-cat-title">카테고리 비중 <small class="sample-label">예시</small></h3>
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
