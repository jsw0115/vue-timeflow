<script setup>
import { color } from '../../data/mock'

const props = defineProps({ screen: { type: Object, required: true } })
const days = ['월', '화', '수', '목', '금', '토', '일']
const hours = ['06', '09', '12', '15', '18', '21']

function blocksFor(day) {
  return Array.from({ length: 2 + (day.charCodeAt(0) % 2) }, (_, i) => ({
    top: 10 + i * 32,
    height: 16 + (i * 7) % 14,
    color: color(props.screen.id, day.charCodeAt(0) + i),
  }))
}
</script>

<template>
  <div class="toolbar"><b>이번 주</b><span></span><button class="selected">주간</button><button>월간</button></div>
  <section class="card">
    <div class="timetable">
      <div class="hours tt-hours"><small v-for="h in hours" :key="h">{{ h }}:00</small></div>
      <div class="tt-day" v-for="d in days" :key="d">
        <small>{{ d }}</small>
        <div class="grid tt-grid">
          <div class="block" v-for="(b, i) in blocksFor(d)" :key="i" :class="b.color" :style="{ top: b.top + '%', height: b.height + '%' }"></div>
        </div>
      </div>
    </div>
  </section>
</template>
