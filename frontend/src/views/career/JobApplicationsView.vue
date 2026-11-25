<script setup>
// 취업·이직 지원 관리(docs/design 03 MN-133·04 FD-88 후보·11 §4.5). 공고·지원 단계·마감·면접을 단계별 보드와 목록으로 본다.
import { computed, ref } from 'vue'
import Modal from '../../components/Modal.vue'
import SaveStatus from '../../components/SaveStatus.vue'
import ConflictCompare from '../../components/ConflictCompare.vue'
import PageActions from '../../components/PageActions.vue'
import ApplicationDocumentsPanel from '../../components/ApplicationDocumentsPanel.vue'
import { session } from '../../features/auth/session.js'
import { applicationStore } from '../../store/careerLedger'
import { createSaveState, saveFailureMessage } from '../../features/records/saveState.mjs'
import { APPLICATION_STATUSES, applicationStatusLabel, calendarMonth, daysUntil, dueLabel, isClosedStatus, isWebUrl, shiftMonth } from '../../features/career/careerModel.mjs'
import { localDate } from '../../utils/postValidation.mjs'
import { bodyLocale, tr } from '../../store/locale'
import { formatDate } from '../../features/i18n/locale.mjs'
import { dueText, statusText } from '../../features/i18n/careerMessages.mjs'

const signedIn = computed(() => Boolean(session.userId))
const today = localDate()
const view = ref('board')
const showClosed = ref(false)
const items = computed(() => (signedIn.value ? applicationStore.list.value : []))
const visible = computed(() => (showClosed.value ? items.value : items.value.filter((item) => !isClosedStatus(item.status))))
const columns = computed(() => APPLICATION_STATUSES
  .filter((status) => showClosed.value || !status.closed)
  .map((status) => ({ ...status, items: visible.value.filter((item) => item.status === status.id) })))
// 목록은 마감이 가까운 순, 마감이 없으면 뒤로 보낸다
const sorted = computed(() => [...visible.value].sort((a, b) => (a.deadline || '9999-12-31').localeCompare(b.deadline || '9999-12-31') || a.company.localeCompare(b.company)))
const closedCount = computed(() => items.value.filter((item) => isClosedStatus(item.status)).length)
// 달력 보기(docs/design 11 §4.5). 끝난 지원도 날짜 기록이라 함께 보이되 "끝남"으로 표시한다
const month = ref(today.slice(0, 7))
const weeks = computed(() => calendarMonth(items.value, month.value))
const monthTitle = computed(() => (bodyLocale.value === 'ko' ? `${month.value.slice(0, 4)}년 ${Number(month.value.slice(5))}월` : formatDate(new Date(Number(month.value.slice(0, 4)), Number(month.value.slice(5)) - 1, 1), bodyLocale.value, { year: 'numeric', month: 'long' })))
const agenda = computed(() => weeks.value.flat().filter((cell) => cell.inMonth && cell.items.length))
// 2024-01-01은 월요일이다. 요일 머리글을 고른 언어의 짧은 이름으로 보인다
const WEEK_HEAD = computed(() => Array.from({ length: 7 }, (_, i) => formatDate(new Date(2024, 0, 1 + i), bodyLocale.value, { weekday: 'short' })))
const due = (days) => dueText(days, bodyLocale.value, dueLabel(days))
const status = (id) => statusText(id, bodyLocale.value, applicationStatusLabel(id))
function openApp(appId) { const app = items.value.find((item) => item.id === appId); if (app) open(app) }
function nextDate(item) {
  const parts = []
  const deadline = daysUntil(item.deadline, today), interview = daysUntil(item.interviewDate, today)
  if (deadline !== null) parts.push(tr('마감 {date} ({due})', { date: item.deadline, due: due(deadline) }))
  if (interview !== null) parts.push(tr('면접 {date} ({due})', { date: item.interviewDate, due: due(interview) }))
  return parts.join(' · ')
}
const listMessage = ref('')

const editor = ref(null)
const saving = createSaveState({ fields: { title: ['title', '포지션'], company: ['company', '회사'], postingUrl: ['postingUrl', '공고 주소'], deadline: ['deadline', '지원 마감'] } })
const conflict = ref(null)
const FIELDS = ['title', 'company', 'status', 'postingUrl', 'employmentType', 'workType', 'salaryRange', 'deadline', 'appliedDate', 'interviewDate', 'body']
function open(item = null) {
  saving.reset()
  conflict.value = null
  const draft = Object.fromEntries(FIELDS.map((key) => [key, item?.[key] ?? '']))
  if (!draft.status) draft.status = 'interested'
  editor.value = { base: item ? { ...item } : null, draft }
}
const urlOk = computed(() => !editor.value?.draft.postingUrl.trim() || isWebUrl(editor.value.draft.postingUrl))
const canSave = computed(() => Boolean(editor.value?.draft.title.trim() && editor.value.draft.company.trim()) && urlOk.value)
const values = () => ({ ...editor.value.draft, title: editor.value.draft.title.trim(), company: editor.value.draft.company.trim(), postingUrl: editor.value.draft.postingUrl.trim() })
async function save() {
  if (!canSave.value) return
  const { base } = editor.value
  conflict.value = null
  const result = await saving.run(() => (base ? applicationStore.update(base, values()) : applicationStore.create(values())))
  if (result.ok) { editor.value = null; return }
  if (result.error.kind === 'conflict') conflict.value = { latest: { ...(result.error.latest ?? base) } }
}
const compareRows = computed(() => {
  if (!conflict.value) return []
  const latest = conflict.value.latest, mine = values()
  return [
    { label: '회사 · 포지션', mine: mine.company + ' · ' + mine.title, latest: (latest.company ?? '') + ' · ' + (latest.title ?? '') },
    { label: '상태', mine: status(mine.status), latest: status(latest.status) },
    { label: '마감 · 면접', mine: [mine.deadline, mine.interviewDate].filter(Boolean).join(' · '), latest: [latest.deadline, latest.interviewDate].filter(Boolean).join(' · ') },
  ]
})
function keepMine() { editor.value.base = { ...conflict.value.latest }; conflict.value = null; save() }
function useLatest() { open(conflict.value.latest) }
async function remove(item) {
  if (!window.confirm(tr('‘{name}’ 지원 기록을 삭제할까요?', { name: item.company + ' · ' + item.title }))) return
  listMessage.value = ''
  try { await applicationStore.remove(item) } catch (error) {
    if (error.kind !== 'stale' && error.kind !== 'notFound') listMessage.value = error.kind === 'conflict' ? tr('다른 곳에서 먼저 고쳐서 삭제하지 않았어요. 최신 내용을 확인한 뒤 다시 삭제해 주세요.') : tr(saveFailureMessage(error).replace('저장하지', '삭제하지'))
  }
}
</script>

<template>
  <PageActions><button v-if="signedIn" type="button" class="primary" @click="open()">{{ tr('지원 추가') }}</button></PageActions>

  <div v-if="!signedIn" class="empty-state apply-signed-out" role="status">
    <p>{{ tr('로그인하면 관심 공고와 지원 단계, 마감·면접 일정을 계정에 모아 관리할 수 있어요. 로그아웃 상태에서는 지원 기록을 저장하지 않아요.') }}</p>
    <router-link class="button-secondary" to="/auth/login">{{ tr('로그인') }}</router-link>
  </div>

  <template v-else>
    <div class="apply-tools">
      <div class="segmented-tab" role="group" :aria-label="tr('보기 방식')">
        <button type="button" :class="{ selected: view === 'board' }" :aria-pressed="view === 'board'" @click="view = 'board'">{{ tr('단계별') }}</button>
        <button type="button" :class="{ selected: view === 'list' }" :aria-pressed="view === 'list'" @click="view = 'list'">{{ tr('마감순 목록') }}</button>
        <button type="button" :class="{ selected: view === 'calendar' }" :aria-pressed="view === 'calendar'" @click="view = 'calendar'">{{ tr('달력') }}</button>
      </div>
      <label class="apply-closed"><input v-model="showClosed" type="checkbox" />{{ tr('끝난 지원도 보기 ({n}건)', { n: closedCount }) }}</label>
    </div>
    <p class="input-field-help apply-note">{{ tr('지원 기록은 나만 보기로 저장돼요. 공고를 자동으로 가져오거나 대신 지원하지는 않아요.') }}</p>
    <p v-if="listMessage" class="input-field-help" data-state="error" role="status">{{ listMessage }}</p>
    <p v-if="applicationStore.state.loading && !applicationStore.state.loaded" class="input-field-help" role="status">{{ tr('지원 기록을 불러오는 중이에요.') }}</p>
    <div v-else-if="applicationStore.state.error && !applicationStore.state.loaded" class="empty-state" role="status"><p>{{ tr('지원 기록을 불러오지 못했어요. 연결을 확인하고 다시 시도해 주세요.') }}</p><button type="button" class="button-secondary" @click="applicationStore.reload()">{{ tr('다시 시도') }}</button></div>
    <div v-else-if="!items.length" class="empty-state" role="status"><p>{{ tr('아직 저장한 지원이 없어요. 관심 있는 공고부터 추가해 보세요.') }}</p><button type="button" class="button-secondary" @click="open()">{{ tr('지원 추가') }}</button></div>

    <div v-else-if="view === 'board'" class="apply-board" role="list" :aria-label="tr('지원 단계별 보드')">
      <section v-for="column in columns" :key="column.id" class="apply-column" role="listitem" :aria-labelledby="'col-' + column.id">
        <h2 :id="'col-' + column.id">{{ status(column.id) }}<small>{{ tr('{n}건', { n: column.items.length }) }}</small></h2>
        <p v-if="!column.items.length" class="input-field-help">{{ tr('없음') }}</p>
        <article v-for="item in column.items" :key="item.id" class="card apply-card">
          <p class="apply-company">{{ item.company }}</p>
          <h3>{{ item.title }}</h3>
          <p v-if="nextDate(item)" class="input-field-help figure-line">{{ nextDate(item) }}</p>
          <p v-if="applicationStore.isPending(item)" class="input-field-help"><span class="tag">{{ tr('전송 대기') }}</span></p>
          <div class="apply-actions">
            <a v-if="isWebUrl(item.postingUrl)" class="button-text" :href="item.postingUrl" target="_blank" rel="noopener noreferrer" :aria-label="tr('{name} 공고 열기(새 창)', { name: item.company })">{{ tr('공고') }}</a>
            <button type="button" class="button-text" :aria-label="tr('{name} 수정', { name: item.company + ' ' + item.title })" @click="open(item)">{{ tr('수정') }}</button>
            <button type="button" class="button-text" :aria-label="tr('{name} 삭제', { name: item.company + ' ' + item.title })" @click="remove(item)">{{ tr('삭제') }}</button>
          </div>
        </article>
      </section>
    </div>

    <section v-else-if="view === 'calendar'" class="apply-calendar" aria-labelledby="apply-month">
      <div class="apply-month-bar">
        <button type="button" class="button-secondary" :aria-label="tr('이전 달')" @click="month = shiftMonth(month, -1)">‹</button>
        <h2 id="apply-month">{{ monthTitle }}</h2>
        <button type="button" class="button-secondary" :aria-label="tr('다음 달')" @click="month = shiftMonth(month, 1)">›</button>
        <button type="button" class="button-text" :disabled="month === today.slice(0, 7)" @click="month = today.slice(0, 7)">{{ tr('이번 달') }}</button>
      </div>
      <table class="apply-month-grid">
        <caption class="sr-only">{{ tr('{month} 지원 마감·면접 달력', { month: monthTitle }) }}</caption>
        <thead><tr><th v-for="d in WEEK_HEAD" :key="d" scope="col">{{ d }}</th></tr></thead>
        <tbody>
          <tr v-for="(week, w) in weeks" :key="w">
            <td v-for="cell in week" :key="cell.date" :class="{ out: !cell.inMonth, today: cell.date === today }">
              <span class="figure apply-day" :aria-label="cell.date === today ? tr('{day}일, 오늘', { day: cell.day }) : undefined">{{ cell.day }}</span>
              <button v-for="item in cell.items" :key="item.id" type="button" class="apply-event" :class="{ closed: item.closed }" :aria-label="`${cell.date} ${tr(item.label)}: ${item.company} ${item.title}${item.closed ? tr(', 끝난 지원') : ''}`" @click="openApp(item.appId)">{{ tr(item.label) }} · {{ item.company }}</button>
            </td>
          </tr>
        </tbody>
      </table>
      <ul class="apply-agenda" :aria-label="tr('이번 달 마감·면접')">
        <li v-for="cell in agenda" :key="cell.date">
          <span class="figure">{{ cell.date }}</span>
          <button v-for="item in cell.items" :key="item.id" type="button" class="apply-event" :class="{ closed: item.closed }" @click="openApp(item.appId)">{{ tr(item.label) }} · {{ item.company }} · {{ item.title }}<template v-if="item.closed"> {{ tr('(끝남)') }}</template></button>
        </li>
        <li v-if="!agenda.length" class="input-field-help">{{ tr('이 달에는 지원 마감이나 면접이 없어요. 다른 달로 넘겨 보세요.') }}</li>
      </ul>
      <p class="input-field-help apply-cal-note">{{ tr('마감·면접 날짜가 있는 지원만 보여요. 끝난 지원은 흐리게 "끝남"으로 표시해요.') }}</p>
    </section>

    <section v-else class="card list apply-list">
      <div class="list-head apply-row"><span>{{ tr('회사 · 포지션') }}</span><span>{{ tr('상태') }}</span><span>{{ tr('마감') }}</span><span>{{ tr('면접') }}</span><span>{{ tr('관리') }}</span></div>
      <div v-for="item in sorted" :key="item.id" class="row apply-row">
        <span><b>{{ item.company }}</b> · {{ item.title }}</span>
        <span class="tag">{{ status(item.status) }}</span>
        <span class="figure">{{ item.deadline ? item.deadline + ' · ' + due(daysUntil(item.deadline, today)) : '—' }}</span>
        <span class="figure">{{ item.interviewDate || '—' }}</span>
        <span class="apply-actions">
          <button type="button" class="button-text" :aria-label="tr('{name} 수정', { name: item.company + ' ' + item.title })" @click="open(item)">{{ tr('수정') }}</button>
          <button type="button" class="button-text" :aria-label="tr('{name} 삭제', { name: item.company + ' ' + item.title })" @click="remove(item)">{{ tr('삭제') }}</button>
        </span>
      </div>
    </section>
  </template>

  <Modal v-if="editor" :title="editor.base ? tr('지원 기록 수정') : tr('지원 추가')" @close="editor = null">
    <div class="form-row">
      <label>{{ tr('회사') }}<input v-model="editor.draft.company" maxlength="200" required /></label>
      <label>{{ tr('포지션') }}<input v-model="editor.draft.title" maxlength="200" required :placeholder="tr('예: 프런트엔드 개발자')" /></label>
    </div>
    <label>{{ tr('지원 상태') }}<select v-model="editor.draft.status"><option v-for="status in APPLICATION_STATUSES" :key="status.id" :value="status.id">{{ tr(status.label) }}</option></select></label>
    <label>{{ tr('공고 주소(선택)') }}<input v-model="editor.draft.postingUrl" type="url" maxlength="2000" placeholder="https://" :aria-invalid="urlOk ? undefined : 'true'" aria-describedby="apply-url-help" /></label>
    <p id="apply-url-help" class="input-field-help" :data-state="urlOk ? undefined : 'error'">{{ urlOk ? tr('주소만 저장해요. 서버가 공고를 가져오지는 않아요.') : tr('http 또는 https로 시작하는 주소를 넣어 주세요.') }}</p>
    <div class="form-row">
      <label>{{ tr('지원 마감') }}<input v-model="editor.draft.deadline" type="date" /></label>
      <label>{{ tr('지원한 날') }}<input v-model="editor.draft.appliedDate" type="date" /></label>
      <label>{{ tr('면접 날짜') }}<input v-model="editor.draft.interviewDate" type="date" /></label>
    </div>
    <div class="form-row">
      <label>{{ tr('고용 형태(선택)') }}<input v-model="editor.draft.employmentType" maxlength="200" :placeholder="tr('예: 정규직')" /></label>
      <label>{{ tr('근무 형태(선택)') }}<input v-model="editor.draft.workType" maxlength="200" :placeholder="tr('예: 원격 혼합')" /></label>
    </div>
    <label>{{ tr('급여 범위(선택)') }}<input v-model="editor.draft.salaryRange" maxlength="200" /></label>
    <label>{{ tr('메모 · 면접 질문 · 회고(선택)') }}<textarea v-model="editor.draft.body" rows="4"></textarea></label>
    <ApplicationDocumentsPanel v-if="editor.base?.id && typeof editor.base.id === 'string'" :application-id="editor.base.id" />
    <p v-else class="input-field-help">{{ tr('지원을 저장한 뒤 다시 열면 제출한 이력서·경력기술서·포트폴리오·자기소개서 버전을 고를 수 있어요.') }}</p>
    <p v-if="saving.state.fieldMessage" class="input-field-help" data-state="error" role="alert">{{ saving.state.fieldMessage }}</p>
    <ConflictCompare v-if="conflict" :rows="compareRows" :busy="saving.state.status === 'saving'" @keep-mine="keepMine" @use-latest="useLatest" />
    <SaveStatus :state="saving.state" mode="server" @retry="save" />
    <template #footer>
      <button type="button" class="modal-secondary" @click="editor = null">{{ tr('취소') }}</button>
      <button type="button" class="primary" :disabled="!canSave || !!conflict" :aria-busy="saving.state.status === 'saving' ? 'true' : undefined" @click="save">{{ saving.state.status === 'saving' ? tr('저장하는 중') : tr('저장하기') }}</button>
    </template>
  </Modal>
</template>

<style scoped>
.apply-signed-out { display: grid; justify-items: start; gap: var(--space-md); }
.apply-tools { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: var(--space-md); margin-bottom: var(--space-sm); }
.apply-closed { display: inline-flex; align-items: center; gap: var(--space-xs); }
.apply-note { display: block; margin: 0 0 var(--space-lg); }
.apply-board { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(220px, 1fr); gap: var(--space-md); overflow-x: auto; padding-bottom: var(--space-sm); }
.apply-column { display: grid; align-content: start; gap: var(--space-sm); min-width: 0; padding: var(--space-md); border-radius: var(--radius-lg); background: var(--color-surface); }
.apply-column h2 { display: flex; justify-content: space-between; align-items: baseline; margin: 0; font-size: var(--type-body-size); }
.apply-column h2 small { color: var(--color-muted); font-size: var(--type-caption-size); font-weight: 500; }
.apply-column > .input-field-help { margin: 0; }
.apply-card { display: grid; gap: var(--space-xs); padding: var(--space-md); }
.apply-card h3 { margin: 0; font-size: var(--type-body-size); overflow-wrap: anywhere; }
.apply-company { margin: 0; color: var(--color-body); font-size: var(--type-body-sm-size); }
.apply-card p { margin: 0; }
.apply-actions { display: flex; flex-wrap: wrap; gap: var(--space-xs); }
.apply-row { grid-template-columns: minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1.4fr) minmax(0, 1fr) auto; }
.apply-list .tag { justify-self: start; padding: 0 var(--space-xs); }
.apply-calendar { display: grid; gap: var(--space-md); }
.apply-month-bar { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-sm); }
.apply-month-bar h2 { margin: 0; min-width: 7em; text-align: center; font-size: var(--type-title-md-size); }
.apply-month-grid { width: 100%; border-collapse: collapse; table-layout: fixed; background: var(--color-card); border: 1px solid var(--color-hairline); border-radius: var(--radius-lg); }
.apply-month-grid th { padding: var(--space-xs); color: var(--color-muted); font-size: var(--type-caption-size); font-weight: 500; border-bottom: 1px solid var(--color-hairline); }
.apply-month-grid td { height: 5.5rem; padding: var(--space-xs); vertical-align: top; border-top: 1px solid var(--color-hairline); border-left: 1px solid var(--color-hairline); }
.apply-month-grid td:first-child { border-left: 0; }
.apply-month-grid td.out { background: var(--color-surface); }
.apply-month-grid td.out .apply-day { color: var(--color-muted); }
.apply-month-grid td.today .apply-day { font-weight: 700; text-decoration: underline; text-underline-offset: 0.2em; }
.apply-day { display: block; margin-bottom: var(--space-xs); }
.apply-event { display: block; width: 100%; margin: 0 0 var(--space-xs); padding: 0 var(--space-xs); border: 1px solid var(--color-control-border); border-left: 3px solid var(--color-accent); border-radius: var(--radius-xs); background: var(--color-card); color: var(--color-foreground); font-size: var(--type-caption-size); text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; cursor: pointer; }
.apply-event.closed { border-left-style: dashed; border-left-color: var(--color-control-border); color: var(--color-muted); }
.apply-agenda { display: none; margin: 0; padding: 0; list-style: none; }
.apply-agenda li { display: grid; gap: var(--space-xs); padding: var(--space-sm) 0; border-top: 1px solid var(--color-hairline); }
.apply-agenda .apply-event { white-space: normal; font-size: var(--type-body-sm-size); padding: var(--space-xs) var(--space-sm); }
.apply-cal-note { margin: 0; }
@media (max-width: 760px) { .apply-month-grid { display: none; } .apply-agenda { display: block; } }
.figure, .figure-line { font-family: var(--font-mono); font-size: var(--type-time-size); font-variant-numeric: tabular-nums; }
.figure-line { word-break: keep-all; }
</style>
