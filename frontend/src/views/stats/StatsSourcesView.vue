<!-- 통계 수치 하나를 만든 원본 기록 목록. 목록 합계를 수치와 나란히 보인다(PR-10 6단계, UF-118·UT-200). -->
<script setup>
import { tr } from '../../store/locale'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ShareSignIn from '../../components/share/ShareSignIn.vue'
import { session } from '../../features/auth/session.js'
import { statsClient } from '../../features/stats/stats.js'
import {
  EMPTY_TEXT, RANGES, SOURCE_KIND, figureOf, figureSummary, formatMinutes, sourceRows, sourceTotal, statsErrorText,
} from '../../features/stats/statsClient.mjs'

const route = useRoute()
const router = useRouter()
const key = computed(() => (figureOf(route.query.figure) ? String(route.query.figure) : 'actual'))
const range = computed(() => (RANGES.some((r) => r.id === route.query.range) ? String(route.query.range) : 'week'))
const figure = computed(() => figureOf(key.value))

const stats = ref(null)
const status = ref('idle')
const error = ref('')
async function load() {
  if (!session.userId) { stats.value = null; status.value = 'idle'; return }
  status.value = 'loading'
  error.value = ''
  try {
    stats.value = await statsClient.dashboard(range.value, route.query.date ? String(route.query.date) : '')
    status.value = 'ready'
  } catch (e) {
    error.value = statsErrorText(e)
    status.value = 'error'
  }
}
watch(() => [session.userId, key.value, range.value, route.query.date], load, { immediate: true })

const summary = computed(() => (stats.value ? figureSummary(stats.value, key.value, tr) : null))
// 날짜순, 같은 날은 서버가 준 순서대로 둔다
const rows = computed(() => (stats.value ? [...sourceRows(stats.value, key.value)].sort((a, b) => String(a.date ?? '').localeCompare(String(b.date ?? ''))) : []))
const total = computed(() => sourceTotal(rows.value, key.value))
const isCount = computed(() => figure.value.unit === 'count')
const totalText = computed(() => (isCount.value ? tr('{n}개', { n: total.value }) : formatMinutes(total.value, tr)))
const matches = computed(() => summary.value && total.value === summary.value.value)
</script>

<template>
  <div class="page-tools">
    <button type="button" class="button-secondary" @click="router.push('/stats')">{{ tr('통계 보드로') }}</button>
    <b style="font-size: 1rem">{{ tr('{name} 원본', { name: tr(figure.label) }) }}</b>
    <span></span>
  </div>

  <ShareSignIn v-if="!session.userId" message="통계 원본은 로그인한 계정의 기록으로 계산해요. 로그인하면 수치를 만든 기록을 볼 수 있어요." />
  <p v-else-if="status === 'loading' && !stats" class="input-field-help" role="status">{{ tr('원본 기록을 불러오는 중이에요.') }}</p>
  <section v-else-if="status === 'error'" class="card">
    <div class="empty-state" role="status"><p>{{ tr(error) }}</p><button type="button" class="button-secondary" @click="load">{{ tr('다시 시도') }}</button></div>
  </section>
  <template v-else-if="summary">
    <section class="card source-head">
      <div class="source-figures">
        <div><span>{{ tr(figure.label) }}</span><b class="figure">{{ summary.text }}</b></div>
        <div><span>{{ tr('목록 합계') }}</span><b class="figure">{{ rows.length ? totalText : tr(EMPTY_TEXT) }}</b><small v-if="rows.length">{{ matches ? tr('수치와 같아요.') : tr('수치와 달라요. 새로 고쳐 주세요.') }}</small></div>
        <div><span>{{ tr('기록 수') }}</span><b class="figure">{{ tr('{n}건', { n: summary.count }) }}</b></div>
      </div>
      <p class="input-field-help source-meta">{{ tr('집계 기간') }} <span class="figure">{{ summary.period }}</span> · {{ summary.zone }}</p>
    </section>

    <section class="card list">
      <div class="list-head source-grid">
        <span>{{ tr('날짜') }}</span><span>{{ tr('종류') }}</span><span>{{ tr('제목') }}</span><span>{{ tr('분류') }}</span><span>{{ isCount ? tr('상태') : tr('시간') }}</span>
      </div>
      <div v-for="row in rows" :key="row.kind + ':' + row.id" class="row source-grid">
        <span class="figure">{{ row.date || tr('기한 없음') }}</span>
        <span><span class="tag">{{ tr(SOURCE_KIND[row.kind] ?? row.kind) }}</span></span>
        <label>{{ row.title || tr('제목 없음') }}</label>
        <span>{{ tr(row.category || '-') }}</span>
        <span class="figure">{{ isCount ? tr('완료') : formatMinutes(row.minutes, tr) }}</span>
      </div>
      <p v-if="!rows.length" class="empty-state" role="status">{{ tr('이 기간에는 기록이 아직 없어요. 플래너에서 실제 기록을 남기면 여기에 모여요.') }}</p>
    </section>
  </template>
</template>

<style scoped>
.source-head { margin-bottom: var(--space-xl); }
.source-meta { margin: var(--space-lg) 0 0; }
.source-figures { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--space-xl); }
.source-figures span { display: block; color: var(--color-muted); font-size: var(--type-body-size); }
.source-figures b { display: block; margin-top: var(--space-sm); font-size: 1.375rem; font-weight: var(--type-figure-weight); }
.source-figures small { display: block; margin-top: var(--space-xs); font-size: var(--type-caption-size); color: var(--color-muted); }
.source-grid { grid-template-columns: 110px 110px minmax(0, 1.6fr) minmax(0, .8fr) 100px; }
@media (max-width: 760px) {
  .source-figures { grid-template-columns: minmax(0, 1fr); gap: var(--space-lg); }
}
</style>
