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
import { localeState } from '../../store/locale'
import { activityTypeText, careerText, dueText, goalText, resumeFieldText, statusText, upcomingText } from '../../features/i18n/careerMessages.mjs'

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
// 표시 언어(PR-32 Q-38): 커리어 대시보드 본문을 옮긴다. 영어가 없는 문구는 한국어 그대로다
const locale = computed(() => localeState.locale)
const t = (key, vars) => careerText(key, locale.value, vars)
const goalShown = computed(() => goalText(goal.value, locale.value))
const sections = computed(() => goal.value.sections)
</script>

<template>
  <PageActions><button type="button" class="primary" :lang="locale" @click="router.push('/career/activities?new=1')">{{ t('recordActivity') }}</button></PageActions>

  <section class="career-context" aria-labelledby="career-goal-title" :lang="locale">
    <div>
      <p id="career-goal-title" class="eyebrow">{{ t('goalEyebrow') }}</p>
      <p class="career-goal"><b>{{ goalShown.label }}</b><span v-if="!goalPicked" class="tag">{{ t('defaultTag') }}</span></p>
      <p class="input-field-help">{{ goalShown.desc }} {{ t('goalNote') }}</p>
    </div>
    <button type="button" class="button-secondary" :aria-expanded="choosing" aria-controls="career-goal-picker" @click="choosing = !choosing">{{ choosing ? t('close') : t('changeGoal') }}</button>
  </section>
  <section v-if="choosing" id="career-goal-picker" class="card career-goal-picker" :lang="locale">
    <fieldset>
      <legend>{{ t('pickGoal') }}</legend>
      <label v-for="option in CAREER_GOALS" :key="option.id" class="goal-option" :class="{ selected: draftGoal === option.id }">
        <input v-model="draftGoal" type="radio" name="career-goal" :value="option.id" />
        <span><b>{{ goalText(option, locale).label }}</b><small>{{ goalText(option, locale).desc }}</small></span>
        <span v-if="draftGoal === option.id" class="goal-check">{{ t('selected') }}</span>
      </label>
    </fieldset>
    <div class="goal-actions">
      <p class="input-field-help" role="status" :data-state="careerGoal.status === 'failed' ? 'error' : undefined">{{ careerGoal.status === 'saving' ? t('saving') : careerGoal.message || (signedIn ? t('savesToAccount') : t('savesToBrowser')) }}</p>
      <button type="button" class="primary" :disabled="careerGoal.status === 'saving'" :aria-busy="careerGoal.status === 'saving' ? 'true' : undefined" @click="saveGoal">{{ careerGoal.status === 'saving' ? t('savingShort') : t('useGoal') }}</button>
    </div>
  </section>

  <div v-if="!signedIn" class="empty-state career-signed-out" role="status" :lang="locale">
    <p>{{ t('signedOut') }}</p>
    <router-link class="button-secondary" to="/auth/login">{{ t('signIn') }}</router-link>
  </div>

  <div v-else class="career-sections" :lang="locale">
    <section v-for="(id, index) in sections" :key="id" class="card career-section" :class="{ lead: index === 0 }" :aria-labelledby="'career-' + id">
      <div class="head"><h2 :id="'career-' + id">{{ t('section.' + id) }}</h2>
        <router-link v-if="id === 'deadlines' || id === 'pipeline'" class="button-text" to="/career/applications">{{ t('applications') }}</router-link>
        <router-link v-else-if="id === 'activities'" class="button-text" to="/career/activities">{{ t('seeAll') }}</router-link>
        <router-link v-else class="button-text" to="/work/career">{{ t('careerDocs') }}</router-link>
      </div>

      <template v-if="id === 'deadlines'">
        <p class="input-field-help">{{ t('deadlinesBasis', { open: openCount }) }}</p>
        <p v-if="loadState(applicationStore) === 'loading'" class="input-field-help" role="status">{{ t('loadingApplications') }}</p>
        <div v-else-if="loadState(applicationStore) === 'error'" class="empty-state" role="status"><p>{{ t('applicationsFailed') }}</p><button type="button" class="button-secondary" @click="applicationStore.reload()">{{ t('retry') }}</button></div>
        <p v-else-if="!upcoming.length" class="empty-state">{{ t('noUpcoming') }}</p>
        <ul v-else class="career-rows">
          <li v-for="row in upcoming" :key="row.id"><span class="figure">{{ row.date }}</span><span><b>{{ row.company }}</b> · {{ row.title }}</span><span class="tag">{{ upcomingText(row.label, locale) }} · {{ dueText(row.days, locale, dueLabel(row.days)) }}</span></li>
        </ul>
      </template>

      <template v-else-if="id === 'pipeline'">
        <p class="input-field-help">{{ t('pipelineBasis', { all: applications.length, open: openCount }) }}</p>
        <p v-if="loadState(applicationStore) === 'loading'" class="input-field-help" role="status">{{ t('loadingApplications') }}</p>
        <p v-else-if="!applications.length" class="empty-state">{{ t('noApplications') }}</p>
        <dl v-else class="career-counts">
          <div v-for="row in pipeline" :key="row.id"><dt>{{ statusText(row.id, locale, row.label) }}</dt><dd class="figure">{{ t('count', { n: row.count }) }}</dd></div>
        </dl>
      </template>

      <template v-else-if="id === 'activities'">
        <p class="input-field-help">{{ t('activitiesBasis', { all: activities.length, recent: recent.length }) }}</p>
        <p v-if="loadState(activityStore) === 'loading'" class="input-field-help" role="status">{{ t('loadingActivities') }}</p>
        <div v-else-if="loadState(activityStore) === 'error'" class="empty-state" role="status"><p>{{ t('activitiesFailed') }}</p><button type="button" class="button-secondary" @click="activityStore.reload()">{{ t('retry') }}</button></div>
        <p v-else-if="!recent.length" class="empty-state">{{ t('noActivities') }}</p>
        <ul v-else class="career-rows">
          <li v-for="item in recent" :key="item.id"><span class="figure">{{ item.date }}</span><span>{{ item.title }}</span><span class="tag">{{ activityTypeText(item.activityType, locale, activityTypeLabel(item.activityType)) }}</span></li>
        </ul>
      </template>

      <template v-else-if="id === 'experiences'">
        <p class="input-field-help">{{ t('experiencesBasis', { n: experiences.length }) }}</p>
        <p v-if="loadState(careerStore) === 'loading'" class="input-field-help" role="status">{{ t('loadingExperiences') }}</p>
        <p v-else-if="!experiences.length" class="empty-state">{{ t('noExperiences') }}</p>
        <ul v-else class="career-rows">
          <li v-for="item in experiences.slice(0, 3)" :key="item.id"><span>{{ item.title }}</span><span class="input-field-help">{{ [item.period, item.role].filter(Boolean).join(' · ') }}</span></li>
        </ul>
      </template>

      <template v-else-if="id === 'documents'">
        <dl class="career-counts">
          <div><dt>{{ t('resumeBasics') }}</dt><dd class="figure">{{ t('resumeFilled', { total: resumeState.total, filled: resumeState.filled }) }}</dd></div>
          <div><dt>{{ t('portfolioItems') }}</dt><dd class="figure">{{ t('count', { n: portfolioCount }) }}</dd></div>
        </dl>
        <p v-if="resumeState.missing.length" class="input-field-help">{{ t('resumeMissing', { fields: resumeState.missing.map((label) => resumeFieldText(label, locale)).join(', ') }) }}</p>
        <!-- 지원별 문서 버전은 PR-25에서 만들었다. 예전 '준비 중' 문구를 고쳤다 -->
        <p class="input-field-help">{{ t('versionsHint') }}</p>
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
