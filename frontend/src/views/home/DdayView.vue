<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { openPostComposer } from '../../store/appState'
import { ddays, isPast, togglePin, notifyLabel } from '../../store/ddays'

const router = useRouter()
const route = useRoute()
const filter = ref('전체')
const filteredDdays = computed(() => {
  if (filter.value === '고정됨') return ddays.value.filter((d) => d.pinned)
  if (filter.value === '지난 일정') return ddays.value.filter((d) => isPast(d.dday))
  return ddays.value.filter((d) => !isPast(d.dday))
})

watch(() => route.query.new, value => { if (value) openPostComposer('D-Day') }, { immediate: true })
</script>

<template>
  <div class="page-tools">
    <div class="filter">
      <button :class="{ selected: filter === '전체' }" @click="filter = '전체'">전체 {{ ddays.filter((d) => !isPast(d.dday)).length }}</button>
      <button :class="{ selected: filter === '고정됨' }" @click="filter = '고정됨'">고정됨 {{ ddays.filter((d) => d.pinned).length }}</button>
      <button :class="{ selected: filter === '지난 일정' }" @click="filter = '지난 일정'">지난 일정</button>
    </div>
    <span></span>
    <button class="primary" @click="openPostComposer('D-Day')">+ D-Day 추가</button>
  </div>
  <div class="metrics">
    <article v-for="d in filteredDdays" :key="d.id" class="dday-card" style="cursor: pointer" @click="router.push(`/dday/${d.id}`)">
      <div class="head">
        <span class="badge brand">{{ d.category }}</span>
        <button class="icon" style="width: 26px; height: 26px; font-size: 0.875rem" :title="d.pinned ? '고정 해제' : '고정하기'" aria-label="d.pinned ? '고정 해제' : '고정하기'" @click.stop="togglePin(d)">{{ d.pinned ? '★' : '☆' }}</button>
      </div>
      <h3>{{ d.title }}</h3>
      <p>{{ d.date }}</p>
      <b class="dday-num">{{ d.dday }}</b>
      <small class="dday-notify">🔔 {{ notifyLabel(d) }}</small>
    </article>
    <p v-if="filteredDdays.length === 0" style="grid-column: 1 / -1">표시할 항목이 없어요.</p>
  </div>

</template>
