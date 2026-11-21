<script setup>
// 취업·이직 지원 관리(docs/design 03 MN-133·04 FD-88 후보·11 §4.5). 공고·지원 단계·마감·면접을 단계별 보드와 목록으로 본다.
import { computed, ref } from 'vue'
import Modal from '../../components/Modal.vue'
import SaveStatus from '../../components/SaveStatus.vue'
import ConflictCompare from '../../components/ConflictCompare.vue'
import PageActions from '../../components/PageActions.vue'
import { session } from '../../features/auth/session.js'
import { applicationStore } from '../../store/careerLedger'
import { createSaveState, saveFailureMessage } from '../../features/records/saveState.mjs'
import { APPLICATION_STATUSES, applicationStatusLabel, daysUntil, dueLabel, isClosedStatus, isWebUrl } from '../../features/career/careerModel.mjs'
import { localDate } from '../../utils/postValidation.mjs'

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
function nextDate(item) {
  const parts = []
  const deadline = daysUntil(item.deadline, today), interview = daysUntil(item.interviewDate, today)
  if (deadline !== null) parts.push('마감 ' + item.deadline + ' (' + dueLabel(deadline) + ')')
  if (interview !== null) parts.push('면접 ' + item.interviewDate + ' (' + dueLabel(interview) + ')')
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
    { label: '상태', mine: applicationStatusLabel(mine.status), latest: applicationStatusLabel(latest.status) },
    { label: '마감 · 면접', mine: [mine.deadline, mine.interviewDate].filter(Boolean).join(' · '), latest: [latest.deadline, latest.interviewDate].filter(Boolean).join(' · ') },
  ]
})
function keepMine() { editor.value.base = { ...conflict.value.latest }; conflict.value = null; save() }
function useLatest() { open(conflict.value.latest) }
async function remove(item) {
  if (!window.confirm('‘' + item.company + ' · ' + item.title + '’ 지원 기록을 삭제할까요?')) return
  listMessage.value = ''
  try { await applicationStore.remove(item) } catch (error) {
    if (error.kind !== 'stale' && error.kind !== 'notFound') listMessage.value = error.kind === 'conflict' ? '다른 곳에서 먼저 고쳐서 삭제하지 않았어요. 최신 내용을 확인한 뒤 다시 삭제해 주세요.' : saveFailureMessage(error).replace('저장하지', '삭제하지')
  }
}
</script>

<template>
  <PageActions><button v-if="signedIn" type="button" class="primary" @click="open()">지원 추가</button></PageActions>

  <div v-if="!signedIn" class="empty-state apply-signed-out" role="status">
    <p>로그인하면 관심 공고와 지원 단계, 마감·면접 일정을 계정에 모아 관리할 수 있어요. 로그아웃 상태에서는 지원 기록을 저장하지 않아요.</p>
    <router-link class="button-secondary" to="/auth/login">로그인</router-link>
  </div>

  <template v-else>
    <div class="apply-tools">
      <div class="segmented-tab" role="group" aria-label="보기 방식">
        <button type="button" :class="{ selected: view === 'board' }" :aria-pressed="view === 'board'" @click="view = 'board'">단계별</button>
        <button type="button" :class="{ selected: view === 'list' }" :aria-pressed="view === 'list'" @click="view = 'list'">마감순 목록</button>
      </div>
      <label class="apply-closed"><input v-model="showClosed" type="checkbox" />끝난 지원도 보기 ({{ closedCount }}건)</label>
    </div>
    <p class="input-field-help apply-note">지원 기록은 나만 보기로 저장돼요. 공고를 자동으로 가져오거나 대신 지원하지는 않아요. 지원 당시 문서 버전을 묶어 두는 기능은 준비 중이에요.</p>
    <p v-if="listMessage" class="input-field-help" data-state="error" role="status">{{ listMessage }}</p>
    <p v-if="applicationStore.state.loading && !applicationStore.state.loaded" class="input-field-help" role="status">지원 기록을 불러오는 중이에요.</p>
    <div v-else-if="applicationStore.state.error && !applicationStore.state.loaded" class="empty-state" role="status"><p>지원 기록을 불러오지 못했어요. 연결을 확인하고 다시 시도해 주세요.</p><button type="button" class="button-secondary" @click="applicationStore.reload()">다시 시도</button></div>
    <div v-else-if="!items.length" class="empty-state" role="status"><p>아직 저장한 지원이 없어요. 관심 있는 공고부터 추가해 보세요.</p><button type="button" class="button-secondary" @click="open()">지원 추가</button></div>

    <div v-else-if="view === 'board'" class="apply-board" role="list" aria-label="지원 단계별 보드">
      <section v-for="column in columns" :key="column.id" class="apply-column" role="listitem" :aria-labelledby="'col-' + column.id">
        <h2 :id="'col-' + column.id">{{ column.label }}<small>{{ column.items.length }}건</small></h2>
        <p v-if="!column.items.length" class="input-field-help">없음</p>
        <article v-for="item in column.items" :key="item.id" class="card apply-card">
          <p class="apply-company">{{ item.company }}</p>
          <h3>{{ item.title }}</h3>
          <p v-if="nextDate(item)" class="input-field-help figure-line">{{ nextDate(item) }}</p>
          <p v-if="applicationStore.isPending(item)" class="input-field-help"><span class="tag">전송 대기</span></p>
          <div class="apply-actions">
            <a v-if="isWebUrl(item.postingUrl)" class="button-text" :href="item.postingUrl" target="_blank" rel="noopener noreferrer" :aria-label="item.company + ' 공고 열기(새 창)'">공고</a>
            <button type="button" class="button-text" :aria-label="item.company + ' ' + item.title + ' 수정'" @click="open(item)">수정</button>
            <button type="button" class="button-text" :aria-label="item.company + ' ' + item.title + ' 삭제'" @click="remove(item)">삭제</button>
          </div>
        </article>
      </section>
    </div>

    <section v-else class="card list apply-list">
      <div class="list-head apply-row"><span>회사 · 포지션</span><span>상태</span><span>마감</span><span>면접</span><span>관리</span></div>
      <div v-for="item in sorted" :key="item.id" class="row apply-row">
        <span><b>{{ item.company }}</b> · {{ item.title }}</span>
        <span class="tag">{{ applicationStatusLabel(item.status) }}</span>
        <span class="figure">{{ item.deadline ? item.deadline + ' · ' + dueLabel(daysUntil(item.deadline, today)) : '—' }}</span>
        <span class="figure">{{ item.interviewDate || '—' }}</span>
        <span class="apply-actions">
          <button type="button" class="button-text" :aria-label="item.company + ' ' + item.title + ' 수정'" @click="open(item)">수정</button>
          <button type="button" class="button-text" :aria-label="item.company + ' ' + item.title + ' 삭제'" @click="remove(item)">삭제</button>
        </span>
      </div>
    </section>
  </template>

  <Modal v-if="editor" :title="editor.base ? '지원 기록 수정' : '지원 추가'" @close="editor = null">
    <div class="form-row">
      <label style="flex: 1">회사<input v-model="editor.draft.company" maxlength="200" required /></label>
      <label style="flex: 1">포지션<input v-model="editor.draft.title" maxlength="200" required placeholder="예: 프런트엔드 개발자" /></label>
    </div>
    <label>지원 상태<select v-model="editor.draft.status"><option v-for="status in APPLICATION_STATUSES" :key="status.id" :value="status.id">{{ status.label }}</option></select></label>
    <label>공고 주소(선택)<input v-model="editor.draft.postingUrl" type="url" maxlength="2000" placeholder="https://" :aria-invalid="urlOk ? undefined : 'true'" aria-describedby="apply-url-help" /></label>
    <p id="apply-url-help" class="input-field-help" :data-state="urlOk ? undefined : 'error'">{{ urlOk ? '주소만 저장해요. 서버가 공고를 가져오지는 않아요.' : 'http 또는 https로 시작하는 주소를 넣어 주세요.' }}</p>
    <div class="form-row">
      <label style="flex: 1">지원 마감<input v-model="editor.draft.deadline" type="date" /></label>
      <label style="flex: 1">지원한 날<input v-model="editor.draft.appliedDate" type="date" /></label>
      <label style="flex: 1">면접 날짜<input v-model="editor.draft.interviewDate" type="date" /></label>
    </div>
    <div class="form-row">
      <label style="flex: 1">고용 형태(선택)<input v-model="editor.draft.employmentType" maxlength="200" placeholder="예: 정규직" /></label>
      <label style="flex: 1">근무 형태(선택)<input v-model="editor.draft.workType" maxlength="200" placeholder="예: 원격 혼합" /></label>
    </div>
    <label>급여 범위(선택)<input v-model="editor.draft.salaryRange" maxlength="200" /></label>
    <label>메모 · 면접 질문 · 회고(선택)<textarea v-model="editor.draft.body" rows="4"></textarea></label>
    <p v-if="saving.state.fieldMessage" class="input-field-help" data-state="error" role="alert">{{ saving.state.fieldMessage }}</p>
    <ConflictCompare v-if="conflict" :rows="compareRows" :busy="saving.state.status === 'saving'" @keep-mine="keepMine" @use-latest="useLatest" />
    <SaveStatus :state="saving.state" mode="server" @retry="save" />
    <template #footer>
      <button type="button" class="modal-secondary" @click="editor = null">취소</button>
      <button type="button" class="primary" :disabled="!canSave || !!conflict" :aria-busy="saving.state.status === 'saving' ? 'true' : undefined" @click="save">{{ saving.state.status === 'saving' ? '저장하는 중' : '저장하기' }}</button>
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
.figure, .figure-line { font-family: var(--font-mono); font-size: var(--type-time-size); font-variant-numeric: tabular-nums; }
.figure-line { word-break: keep-all; }
</style>
