<script setup>
import { computed, ref } from 'vue'

/**
 * 업무 리포트 — 일간/주간/월간/연간 탭이 실제로 데이터를 바꾼다.
 * AI 업무보고 초안은 선택한 기간의 집계에서 그대로 생성한다.
 */
const PERIODS = [
  {
    key: '일간',
    caption: '8월 24일 (토) 업무 리포트',
    totalMin: 412,
    doneCount: 5,
    planRate: 88,
    bars: [
      { label: '개발', plan: 180, actual: 205 },
      { label: '회의', plan: 90, actual: 100 },
      { label: '기획', plan: 60, actual: 52 },
      { label: '문서화', plan: 60, actual: 55 },
    ],
    highlights: ['인증 흐름 설계 리뷰 완료', 'API 명세 2건 확정'],
    risks: ['회의가 예상보다 10분 길어짐'],
  },
  {
    key: '주간',
    caption: '8월 4주차 업무 리포트',
    totalMin: 1960,
    doneCount: 14,
    planRate: 92,
    bars: [
      { label: '개발', plan: 900, actual: 1020 },
      { label: '회의', plan: 420, actual: 470 },
      { label: '기획', plan: 360, actual: 300 },
      { label: '문서화', plan: 240, actual: 170 },
    ],
    highlights: ['타임바 리뉴얼 1차 QA 통과', '주간 목표 14건 중 14건 완료'],
    risks: ['문서화 시간이 계획 대비 70분 부족'],
  },
  {
    key: '월간',
    caption: '8월 업무 리포트',
    totalMin: 8240,
    doneCount: 58,
    planRate: 86,
    bars: [
      { label: '개발', plan: 3800, actual: 4100 },
      { label: '회의', plan: 1700, actual: 1980 },
      { label: '기획', plan: 1500, actual: 1280 },
      { label: '문서화', plan: 1000, actual: 880 },
    ],
    highlights: ['리뉴얼 마일스톤 2개 달성', '공수 편차 5% 이내 유지'],
    risks: ['회의 비중이 월 목표 대비 4%p 초과'],
  },
  {
    key: '연간',
    caption: '2026년 누적 업무 리포트',
    totalMin: 64800,
    doneCount: 512,
    planRate: 89,
    bars: [
      { label: '개발', plan: 30000, actual: 31200 },
      { label: '회의', plan: 13000, actual: 14600 },
      { label: '기획', plan: 11000, actual: 10200 },
      { label: '문서화', plan: 8000, actual: 7300 },
    ],
    highlights: ['분기 목표 4회 연속 달성', '연간 계획 대비 실행률 89%'],
    risks: ['4분기 회의 시간 증가 추세'],
  },
]

const view = ref('주간')
const active = computed(() => PERIODS.find((p) => p.key === view.value))
const maxBar = computed(() => Math.max(...active.value.bars.flatMap((b) => [b.plan, b.actual])))
const meetingShare = computed(() => {
  const total = active.value.bars.reduce((a, b) => a + b.actual, 0)
  const meeting = active.value.bars.find((b) => b.label === '회의')?.actual ?? 0
  return Math.round((meeting / total) * 100)
})
function hm(min) {
  return Math.floor(min / 60) + 'h ' + (min % 60) + 'm'
}
function pct(v) {
  return Math.round((v / maxBar.value) * 100)
}

// AI 업무보고 초안 — 집계값을 그대로 문장으로 옮긴다
const showReport = ref(false)
const draft = computed(() => {
  const a = active.value
  const lines = [
    '[' + a.caption + ']',
    '',
    '· 총 업무 시간: ' + hm(a.totalMin) + ' / 완료 업무 ' + a.doneCount + '건 / 계획 대비 실행률 ' + a.planRate + '%',
    '· 업무 유형별 실적: ' + a.bars.map((b) => b.label + ' ' + hm(b.actual) + '(계획 ' + hm(b.plan) + ')').join(', '),
    '',
    '주요 성과',
    ...a.highlights.map((h) => '- ' + h),
    '',
    '리스크 · 다음 계획',
    ...a.risks.map((r) => '- ' + r),
  ]
  return lines.join('\n')
})
const copied = ref(false)
async function copyDraft() {
  try {
    await navigator.clipboard.writeText(draft.value)
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  } catch {
    copied.value = false
  }
}
</script>

<template>
  <div class="toolbar">
    <b>{{ active.caption }}</b><span></span>
    <button v-for="p in PERIODS" :key="p.key" :class="{ selected: view === p.key }" @click="view = p.key">{{ p.key }}</button>
  </div>

  <div class="metrics">
    <article><span>총 업무 시간</span><b class="figure" style="font-size: 19px">{{ hm(active.totalMin) }}</b></article>
    <article><span>계획 대비 실행</span><b class="figure" style="font-size: 19px">{{ active.planRate }}%</b></article>
    <article><span>완료 업무</span><b class="figure" style="font-size: 19px">{{ active.doneCount }}건</b></article>
    <article><span>회의 시간 비중</span><b class="figure" style="font-size: 19px">{{ meetingShare }}%</b></article>
  </div>

  <section class="card" style="margin-top: 16px">
    <div class="head">
      <div><h3 style="margin: 0">업무 유형별 Plan vs Actual</h3><p style="margin: 4px 0 0">{{ active.key }} 기준</p></div>
      <button class="review" style="margin: 0" @click="showReport = !showReport">{{ showReport ? 'AI 업무보고 닫기' : 'AI 업무보고 생성' }}</button>
    </div>
    <div class="chart">
      <div v-for="b in active.bars" :key="b.label">
        <i :style="{ height: pct(b.plan) + '%' }" :title="'계획 ' + hm(b.plan)"></i>
        <b :style="{ height: pct(b.actual) + '%' }" :title="'실제 ' + hm(b.actual)"></b>
        <small>{{ b.label }}</small>
      </div>
    </div>
    <div class="chart-legend">
      <span><i class="swatch plan"></i>계획</span>
      <span><i class="swatch actual"></i>실제</span>
    </div>
  </section>

  <section v-if="showReport" class="card" style="margin-top: 16px">
    <div class="head">
      <div><h3 style="margin: 0">AI 업무보고 초안 · {{ active.key }}</h3><p style="margin: 4px 0 0">집계값을 그대로 문장으로 정리했어요. 수정해서 그대로 제출할 수 있어요.</p></div>
      <button class="review" style="margin: 0" @click="copyDraft">{{ copied ? '복사됨' : '복사' }}</button>
    </div>
    <textarea class="report-draft" :value="draft" readonly rows="14"></textarea>
  </section>
</template>
