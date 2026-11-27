<script setup>
import { bodyLocale, tr } from '../../store/locale'
import { formatDate } from '../../features/i18n/locale.mjs'
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { diaries, diaryStore } from '../../store/writing'
import ListLoadState from '../../components/ListLoadState.vue'
import { listPending } from '../../features/records/listLoadState.mjs'
import { moodLabel } from '../../utils/mood.mjs'
import { openPostComposer } from '../../store/appState'
import { localDate } from '../../utils/postValidation.mjs'
import RichText from '../../components/RichText.vue'
import PageActions from '../../components/PageActions.vue'
const router = useRouter()
const route = useRoute()
const month = ref(localDate().slice(0, 7))
watch(() => route.query.month, value => { if (typeof value === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(value)) month.value = value }, { immediate: true })
const view = ref('목록')
// 요일 머리글(일요일부터). 2024-01-07은 일요일이다
const WEEK_HEAD = computed(() => Array.from({ length: 7 }, (_, i) => formatDate(new Date(2024, 0, 7 + i), bodyLocale.value, { weekday: 'short' })))
const visible = computed(() => diaries.value.filter(d => d.date?.startsWith(month.value)).sort((a,b) => b.date.localeCompare(a.date)))
const days = computed(() => new Date(Number(month.value.slice(0,4)), Number(month.value.slice(5,7)), 0).getDate())
const offset = computed(() => new Date(month.value + '-01T00:00:00').getDay())
const dayEntries = day => visible.value.filter(d => Number(d.date.slice(-2)) === day)
</script>
<template>
  <div class="page-tools">
    <label>{{ tr('기록 월') }}<input type="month" v-model="month" /></label><span></span>
    <button class="review" @click="view = view === '목록' ? '캘린더' : '목록'">{{ view === '목록' ? tr('캘린더 보기') : tr('목록 보기') }}</button>
    <PageActions><button class="primary" @click="openPostComposer('다이어리')">{{ tr('다이어리 작성') }}</button></PageActions>
  </div>
  <section v-if="view === '캘린더' && month" class="card">
    <div class="diary-month-grid">
      <b v-for="d in WEEK_HEAD" :key="d">{{ d }}</b>
      <span v-for="n in offset" :key="'blank' + n"></span>
      <button v-for="day in days" :key="day" :disabled="!dayEntries(day).length" @click="router.push({ path: '/diary/entry', query: { id: dayEntries(day)[0].id } })">{{ day }}<small v-if="dayEntries(day).length">{{ tr('{n}건', { n: dayEntries(day).length }) }}</small></button>
    </div>
  </section>
  <div class="diary-list">
    <article v-for="entry in visible" :key="entry.id" class="card">
      <div class="head"><div><span class="tag">{{ entry.date }}<template v-if="moodLabel(entry.mood)"> · {{ tr(moodLabel(entry.mood)) }}</template></span><h3>{{ entry.title }}</h3></div>
        <button @click="router.push({ path: '/diary/entry', query: { id: entry.id } })">{{ tr('열기 →') }}</button></div>
      <p><RichText :text="entry.body" /></p>
    </article>
    <ListLoadState :store="diaryStore" loading="다이어리를 불러오는 중이에요." failed="다이어리를 불러오지 못했어요. 연결을 확인하고 다시 시도해 주세요." />
    <section v-if="!visible.length && !listPending(diaryStore)" class="card"><h3>{{ tr('아직 기록이 없어요') }}</h3><p>{{ tr('새 글 작성에서 오늘의 생각을 남겨보세요.') }}</p></section>
  </div>
</template>
