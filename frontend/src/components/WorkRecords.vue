<script setup>
import { bodyLocale, tr } from '../store/locale'
import { formatWon } from '../features/i18n/locale.mjs'
import { useId as modalUseId } from 'vue'
const modalFormId1 = modalUseId()

import { computed, ref } from 'vue'
import Modal from './Modal.vue'
import EventDateFields from './EventDateFields.vue'
import TagMentionInput from './TagMentionInput.vue'
import RichText from './RichText.vue'
import { workRecords as records, workRecordStore } from '../store/workRecords'
import { WORK_TYPES } from '../features/records/featureKinds.mjs'
import { createSaveState } from '../features/records/saveState.mjs'
import StorageNote from './StorageNote.vue'
import { openPostComposer } from '../store/appState'
import { localDate, workRecordError } from '../utils/postValidation.mjs'
const props = defineProps({ projects: { type: Array, default: () => [] } })
// 서버가 받는 다섯 가지 종류다(PR-10 4단계). 예전 로컬의 '기타' 기록은 목록에는 보인다
const types = WORK_TYPES
const filter = ref('전체')
// 경비는 원화다. 한국어는 예전처럼 "12,000원", 다른 언어는 통화 기호로 보인다
const won = (n) => (bodyLocale.value === 'ko' ? Number(n || 0).toLocaleString() + '원' : formatWon(Number(n || 0), bodyLocale.value))
const visible = computed(() => records.value.filter(r => filter.value === '전체' || r.type === filter.value))
const show = ref(false)
const editing = ref(null)
const fresh = () => ({ type: '연차', title: '', owner: '나', projectId: '', startDate: localDate(), endDate: localDate(), startTime: '09:00', endTime: '18:00', half: '오전', leaveDays: 1, status: '예정', location: '', partner: '', transport: '', expense: 0, fromCompany: '', toCompany: '', role: '', handover: '', body: '' })
const draft = ref(fresh())
const error = computed(() => workRecordError(draft.value))
const saving = createSaveState({ fields: { title: ['title', '제목'], owner: ['owner', '담당'], dates: ['종료', '날짜'] } })
function open(record) {
  if (!record) { openPostComposer('업무 기록', '', { projects: props.projects.map(project => ({ id: project.id, title: project.title })) }); return }
  editing.value = record?.id ?? null
  draft.value = record ? { ...fresh(), ...record } : fresh()
  saving.reset()
  show.value = true
}
function setHalf() {
  if (draft.value.type !== '반차') return
  Object.assign(draft.value, { endDate: draft.value.startDate, startTime: draft.value.half === '오전' ? '09:00' : '14:00', endTime: draft.value.half === '오전' ? '13:00' : '18:00', leaveDays: 0.5 })
}
async function save() {
  if (error.value) return
  const data = { ...draft.value, title: draft.value.title.trim(), leaveDays: draft.value.type === '반차' ? 0.5 : draft.value.leaveDays }
  // 유형 변경 시 이전 유형의 민감한 상세값이 남지 않도록 정리합니다.
  if (!['외근','출장'].includes(data.type)) Object.assign(data, { location: '', partner: '' })
  if (data.type !== '출장') Object.assign(data, { expense: 0, transport: '' })
  if (data.type !== '이직') Object.assign(data, { fromCompany: '', toCompany: '', role: '', handover: '' })
  if (!['연차','반차'].includes(data.type)) data.leaveDays = 0
  // 로그인 상태는 서버 성공 응답 뒤에 목록에 들어가고, 실패하면 입력을 그대로 둔다(UF-82·UF-83)
  const target = records.value.find(r => r.id === editing.value)
  const result = await saving.run(() => (target ? workRecordStore.update(target, data) : workRecordStore.create(data)))
  if (result.ok) show.value = false
}
const removeError = ref('')
async function remove(record) {
  if (!confirm(tr('이 업무 기록을 삭제할까요?'))) return
  removeError.value = ''
  try { await workRecordStore.remove(record) } catch (cause) { removeError.value = tr('삭제하지 못했어요. 연결을 확인하고 다시 시도해 주세요.'); if (cause?.status === 409 || cause?.status === 404) await workRecordStore.reload() }
}
</script>
<template>
  <section class="card work-records">
    <div class="head"><div><p class="eyebrow">WORK & CAREER</p><h3>{{ tr('근무 · 휴가 · 커리어 기록') }}</h3><p>{{ tr('작업 공수와 분리해서 관리하는 업무 일정') }}</p></div><button class="primary" @click="open()">{{ tr('기록 추가') }}</button></div>
    <div class="compose-tabs" :aria-label="tr('업무 기록 필터')"><button v-for="type in ['전체', ...types]" :key="type" :aria-pressed="filter === type" :class="{ selected: filter === type }" @click="filter = type">{{ tr(type) }}</button></div>
    <article v-for="record in visible" :key="record.id" class="work-record">
      <div><span class="tag">{{ tr(record.type) }}</span> <span class="tag">{{ tr(record.status) }}</span><h3>{{ record.title }}</h3>
        <p>{{ tr(record.owner) }} · {{ record.startDate }} {{ record.startTime }} ~ {{ record.endDate }} {{ record.endTime }}</p>
        <p v-if="record.type === '연차' || record.type === '반차'">{{ tr('사용 {n}일', { n: record.leaveDays }) }} <span v-if="record.type === '반차'">· {{ tr(record.half) }}</span></p>
        <p v-if="record.location">{{ record.location }} · {{ record.partner }}</p>
        <p v-if="record.type === '출장'">{{ record.transport }} · {{ tr('예상 경비 {amount}', { amount: won(record.expense) }) }}</p>
        <p v-if="record.type === '이직'">{{ record.fromCompany || tr('미입력') }} → {{ record.toCompany }} · {{ record.role }}</p>
        <p><RichText :text="record.body" /></p>
      </div>
      <div class="record-actions"><button class="review" @click="open(record)">{{ tr('상세 · 수정') }}</button><button class="review" @click="remove(record)">{{ tr('삭제') }}</button></div>
    </article>
    <p v-if="removeError" class="input-field-help" data-state="error" role="alert">{{ tr(removeError) }}</p>
    <p v-if="!visible.length" class="empty-state">{{ tr('등록된 업무 기록이 없어요. 연차부터 이직 준비까지 \'기록 추가\'로 한곳에 정리해 보세요.') }}</p>
  </section>
  <Modal v-if="show" :title="editing ? tr('업무 기록 수정') : tr('업무 기록 작성')" :edit-resource="editing ? 'work-record:' + editing : ''" wide @close="show = false">
    <form @submit.prevent="save" :id="modalFormId1">
      <div class="form-row"><label>{{ tr('유형') }}<select v-model="draft.type" @change="setHalf"><option v-for="type in types" :key="type" :value="type">{{ tr(type) }}</option></select></label>
        <label>{{ tr('상태') }}<select v-model="draft.status"><option value="예정">{{ tr('예정') }}</option><option value="신청">{{ tr('신청') }}</option><option value="승인">{{ tr('승인') }}</option><option value="진행중">{{ tr('진행중') }}</option><option value="완료">{{ tr('완료') }}</option><option value="취소">{{ tr('취소') }}</option></select></label></div>
      <label>{{ tr('제목') }}<input v-model="draft.title" required maxlength="200" :placeholder="tr('예: 하반기 연차 / 고객사 방문')" /></label>
      <div class="form-row"><label>{{ tr('담당자') }}<input v-model="draft.owner" required /></label>
        <label>{{ tr('연결 작업') }}<select v-model="draft.projectId"><option value="">{{ tr('연결 안 함') }}</option><option v-for="project in projects" :key="project.id" :value="project.id">{{ project.title }}</option></select></label></div>
      <label v-if="draft.type === '반차'">{{ tr('반차 구분') }}<select v-model="draft.half" @change="setHalf"><option value="오전">{{ tr('오전') }}</option><option value="오후">{{ tr('오후') }}</option></select></label>
      <EventDateFields :draft="draft" />
      <label v-if="draft.type === '연차'">{{ tr('사용 연차 (휴무일 제외 직접 입력)') }}<input type="number" min="0.5" max="365" step="0.5" v-model.number="draft.leaveDays" /></label>
      <div v-if="['외근','출장'].includes(draft.type)" class="form-row"><label>{{ tr('방문 장소') }}<input v-model="draft.location" /></label><label>{{ tr('방문처 · 담당자') }}<input v-model="draft.partner" /></label></div>
      <div v-if="draft.type === '출장'" class="form-row"><label>{{ tr('교통 · 숙박') }}<input v-model="draft.transport" /></label><label>{{ tr('예상 경비 (원)') }}<input type="number" min="0" max="100000000" v-model.number="draft.expense" /></label></div>
      <template v-if="draft.type === '이직'">
        <div class="form-row"><label>{{ tr('이전 회사') }}<input v-model="draft.fromCompany" /></label><label>{{ tr('이직 회사') }}<input v-model="draft.toCompany" /></label></div>
        <label>{{ tr('직무 · 직급') }}<input v-model="draft.role" /></label>
        <label>{{ tr('인수인계 · 준비 사항') }}<TagMentionInput v-model="draft.handover" /></label>
      </template>
      <label>{{ tr('사유 · 상세 내용 · 태그 · 멘션') }}<TagMentionInput v-model="draft.body" /></label>
      <p class="form-note">{{ tr('나만 보는 개인 기록이에요. 승인 상태는 메모용이며 실제 결재나 연차 차감은 하지 않아요. 민감한 인사정보는 입력하지 마세요.') }}</p>
      <StorageNote :mode="workRecordStore.mode.value" />
      <p v-if="error" class="form-note" role="status">{{ tr(error) }}</p>
      <p v-if="saving.state.message" class="input-field-help" data-state="error" role="alert">{{ tr(saving.state.message) }} {{ tr(saving.state.fieldMessage) }}</p>

    </form>

    <template #footer>
      <button type="button" class="modal-secondary" @click="show = false">{{ tr('취소') }}</button>
      <button :form="modalFormId1" class="primary" type="submit" :disabled="!!error || saving.state.status === 'saving'" :aria-busy="saving.state.status === 'saving' ? 'true' : undefined">{{ saving.state.status === 'saving' ? tr('저장하는 중') : tr('저장하기') }}</button>
    </template>
  </Modal>
</template>
