<script setup>
import { items as buildItems, percent } from '../../data/mock'

const props = defineProps({ screen: { type: Object, required: true } })
const rows = buildItems(props.screen, 4)
const bars = Array.from({ length: 7 }, (_, i) => percent(props.screen.id, i, 20, 95))
const days = ['월', '화', '수', '목', '금', '토', '일']
</script>

<template>
  <div class="metrics">
    <article v-for="row in rows" :key="row.id">
      <i>◔</i>
      <b>{{ row.percent }}<small>%</small></b>
      <span>{{ row.title }}</span>
      <div class="progress"><em :style="{ width: row.percent + '%' }"></em></div>
    </article>
  </div>
  <section class="card">
    <div class="head"><div><p class="eyebrow">{{ screen.id }}</p><h3>{{ screen.name }}</h3></div></div>
    <p>{{ screen.role }}</p>
    <div class="chart">
      <div v-for="(v, i) in bars" :key="i">
        <b :style="{ height: v + '%' }"></b>
        <small>{{ days[i] }}</small>
      </div>
    </div>
  </section>
</template>
