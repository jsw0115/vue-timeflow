<script setup>
import { computed, nextTick, reactive, ref, useId, watch } from 'vue'
import { useRouter } from 'vue-router'
import Modal from './Modal.vue'
import EventDateFields from './EventDateFields.vue'
import RepeatSettings from './RepeatSettings.vue'
import ChecklistEditor from './ChecklistEditor.vue'
import TagMentionInput from './TagMentionInput.vue'
import { composer, composerKind, composerSeed, composerContext, ROUTINE_DAYS } from '../store/appState'
import { postKinds as kinds, makePostDraft, postDraftError, savePostDraft } from '../store/postComposer'
import { NOTIFY_OPTIONS } from '../store/ddays'
import { contacts, isBlocked } from '../store/contacts'
import { modeState, modeMeta, isFieldOn } from '../store/modeProfiles'
import { WIKI_SPACES, wiki } from '../store/wiki'

const kind = ref(kinds.includes(composerKind.value) ? composerKind.value : '일정')
const router = useRouter()
const tabsId = useId(), formId = tabsId + '-form'
const formRoot = ref(null)
const drafts = reactive(Object.fromEntries(kinds.map(k => [k, makePostDraft(k)])))
Object.assign(drafts[kind.value], composerContext.value, { title: composerSeed.value })
const draft = computed(() => drafts[kind.value])
const error = computed(() => postDraftError(kind.value, draft.value))
const attendeeQuery = ref('')
const attendees = computed(() => contacts.value.filter(contact => !isBlocked(contact.id) && contact.name.includes(attendeeQuery.value.trim())))
const categories = computed(() => kind.value === '머니로그' ? ['식비', '여가', '건강', '교통', '주거', '수입', '기타'] : ['개인', '업무', '공부', '건강', '휴식', '가족'])
const workTypes = ['연차', '반차', '외근', '출장', '이직', '기타']
watch(composerKind, value => { if (kinds.includes(value)) kind.value = value })
watch(kind, async () => { await nextTick(); formRoot.value?.closest('.modal-body')?.scrollTo({ top: 0 }) })
function on(section, field) { return isFieldOn(modeState.activeMode, section, field) }
function toggleValue(list, value) { const index = list.indexOf(value); if (index < 0) list.push(value); else list.splice(index, 1) }
function setHalf() {
  if (draft.value.type !== '반차') return
  Object.assign(draft.value, { endDate: draft.value.startDate, startTime: draft.value.half === '오전' ? '09:00' : '14:00', endTime: draft.value.half === '오전' ? '13:00' : '18:00', leaveDays: 0.5 })
}
function save() {
  if (!savePostDraft(kind.value, draft.value)) return
  composer.value = false
  const paths = { '일정': '/events', '할 일': '/tasks', '루틴': '/routines', '다이어리': '/diary', '메모': '/memos', 'D-Day': '/dday', '머니로그': '/money', '회고': '/planner/daily', '커뮤니티 글': '/community/board', '업무 기록': '/work/wbs', '업무 위키': '/work/wiki' }
  const query = kind.value === '다이어리' || kind.value === '머니로그' ? { month: draft.value.date.slice(0, 7) } : kind.value === '회고' ? { date: draft.value.date } : {}
  void router.push({ path: paths[kind.value], query })
}
</script>
<template>
  <Modal title="새 글 작성" @close="composer = false">
    <template #toolbar>
      <label class="composer-kind-select" :for="tabsId + '-kind'">작성 종류<select :id="tabsId + '-kind'" v-model="kind"><option v-for="option in kinds" :key="option">{{ option }}</option></select></label>
    </template>
    <form ref="formRoot" :id="formId" :aria-label="kind + ' 작성'" @submit.prevent="save">
      <p class="form-note">{{ modeMeta(modeState.activeMode).name }} 글양식 · 종류를 바꿔도 작성 중인 내용이 유지돼요.</p>
      <label v-if="!['커뮤니티 글', '회고'].includes(kind)">제목<input v-model="draft.title" required maxlength="200" placeholder="무엇을 남기고 싶으세요?" /></label>
      <EventDateFields v-if="kind === '일정'" :draft="draft" />
      <RepeatSettings v-if="kind === '일정'" v-model="draft.recurrence" :start-date="draft.startDate" />
      <ChecklistEditor v-if="kind === '할 일'" v-model="draft.subtasks" />
      <div v-if="['할 일', '다이어리', 'D-Day', '머니로그', '회고'].includes(kind)" class="form-row">
        <label>{{ kind === '할 일' ? '마감일 (선택)' : '기록 날짜' }}<input v-model="draft.date" type="date" :required="kind !== '할 일'" /></label>
        <label v-if="kind === '할 일'">우선순위<select v-model="draft.priority"><option>높음</option><option>보통</option><option>낮음</option></select></label>
        <label v-if="kind === '다이어리'">기분<select v-model="draft.mood"><option>좋음</option><option>평온</option><option>피곤</option><option>속상함</option><option>뿌듯함</option></select></label>
      </div>
      <label v-if="['할 일', 'D-Day', '머니로그'].includes(kind) || kind === '일정' && on('event', 'category') || kind === '루틴' && on('routine', 'category')">분류<select v-model="draft.category" :disabled="kind === '머니로그' && draft.type === 'in'"><option v-for="category in categories" :key="category">{{ category }}</option></select></label>
      <template v-if="kind === '일정'">
        <label>일정 색상<input v-model="draft.color" type="color" /></label>
        <fieldset class="composer-attendees"><legend>참석자 ({{ draft.attendeeIds.length }}명)</legend><input v-model="attendeeQuery" type="search" placeholder="주소록에서 이름 검색" /><label v-for="person in attendees" :key="person.id" class="check-field"><input type="checkbox" :checked="draft.attendeeIds.includes(person.id)" @change="toggleValue(draft.attendeeIds, person.id)" />{{ person.name }}</label></fieldset>
      </template>
      <template v-if="kind === '루틴'">
        <div class="form-row"><label>시작 시간<input v-model="draft.time" type="time" /></label><label>진행 시간 (분)<input v-model.number="draft.duration" type="number" min="1" max="1440" /></label></div>
        <label>반복 시작일<input v-model="draft.startDate" type="date" /></label>
        <RepeatSettings :model-value="draft.recurrence" required :start-date="draft.startDate" @update:model-value="value => { draft.recurrence = value; draft.days = value.frequency === 'weekly' ? [...value.weekdays] : [0,1,2,3,4,5,6] }" />
        <div class="form-row"><label>목표 수량<input v-model.number="draft.goalCount" type="number" min="1" max="9999" /></label><label>단위<input v-model="draft.goalUnit" placeholder="회, 개, 분" /></label></div>
        <label class="check-field"><input v-model="draft.notify" type="checkbox" />알림 받기</label>
        <label v-if="draft.notify">시작 전 알림<select v-model.number="draft.reminderMinutes"><option :value="0">시작 시간</option><option :value="5">5분 전</option><option :value="10">10분 전</option><option :value="30">30분 전</option></select></label>
      </template>
      <fieldset v-if="kind === 'D-Day'" class="composer-fieldset"><legend>알림 시점</legend><div class="day-picker"><button v-for="option in NOTIFY_OPTIONS" :key="option.days" type="button" :aria-pressed="draft.notifyDays.includes(option.days)" :class="{ selected: draft.notifyDays.includes(option.days) }" @click="toggleValue(draft.notifyDays, option.days)">{{ option.label }}</button></div></fieldset>
      <div v-if="kind === '머니로그'" class="form-row"><label>유형<select v-model="draft.type"><option value="out">지출</option><option value="in">수입</option></select></label><label>금액 (원)<input v-model.number="draft.amount" type="number" min="1" required /></label></div>
      <template v-if="kind === '업무 기록'">
        <div class="form-row"><label>유형<select v-model="draft.type" @change="setHalf"><option v-for="type in workTypes" :key="type">{{ type }}</option></select></label><label>상태<select v-model="draft.status"><option>예정</option><option>신청</option><option>승인</option><option>진행중</option><option>완료</option><option>취소</option></select></label></div>
        <label>담당자<input v-model="draft.owner" required /></label>
        <label v-if="draft.projects?.length">연결 작업<select v-model="draft.projectId"><option value="">연결 안 함</option><option v-for="project in draft.projects" :key="project.id" :value="project.id">{{ project.title }}</option></select></label>
        <label v-if="draft.type === '반차'">반차 구분<select v-model="draft.half" @change="setHalf"><option>오전</option><option>오후</option></select></label>
        <EventDateFields :draft="draft" />
        <label v-if="draft.type === '연차'">사용 연차<input v-model.number="draft.leaveDays" type="number" min="0.5" max="365" step="0.5" /></label>
        <div v-if="['외근', '출장'].includes(draft.type)" class="form-row"><label>방문 장소<input v-model="draft.location" /></label><label>방문처 · 담당자<input v-model="draft.partner" /></label></div>
        <div v-if="draft.type === '출장'" class="form-row"><label>교통 · 숙박<input v-model="draft.transport" /></label><label>예상 경비 (원)<input v-model.number="draft.expense" type="number" min="0" max="100000000" /></label></div>
        <template v-if="draft.type === '이직'"><div class="form-row"><label>이전 회사<input v-model="draft.fromCompany" /></label><label>이직 회사<input v-model="draft.toCompany" /></label></div><label>직무 · 직급<input v-model="draft.role" /></label><label>인수인계 · 준비 사항<TagMentionInput v-model="draft.handover" /></label></template>
      </template>
      <div v-if="kind === '업무 위키'" class="form-row"><label>공간<select v-model="draft.space"><option v-for="space in WIKI_SPACES" :key="space">{{ space }}</option></select></label><label>상위 문서<select v-model="draft.parentId"><option :value="null">최상위 문서</option><option v-for="doc in wiki.docs" :key="doc.id" :value="doc.id">{{ doc.title }}</option></select></label></div>
      <label>내용 · 태그 · 멘션<TagMentionInput v-model="draft.body" :rows="kind === '다이어리' || kind === '회고' ? 8 : 4" /></label>
      <p v-if="error" class="form-note" role="status">{{ error }}</p>
    </form>
    <template #footer><button type="button" class="modal-secondary" @click="composer = false">취소</button><button type="submit" :form="formId" class="primary" :disabled="!!error">{{ kind }} 저장</button></template>
  </Modal>
</template>
<style>
.composer-kind-select { display: flex; align-items: center; gap: 12px; margin: 0; font-size: .8125rem; }
.composer-kind-select select { flex: 1; min-width: 0; margin: 0; }
.composer-fieldset, .composer-attendees { padding: 12px; margin: 16px 0; border: 1px solid var(--color-hairline); border-radius: var(--radius-md); font-size: 13px; }
.composer-attendees { max-height: 200px; overflow-y: auto; }
.composer-attendees .check-field { margin: 6px 0; }
</style>
