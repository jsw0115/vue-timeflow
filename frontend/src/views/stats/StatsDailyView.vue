<script setup>
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
  { label: '업무', minutes: 252, color: 'var(--color-accent)' },
  { label: '공부', minutes: 132, color: 'var(--color-foreground)' },
  { label: '건강', minutes: 108, color: '#b5843f' },
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
  <div class="toolbar">
    <span></span>
    <button :class="{ selected: view === '일간' }" @click="view = '일간'">일간</button>
    <button :class="{ selected: view === '주간' }" @click="((view = '주간'), router.push('/stats/category'))">주간</button>
    <button :class="{ selected: view === '월간' }" @click="((view = '월간'), router.push('/stats/compare'))">월간</button>
  </div>
  <div class="bento">
    <section class="card bento-2x1">
      <h3>Plan vs Actual</h3>
      <div class="chart">
        <div v-for="b in bars" :key="b.label"><i :style="{ height: b.plan + '%' }"></i><b :style="{ height: b.actual + '%' }"></b><small>{{ b.label }}</small></div>
      </div>
    </section>
    <section class="card cat bento-1x2">
      <h3 style="text-align: left">카테고리 비중</h3>
      <strong :style="{ background: `conic-gradient(${donutStops})` }">{{ formatDuration(totalMinutes) }}</strong>
      <div class="legend-list">
        <button v-for="c in categories" :key="c.label" class="legend-row" :class="{ active: activeCategory === c.label }" @click="pickCategory(c.label)">
          <i :style="{ background: c.color }"></i><span>{{ c.label }}</span><b>{{ formatDuration(c.minutes) }}</b>
        </button>
      </div>
      <div v-if="activeCategory" class="callout" style="margin-top: 10px; text-align: left">
        <b>{{ activeCategory }} 상세</b>
        <p>오늘 계획 {{ bars.find((b) => b.label === activeCategory)?.plan ?? 0 }}% · 실제 {{ bars.find((b) => b.label === activeCategory)?.actual ?? 0 }}% 실행했어요.</p>
      </div>
    </section>
    <section class="card bento-1x1">
      <h3>최근 4주 기록 꾸준함</h3>
      <div class="heat-cells streak" style="grid-template-columns: repeat(7, 1fr); margin-top: 10px" v-for="(week, wi) in heatWeeks" :key="wi">
        <i v-for="(lvl, di) in week" :key="di" :class="{ done: lvl > 0 }" :style="{ opacity: lvl > 0 ? 0.35 + lvl * 0.16 : 1 }"></i>
      </div>
    </section>
    <section class="card bento-1x1">
      <h3>오늘의 방해 요인</h3>
      <div style="display: flex; flex-wrap: wrap; gap: 6px; margin: 10px 0">
        <button v-for="t in DISTRACTION_PRESETS" :key="t" class="tag" :class="{ selected: selectedDistractions.includes(t) }" :style="selectedDistractions.includes(t) ? 'background:var(--color-foreground);color:var(--color-on-primary)' : ''" @click="toggleDistraction(t)">{{ t }}</button>
      </div>
      <textarea v-model="distractionNote" placeholder="자유롭게 덧붙일 내용이 있다면 적어보세요" style="min-height: 60px"></textarea>
    </section>
  </div>
</template>
