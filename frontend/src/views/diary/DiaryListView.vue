<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { diaries } from '../../store/writing'
import { openPostComposer } from '../../store/appState'
import { localDate } from '../../utils/postValidation.mjs'
import RichText from '../../components/RichText.vue'
const router = useRouter()
const route = useRoute()
const month = ref(localDate().slice(0, 7))
watch(() => route.query.month, value => { if (typeof value === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(value)) month.value = value }, { immediate: true })
const view = ref('목록')
const visible = computed(() => diaries.value.filter(d => d.date?.startsWith(month.value)).sort((a,b) => b.date.localeCompare(a.date)))
const days = computed(() => new Date(Number(month.value.slice(0,4)), Number(month.value.slice(5,7)), 0).getDate())
const offset = computed(() => new Date(month.value + '-01T00:00:00').getDay())
const dayEntries = day => visible.value.filter(d => Number(d.date.slice(-2)) === day)
</script>
<template>
  <div class="page-tools">
    <label>기록 월<input type="month" v-model="month" /></label><span></span>
    <button class="review" @click="view = view === '목록' ? '캘린더' : '목록'">{{ view === '목록' ? '캘린더 보기' : '목록 보기' }}</button>
    <button class="primary" @click="openPostComposer('다이어리')">다이어리 작성</button>
  </div>
  <section v-if="view === '캘린더' && month" class="card">
    <div class="diary-month-grid">
      <b v-for="d in ['일','월','화','수','목','금','토']" :key="d">{{ d }}</b>
      <span v-for="n in offset" :key="'blank' + n"></span>
      <button v-for="day in days" :key="day" :disabled="!dayEntries(day).length" @click="router.push({ path: '/diary/entry', query: { id: dayEntries(day)[0].id } })">{{ day }}<small v-if="dayEntries(day).length">{{ dayEntries(day).length }}건</small></button>
    </div>
  </section>
  <div class="diary-list">
    <article v-for="entry in visible" :key="entry.id" class="card">
      <div class="head"><div><span class="tag">{{ entry.date }} · {{ entry.mood }}</span><h3>{{ entry.title }}</h3></div>
        <button @click="router.push({ path: '/diary/entry', query: { id: entry.id } })">열기 →</button></div>
      <p><RichText :text="entry.body" /></p>
    </article>
    <section v-if="!visible.length" class="card"><h3>아직 기록이 없어요</h3><p>새 글 작성에서 오늘의 생각을 남겨보세요.</p></section>
  </div>
</template>
