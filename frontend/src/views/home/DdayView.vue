<script setup>
import { bodyLocale, tr } from '../../store/locale'
import { formatDate } from '../../features/i18n/locale.mjs'
// 날짜 이름은 저장소가 한국어로 만든다("12월 10일"). 다른 언어는 ISO 날짜로 다시 만든다
const shownDate = (d) => (bodyLocale.value === 'ko' || !d.isoDate ? tr(d.date) : formatDate(d.isoDate + 'T00:00:00', bodyLocale.value, { month: 'short', day: 'numeric' }))

import AppIcon from '../../components/icons/AppIcon.vue'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { openPostComposer } from '../../store/appState'
import { ddays, isPast, togglePin, notifyLabel, ddayNotice, ddayStore } from '../../store/ddays'
import ListLoadState from '../../components/ListLoadState.vue'
import { listPending } from '../../features/records/listLoadState.mjs'
import StorageNote from '../../components/StorageNote.vue'
import PageActions from '../../components/PageActions.vue'
const ddayMode = ddayStore.mode

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
      <button :class="{ selected: filter === '전체' }" @click="filter = '전체'">{{ tr('전체 {n}', { n: ddays.filter((d) => !isPast(d.dday)).length }) }}</button>
      <button :class="{ selected: filter === '고정됨' }" @click="filter = '고정됨'">{{ tr('고정됨 {n}', { n: ddays.filter((d) => d.pinned).length }) }}</button>
      <button :class="{ selected: filter === '지난 일정' }" @click="filter = '지난 일정'">{{ tr('지난 일정') }}</button>
    </div>
    <span></span>
    <PageActions><button class="primary" @click="openPostComposer('D-Day')">{{ tr('+ D-Day 추가') }}</button></PageActions>
  </div>
  <StorageNote :mode="ddayMode" />
  <p v-if="ddayNotice.message" class="input-field-help" data-state="error" role="status">{{ tr(ddayNotice.message) }}</p>
  <ListLoadState :store="ddayStore" loading="D-Day를 불러오는 중이에요." failed="D-Day를 불러오지 못했어요. 연결을 확인하고 다시 시도해 주세요." />
  <div class="metrics">
    <article v-for="d in filteredDdays" :key="d.id" class="dday-card" style="cursor: pointer" @click="router.push(`/dday/${d.id}`)">
      <div class="head">
        <span class="tag">{{ tr(d.category) }}</span>
        <button type="button" class="icon-button dday-pin" :class="{ pinned: d.pinned }" :title="d.pinned ? tr('고정 해제') : tr('고정하기')" :aria-label="d.pinned ? tr('{name} 고정 해제', { name: d.title }) : tr('{name} 고정하기', { name: d.title })" :aria-pressed="!!d.pinned" @click.stop="togglePin(d)"><AppIcon name="star" :size="18" /></button>
      </div>
      <h3><RouterLink :to="`/dday/${d.id}`" class="card-link" @click.stop>{{ d.title }}</RouterLink></h3>
      <p>{{ shownDate(d) }}</p>
      <b class="dday-num">{{ d.dday }}</b>
      <small class="dday-notify">{{ tr('알림 · {when}', { when: notifyLabel(d, tr) }) }}</small>
    </article>
    <p v-if="filteredDdays.length === 0 && !listPending(ddayStore)" style="grid-column: 1 / -1">{{ tr('표시할 항목이 없어요.') }}</p>
  </div>

</template>
