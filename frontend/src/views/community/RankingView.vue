<script setup>
import { computed, ref } from 'vue'
import { workPrivacy, sanitizeForShare } from '../../store/workPrivacy'

/**
 * 달성률 랭킹 — 기간·기준·범위를 고를 수 있고, 내 순위를 항상 함께 보여준다.
 * 업무 카테고리 기록은 sanitizeForShare()로 걸러 랭킹 집계에 절대 들어가지 않는다.
 */
const PERIODS = ['이번 주', '이번 달', '전체 기간']
const METRICS = [
  { id: 'plan', label: '계획 달성률' },
  { id: 'routine', label: '루틴 달성률' },
  { id: 'focus', label: '집중 시간' },
]
const SCOPES = ['전체', '스터디 크루', '운동 갓생방']

const period = ref('이번 주')
const metric = ref('plan')
const scope = ref('전체')

// 각 사용자의 기록. domain이 'work'인 항목은 공유 대상에서 제외된다.
const RAW = [
  { name: '이서연', me: false, group: '스터디 크루', records: [{ domain: 'routine', plan: 94, routine: 90, focus: 620 }] },
  { name: '김지수', me: true, group: '스터디 크루', records: [
    { domain: 'routine', plan: 98, routine: 95, focus: 700 },
    { domain: 'work', plan: 100, routine: 100, focus: 1800 },
  ] },
  { name: '박민준', me: false, group: '운동 갓생방', records: [{ domain: 'routine', plan: 89, routine: 84, focus: 540 }] },
  { name: '최지우', me: false, group: '스터디 크루', records: [{ domain: 'routine', plan: 82, routine: 79, focus: 480 }] },
  { name: '한소율', me: false, group: '운동 갓생방', records: [{ domain: 'routine', plan: 76, routine: 71, focus: 410 }] },
]

const periodFactor = computed(() => ({ '이번 주': 1, '이번 달': 0.96, '전체 기간': 0.92 })[period.value])

const ranked = computed(() => {
  const rows = RAW.filter((u) => scope.value === '전체' || u.group === scope.value).map((u) => {
    // 업무 기록은 공유 payload에서 제거된다(정책상 랭킹 집계 대상 아님)
    const shareable = sanitizeForShare(u.records)
    const total = shareable.reduce((a, r) => a + r[metric.value], 0)
    const value = shareable.length ? Math.round((total / shareable.length) * periodFactor.value) : 0
    return { name: u.name, me: u.me, group: u.group, value, excluded: u.records.length - shareable.length }
  })
  return rows.sort((a, b) => b.value - a.value).map((r, i) => ({ ...r, rank: i + 1 }))
})
const podium = computed(() => {
  const [first, second, third] = ranked.value
  return [second, first, third].filter(Boolean)
})
const rest = computed(() => ranked.value.slice(3))
const myRow = computed(() => ranked.value.find((r) => r.me))
const unit = computed(() => (metric.value === 'focus' ? '분' : '%'))
const maxValue = computed(() => Math.max(1, ...ranked.value.map((r) => r.value)))
</script>

<template>
  <div class="page-tools">
    <div class="filter">
      <button v-for="p in PERIODS" :key="p" :class="{ selected: period === p }" @click="period = p">{{ p }}</button>
    </div>
    <div class="filter">
      <button v-for="m in METRICS" :key="m.id" :class="{ selected: metric === m.id }" @click="metric = m.id">{{ m.label }}</button>
    </div>
    <select v-model="scope" style="border: 1px solid var(--color-hairline); border-radius: var(--radius-sm); padding: 8px 10px; font-size: 0.8125rem; background: var(--color-canvas)">
      <option v-for="s in SCOPES" :key="s">{{ s }}</option>
    </select>
  </div>

  <div class="podium">
    <div style="text-align: center" v-for="p in podium" :key="p.name">
      <div class="podium-avatar" :class="{ top: p.rank === 1 }">{{ p.rank === 1 ? '★' : p.name[0] }}</div>
      <b style="font-size: 0.875rem; display: block">{{ p.name }}</b>
      <small class="figure" style="color: var(--color-muted)">{{ p.value }}{{ unit }}</small>
      <div class="bar" :style="{ height: 24 + (p.value / maxValue) * 44 + 'px', width: p.rank === 1 ? '64px' : '52px' }"></div>
    </div>
  </div>

  <section class="card">
    <div class="event" v-for="r in rest" :key="r.name" :class="{ 'rank-me': r.me }">
      <b class="figure" style="width: 22px">{{ r.rank }}</b>
      <i>{{ r.name[0] }}</i>
      <span style="flex: 1">{{ r.name }}<small v-if="r.me"> · 나</small></span>
      <b class="figure">{{ r.value }}{{ unit }}</b>
    </div>
    <p v-if="!rest.length" class="form-note" style="margin: 0">4위 이하 참가자가 없어요.</p>
  </section>

  <section class="card" style="margin-top: 16px" v-if="myRow">
    <div class="head">
      <div><h3 style="margin: 0">내 순위</h3><p style="margin: 4px 0 0">{{ scope }} · {{ period }} · {{ METRICS.find((m) => m.id === metric).label }}</p></div>
      <b class="figure" style="font-size: 1.375rem">{{ myRow.rank }}위 · {{ myRow.value }}{{ unit }}</b>
    </div>
    <p v-if="myRow.excluded" class="form-note" style="margin-top: 10px">
      업무 카테고리 기록 {{ myRow.excluded }}건은 랭킹 집계에서 제외됐어요. 업무 기록은 다른 사용자에게 공개되지 않습니다.
    </p>
    <p v-if="workPrivacy.excludeFromRanking" class="form-note" style="margin-top: 4px">
      보안 설정에서 ‘랭킹·비교에서 제외’가 켜져 있어요.
    </p>
  </section>
</template>
