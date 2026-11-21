<script setup>
// 커리어 대시보드(docs/design 03 MN-130 후보, 11 §4.1). 커리어 목표에 따라 영역 순서만 바꾸고, 숫자에는 기간·분모를 함께 보인다.
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import PageActions from '../../components/PageActions.vue'
import { session } from '../../features/auth/session.js'
import { activityStore, applicationStore } from '../../store/careerLedger'
import { careerStore, portfolioStore, resumeStore } from '../../store/career'
import { careerGoal, chooseCareerGoal } from '../../store/careerGoal'
import {
  CAREER_GOALS, DEFAULT_GOAL, activityTypeLabel, applicationStatusLabel, dueLabel, goalOf, isClosedStatus,
  pipelineCounts, recentActivities, resumeProgress, upcomingDates,
} from '../../features/career/careerModel.mjs'
import { localDate } from '../../utils/postValidation.mjs'

const router = useRouter()
const signedIn = computed(() => Boolean(session.userId))
const today = localDate()
const goal = computed(() => goalOf(careerGoal.goal ?? DEFAULT_GOAL))
const goalPicked = computed(() => Boolean(careerGoal.goal))
const choosing = ref(false)
const draftGoal = ref(goal.value.id)
watch(goal, (value) => { if (!choosing.value) draftGoal.value = value.id })
async function saveGoal() {
  if (await chooseCareerGoal(draftGoal.value)) choosing.value = false
}

const activities = computed(() => (signedIn.value ? activityStore.list.value : []))
const applications = computed(() => (signedIn.value ? applicationStore.list.value : []))
const upcoming = computed(() => upcomingDates(applications.value, today, 14))
const pipeline = computed(() => pipelineCounts(applications.value).filter((row) => row.count > 0))
const openCount = computed(() => applications.value.filter((app) => !isClosedStatus(app.status)).length)
const recent = computed(() => recentActivities(activities.value, 5))
const experiences = computed(() => (signedIn.value ? careerStore.list.value : []))
const resumeState = computed(() => resumeProgress(signedIn.value ? resumeStore.state.value : null))
const portfolioCount = computed(() => (signedIn.value ? portfolioStore.list.value.length : 0))
watch(signedIn, (value) => { if (value) resumeStore.load() }, { immediate: true })

/** 저장소별 불러오기 상태. 처음 불러오는 중·실패를 영역마다 사실대로 보인다. */
function loadState(store) {
  if (!signedIn.value) return 'signedOut'
  if (store.state.loading && !store.state.loaded) return 'loading'
  if (store.state.error && !store.state.loaded) return 'error'
  return 'ready'
}
const SECTION_TITLES = { deadlines: '다가오는 마감·면접', pipeline: '지원 진행 현황', activities: '최근 활동', experiences: '경력·경험', documents: '문서 준비' }
const sections = computed(() => goal.value.sections)
</script>

<template>
  <PageActions><button type="button" class="primary" @click="router.push('/career/activities?new=1')">활동 기록하기</button></PageActions>

  <section class="career-context" aria-labelledby="career-goal-title">
    <div>
      <p id="career-goal-title" class="eyebrow">커리어 목표</p>
      <p class="career-goal"><b>{{ goal.label }}</b><span v-if="!goalPicked" class="tag">기본값</span></p>
      <p class="input-field-help">{{ goal.desc }} 목표는 화면 순서만 바꾸고 공개 범위나 권한은 바꾸지 않아요.</p>
    </div>
    <button type="button" class="button-secondary" :aria-expanded="choosing" aria-controls="career-goal-picker" @click="choosing = !choosing">{{ choosing ? '닫기' : '목표 바꾸기' }}</button>
  </section>
  <section v-if="choosing" id="career-goal-picker" class="card career-goal-picker">
    <fieldset>
      <legend>지금 가장 가까운 목표를 골라 주세요</legend>
      <label v-for="option in CAREER_GOALS" :key="option.id" class="goal-option" :class="{ selected: draftGoal === option.id }">
        <input v-model="draftGoal" type="radio" name="career-goal" :value="option.id" />
        <span><b>{{ option.label }}</b><small>{{ option.desc }}</small></span>
        <span v-if="draftGoal === option.id" class="goal-check">선택됨</span>
      </label>
    </fieldset>
    <div class="goal-actions">
      <p class="input-field-help" role="status" :data-state="careerGoal.status === 'failed' ? 'error' : undefined">{{ careerGoal.status === 'saving' ? '저장하는 중이에요.' : careerGoal.message || (signedIn ? '계정에 저장해요.' : '로그아웃 상태라 이 브라우저에 저장해요.') }}</p>
      <button type="button" class="primary" :disabled="careerGoal.status === 'saving'" :aria-busy="careerGoal.status === 'saving' ? 'true' : undefined" @click="saveGoal">{{ careerGoal.status === 'saving' ? '저장하는 중' : '이 목표로 보기' }}</button>
    </div>
  </section>

  <div v-if="!signedIn" class="empty-state career-signed-out" role="status">
    <p>로그인하면 활동·경력·지원 기록을 계정에 모아 볼 수 있어요. 로그아웃 상태에서는 커리어 기록을 저장하지 않아요.</p>
    <router-link class="button-secondary" to="/auth/login">로그인</router-link>
  </div>

  <div v-else class="career-sections">
    <section v-for="(id, index) in sections" :key="id" class="card career-section" :class="{ lead: index === 0 }" :aria-labelledby="'career-' + id">
      <div class="head"><h2 :id="'career-' + id">{{ SECTION_TITLES[id] }}</h2>
        <router-link v-if="id === 'deadlines' || id === 'pipeline'" class="button-text" to="/career/applications">지원 관리</router-link>
        <router-link v-else-if="id === 'activities'" class="button-text" to="/career/activities">전체 보기</router-link>
        <router-link v-else class="button-text" to="/work/career">경력·포트폴리오</router-link>
      </div>

      <template v-if="id === 'deadlines'">
        <p class="input-field-help">오늘부터 14일 안 · 진행 중인 지원 {{ openCount }}건 기준</p>
        <p v-if="loadState(applicationStore) === 'loading'" class="input-field-help" role="status">지원 기록을 불러오는 중이에요.</p>
        <div v-else-if="loadState(applicationStore) === 'error'" class="empty-state" role="status"><p>지원 기록을 불러오지 못했어요.</p><button type="button" class="button-secondary" @click="applicationStore.reload()">다시 시도</button></div>
        <p v-else-if="!upcoming.length" class="empty-state">14일 안에 다가오는 마감이나 면접이 없어요. 지원 관리에서 마감·면접 날짜를 넣으면 여기에 보여요.</p>
        <ul v-else class="career-rows">
          <li v-for="row in upcoming" :key="row.id"><span class="figure">{{ row.date }}</span><span><b>{{ row.company }}</b> · {{ row.title }}</span><span class="tag">{{ row.label }} · {{ dueLabel(row.days) }}</span></li>
        </ul>
      </template>

      <template v-else-if="id === 'pipeline'">
        <p class="input-field-help">전체 지원 {{ applications.length }}건 · 진행 중 {{ openCount }}건</p>
        <p v-if="loadState(applicationStore) === 'loading'" class="input-field-help" role="status">지원 기록을 불러오는 중이에요.</p>
        <p v-else-if="!applications.length" class="empty-state">아직 저장한 지원이 없어요. 관심 있는 공고부터 추가해 보세요.</p>
        <dl v-else class="career-counts">
          <div v-for="row in pipeline" :key="row.id"><dt>{{ row.label }}</dt><dd class="figure">{{ row.count }}건</dd></div>
        </dl>
      </template>

      <template v-else-if="id === 'activities'">
        <p class="input-field-help">전체 활동 {{ activities.length }}건 중 최근 {{ recent.length }}건</p>
        <p v-if="loadState(activityStore) === 'loading'" class="input-field-help" role="status">활동을 불러오는 중이에요.</p>
        <div v-else-if="loadState(activityStore) === 'error'" class="empty-state" role="status"><p>활동을 불러오지 못했어요.</p><button type="button" class="button-secondary" @click="activityStore.reload()">다시 시도</button></div>
        <p v-else-if="!recent.length" class="empty-state">아직 남긴 활동이 없어요. 최근 업무나 학습 성과를 남기면 이력서·포트폴리오에 활용할 수 있어요.</p>
        <ul v-else class="career-rows">
          <li v-for="item in recent" :key="item.id"><span class="figure">{{ item.date }}</span><span>{{ item.title }}</span><span class="tag">{{ activityTypeLabel(item.activityType) }}</span></li>
        </ul>
      </template>

      <template v-else-if="id === 'experiences'">
        <p class="input-field-help">경력 프로젝트 {{ experiences.length }}건</p>
        <p v-if="loadState(careerStore) === 'loading'" class="input-field-help" role="status">경력을 불러오는 중이에요.</p>
        <p v-else-if="!experiences.length" class="empty-state">아직 경력 프로젝트가 없어요. 회사·인턴·프로젝트 경험을 추가하면 활동을 경력에 연결할 수 있어요.</p>
        <ul v-else class="career-rows">
          <li v-for="item in experiences.slice(0, 3)" :key="item.id"><span>{{ item.title }}</span><span class="input-field-help">{{ [item.period, item.role].filter(Boolean).join(' · ') }}</span></li>
        </ul>
      </template>

      <template v-else-if="id === 'documents'">
        <dl class="career-counts">
          <div><dt>이력서 기본 정보</dt><dd class="figure">{{ resumeState.total }}개 중 {{ resumeState.filled }}개 입력</dd></div>
          <div><dt>포트폴리오 항목</dt><dd class="figure">{{ portfolioCount }}건</dd></div>
        </dl>
        <p v-if="resumeState.missing.length" class="input-field-help">{{ resumeState.missing.join(', ') }}을(를) 채우면 이력서를 내보낼 때 바로 쓸 수 있어요.</p>
        <p class="input-field-help">지원 공고별 문서 버전 저장은 아직 준비 중이에요.</p>
      </template>
    </section>
  </div>
</template>

<style scoped>
.career-context { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-start; gap: var(--space-md); margin-bottom: var(--space-lg); }
.career-context .eyebrow { margin: 0; }
.career-goal { display: flex; align-items: center; gap: var(--space-sm); margin: var(--space-xs) 0; font-size: var(--type-title-md-size); }
.career-goal-picker { margin-bottom: var(--space-lg); padding: var(--space-lg); }
.career-goal-picker fieldset { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-sm); margin: 0; padding: 0; border: 0; }
.career-goal-picker legend { margin-bottom: var(--space-sm); font-weight: 600; }
.goal-option { position: relative; display: flex; gap: var(--space-sm); align-items: flex-start; padding: var(--space-md); border: 1px solid var(--color-hairline); border-radius: var(--radius-md); background: var(--color-card); cursor: pointer; }
.goal-option.selected { border-color: var(--color-accent); background: var(--color-accent-soft); }
.goal-option:focus-within { outline: var(--focus-ring-width) solid var(--color-accent); outline-offset: var(--focus-ring-offset); }
.goal-option input { margin-top: var(--space-xs); }
.goal-option span { display: grid; gap: var(--space-xs); }
.goal-option small { color: var(--color-body); font-size: var(--type-body-sm-size); }
.goal-check { margin-left: auto; color: var(--color-accent); font-size: var(--type-caption-size); font-weight: 600; }
.goal-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; align-items: center; gap: var(--space-md); margin-top: var(--space-md); }
.goal-actions p { margin: 0; }
.career-signed-out { display: grid; justify-items: start; gap: var(--space-md); }
.career-sections { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-lg); }
.career-section { padding: var(--space-lg); min-width: 0; }
.career-section.lead { grid-column: 1 / -1; }
.career-section h2 { margin: 0; font-size: var(--type-title-md-size); }
.career-section .head { align-items: center; gap: var(--space-sm); }
.career-rows { display: grid; gap: 0; margin: var(--space-sm) 0 0; padding: 0; list-style: none; }
.career-rows li { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-xs) var(--space-md); padding: var(--space-sm) 0; border-top: 1px solid var(--color-hairline); }
.career-rows li:first-child { border-top: 0; }
.career-rows .tag { margin-left: auto; padding: 0 var(--space-xs); }
.career-counts { display: grid; gap: var(--space-xs); margin: var(--space-sm) 0 0; }
.career-counts div { display: flex; justify-content: space-between; gap: var(--space-md); padding: var(--space-xs) 0; border-top: 1px solid var(--color-hairline); }
.career-counts div:first-child { border-top: 0; }
.career-counts dt { color: var(--color-body); }
.career-counts dd { margin: 0; font-variant-numeric: tabular-nums; }
.figure { font-family: var(--font-mono); font-size: var(--type-time-size); font-variant-numeric: tabular-nums; }
@media (max-width: 860px) { .career-sections, .career-goal-picker fieldset { grid-template-columns: minmax(0, 1fr); } }
</style>
