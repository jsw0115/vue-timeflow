<script setup>
import { computed, ref } from 'vue'

/**
 * 기간 요약 — 프리셋 기간과 직접 지정(사용자 지정 시작/종료)을 모두 지원한다.
 * 프리셋을 고르면 시작·종료 날짜가 자동으로 채워지고, 날짜를 직접 고치면 ‘직접 지정’으로 전환된다.
 */
const TODAY = new Date('2026-08-31')

const PRESETS = [
  { id: 'week', label: '이번 주', days: 7 },
  { id: 'month', label: '이번 달', days: 31 },
  { id: 'quarter', label: '지난 3개월', days: 92 },
  { id: 'half', label: '지난 6개월', days: 183 },
  { id: 'year', label: '올해', days: 243 },
  { id: 'custom', label: '직접 지정', days: null },
]

function iso(d) {
  return d.toISOString().slice(0, 10)
}
function shift(days) {
  const d = new Date(TODAY)
  d.setDate(d.getDate() - days + 1)
  return d
}

const preset = ref('month')
const from = ref(iso(shift(31)))
const to = ref(iso(TODAY))

function applyPreset(p) {
  preset.value = p.id
  if (!p.days) return
  from.value = iso(shift(p.days))
  to.value = iso(TODAY)
}
function onManualDate() {
  preset.value = 'custom'
}

const dayCount = computed(() => {
  const diff = (new Date(to.value).getTime() - new Date(from.value).getTime()) / 86400000
  return Math.max(0, Math.round(diff) + 1)
})
const invalid = computed(() => new Date(to.value) < new Date(from.value))

// 기간 길이에 따라 집계 단위를 자동으로 바꾼다
const bucketUnit = computed(() => {
  if (dayCount.value <= 14) return '일'
  if (dayCount.value <= 92) return '주'
  return '월'
})
const buckets = computed(() => {
  const n = bucketUnit.value === '일' ? Math.min(dayCount.value, 14) : bucketUnit.value === '주' ? Math.ceil(dayCount.value / 7) : Math.ceil(dayCount.value / 30)
  return Array.from({ length: Math.max(1, Math.min(n, 12)) }, (_, i) => {
    const seed = Math.abs(Math.sin((i + 1) * 2.3 + dayCount.value * 0.01))
    return { label: i + 1 + bucketUnit.value, mood: Math.round(40 + seed * 55), written: Math.round(2 + seed * 5) }
  })
})

const written = computed(() => Math.min(dayCount.value, Math.round(dayCount.value * 0.72)))
const highlights = computed(() => Math.max(1, Math.round(dayCount.value / 10)))
const topMood = computed(() => (buckets.value.reduce((a, b) => a + b.mood, 0) / buckets.value.length > 62 ? '좋음' : '보통'))
</script>

<template>
  <div class="page-tools">
    <b style="font-size: 1rem">기간 요약</b>
    <span></span>
    <div class="filter">
      <button v-for="p in PRESETS" :key="p.id" :class="{ selected: preset === p.id }" @click="applyPreset(p)">{{ p.label }}</button>
    </div>
  </div>

  <section class="card" style="margin-bottom: 16px">
    <div class="range-row">
      <label style="margin: 0">시작<input type="date" v-model="from" @change="onManualDate" /></label>
      <span class="range-sep">→</span>
      <label style="margin: 0">종료<input type="date" v-model="to" @change="onManualDate" /></label>
      <span class="badge" :class="invalid ? 'danger' : 'ok'">
        {{ invalid ? '종료일이 시작일보다 빨라요' : dayCount + '일 · ' + bucketUnit + ' 단위 집계' }}
      </span>
    </div>
  </section>

  <template v-if="!invalid">
    <section class="card hero" style="min-height: auto; padding: 24px 28px; flex-direction: column; align-items: flex-start; margin-bottom: 16px">
      <span class="pill">AI 요약</span>
      <p style="margin-top: 12px">
        {{ from }} ~ {{ to }} 사이 {{ written }}일을 기록했어요. 새 프로젝트로 바빴지만 운동 루틴 덕분에 컨디션은 좋았던 기간이에요.
        ‘회의’와 ‘운동’이 가장 자주 등장한 키워드입니다.
      </p>
    </section>

    <div class="metrics" style="margin-bottom: 16px">
      <article><span>작성일</span><b class="figure">{{ written }}<small>일</small></b><small>전체 {{ dayCount }}일 중</small></article>
      <article><span>작성률</span><b class="figure">{{ Math.round((written / dayCount) * 100) }}<small>%</small></b></article>
      <article><span>가장 많은 감정</span><b class="figure" style="font-size: 1.1875rem">{{ topMood }}</b></article>
      <article><span>하이라이트</span><b class="figure">{{ highlights }}<small>건</small></b></article>
    </div>

    <section class="card">
      <h3>감정 변화 추이 · {{ bucketUnit }} 단위</h3>
      <div class="chart">
        <div v-for="b in buckets" :key="b.label">
          <b :style="{ height: b.mood + '%' }" :title="b.label + ' · ' + b.mood"></b>
          <small>{{ b.label }}</small>
        </div>
      </div>
      <p class="form-note" style="margin-top: 12px">기간이 길어지면 일 → 주 → 월 단위로 자동 묶어서 보여줘요.</p>
    </section>
  </template>

  <section v-else class="card">
    <p>기간을 다시 선택해주세요. 종료일은 시작일과 같거나 이후여야 해요.</p>
  </section>
</template>
