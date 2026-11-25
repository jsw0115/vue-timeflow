<script setup>
// 연간 플래너: 올해 수치와 열두 달 실행 히트맵.
// 로그인 상태는 연간 실행률과 날짜별 칸을 서버가 계정 기록으로 계산한다(PR-19 UF-136, Q-40). 나머지 수치와 로그아웃 상태는 시연용 예시다.
import { computed, ref, watch } from 'vue'
import { cursor } from '../../store/plannerDate'
import { bodyLocale, tr } from '../../store/locale'
import { formatDate } from '../../features/i18n/locale.mjs'
import { session } from '../../features/auth/session.js'
import { apiRequest } from '../../features/auth/apiRequest.js'
import { LEVELS as REAL_LEVELS, fetchExecution, rateLevel, yearRange } from '../../features/planner/executionRate.mjs'

const DEMO_LEVELS = ['기록 없음', '낮음', '보통', '높음']
const execution = ref(null)
const status = ref('idle')
watch(() => [session.userId, cursor.value.getFullYear()], async () => {
  if (!session.userId) { execution.value = null; status.value = 'idle'; return }
  const { from, to } = yearRange(cursor.value.getFullYear())
  status.value = 'loading'
  try { execution.value = await fetchExecution(apiRequest, from, to); status.value = 'ready' } catch { execution.value = null; status.value = 'error' }
}, { immediate: true })
const real = computed(() => !!execution.value)
const LEVELS = computed(() => (real.value ? REAL_LEVELS : DEMO_LEVELS))
const now = new Date()
// 보는 해가 올해면 이번 달을 '진행 중', 그 뒤 달은 '예정'으로 둔다. 지난해는 모두 지난 달이다
const months = computed(() => {
  const year = cursor.value.getFullYear()
  return Array.from({ length: 12 }, (_, i) => {
    const state = year < now.getFullYear() || (year === now.getFullYear() && i < now.getMonth()) ? 'past' : year === now.getFullYear() && i === now.getMonth() ? 'current' : 'future'
    // 로그인 상태는 그 달의 날짜마다 한 칸(실행률 단계), 아니면 예시 단계를 달·칸 번호로 정해 화면이 흔들리지 않게 한다
    const cells = real.value
      ? execution.value.days.filter((d) => Number(d.date.slice(5, 7)) === i + 1).map((d) => rateLevel(d.rate))
      : Array.from({ length: 14 }, (_, d) => (state === 'future' ? 0 : [3, 1, 2, 0, 1][(i * 7 + d * 3) % 5]))
    return { label: bodyLocale.value === 'ko' ? i + 1 + '월' : formatDate(new Date(year, i, 1), bodyLocale.value, { month: 'short' }), state, cells }
  })
})
</script>

<template>
  <!-- 기간 이동은 앱이 그리는 PlannerViewSettings 한 줄에 있다 -->
  <p v-if="real" class="input-field-help planner-sample">{{ tr('실행률과 월별 칸은 계정 기록으로 계산해요(칸 하나가 하루). 실행률은 계획 시간 중 실제 기록이 겹친 비율이고, 계획 없는 날은 실패로 세지 않아요. 표시가 붙은 나머지 수치는 예시예요.') }}</p>
  <p v-else class="sample-label planner-sample">{{ tr('이 화면의 연간 수치·히트맵은 시연용 예시 데이터예요.') }} {{ session.userId ? (status === 'loading' ? tr('계정 기록을 불러오는 중이에요.') : tr('계정 기록을 불러오지 못했어요.')) : tr('로그인하면 실행률을 계정 기록으로 계산해요.') }}</p>
  <div class="metrics">
    <article><span>{{ tr('올해 총 집중 시간') }}<template v-if="real"> {{ tr('(예시)') }}</template></span><b>612<small>{{ tr('시간') }}</small></b></article>
    <article v-if="real"><span>{{ tr('연간 실행률') }}</span><b>{{ execution.totals.rate == null ? '–' : execution.totals.rate }}<small v-if="execution.totals.rate != null">%</small></b></article>
    <article v-else><span>{{ tr('연간 평균 실행률') }}</span><b>71<small>%</small></b></article>
    <article><span>{{ tr('완료한 D-Day') }}<template v-if="real"> {{ tr('(예시)') }}</template></span><b>9<small>{{ tr('건') }}</small></b></article>
    <article><span>{{ tr('최장 연속 기록') }}<template v-if="real"> {{ tr('(예시)') }}</template></span><b>23<small>{{ tr('일') }}</small></b></article>
  </div>
  <section class="card" aria-labelledby="year-heat-title">
    <div class="head">
      <div><h3 id="year-heat-title">{{ tr('월별 실행') }}</h3><p>{{ real ? tr('칸 하나가 그 달의 하루예요') : tr('칸마다 그 달 2주 단위 기록이에요') }}</p></div>
      <ul class="heat-legend" :aria-label="tr('범례')">
        <li v-for="(name, level) in LEVELS" :key="level"><i class="heat-swatch" :class="'l' + level" aria-hidden="true"></i>{{ tr(name) }}</li>
      </ul>
    </div>
    <ol class="year-grid">
      <li v-for="m in months" :key="m.label" class="year-month" :class="m.state" :aria-current="m.state === 'current' ? 'date' : undefined">
        <span class="year-month-label">{{ m.label }}<small v-if="m.state === 'current'"> {{ tr('· 진행 중') }}</small><small v-else-if="m.state === 'future'"> {{ tr('· 예정') }}</small></span>
        <div class="year-cells" role="img" :aria-label="m.state === 'future' && !real ? tr('{month} 예정', { month: m.label }) : tr('{month} 실행 높음 {high}칸, 보통 {mid}칸, 낮음 {low}칸', { month: m.label, high: m.cells.filter(c => c === 3).length, mid: m.cells.filter(c => c === 2).length, low: m.cells.filter(c => c === 1).length })">
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
