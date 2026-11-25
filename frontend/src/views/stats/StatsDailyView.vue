<script setup>
import { tr } from '../../store/locale'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const view = ref('일간')
const bars = [
  { label: '업무', plan: 70, actual: 60 },
  { label: '건강', plan: 40, actual: 48 },
  { label: '공부', plan: 30, actual: 18 },
  { label: '휴식', plan: 20, actual: 22 },
]

const categories = [
  // 데이터 색 하나 + 중립 단계. 범례에 이름·시간을 함께 적는다(색만으로 구분하지 않는다)
  { label: '업무', minutes: 252, color: 'var(--color-data)' },
  { label: '공부', minutes: 132, color: 'var(--color-foreground)' },
  { label: '건강', minutes: 108, color: 'var(--color-control-border)' },
  { label: '휴식', minutes: 108, color: 'var(--color-hairline)' },
]
const totalMinutes = categories.reduce((sum, c) => sum + c.minutes, 0)
const donutStops = computed(() => {
  let acc = 0
  return categories
    .map((c) => {
      const from = acc
      acc += (c.minutes / totalMinutes) * 100
      return `${c.color} ${from}% ${acc}%`
    })
    .join(', ')
})
const activeCategory = ref(null)
function pickCategory(label) {
  activeCategory.value = activeCategory.value === label ? null : label
}
function formatDuration(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h ? `${h}h ${m}m` : `${m}m`
}

const heatWeeks = Array.from({ length: 4 }, () => Array.from({ length: 7 }, () => Math.floor(Math.random() * 5)))

const DISTRACTION_PRESETS = ['피곤함', '회의 과다', '돌발 업무', '집중력 저하', '컨디션 난조', '계획 과다']
const selectedDistractions = ref(['회의 과다'])
const distractionNote = ref('')
function toggleDistraction(tag) {
  const i = selectedDistractions.value.indexOf(tag)
  if (i >= 0) selectedDistractions.value.splice(i, 1)
  else selectedDistractions.value.push(tag)
}
</script>

<template>
  <div class="stats-daily-tools">
    <p class="sample-label">{{ tr('이 화면의 수치는 시연용 예시 데이터예요. 실제 기록으로 계산한 수치는 통계 보드의 \'한눈에 보기\'에 있어요.') }}</p>
    <!-- 주간·월간은 각각 카테고리 통계·비교 분석 화면으로 이동한다(기존 동작 유지) -->
    <div class="segmented-tab" role="group" :aria-label="tr('기간')">
      <button type="button" :aria-pressed="view === '일간'" @click="view = '일간'">{{ tr('일간') }}</button>
      <button type="button" :aria-pressed="view === '주간'" @click="((view = '주간'), router.push('/stats/category'))">{{ tr('주간') }}</button>
      <button type="button" :aria-pressed="view === '월간'" @click="((view = '월간'), router.push('/stats/compare'))">{{ tr('월간') }}</button>
    </div>
  </div>
  <div class="bento">
    <section class="card bento-2x1" aria-labelledby="daily-pa-title">
      <h3 id="daily-pa-title">{{ tr('계획 대비 실제') }}</h3>
      <div class="chart" role="img" :aria-label="bars.map(b => tr('{name} 계획 {plan}%, 실제 {actual}%', { name: tr(b.label), plan: b.plan, actual: b.actual })).join('; ')">
        <div v-for="b in bars" :key="b.label"><i :style="{ height: b.plan + '%' }"></i><b :style="{ height: b.actual + '%' }"></b><small>{{ tr(b.label) }}</small></div>
      </div>
      <div class="chart-legend"><span><i class="swatch plan"></i>{{ tr('계획') }}</span><span><i class="swatch actual"></i>{{ tr('실제 기록') }}</span></div>
    </section>
    <section class="card cat bento-1x2" aria-labelledby="daily-cat-title">
      <h3 id="daily-cat-title" style="text-align: left">{{ tr('카테고리 비중') }}</h3>
      <strong :style="{ background: `conic-gradient(${donutStops})` }" role="img" :aria-label="tr('합계 {time}', { time: formatDuration(totalMinutes) })">{{ formatDuration(totalMinutes) }}</strong>
      <div class="legend-list">
        <button v-for="c in categories" :key="c.label" type="button" class="legend-row" :class="{ active: activeCategory === c.label }" :aria-pressed="activeCategory === c.label" @click="pickCategory(c.label)">
          <i :style="{ background: c.color }" aria-hidden="true"></i><span>{{ tr(c.label) }}</span><b>{{ formatDuration(c.minutes) }}</b>
        </button>
      </div>
      <div v-if="activeCategory" class="callout" style="margin-top: 10px; text-align: left">
        <b>{{ tr('{name} 상세', { name: tr(activeCategory) }) }}</b>
        <p>{{ tr('오늘 계획 {plan}% · 실제 {actual}% 실행했어요.', { plan: bars.find((b) => b.label === activeCategory)?.plan ?? 0, actual: bars.find((b) => b.label === activeCategory)?.actual ?? 0 }) }}</p>
      </div>
    </section>
    <section class="card bento-1x1" aria-labelledby="daily-streak-title">
      <h3 id="daily-streak-title">{{ tr('최근 4주 기록 꾸준함') }}</h3>
      <p class="streak-note">{{ tr('칸이 진할수록 그날 기록이 많아요. 빈 칸은 기록이 없는 날이에요.') }}</p>
      <div class="heat-cells streak" style="grid-template-columns: repeat(7, 1fr); margin-top: 10px" v-for="(week, wi) in heatWeeks" :key="wi" role="img" :aria-label="tr('{n}주 전: 기록한 날 {days}일', { n: 4 - wi, days: week.filter(l => l > 0).length })">
        <i v-for="(lvl, di) in week" :key="di" :class="{ done: lvl > 0 }" :style="{ opacity: lvl > 0 ? 0.35 + lvl * 0.16 : 1 }"></i>
      </div>
    </section>
    <section class="card bento-1x1" aria-labelledby="daily-distraction-title">
      <h3 id="daily-distraction-title">{{ tr('오늘의 방해 요인') }}</h3>
      <div class="distraction-chips" role="group" :aria-label="tr('방해 요인 고르기')">
        <button v-for="t in DISTRACTION_PRESETS" :key="t" type="button" class="tag" :class="{ 'chip-on': selectedDistractions.includes(t) }" :aria-pressed="selectedDistractions.includes(t)" @click="toggleDistraction(t)">{{ tr(t) }}</button>
      </div>
      <label class="input-field">{{ tr('덧붙일 내용') }}<textarea v-model="distractionNote" :placeholder="tr('자유롭게 적어 보세요')" rows="3"></textarea><span class="input-field-help">{{ tr('이 메모는 이 화면에서만 보이고 저장되지 않아요.') }}</span></label>
    </section>
  </div>
</template>

<style scoped>
.stats-daily-tools { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--space-lg); margin-bottom: var(--space-xxl); }
.stats-daily-tools .sample-label { margin: 0; }
.streak-note { margin: var(--space-xs) 0 0; color: var(--color-body); font-size: var(--type-caption-size); }
.distraction-chips { display: flex; flex-wrap: wrap; gap: var(--space-sm); margin: var(--space-lg) 0; }
.distraction-chips .tag { min-height: var(--tab-height); padding: 0 var(--space-lg); border: 1px solid var(--color-hairline); border-radius: var(--radius-full); }
</style>
