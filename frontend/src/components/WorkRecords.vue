<script setup>
import { useId as modalUseId } from 'vue'
const modalFormId1 = modalUseId()

import { computed, ref } from 'vue'
import Modal from './Modal.vue'
import EventDateFields from './EventDateFields.vue'
import TagMentionInput from './TagMentionInput.vue'
import RichText from './RichText.vue'
import { workRecords as records } from '../store/workRecords'
import { openPostComposer } from '../store/appState'
import { localDate, workRecordError } from '../utils/postValidation.mjs'
const props = defineProps({ projects: { type: Array, default: () => [] } })
const types = ['연차', '반차', '외근', '출장', '이직', '기타']
const filter = ref('전체')
const visible = computed(() => records.value.filter(r => filter.value === '전체' || r.type === filter.value))
const show = ref(false)
const editing = ref(null)
const fresh = () => ({ type: '연차', title: '', owner: '김지수', projectId: '', startDate: localDate(), endDate: localDate(), startTime: '09:00', endTime: '18:00', half: '오전', leaveDays: 1, status: '예정', location: '', partner: '', transport: '', expense: 0, fromCompany: '', toCompany: '', role: '', handover: '', body: '' })
const draft = ref(fresh())
const error = computed(() => workRecordError(draft.value))
function open(record) {
  if (!record) { openPostComposer('업무 기록', '', { projects: props.projects.map(project => ({ id: project.id, title: project.title })) }); return }
  editing.value = record?.id ?? null
  draft.value = record ? { ...fresh(), ...record } : fresh()
  show.value = true
}
function setHalf() {
  if (draft.value.type !== '반차') return
  Object.assign(draft.value, { endDate: draft.value.startDate, startTime: draft.value.half === '오전' ? '09:00' : '14:00', endTime: draft.value.half === '오전' ? '13:00' : '18:00', leaveDays: 0.5 })
}
function save() {
  if (error.value) return
  const data = { ...draft.value, title: draft.value.title.trim(), leaveDays: draft.value.type === '반차' ? 0.5 : draft.value.leaveDays }
  // 유형 변경 시 이전 유형의 민감한 상세값이 남지 않도록 정리합니다.
  if (!['외근','출장'].includes(data.type)) Object.assign(data, { location: '', partner: '' })
  if (data.type !== '출장') Object.assign(data, { expense: 0, transport: '' })
  if (data.type !== '이직') Object.assign(data, { fromCompany: '', toCompany: '', role: '', handover: '' })
  if (!['연차','반차'].includes(data.type)) data.leaveDays = 0
  const target = records.value.find(r => r.id === editing.value)
  if (target) Object.assign(target, data)
  else records.value.unshift({ id: Math.max(0, ...records.value.map(r => r.id)) + 1, ...data })
  show.value = false
}
function remove(record) {
  if (confirm('이 업무 기록을 삭제할까요?')) records.value = records.value.filter(r => r.id !== record.id)
}
</script>
<template>
  <section class="card work-records">
    <div class="head"><div><p class="eyebrow">WORK & CAREER</p><h3>근무 · 휴가 · 커리어 기록</h3><p>작업 공수와 분리해서 관리하는 업무 일정</p></div><button class="primary" @click="open()">기록 추가</button></div>
    <div class="compose-tabs" aria-label="업무 기록 필터"><button v-for="type in ['전체', ...types]" :key="type" :aria-pressed="filter === type" :class="{ selected: filter === type }" @click="filter = type">{{ type }}</button></div>
    <article v-for="record in visible" :key="record.id" class="work-record">
      <div><span class="tag">{{ record.type }}</span> <span class="tag">{{ record.status }}</span><h3>{{ record.title }}</h3>
        <p>{{ record.owner }} · {{ record.startDate }} {{ record.startTime }} ~ {{ record.endDate }} {{ record.endTime }}</p>
        <p v-if="record.type === '연차' || record.type === '반차'">사용 {{ record.leaveDays }}일 <span v-if="record.type === '반차'">· {{ record.half }}</span></p>
        <p v-if="record.location">{{ record.location }} · {{ record.partner }}</p>
        <p v-if="record.type === '출장'">{{ record.transport }} · 예상 경비 {{ record.expense.toLocaleString() }}원</p>
        <p v-if="record.type === '이직'">{{ record.fromCompany || '미입력' }} → {{ record.toCompany }} · {{ record.role }}</p>
        <p><RichText :text="record.body" /></p>
      </div>
      <div class="record-actions"><button class="review" @click="open(record)">상세 · 수정</button><button class="review" @click="remove(record)">삭제</button></div>
    </article>
    <p v-if="!visible.length" class="empty-state">등록된 기록이 없어요. 연차부터 이직 준비까지 한곳에 정리하세요.</p>
  </section>
  <Modal v-if="show" :title="editing ? '업무 기록 수정' : '업무 기록 작성'" :edit-resource="editing ? 'work-record:' + editing : ''" wide @close="show = false">
    <form @submit.prevent="save" :id="modalFormId1">
      <div class="form-row"><label>유형<select v-model="draft.type" @change="setHalf"><option v-for="type in types" :key="type">{{ type }}</option></select></label>
        <label>상태<select v-model="draft.status"><option>예정</option><option>신청</option><option>승인</option><option>진행중</option><option>완료</option><option>취소</option></select></label></div>
      <label>제목<input v-model="draft.title" required maxlength="200" placeholder="예: 하반기 연차 / 고객사 방문" /></label>
      <div class="form-row"><label>담당자<input v-model="draft.owner" required /></label>
        <label>연결 작업<select v-model="draft.projectId"><option value="">연결 안 함</option><option v-for="project in projects" :key="project.id" :value="project.id">{{ project.title }}</option></select></label></div>
      <label v-if="draft.type === '반차'">반차 구분<select v-model="draft.half" @change="setHalf"><option>오전</option><option>오후</option></select></label>
      <EventDateFields :draft="draft" />
      <label v-if="draft.type === '연차'">사용 연차 (휴무일 제외 직접 입력)<input type="number" min="0.5" max="365" step="0.5" v-model.number="draft.leaveDays" /></label>
      <div v-if="['외근','출장'].includes(draft.type)" class="form-row"><label>방문 장소<input v-model="draft.location" /></label><label>방문처 · 담당자<input v-model="draft.partner" /></label></div>
      <div v-if="draft.type === '출장'" class="form-row"><label>교통 · 숙박<input v-model="draft.transport" /></label><label>예상 경비 (원)<input type="number" min="0" max="100000000" v-model.number="draft.expense" /></label></div>
      <template v-if="draft.type === '이직'">
        <div class="form-row"><label>이전 회사<input v-model="draft.fromCompany" /></label><label>이직 회사<input v-model="draft.toCompany" /></label></div>
        <label>직무 · 직급<input v-model="draft.role" /></label>
        <label>인수인계 · 준비 사항<TagMentionInput v-model="draft.handover" /></label>
      </template>
      <label>사유 · 상세 내용 · 태그 · 멘션<TagMentionInput v-model="draft.body" /></label>
      <p class="form-note">로컬 개인 기록입니다. 승인 상태는 메모용이며 실제 결재나 연차 차감은 수행하지 않습니다. 민감한 인사정보는 입력하지 마세요.</p>
      <p v-if="error" class="form-note" role="status">{{ error }}</p>

    </form>

    <template #footer>
      <button type="button" class="modal-secondary" @click="show = false">취소</button>
      <button :form="modalFormId1" class="primary" type="submit" :disabled="!!error">저장하기</button>
    </template>
  </Modal>
</template>
