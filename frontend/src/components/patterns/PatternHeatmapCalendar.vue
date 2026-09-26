<script setup>
import { computed } from 'vue'
import { percent } from '../../data/mock'

const props = defineProps({ screen: { type: Object, required: true } })

const variant = computed(() => {
  if (props.screen.id === 'PLAN-004') return 'year'
  if (props.screen.id === 'ROUT-003') return 'streak'
  if (props.screen.id === 'DIARY-001') return 'simple'
  return 'month'
})

function grid(n, offset = 0) {
  return Array.from({ length: n }, (_, i) => percent(props.screen.id, i + offset, 0, 100))
}

const months = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']
const monthCells = grid(35)
const yearCells = months.map((m, i) => ({ label: m, cells: grid(28, i * 40) }))
const streakCells = grid(42)
</script>

<template>
  <div class="heatmap-pattern card">
    <div class="head">
      <div><p class="eyebrow">{{ screen.id }}</p><h3>{{ screen.name }}</h3></div>
      <div class="legend"><span>낮음</span><i v-for="n in 4" :key="n" :style="{ opacity: n * 0.22 + 0.15 }"></i><span>높음</span></div>
    </div>

    <template v-if="variant === 'year'">
      <div class="year-heatmap">
        <div class="year-month" v-for="m in yearCells" :key="m.label">
          <small>{{ m.label }}</small>
          <div class="heat-cells mini">
            <i v-for="(v, i) in m.cells" :key="i" :style="{ opacity: v / 100 }"></i>
          </div>
        </div>
      </div>
    </template>

    <template v-else-if="variant === 'streak'">
      <div class="heat-cells streak">
        <i v-for="(v, i) in streakCells" :key="i" :class="{ done: v > 40 }"></i>
      </div>
      <p>최근 42일 중 {{ streakCells.filter((v) => v > 40).length }}일 수행 · 연속 {{ Math.max(...streakCells.map((v,i)=> v>40? i:0)) % 7 + 1 }}일 유지</p>
    </template>

    <template v-else-if="variant === 'simple'">
      <div class="calendar"><div>
        <span v-for="(v, i) in monthCells.slice(0, 31)" :key="i" :class="{ written: v > 50 }">{{ i + 1 }}</span>
      </div></div>
    </template>

    <template v-else>
      <div class="heat-cells month">
        <i v-for="(v, i) in monthCells" :key="i" :style="{ opacity: v / 100 }" :title="`${v}%`"></i>
      </div>
    </template>
    <p class="eyebrow" style="margin-top:12px">{{ screen.role }}</p>
  </div>
</template>
