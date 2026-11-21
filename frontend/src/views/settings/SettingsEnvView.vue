<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { modeState, modeMeta, setWeekdaySchedule } from '../../store/modeProfiles'
import { appearance, DENSITIES, FONT_SIZES } from '../../store/appearance'
import DayBoundarySettings from '../../components/DayBoundarySettings.vue'
import { careerGoal, chooseCareerGoal } from '../../store/careerGoal'
import { CAREER_GOALS, DEFAULT_GOAL } from '../../features/career/careerModel.mjs'
import { session } from '../../features/auth/session.js'

const router = useRouter()
const modes = ['J', 'P', 'B']
const startScreen = ref('홈 대시보드')
const dateFormat = ref('2026.08.24 (월) · 24시간제')
const weekStart = ref('월요일')
const saved = ref(false)

function save() {
  saved.value = true
  setTimeout(() => (saved.value = false), 2000)
}
</script>

<template>
  <section class="card setting-content">
    <div class="setting-head">
      <div>
        <h2>환경 설정</h2>
        <p>기본 모드에 맞춰 홈 화면 구성과 글양식이 달라져요</p>
      </div>
      <span v-if="saved" class="badge ok">저장했어요</span>
    </div>

    <!-- 커리어 목표(docs/design 03 §5). 고르면 바로 저장하고, 저장이 끝난 뒤에만 완료 문구를 보인다 -->
    <div class="section-label">커리어 목표</div>
    <p class="form-note" style="margin-top: 0">커리어 대시보드에서 먼저 볼 내용을 정해요. 공개 범위나 권한은 바뀌지 않아요.</p>
    <div class="mode-picker career-goal-picker" role="group" aria-label="커리어 목표">
      <button v-for="g in CAREER_GOALS" :key="g.id" type="button" :class="{ selected: (careerGoal.goal || DEFAULT_GOAL) === g.id }" :aria-pressed="(careerGoal.goal || DEFAULT_GOAL) === g.id" :disabled="careerGoal.status === 'saving'" @click="chooseCareerGoal(g.id)">
        <span>{{ g.label }}<small>{{ g.desc }}</small></span>
      </button>
    </div>
    <p class="input-field-help" role="status" :data-state="careerGoal.status === 'failed' ? 'error' : careerGoal.status === 'saved' ? 'success' : undefined">{{ careerGoal.status === 'saving' ? '저장하는 중이에요.' : careerGoal.message || (careerGoal.goal ? '' : '아직 고르지 않아 기본 목표(취업 준비) 순서로 보여요.') + (session.userId ? '' : ' 로그아웃 상태에서는 이 브라우저에 저장해요.') }}</p>

    <div class="section-label" style="margin-top: var(--space-lg)">기본 모드</div>
    <div class="mode-picker">
      <button v-for="m in modes" :key="m" :class="{ selected: modeState.activeMode === m }" @click="modeState.activeMode = m">
        <b>{{ m }}</b>
        <span>{{ modeMeta(m).name }}<small>{{ modeMeta(m).desc }}</small></span>
      </button>
    </div>

    <!-- 평일·주말 기본 모드(PR-19 UF-133). 하루 모드와 같이 이 브라우저에만 저장한다 -->
    <label class="task weekday-mode-toggle">
      <input type="checkbox" :checked="modeState.weekdaySchedule.enabled" aria-describedby="weekday-mode-help" @change="setWeekdaySchedule({ enabled: $event.target.checked })" />
      <span><b>평일과 주말에 다른 모드 쓰기</b><small id="weekday-mode-help">날짜가 바뀌면 그날 모드로 바꿔요. 그날 직접 고른 모드와 작성 중인 글은 그대로예요.</small></span>
    </label>
    <div v-if="modeState.weekdaySchedule.enabled" class="form-row weekday-mode-pick">
      <label>평일(월~금)<select :value="modeState.weekdaySchedule.weekday" @change="setWeekdaySchedule({ weekday: $event.target.value })"><option v-for="m in modes" :key="m" :value="m">{{ modeMeta(m).name }}</option></select></label>
      <label>주말(토·일)<select :value="modeState.weekdaySchedule.weekend" @change="setWeekdaySchedule({ weekend: $event.target.value })"><option v-for="m in modes" :key="m" :value="m">{{ modeMeta(m).name }}</option></select></label>
    </div>
    <p v-if="modeState.weekdaySchedule.enabled" class="form-note weekday-mode-note">켜거나 바꾸면 오늘 모드도 바로 맞춰요. 날짜가 바뀌는 시각은 아래 '하루의 기준'을 따르고, 설정은 이 브라우저에 저장돼요.</p>

    <div class="form-style-cta">
      <div>
        <b>일정·루틴·업무 글양식 · 화면 구성</b>
        <p>모드별로 작성 항목과 홈·통계 포틀릿 구성을 직접 고를 수 있어요. 바꿔도 이미 쓴 글은 그대로 유지돼요.</p>
      </div>
      <button type="button" class="button-secondary" @click="router.push('/settings/forms')">글양식 설정하기</button>
    </div>

    <div class="section-label" style="margin-top: 22px">화면 밀도</div>
    <p class="form-note" style="margin-top: 0">간격과 글자 크기를 바꾸면 앱 전체에 바로 적용돼요.</p>
    <div class="density-picker">
      <button
        v-for="(d, key) in DENSITIES"
        :key="key"
        :class="{ selected: appearance.density === key }"
        @click="appearance.density = key"
      >
        <span class="density-preview" :style="{ '--p': d.scale }"><i></i><i></i><i></i></span>
        <b>{{ d.label }}</b>
        <small>{{ d.desc }}</small>
      </button>
    </div>

    <div class="section-label" style="margin-top: 20px">글자 크기</div>
    <div class="filter" style="width: fit-content; margin-top: 8px">
      <button v-for="(f, key) in FONT_SIZES" :key="key" :class="{ selected: appearance.fontSize === key }" @click="appearance.fontSize = key">
        {{ f.label }}
      </button>
    </div>

    <label class="task" style="border: 0; margin-top: 14px; display: inline-flex;">
      <input type="checkbox" v-model="appearance.reduceMotion" />
      <span style="flex: 1"><b>동작 줄이기</b><small>전환 효과와 애니메이션을 최소화해요</small></span>
    </label>

    <!-- 점수 숨기기(PR-19 UF-136). 이 브라우저에만 저장한다. 랭킹 참여는 계정 설정이라 랭킹 화면에서 바꾼다 -->
    <label class="task weekday-mode-toggle">
      <input type="checkbox" v-model="appearance.hideScores" aria-describedby="hide-scores-help" />
      <span><b>점수 숨기기</b><small id="hide-scores-help">홈·통계의 갓생 점수를 보이지 않게 해요. 기록과 계산은 그대로이고, 이 브라우저에만 저장돼요. 랭킹에서 빠지려면 랭킹 화면의 '랭킹에 나를 보이기'를 끄세요.</small></span>
    </label>

    <DayBoundarySettings />

    <div class="section-label" style="margin-top: 22px">기본값</div>
    <label>시작 화면<select v-model="startScreen"><option>홈 대시보드</option><option>플래너</option><option>할 일</option><option>통계 보드</option></select></label>
    <label>날짜/시간 포맷<select v-model="dateFormat"><option>2026.08.24 (월) · 24시간제</option><option>2026-08-24 · 12시간제</option><option>8월 24일 토요일 · 24시간제</option></select></label>
    <label>한 주의 시작<select v-model="weekStart"><option>월요일</option><option>일요일</option></select></label>

    <button class="primary" @click="save">저장하기</button>
  </section>
</template>

<style scoped>
/* 커리어 목표는 4개라 2열로 둔다. 좁은 화면은 공통 mode-picker 규칙처럼 1열로 쌓는다 */
.career-goal-picker { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.career-goal-picker span { display: grid; gap: var(--space-xs); }
@media (max-width: 760px) { .career-goal-picker { grid-template-columns: minmax(0, 1fr); } }
.weekday-mode-toggle { display: inline-flex; margin-top: var(--space-lg); border: 0; }
.weekday-mode-toggle span { flex: 1; }
.weekday-mode-note { margin-top: 0; }
@media (max-width: 480px) { .weekday-mode-pick { flex-direction: column; } }
</style>
