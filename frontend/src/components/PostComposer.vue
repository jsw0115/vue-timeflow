<script setup>
import { WORK_TYPES } from '../features/records/featureKinds.mjs'
import { computed, nextTick, reactive, ref, useId, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Modal from './Modal.vue'
import EventDateFields from './EventDateFields.vue'
import RepeatSettings from './RepeatSettings.vue'
import ChecklistEditor from './ChecklistEditor.vue'
import TagMentionInput from './TagMentionInput.vue'
import SaveStatus from './SaveStatus.vue'
import StorageNote from './StorageNote.vue'
import { composer, composerKind, composerSeed, composerContext, ROUTINE_DAYS } from '../store/appState'
import { postKinds as kinds, makePostDraft, postDraftError, savePostDraft, postStorageMode } from '../store/postComposer'
import { createSaveState } from '../features/records/saveState.mjs'
import { MOODS } from '../utils/mood.mjs'
import { NOTIFY_OPTIONS } from '../store/ddays'
import { contacts, isBlocked } from '../store/contacts'
import { modeState, modeMeta, isFieldOn } from '../store/modeProfiles'
import { WIKI_SPACES, wiki } from '../store/wiki'
import { bodyLocale, tr } from '../store/locale'
import { modeText } from '../features/i18n/locale.mjs'

const kind = ref(kinds.includes(composerKind.value) ? composerKind.value : '일정')
const router = useRouter()
const tabsId = useId(), formId = tabsId + '-form'
const formRoot = ref(null)
const drafts = reactive(Object.fromEntries(kinds.map(k => [k, makePostDraft(k)])))
Object.assign(drafts[kind.value], composerContext.value, { title: composerSeed.value })
// 화면이 바뀌면(뒤로 가기 포함) 쓴 내용이 없을 때만 창을 닫는다. 쓰던 내용이 있으면 잃지 않게 열어 둔다(IMP-025)
const pristine = JSON.stringify(drafts)
const route = useRoute()
watch(() => route.path, () => { if (JSON.stringify(drafts) === pristine) composer.value = false })
const draft = computed(() => drafts[kind.value])
const error = computed(() => postDraftError(kind.value, draft.value))
const attendeeQuery = ref('')
const attendees = computed(() => contacts.value.filter(contact => !isBlocked(contact.id) && contact.name.includes(attendeeQuery.value.trim())))
const categories = computed(() => kind.value === '머니로그' ? ['식비', '여가', '건강', '교통', '주거', '수입', '기타'] : ['개인', '업무', '공부', '건강', '휴식', '가족'])
// 서버가 받는 업무 기록 종류(PR-10 4단계)
const workTypes = WORK_TYPES
watch(composerKind, value => { if (kinds.includes(value)) kind.value = value })
watch(kind, async () => { saving.reset(); await nextTick(); formRoot.value?.closest('.modal-body')?.scrollTo({ top: 0 }) })
// 작성 창을 연 순간의 모드로 필드를 고정한다. 그 사이 하루 모드가 바뀌어도(요일별 모드, UF-133) 열린 초안은 그대로다
const composeMode = modeState.activeMode
// 모드 이름은 본문 언어로 보인다. 종류·분류·상태 같은 값은 한국어로 저장하고 글자만 옮긴다(option의 value를 한국어로 고정)
const modeName = (mode) => modeText(mode, bodyLocale.value, modeMeta(mode)).name
function on(section, field) { return isFieldOn(composeMode, section, field) }
function toggleValue(list, value) { const index = list.indexOf(value); if (index < 0) list.push(value); else list.splice(index, 1) }
function setHalf() {
  if (draft.value.type !== '반차') return
  Object.assign(draft.value, { endDate: draft.value.startDate, startTime: draft.value.half === '오전' ? '09:00' : '14:00', endTime: draft.value.half === '오전' ? '13:00' : '18:00', leaveDays: 0.5 })
}
// 서버 저장은 성공 응답 뒤에만 창을 닫는다. 실패하면 입력을 그대로 두고, 할 일을 만든 뒤 체크리스트만 실패했으면 이어서 저장한다(PR-07)
const saving = createSaveState({ fields: { title: ['제목'], date: ['마감', '날짜'] } })
const storageMode = computed(() => postStorageMode(kind.value))
const progress = {}
async function save() {
  const result = await saving.run(() => savePostDraft(kind.value, draft.value, progress[kind.value]))
  if (!result.ok) {
    const partial = result.error?.progress
    if (partial) { progress[kind.value] = partial; draft.value.subtasks = partial.subtasks }
    return
  }
  if (!result.value) { saving.reset(); return }
  delete progress[kind.value]
  composer.value = false
  const paths = { '일정': '/events', '할 일': '/tasks', '루틴': '/routines', '다이어리': '/diary', '메모': '/memos', 'D-Day': '/dday', '머니로그': '/money', '회고': '/planner/daily', '업무 기록': '/work/wbs', '업무 위키': '/work/wiki' }
  const query = kind.value === '다이어리' || kind.value === '머니로그' ? { month: draft.value.date.slice(0, 7) } : kind.value === '회고' ? { date: draft.value.date } : {}
  void router.push({ path: paths[kind.value], query })
}
</script>
<template>
  <Modal :title="tr('새 글 작성')" @close="composer = false">
    <template #toolbar>
      <label class="composer-kind-select" :for="tabsId + '-kind'">{{ tr('작성 종류') }}<select :id="tabsId + '-kind'" v-model="kind"><option v-for="option in kinds" :key="option" :value="option">{{ tr(option) }}</option></select></label>
    </template>
    <form ref="formRoot" :id="formId" :aria-label="tr('{kind} 작성', { kind: tr(kind) })" @submit.prevent="save">
      <p class="form-note">{{ tr('{mode} 글양식 · 종류를 바꿔도 작성 중인 내용이 유지돼요.', { mode: modeName(composeMode) }) }}<template v-if="modeState.activeMode !== composeMode"> {{ tr('하루 모드가 {mode}으로 바뀌었지만, 이 글은 처음 열었을 때의 양식을 그대로 써요.', { mode: modeName(modeState.activeMode) }) }}</template></p>
      <label v-if="kind !== '회고'">{{ tr('제목') }}<input v-model="draft.title" required maxlength="200" :placeholder="tr('무엇을 남기고 싶으세요?')" :aria-invalid="saving.state.field === 'title' ? 'true' : undefined" :aria-describedby="saving.state.field === 'title' ? formId + '-title-error' : undefined" /><span v-if="saving.state.field === 'title'" :id="formId + '-title-error'" class="input-field-help" data-state="error">{{ tr(saving.state.fieldMessage) }}</span></label>
      <EventDateFields v-if="kind === '일정'" :draft="draft" />
      <RepeatSettings v-if="kind === '일정'" v-model="draft.recurrence" :start-date="draft.startDate" />
      <ChecklistEditor v-if="kind === '할 일'" v-model="draft.subtasks" :account-only="storageMode === 'server'" />
      <div v-if="['할 일', '다이어리', 'D-Day', '머니로그', '회고'].includes(kind)" class="form-row">
        <label>{{ kind === '할 일' ? tr('마감일 (선택)') : tr('기록 날짜') }}<input v-model="draft.date" type="date" :required="kind !== '할 일'" /></label>
        <label v-if="kind === '할 일'">{{ tr('마감 시각 (선택)') }}<input v-model="draft.dueTime" type="time" :disabled="!draft.date" aria-describedby="composer-due-time-help" /></label>
        <span v-if="kind === '할 일'" id="composer-due-time-help" class="input-field-help">{{ tr('마감일을 고르면 시각도 정할 수 있어요. 비워 두면 그날 안이 마감이에요.') }}</span>
        <label v-if="kind === '할 일'">{{ tr('우선순위') }}<select v-model="draft.priority"><option value="높음">{{ tr('높음') }}</option><option value="보통">{{ tr('보통') }}</option><option value="낮음">{{ tr('낮음') }}</option></select></label>
        <label v-if="kind === '다이어리'">{{ tr('기분') }}<select v-model="draft.mood"><option v-for="mood in MOODS" :key="mood.code" :value="mood.code">{{ tr(mood.label) }}</option></select></label>
      </div>
      <label v-if="['할 일', 'D-Day', '머니로그'].includes(kind) || kind === '일정' && on('event', 'category') || kind === '루틴' && on('routine', 'category')">{{ tr('분류') }}<select v-model="draft.category" :disabled="kind === '머니로그' && draft.type === 'in'"><option v-for="category in categories" :key="category" :value="category">{{ tr(category) }}</option></select></label>
      <template v-if="kind === '일정'">
        <label>{{ tr('일정 색상') }}<input v-model="draft.color" type="color" /></label>
        <p v-if="storageMode === 'server'" class="input-field-help">{{ tr('로그인 상태에서는 참석자를 고를 수 없어요. 주소록은 아직 이 브라우저에만 있어서 계정에 참석자로 저장할 수 없어요.') }}</p>
        <fieldset v-else class="composer-attendees"><legend>{{ tr('참석자 ({n}명)', { n: draft.attendeeIds.length }) }}</legend><input v-model="attendeeQuery" type="search" :placeholder="tr('주소록에서 이름 검색')" /><label v-for="person in attendees" :key="person.id" class="check-field"><input type="checkbox" :checked="draft.attendeeIds.includes(person.id)" @change="toggleValue(draft.attendeeIds, person.id)" />{{ person.name }}</label></fieldset>
      </template>
      <template v-if="kind === '루틴'">
        <div class="form-row"><label>{{ tr('시작 시간') }}<input v-model="draft.time" type="time" /></label><label>{{ tr('진행 시간 (분)') }}<input v-model.number="draft.duration" type="number" min="1" max="1440" /></label></div>
        <label>{{ tr('반복 시작일') }}<input v-model="draft.startDate" type="date" /></label>
        <RepeatSettings :model-value="draft.recurrence" required :start-date="draft.startDate" @update:model-value="value => { draft.recurrence = value; draft.days = value.frequency === 'weekly' ? [...value.weekdays] : [0,1,2,3,4,5,6] }" />
        <div class="form-row"><label>{{ tr('목표 수량') }}<input v-model.number="draft.goalCount" type="number" min="1" max="9999" /></label><label>{{ tr('단위') }}<input v-model="draft.goalUnit" :placeholder="tr('회, 개, 분')" /></label></div>
        <label class="check-field"><input v-model="draft.notify" type="checkbox" />{{ tr('알림 받기') }}</label>
        <label v-if="draft.notify">{{ tr('시작 전 알림') }}<select v-model.number="draft.reminderMinutes"><option :value="0">{{ tr('시작 시간') }}</option><option :value="5">{{ tr('5분 전') }}</option><option :value="10">{{ tr('10분 전') }}</option><option :value="30">{{ tr('30분 전') }}</option></select></label>
      </template>
      <fieldset v-if="kind === 'D-Day'" class="composer-fieldset"><legend>{{ tr('알림 시점') }}</legend><div class="day-picker"><button v-for="option in NOTIFY_OPTIONS" :key="option.days" type="button" :aria-pressed="draft.notifyDays.includes(option.days)" :class="{ selected: draft.notifyDays.includes(option.days) }" @click="toggleValue(draft.notifyDays, option.days)">{{ tr(option.label) }}</button></div></fieldset>
      <div v-if="kind === '머니로그'" class="form-row"><label>{{ tr('유형') }}<select v-model="draft.type"><option value="out">{{ tr('지출') }}</option><option value="in">{{ tr('수입') }}</option></select></label><label>{{ tr('금액 (원)') }}<input v-model.number="draft.amount" type="number" min="1" required /></label></div>
      <template v-if="kind === '업무 기록'">
        <div class="form-row"><label>{{ tr('유형') }}<select v-model="draft.type" @change="setHalf"><option v-for="type in workTypes" :key="type" :value="type">{{ tr(type) }}</option></select></label><label>{{ tr('상태') }}<select v-model="draft.status"><option value="예정">{{ tr('예정') }}</option><option value="신청">{{ tr('신청') }}</option><option value="승인">{{ tr('승인') }}</option><option value="진행중">{{ tr('진행중') }}</option><option value="완료">{{ tr('완료') }}</option><option value="취소">{{ tr('취소') }}</option></select></label></div>
        <label>{{ tr('담당자') }}<input v-model="draft.owner" required /></label>
        <label v-if="draft.projects?.length">{{ tr('연결 작업') }}<select v-model="draft.projectId"><option value="">{{ tr('연결 안 함') }}</option><option v-for="project in draft.projects" :key="project.id" :value="project.id">{{ project.title }}</option></select></label>
        <label v-if="draft.type === '반차'">{{ tr('반차 구분') }}<select v-model="draft.half" @change="setHalf"><option value="오전">{{ tr('오전') }}</option><option value="오후">{{ tr('오후') }}</option></select></label>
        <EventDateFields :draft="draft" />
        <label v-if="draft.type === '연차'">{{ tr('사용 연차') }}<input v-model.number="draft.leaveDays" type="number" min="0.5" max="365" step="0.5" /></label>
        <div v-if="['외근', '출장'].includes(draft.type)" class="form-row"><label>{{ tr('방문 장소') }}<input v-model="draft.location" /></label><label>{{ tr('방문처 · 담당자') }}<input v-model="draft.partner" /></label></div>
        <div v-if="draft.type === '출장'" class="form-row"><label>{{ tr('교통 · 숙박') }}<input v-model="draft.transport" /></label><label>{{ tr('예상 경비 (원)') }}<input v-model.number="draft.expense" type="number" min="0" max="100000000" /></label></div>
        <template v-if="draft.type === '이직'"><div class="form-row"><label>{{ tr('이전 회사') }}<input v-model="draft.fromCompany" /></label><label>{{ tr('이직 회사') }}<input v-model="draft.toCompany" /></label></div><label>{{ tr('직무 · 직급') }}<input v-model="draft.role" /></label><label>{{ tr('인수인계 · 준비 사항') }}<TagMentionInput v-model="draft.handover" /></label></template>
      </template>
      <div v-if="kind === '업무 위키'" class="form-row"><label>{{ tr('공간') }}<select v-model="draft.space"><option v-for="space in WIKI_SPACES" :key="space" :value="space">{{ tr(space) }}</option></select></label><label>{{ tr('상위 문서') }}<select v-model="draft.parentId"><option :value="null">{{ tr('최상위 문서') }}</option><option v-for="doc in wiki.docs" :key="doc.id" :value="doc.id">{{ doc.title }}</option></select></label></div>
      <label>{{ tr('내용 · 태그 · 멘션') }}<TagMentionInput v-model="draft.body" :rows="kind === '다이어리' || kind === '회고' ? 8 : 4" /></label>
      <p v-if="error" class="form-note" role="status">{{ tr(error) }}</p>
      <StorageNote v-if="storageMode" :mode="storageMode" />
      <SaveStatus :state="saving.state" :mode="storageMode ?? 'local'" @retry="save" />
    </form>
    <template #footer><button type="button" class="modal-secondary" @click="composer = false">{{ tr('취소') }}</button><button type="submit" :form="formId" class="primary" :disabled="!!error" :aria-busy="saving.state.status === 'saving' ? 'true' : undefined">{{ saving.state.status === 'saving' ? tr('저장하는 중') : tr('{kind} 저장', { kind: tr(kind) }) }}</button></template>
  </Modal>
</template>
<style>
.composer-kind-select { display: flex; align-items: center; gap: 12px; margin: 0; font-size: .8125rem; }
.composer-kind-select select { flex: 1; min-width: 0; margin: 0; }
.composer-fieldset, .composer-attendees { padding: 12px; margin: 16px 0; border: 1px solid var(--color-hairline); border-radius: var(--radius-md); font-size: 13px; }
.composer-attendees { max-height: 200px; overflow-y: auto; }
.composer-attendees .check-field { margin: 6px 0; }
</style>
