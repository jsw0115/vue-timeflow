<script setup>
import { bodyLocale } from '../../store/locale'
import { formatDate } from '../../features/i18n/locale.mjs'
import { items as buildItems, percent } from '../../data/mock'

const props = defineProps({ screen: { type: Object, required: true } })
const rows = buildItems(props.screen, 4)
const bars = Array.from({ length: 7 }, (_, i) => percent(props.screen.id, i, 20, 95))
const days = ['월', '화', '수', '목', '금', '토', '일']
// 월요일부터 시작한다. 2024-01-08이 월요일이다
const dayName = (i) => (bodyLocale.value === 'ko' ? days[i] : formatDate(new Date(2024, 0, 8 + i), bodyLocale.value, { weekday: 'short' }))
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
        <small>{{ dayName(i) }}</small>
      </div>
    </div>
  </section>
</template>
