<script setup>
import AppIcon from '../../components/icons/AppIcon.vue'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { appearance } from '../../store/appearance'
import { isAutomationOn, toggleAutomation } from '../../store/automations'
import { routines, tasks, routineRate } from '../../store/appState'
import HelpPopover from '../../components/HelpPopover.vue'
import { workPrivacy } from '../../store/workPrivacy'

/**
 * 갓생 리포트 — 루틴·할 일·집중 시간을 가중 합산해 점수를 낸다.
 * 업무 기록은 정책상 비교·랭킹 대상이 아니므로 점수 계산에 넣지 않는다.
 */
const router = useRouter()
const RANGES = ['이번 주', '지난주', '이번 달']
const range = ref('이번 주')

const WEIGHTS = { routine: 40, task: 35, focus: 25 }
const FOCUS_TARGET_MIN = 900 // 주간 목표 집중 시간(분)

const focusMinutes = computed(() => ({ '이번 주': 780, 지난주: 690, '이번 달': 3120 })[range.value])
const focusTarget = computed(() => (range.value === '이번 달' ? FOCUS_TARGET_MIN * 4 : FOCUS_TARGET_MIN))

const routineScore = computed(() => {
  if (!routines.value.length) return 0
  const avg = routines.value.reduce((a, r) => a + routineRate(r), 0) / routines.value.length
  return Math.round((avg / 100) * WEIGHTS.routine)
})
const taskScore = computed(() => {
  if (!tasks.value.length) return 0
  const rate = tasks.value.filter((t) => t.done).length / tasks.value.length
  return Math.round(rate * WEIGHTS.task)
})
const focusScore = computed(() => Math.round(Math.min(1, focusMinutes.value / focusTarget.value) * WEIGHTS.focus))
const total = computed(() => routineScore.value + taskScore.value + focusScore.value)
const lastWeekTotal = 82
const delta = computed(() => total.value - lastWeekTotal)

const breakdown = computed(() => [
  { label: '루틴 달성', score: routineScore.value, max: WEIGHTS.routine, note: '최근 7일 평균 달성률' },
  { label: '할 일 완료', score: taskScore.value, max: WEIGHTS.task, note: tasks.value.filter((t) => t.done).length + '/' + tasks.value.length + '건 완료' },
  { label: '집중 시간', score: focusScore.value, max: WEIGHTS.focus, note: hm(focusMinutes.value) + ' / 목표 ' + hm(focusTarget.value) },
])
function hm(min) {
  return Math.floor(min / 60) + '시간 ' + (min % 60) + '분'
}

const GOLDEN_HOURS = [
  { h: '6시', v: 20 }, { h: '8시', v: 30 }, { h: '9시', v: 85 }, { h: '10시', v: 92 },
  { h: '11시', v: 78 }, { h: '13시', v: 35 }, { h: '15시', v: 25 }, { h: '17시', v: 45 },
  { h: '20시', v: 60 }, { h: '22시', v: 20 },
]
const goldenHour = computed(() => {
  const top = [...GOLDEN_HOURS].sort((a, b) => b.v - a.v).slice(0, 2)
  return top.map((t) => t.h).join(' ~ ')
})

const BADGES = [
  // 뱃지 표식은 앱 선 아이콘이다(DESIGN.md 7장: 장식 이모지를 상태 아이콘으로 쓰지 않는다)
  { id: 'streak', icon: 'repeat', label: '연속 기록', desc: '12일 연속 기록', earned: true },
  { id: 'morning', icon: 'sun', label: '아침형 인간', desc: '오전 집중 3주 연속', earned: true },
  { id: 'mvp', icon: 'star', label: '이번 주 MVP', desc: '그룹 내 달성률 1위', earned: true },
  { id: 'perfect', icon: 'target', label: '퍼펙트 위크', desc: '한 주 모든 루틴 달성', earned: false },
]
const earnedBadges = computed(() => BADGES.filter((b) => b.earned))

const summary = computed(() => {
  const strongest = [...breakdown.value].sort((a, b) => b.score / b.max - a.score / a.max)[0]
  const weakest = [...breakdown.value].sort((a, b) => a.score / a.max - b.score / b.max)[0]
  return strongest.label + '이(가) 가장 잘 유지됐고, ' + weakest.label + '은(는) 조금 여유가 있었어요. 집중은 ' + goldenHour.value + '에 가장 잘 됐습니다.'
})
</script>

<template>
  <div class="page-tools">
    <HelpPopover
      title="갓생 점수 계산법"
      summary="루틴·할 일·집중 시간을 가중 합산해 100점 만점으로 계산해요. 미완료를 벌점으로 깎지 않고, 해낸 만큼만 더합니다."
      formula="점수 = 루틴 달성률×40 + 할 일 완료율×35 + min(집중시간÷목표, 1)×25"
      :steps="[
        '기간을 고르면 그 기간 기준으로 다시 계산돼요.',
        '항목별 막대에서 어디서 점수가 빠졌는지 확인해요.',
        '골든타임을 참고해 집중이 잘 되는 시간에 어려운 일을 배치해요.',
      ]"
      :terms="[
        { term: '루틴 달성률', desc: '각 루틴의 최근 7일 체크 비율을 평균낸 값이에요.' },
        { term: '골든타임', desc: '집중 기록이 가장 많이 남은 시간대예요.' },
      ]"
      :tips="['업무 카테고리 기록은 점수와 비교에 쓰이지 않아요.']"
    />
    <span></span>
    <div class="filter">
      <button v-for="r in RANGES" :key="r" :class="{ selected: range === r }" @click="range = r">{{ r }}</button>
    </div>
  </div>

  <!-- 점수 숨기기(UF-136): 점수와 점수 구성만 감춘다. 골든타임·뱃지는 점수가 아니라 그대로 둔다 -->
  <section v-if="appearance.hideScores" class="card empty-state" style="margin-bottom: 16px" role="status">
    <p>점수를 숨겨 두었어요. 기록과 계산은 그대로예요.</p>
    <button type="button" class="button-secondary" @click="router.push('/settings/env')">환경 설정에서 다시 켜기</button>
  </section>
  <template v-else>
  <section class="card hero" style="margin-bottom: 16px; align-items: center">
    <div>
      <span class="pill">지난주 대비 {{ delta >= 0 ? '+' : '' }}{{ delta }}점</span>
      <p style="margin-top: 12px; max-width: 46ch">{{ summary }}</p>
    </div>
    <strong class="figure">{{ total }}</strong>
  </section>

  <section class="card" style="margin-bottom: 16px">
    <h3>점수 구성</h3>
    <div v-for="b in breakdown" :key="b.label" class="rate-row">
      <span>{{ b.label }}<small style="display: block; color: var(--color-muted)">{{ b.note }}</small></span>
      <div class="progress"><em :style="{ width: (b.score / b.max) * 100 + '%' }"></em></div>
      <b class="figure">{{ b.score }}/{{ b.max }}</b>
    </div>
  </section>
  </template>

  <div class="three godlife-grid">
    <section class="card">
      <h3>골든 타임 존</h3>
      <div class="chart">
        <div v-for="g in GOLDEN_HOURS" :key="g.h"><b :style="{ height: g.v + '%' }"></b><small>{{ g.h }}</small></div>
      </div>
      <p>{{ goldenHour }}가 가장 집중도가 높은 골든타임이에요.</p>
    </section>

    <section class="card">
      <h3>획득 뱃지 {{ earnedBadges.length }}/{{ BADGES.length }}</h3>
      <div class="badge-grid">
        <div v-for="b in BADGES" :key="b.id" class="badge-item" :class="{ locked: !b.earned }" :title="b.desc">
          <i aria-hidden="true"><AppIcon :name="b.icon" :size="18" /></i>
          <span><b>{{ b.label }}</b><small>{{ b.desc }}{{ b.earned ? '' : ' · 아직 얻지 않음' }}</small></span>
        </div>
      </div>
    </section>
  </div>

  <section class="card" style="margin-top: 16px; display: flex; align-items: center; gap: 12px">
    <span class="godlife-mail" aria-hidden="true"><AppIcon name="mail" /></span>
    <span style="flex: 1">
      <b>매주 갓생 리포트 메일로 받기</b><br />
      <small>매주 월요일 오전 9시 · <RouterLink to="/settings/automation" class="inline-link">자동화 설정에서 관리</RouterLink></small>
    </span>
    <button type="button" role="switch" class="toggle" aria-label="매주 갓생 리포트 메일로 받기" :aria-checked="isAutomationOn('weekly-report')" :class="{ on: isAutomationOn('weekly-report') }" @click="toggleAutomation('weekly-report')"><em></em></button>
  </section>

  <p class="form-note" style="margin-top: 12px">
    업무 카테고리 기록은 점수 계산과 사용자 비교에 포함되지 않아요.
    <template v-if="workPrivacy.excludeFromRanking"> 보안 설정에서 ‘랭킹·비교에서 제외’도 켜져 있어요.</template>
  </p>
</template>

<style scoped>
/* 넓은 화면은 골든타임을 넓게, 760px 이하는 전역 .three 규칙처럼 1열로 쌓는다. 인라인 열 지정이 좁은 화면 규칙을 덮어 뱃지 글자가 한두 자씩 줄바꿈되던 문제를 고쳤다 */
.godlife-grid { grid-template-columns: 1.3fr 0.7fr; }
@media (max-width: 760px) { .godlife-grid { grid-template-columns: minmax(0, 1fr); } }
</style>
