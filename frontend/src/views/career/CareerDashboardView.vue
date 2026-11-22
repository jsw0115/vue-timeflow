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
  CAREER_GOALS, DEFAULT_GOAL, activityTypeLabel, dueLabel, goalOf, isClosedStatus,
  pipelineCounts, recentActivities, resumeProgress, shortDate, timebarDays, upcomingDates, weekdayLabel,
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
// upcoming은 남은 날 오름차순이라 첫 행이 가장 가까운 날이다
const nearestDays = computed(() => upcoming.value[0]?.days ?? null)
const timebar = computed(() => timebarDays(upcoming.value, today, 14))
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

/** 영역 제목·바로가기. 같은 화면으로 가는 링크도 영역마다 무엇을 여는지 다르게 부른다. wide는 목록이 긴 영역이라 넓은 칸을 쓴다. */
const SECTIONS = {
  deadlines: { title: '다가오는 마감·면접', to: '/career/applications', link: '지원 관리', store: applicationStore, wide: true },
  pipeline: { title: '지원 진행 현황', to: '/career/applications', link: '단계별 보기', store: applicationStore },
  activities: { title: '최근 활동', to: '/career/activities', link: '활동 타임라인', store: activityStore, wide: true },
  experiences: { title: '경력·경험', to: '/work/career', link: '경력 기록', store: careerStore },
  documents: { title: '문서 준비', to: '/work/career', link: '이력서·포트폴리오', store: null },
}
/** 영역 머리 아래의 기간·분모 문구. 불러오기가 끝나기 전에는 0건처럼 보이지 않게 숨긴다. */
const sectionMeta = computed(() => ({
  deadlines: `오늘부터 14일 · 진행 중인 지원 ${openCount.value}건 기준`,
  pipeline: `전체 지원 ${applications.value.length}건 · 진행 중 ${openCount.value}건`,
  activities: `전체 활동 ${activities.value.length}건 중 최근 ${recent.value.length}건`,
  experiences: `경력 프로젝트 ${experiences.value.length}건`,
  documents: '',
}))
const metaFor = (id) => (SECTIONS[id].store && loadState(SECTIONS[id].store) !== 'ready' ? '' : sectionMeta.value[id])
const sections = computed(() => goal.value.sections)
</script>

<template>
  <PageActions><button type="button" class="primary" @click="router.push('/career/activities?new=1')">활동 기록하기</button></PageActions>

  <section class="career-context" aria-labelledby="career-goal-title">
    <div>
      <p id="career-goal-title" class="eyebrow">커리어 목표</p>
      <p class="career-goal"><b>{{ goal.label }}</b><span v-if="!goalPicked" class="tag">기본값</span></p>
      <p class="career-goal-desc">{{ goal.desc }}</p>
    </div>
    <button type="button" class="button-secondary" :aria-expanded="choosing" aria-controls="career-goal-picker" @click="choosing = !choosing">{{ choosing ? '닫기' : '목표 바꾸기' }}</button>
  </section>
  <section v-if="choosing" id="career-goal-picker" class="card career-goal-picker">
    <fieldset aria-describedby="career-goal-note">
      <legend>지금 가장 가까운 목표를 골라 주세요</legend>
      <p id="career-goal-note" class="career-goal-note">목표는 화면 순서만 바꾸고 공개 범위나 권한은 바꾸지 않아요.</p>
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
    <section v-for="(id, index) in sections" :key="id" class="card career-section" :class="{ lead: index === 0, wide: SECTIONS[id].wide }" :aria-labelledby="'career-' + id">
      <div class="career-section-head">
        <div class="head">
          <h2 :id="'career-' + id">{{ SECTIONS[id].title }}</h2>
          <router-link class="button-text" :to="SECTIONS[id].to">{{ SECTIONS[id].link }}</router-link>
        </div>
        <p v-if="metaFor(id)" class="input-field-help">{{ metaFor(id) }}</p>
      </div>

      <template v-if="id === 'deadlines'">
        <p v-if="loadState(applicationStore) === 'loading'" class="input-field-help" role="status">지원 기록을 불러오는 중이에요.</p>
        <div v-else-if="loadState(applicationStore) === 'error'" class="empty-state" role="status"><p>지원 기록을 불러오지 못했어요.</p><button type="button" class="button-secondary" @click="applicationStore.reload()">다시 시도</button></div>
        <p v-else-if="!upcoming.length" class="empty-state">14일 안에 다가오는 마감이나 면접이 없어요. 지원 관리에서 마감·면접 날짜를 넣으면 여기에 보여요.</p>
        <template v-else>
          <!-- 14일 시간축: 로고와 같은 문법으로 오늘은 세로 기준선, 앞으로의 계획은 점선 위 표식이다. 같은 내용을 아래 목록이 글로 준다 -->
          <div class="career-timebar" :style="{ '--days': timebar.length }" aria-hidden="true">
            <span v-for="day in timebar" :key="day.date" class="career-day" :class="{ today: day.offset === 0, marked: day.marks.length, 'month-start': day.monthStart }">
              <span class="career-day-marks"><i v-for="mark in day.marks" :key="mark.id" class="career-mark" :class="[mark.field, { next: mark.next }]"></i></span>
              <span class="career-day-label">{{ day.offset === 0 ? '오늘' : day.day }}</span>
            </span>
          </div>
          <ul class="career-rows career-due">
            <li v-for="row in upcoming" :key="row.id" :class="{ next: row.days === nearestDays }">
              <i class="career-mark" :class="[row.field, { next: row.days === nearestDays }]" aria-hidden="true"></i>
              <span class="career-date">{{ shortDate(row.date, today) }} <small>{{ weekdayLabel(row.date) }}</small></span>
              <span class="career-title"><b>{{ row.company }}</b> · {{ row.title }}</span>
              <span class="career-side"><small>{{ row.label }}</small> <span class="career-due-days">{{ dueLabel(row.days) }}</span></span>
            </li>
          </ul>
        </template>
      </template>

      <template v-else-if="id === 'pipeline'">
        <p v-if="loadState(applicationStore) === 'loading'" class="input-field-help" role="status">지원 기록을 불러오는 중이에요.</p>
        <div v-else-if="loadState(applicationStore) === 'error'" class="empty-state" role="status"><p>지원 기록을 불러오지 못했어요.</p><button type="button" class="button-secondary" @click="applicationStore.reload()">다시 시도</button></div>
        <p v-else-if="!applications.length" class="empty-state">아직 저장한 지원이 없어요. 관심 있는 공고부터 추가해 보세요.</p>
        <template v-else>
          <!-- 단계별 비율 막대. 앞 단계일수록 옅고, 끝난 지원은 빗금이다. 수치는 아래 범례가 글로 준다 -->
          <div class="career-stack" aria-hidden="true">
            <span v-for="row in pipeline" :key="row.id" :data-status="row.id" :style="{ flexGrow: row.count }"></span>
          </div>
          <dl class="career-legend">
            <div v-for="row in pipeline" :key="row.id"><dt><i class="career-swatch" :data-status="row.id" aria-hidden="true"></i>{{ row.label }}</dt><dd>{{ row.count }}건</dd></div>
          </dl>
        </template>
      </template>

      <template v-else-if="id === 'activities'">
        <p v-if="loadState(activityStore) === 'loading'" class="input-field-help" role="status">활동을 불러오는 중이에요.</p>
        <div v-else-if="loadState(activityStore) === 'error'" class="empty-state" role="status"><p>활동을 불러오지 못했어요.</p><button type="button" class="button-secondary" @click="activityStore.reload()">다시 시도</button></div>
        <p v-else-if="!recent.length" class="empty-state">아직 남긴 활동이 없어요. 최근 업무나 학습 성과를 남기면 이력서·포트폴리오에 활용할 수 있어요.</p>
        <ul v-else class="career-rows career-log">
          <li v-for="item in recent" :key="item.id">
            <span class="career-date">{{ shortDate(item.date, today) }}</span>
            <span class="career-title">{{ item.title }}</span>
            <span class="career-side">{{ activityTypeLabel(item.activityType) }}</span>
          </li>
        </ul>
      </template>

      <template v-else-if="id === 'experiences'">
        <p v-if="loadState(careerStore) === 'loading'" class="input-field-help" role="status">경력을 불러오는 중이에요.</p>
        <div v-else-if="loadState(careerStore) === 'error'" class="empty-state" role="status"><p>경력을 불러오지 못했어요.</p><button type="button" class="button-secondary" @click="careerStore.reload()">다시 시도</button></div>
        <p v-else-if="!experiences.length" class="empty-state">아직 경력 프로젝트가 없어요. 회사·인턴·프로젝트 경험을 추가하면 활동을 경력에 연결할 수 있어요.</p>
        <ul v-else class="career-rows career-plain">
          <li v-for="item in experiences.slice(0, 3)" :key="item.id">
            <span class="career-title">{{ item.title }}</span>
            <span class="career-side">{{ [item.period, item.role].filter(Boolean).join(' · ') }}</span>
          </li>
        </ul>
      </template>

      <template v-else-if="id === 'documents'">
        <dl class="career-rows career-counts">
          <div><dt>이력서 기본 정보</dt><dd>{{ resumeState.total }}개 중 {{ resumeState.filled }}개 입력</dd></div>
          <div><dt>포트폴리오 항목</dt><dd>{{ portfolioCount }}건</dd></div>
        </dl>
        <div class="career-notes">
          <p v-if="resumeState.missing.length">{{ resumeState.missing.join(', ') }} 항목을 채우면 이력서를 내보낼 때 바로 쓸 수 있어요.</p>
          <p>지원 공고별 문서 버전 저장은 아직 준비 중이에요.</p>
        </div>
      </template>
    </section>
  </div>
</template>

<style scoped>
/* 코드 간격 토큰은 DESIGN 이름과 한 칸 어긋난다: --space-xs 4 · sm/md 8 · lg 12 · xl 16 · xxl 24 (tokens.css) */
/* 한국어 문장이 글자 중간에서 끊기지 않게 한다(DESIGN.md 3장) */
.career-context, .career-goal-picker, .career-signed-out, .career-sections { word-break: keep-all; }
.career-context { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-start; gap: var(--space-xl); margin-bottom: var(--space-xxl); }
.career-context .eyebrow { margin: 0; }
.career-goal { display: flex; align-items: center; gap: var(--space-sm); margin: var(--space-xs) 0; font-size: var(--type-title-md-size); }
.career-goal b { font-weight: 600; }
.career-goal-desc { margin: 0; color: var(--color-body); font-size: var(--type-body-sm-size); }

.career-goal-picker { margin-bottom: var(--space-xxl); padding: var(--space-xxl); }
.career-goal-picker fieldset { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-sm); margin: 0; padding: 0; border: 0; }
.career-goal-picker legend { margin-bottom: var(--space-xs); font-weight: 600; }
.career-goal-note { grid-column: 1 / -1; margin: 0 0 var(--space-sm); color: var(--color-body); font-size: var(--type-body-sm-size); }
.goal-option { position: relative; display: flex; gap: var(--space-lg); align-items: flex-start; padding: var(--space-xl); border: 1px solid var(--color-hairline); border-radius: var(--radius-md); background: var(--color-card); cursor: pointer; transition: border-color var(--motion-fast), background-color var(--motion-fast); }
.goal-option:hover { border-color: var(--color-control-border); }
.goal-option.selected { border-color: var(--color-accent); background: var(--color-accent-soft); }
.goal-option:focus-within { outline: var(--focus-ring-width) solid var(--color-accent); outline-offset: var(--focus-ring-offset); }
.goal-option input { margin-top: var(--space-xs); }
.goal-option span { display: grid; gap: var(--space-xs); }
.goal-option b { font-weight: 600; }
.goal-option small { color: var(--color-body); font-size: var(--type-body-sm-size); }
.goal-check { margin-left: auto; color: var(--color-accent); font-size: var(--type-caption-size); font-weight: 600; white-space: nowrap; }
.goal-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; align-items: center; gap: var(--space-xl); margin-top: var(--space-xl); }
.goal-actions p { margin: 0; }
.career-signed-out { display: grid; justify-items: start; gap: var(--space-lg); }

/* 맨 앞 영역은 전체 폭. 나머지는 한 줄에 둘씩, 목록이 긴 영역(wide)은 넓게·요약 영역은 좁게 나눠 같은 크기 카드가 반복되지 않게 한다.
   flex-basis 합이 100%를 넘으면 다음 줄로 내려가므로 wide 둘은 각자 전체 폭을 쓴다 */
.career-sections { display: flex; flex-wrap: wrap; gap: var(--space-xl); }
.career-section { flex: 5 1 38%; display: grid; align-content: start; gap: var(--space-xl); min-width: 0; padding: var(--space-xxl); }
.career-section.wide { flex: 7 1 52%; }
.career-section.lead { flex-basis: 100%; }
.career-section-head { display: grid; gap: var(--space-xs); }
.career-section .head { align-items: center; gap: var(--space-sm); }
.career-section h2 { margin: 0; font-size: var(--type-title-md-size); }
/* 바로가기 글자를 카드 안쪽 오른쪽 끝에 맞춘다. 눌림 영역은 버튼 여백만큼 바깥으로 남긴다 */
.career-section .head .button-text { margin-right: calc(-1 * var(--space-lg)); }
.career-section .input-field-help { margin: 0; }
.career-section .empty-state { padding: 0; }

/* 목록 행: 모든 영역이 같은 높이(24px 줄 + 위아래 8px)와 같은 구분선을 쓴다 */
.career-rows { display: grid; margin: calc(-1 * var(--space-sm)) 0 0; padding: 0; list-style: none; }
.career-rows > li, .career-rows > div { display: grid; align-items: baseline; gap: var(--space-xs) var(--space-lg); padding: var(--space-sm) 0; border-top: 1px solid var(--color-hairline); }
.career-rows > :first-child { border-top: 0; }
.career-date { font-family: var(--font-mono); font-size: var(--type-time-size); font-variant-numeric: tabular-nums; white-space: nowrap; }
.career-date small { color: var(--color-muted); font-family: var(--font-sans); font-size: var(--type-caption-size); }
.career-title { min-width: 0; overflow-wrap: anywhere; }
.career-title b { font-weight: 600; }
.career-side { color: var(--color-muted); font-size: var(--type-body-sm-size); text-align: right; white-space: nowrap; }
.career-due li { grid-template-columns: 12px minmax(4.5rem, max-content) minmax(0, 1fr) auto; }
.career-due .career-mark { align-self: center; }
.career-due-days { color: var(--color-foreground); font-variant-numeric: tabular-nums; }
.career-due li.next .career-due-days { font-weight: 600; }
.career-log li { grid-template-columns: minmax(4.5rem, max-content) minmax(0, 1fr) auto; }
.career-plain li { grid-template-columns: minmax(0, 1fr) auto; }
.career-counts > div { grid-template-columns: minmax(0, 1fr) auto; }
.career-counts dt { color: var(--color-body); }
.career-counts dd { margin: 0; font-variant-numeric: tabular-nums; }
.career-notes { display: grid; gap: var(--space-xs); }
.career-notes p { margin: 0; color: var(--color-muted); font-size: var(--type-body-sm-size); }

/* 마감 ●·면접 ◆ 표식. 아직 오지 않은 계획이라 중립 잉크색이다. 가장 가까운 날은 색이 아니라 바깥 고리 모양으로 강조한다
   (accent 채움은 주 버튼·선택 표식 전용 — design-tokens.test.mjs) */
.career-mark { display: block; flex: none; width: 10px; height: 10px; margin: 1px; border-radius: var(--radius-full); background: var(--color-foreground); }
.career-mark.interviewDate { width: 8px; height: 8px; margin: 2px; border-radius: 0; transform: rotate(45deg); }
.career-mark.next { box-shadow: 0 0 0 2px var(--color-card), 0 0 0 4px var(--color-foreground); }

/* 14일 시간축. 점선 트랙의 세로 중심은 27px, 표식 칸 아래 끝(33px)에서 표식 반 높이만큼 위다. 표식 칸은 둘까지 쌓을 높이다 */
.career-timebar { position: relative; display: grid; grid-template-columns: repeat(var(--days), minmax(0, 1fr)); }
.career-timebar::before { content: ''; position: absolute; top: 26px; left: calc(50% / var(--days)); right: calc(50% / var(--days)); border-top: 2px dashed var(--color-control-border); }
.career-day { position: relative; display: grid; justify-items: center; min-width: 0; padding-top: var(--space-xxl); }
.career-day::after { content: ''; position: absolute; top: 29px; left: 50%; height: 4px; border-left: 1px solid var(--color-control-border); }
.career-day.month-start::after { top: 20px; height: 13px; }
.career-day.today::before { content: ''; position: absolute; top: 15px; left: calc(50% - 1px); width: 2px; height: 24px; border-radius: var(--radius-xs); background: var(--color-foreground); }
.career-day-marks { position: absolute; top: 0; left: 0; right: 0; height: 33px; display: flex; flex-direction: column-reverse; align-items: center; gap: var(--space-sm); }
.career-day-label { margin-top: var(--space-lg); color: var(--color-muted); font-family: var(--font-mono); font-size: var(--type-caption-size); font-variant-numeric: tabular-nums; white-space: nowrap; visibility: hidden; }
.career-day.marked .career-day-label, .career-day.month-start .career-day-label { visibility: visible; }
.career-day.marked .career-day-label { color: var(--color-foreground); }
.career-day.today .career-day-label { visibility: visible; color: var(--color-foreground); font-family: inherit; font-weight: 600; }

/* 지원 단계 누적 막대와 범례. 진행할수록 data 색이 짙어지고, 보류는 중립, 끝난 지원(불합격·철회)은 빗금이다 */
.career-stack { display: flex; gap: 2px; height: 12px; border-radius: var(--radius-xs); overflow: hidden; }
.career-stack span { flex: 1 1 0; min-width: 4px; }
.career-swatch { display: inline-block; flex: none; width: 12px; height: 12px; border-radius: var(--radius-xs); }
:is(.career-stack span, .career-swatch) { background: var(--color-data); }
:is(.career-stack span, .career-swatch)[data-status='interested'] { background: color-mix(in srgb, var(--color-data) 30%, var(--color-card)); }
:is(.career-stack span, .career-swatch)[data-status='preparing'] { background: color-mix(in srgb, var(--color-data) 45%, var(--color-card)); }
:is(.career-stack span, .career-swatch)[data-status='applied'] { background: color-mix(in srgb, var(--color-data) 60%, var(--color-card)); }
:is(.career-stack span, .career-swatch)[data-status='screening-passed'] { background: color-mix(in srgb, var(--color-data) 75%, var(--color-card)); }
:is(.career-stack span, .career-swatch)[data-status='interview'] { background: color-mix(in srgb, var(--color-data) 88%, var(--color-card)); }
:is(.career-stack span, .career-swatch)[data-status='on-hold'] { background: var(--color-control-border); }
:is(.career-stack span, .career-swatch):is([data-status='rejected'], [data-status='withdrawn']) { background: repeating-linear-gradient(135deg, var(--color-control-border) 0 1.5px, var(--color-card) 1.5px 4px); }
.career-legend { display: grid; grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr)); gap: 0 var(--space-block); margin: 0; }
.career-legend > div { display: flex; justify-content: space-between; align-items: center; gap: var(--space-sm); min-width: 0; padding: var(--space-xs) 0; }
.career-legend dt { display: flex; align-items: center; gap: var(--space-sm); color: var(--color-body); font-size: var(--type-body-sm-size); }
.career-legend dd { margin: 0; font-size: var(--type-body-sm-size); font-variant-numeric: tabular-nums; }

@media (max-width: 1150px) { .career-section, .career-section.wide { flex-basis: 100%; } }
@media (max-width: 860px) { .career-goal-picker fieldset { grid-template-columns: minmax(0, 1fr); } }
@media (max-width: 600px) {
  .career-section, .career-goal-picker { padding: var(--space-xl); }
  .career-due li { grid-template-columns: 12px minmax(0, 1fr) auto; grid-template-areas: 'mark date side' '. title title'; }
  .career-due .career-mark { grid-area: mark; }
  .career-due .career-date { grid-area: date; }
  .career-due .career-title { grid-area: title; }
  .career-due .career-side { grid-area: side; }
  .career-log li { grid-template-columns: minmax(0, 1fr) auto; grid-template-areas: 'date side' 'title title'; }
  .career-log .career-date { grid-area: date; }
  .career-log .career-title { grid-area: title; }
  .career-log .career-side { grid-area: side; }
  .career-plain li { grid-template-columns: minmax(0, 1fr); }
  .career-plain .career-side { text-align: left; white-space: normal; }
}
@media (prefers-reduced-motion: reduce) { .goal-option { transition: none; } }
</style>
