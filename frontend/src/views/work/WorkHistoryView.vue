<script setup>
import { computed, ref } from 'vue'
import Modal from '../../components/Modal.vue'
import HelpPopover from '../../components/HelpPopover.vue'
import { exportPdf, exportWord, sectionsToHtml } from '../../store/docExport'
import { workPrivacy, logAccess } from '../../store/workPrivacy'

/** 업무 히스토리 — 누적 시간 집계와 인수인계 문서 생성. */
const types = ref([
  { id: 1, title: '신규 기능 개발', hours: 142, template: true, note: '타임바 리뉴얼 · 화면 개발 전반' },
  { id: 2, title: '버그 수정', hours: 58, template: true, note: 'QA 이슈 대응' },
  { id: 3, title: '고객 미팅', hours: 31, template: false, note: '주간 정기 미팅' },
  { id: 4, title: '문서화', hours: 24, template: false, note: 'API 명세·운영 가이드' },
])
const docs = ref([
  { id: 1, title: '타임바 리뉴얼 프로젝트 인수인계', at: '2026-08-20', from: '민준', to: '지수' },
  { id: 2, title: '2분기 마감 업무 정리', at: '2026-07-02', from: '지수', to: '서연' },
])
const totalHours = computed(() => types.value.reduce((a, t) => a + t.hours, 0))

/* ---------- 인수인계 문서 생성 ---------- */
const showCreate = ref(false)
const notice = ref('')
const draft = ref({
  title: '',
  to: '',
  period: '2026-08',
  includeIds: [],
  contacts: '',
  pending: '',
  cautions: '',
})

function openCreate() {
  draft.value = {
    title: '',
    to: '',
    period: '2026-08',
    includeIds: types.value.map((t) => t.id),
    contacts: '',
    pending: '',
    cautions: '',
  }
  showCreate.value = true
}
function toggleInclude(id) {
  const list = draft.value.includeIds
  const i = list.indexOf(id)
  if (i >= 0) list.splice(i, 1)
  else list.push(id)
}
const canCreate = computed(
  () => Boolean(draft.value.title.trim()) && Boolean(draft.value.to.trim()) && draft.value.includeIds.length > 0,
)

/** 폼 값을 그대로 문서 구조로 옮긴다 — PDF/Word가 같은 내용을 쓴다 */
function buildSections() {
  const picked = types.value.filter((t) => draft.value.includeIds.includes(t.id))
  const sections = [
    { type: 'title', text: draft.value.title.trim() },
    { type: 'meta', text: '기간 ' + draft.value.period + ' · 인계자 지수 → 인수자 ' + draft.value.to.trim() + ' · 작성일 ' + new Date().toISOString().slice(0, 10) },
    { type: 'h2', text: '업무 범위 및 누적 시간' },
    {
      type: 'table',
      head: ['업무 유형', '누적 시간', '템플릿', '비고'],
      rows: picked.map((t) => [t.title, t.hours + 'h', t.template ? '있음' : '없음', t.note]),
    },
  ]
  if (draft.value.pending.trim()) {
    sections.push({ type: 'h2', text: '진행중 · 미완료 업무' })
    sections.push({ type: 'list', items: draft.value.pending.split('\n').map((s) => s.trim()).filter(Boolean) })
  }
  if (draft.value.contacts.trim()) {
    sections.push({ type: 'h2', text: '관련 담당자 · 연락처' })
    sections.push({ type: 'list', items: draft.value.contacts.split('\n').map((s) => s.trim()).filter(Boolean) })
  }
  if (draft.value.cautions.trim()) {
    sections.push({ type: 'h2', text: '주의사항' })
    sections.push({ type: 'list', items: draft.value.cautions.split('\n').map((s) => s.trim()).filter(Boolean) })
  }
  return sections
}
const previewSections = computed(() => (canCreate.value ? buildSections() : []))

function saveRecord() {
  docs.value.unshift({
    id: Math.max(0, ...docs.value.map((d) => d.id)) + 1,
    title: draft.value.title.trim(),
    at: new Date().toISOString().slice(0, 10),
    from: '지수',
    to: draft.value.to.trim(),
  })
  logAccess('인수인계 문서 생성 · ' + draft.value.title.trim())
}
function watermark() {
  return workPrivacy.watermarkExports ? '타임바 다이어리 · 지수 · ' + new Date().toISOString().slice(0, 10) : ''
}
function download(kind) {
  if (!canCreate.value) {
    notice.value = '문서 제목, 인수자, 포함할 업무를 모두 채워주세요.'
    setTimeout(() => (notice.value = ''), 2500)
    return
  }
  const bodyHtml = sectionsToHtml(buildSections())
  const result = kind === 'pdf'
    ? exportPdf({ title: draft.value.title.trim(), bodyHtml, watermark: watermark() })
    : exportWord({ title: draft.value.title.trim(), bodyHtml, watermark: watermark() })
  if (!result.ok) {
    notice.value = result.reason
    setTimeout(() => (notice.value = ''), 4000)
    return
  }
  saveRecord()
  showCreate.value = false
}
</script>

<template>
  <div class="page-tools">
    <b style="font-size: 1rem">업무 히스토리</b>
    <HelpPopover
      title="업무 히스토리 · 인수인계"
      summary="업무 유형별 누적 시간을 모아두고, 자리를 옮기거나 휴가를 갈 때 인수인계 문서로 바로 뽑아 쓰는 화면이에요."
      :steps="[
        '누적 시간 표에서 인계할 업무 유형을 확인해요.',
        '‘인수인계 문서 생성’을 눌러 제목과 인수자를 적어요.',
        '포함할 업무를 고르고, 진행중 업무·담당자·주의사항을 적어요.',
        '미리보기를 확인한 뒤 PDF 또는 Word로 내려받아요.',
      ]"
      :terms="[
        { term: '누적 시간', desc: '해당 업무 유형에 기록된 실제 시간의 합계예요.' },
        { term: '템플릿', desc: '그 업무를 반복할 때 쓰는 작성 양식이 등록돼 있는지 여부예요.' },
      ]"
      :tips="['보안 설정에서 워터마크를 켜두면 내보낸 문서에 작성자와 날짜가 남아요.']"
    />
    <span></span>
    <button class="primary" @click="openCreate">인수인계 문서 생성</button>
  </div>

  <div class="metrics" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 16px">
    <article><span>총 누적 시간</span><b class="figure">{{ totalHours }}<small>h</small></b></article>
    <article><span>업무 유형</span><b class="figure">{{ types.length }}<small>종</small></b></article>
    <article><span>인수인계 문서</span><b class="figure">{{ docs.length }}<small>건</small></b></article>
  </div>

  <section class="card list" style="margin-bottom: 16px">
    <div class="list-head" style="grid-template-columns: 1.6fr 2fr 1fr 0.8fr"><span>업무 유형</span><span>비고</span><span>누적 시간</span><span>템플릿</span></div>
    <div class="row" style="grid-template-columns: 1.6fr 2fr 1fr 0.8fr" v-for="t in types" :key="t.id">
      <label>{{ t.title }}</label>
      <span>{{ t.note }}</span>
      <span class="figure">{{ t.hours }}h</span>
      <span class="badge" :class="t.template ? 'ok' : ''">{{ t.template ? '있음' : '없음' }}</span>
    </div>
  </section>

  <section class="card">
    <h3>최근 인수인계 문서</h3>
    <div class="event" v-for="d in docs" :key="d.id">
      <i></i>
      <span style="flex: 1"><b>{{ d.title }}</b><small>{{ d.from }} → {{ d.to }}</small></span>
      <small class="figure">{{ d.at }}</small>
    </div>
  </section>

  <Modal v-if="showCreate" title="인수인계 문서 생성" wide @close="showCreate = false">
    <label>문서 제목<input v-model="draft.title" placeholder="예: 타임바 리뉴얼 인수인계" autofocus /></label>
    <div class="form-row">
      <label style="flex: 1">인수자<input v-model="draft.to" placeholder="예: 서연" /></label>
      <label style="flex: 1">대상 기간<input type="month" v-model="draft.period" /></label>
    </div>

    <div class="section-label">포함할 업무 ({{ draft.includeIds.length }}/{{ types.length }})</div>
    <label class="task" v-for="t in types" :key="t.id" style="border-bottom: 1px solid var(--color-hairline)">
      <input type="checkbox" :checked="draft.includeIds.includes(t.id)" @change="toggleInclude(t.id)" />
      <span style="flex: 1"><b>{{ t.title }}</b><small>{{ t.hours }}h · {{ t.note }}</small></span>
    </label>

    <label>진행중 · 미완료 업무<textarea v-model="draft.pending" rows="3" placeholder="한 줄에 하나씩 적어주세요"></textarea></label>
    <label>관련 담당자 · 연락처<textarea v-model="draft.contacts" rows="2" placeholder="예: API 문의 - 민준 (minjun@timebar.kr)"></textarea></label>
    <label>주의사항<textarea v-model="draft.cautions" rows="2" placeholder="예: 배포는 화요일 오전에만 진행"></textarea></label>

    <div v-if="previewSections.length" class="doc-preview">
      <span class="pill">미리보기</span>
      <p class="figure" style="margin-top: 8px">{{ draft.title }} · {{ draft.period }} · 지수 → {{ draft.to }}</p>
      <p>포함 업무 {{ draft.includeIds.length }}건 · 섹션 {{ previewSections.length }}개</p>
    </div>

    <p v-if="notice" class="badge warn" style="display: inline-block">{{ notice }}</p>
    <p class="form-note">PDF는 인쇄 창에서 ‘PDF로 저장’을 선택하면 돼요. Word는 .doc 파일로 바로 내려받아요.</p>

    <template #footer>
      <button type="button" class="modal-secondary" @click="showCreate = false">취소</button>
      <div class="form-row">
      <button class="primary" style="flex: 1" :disabled="!canCreate" @click="download('pdf')">PDF로 내보내기</button>
      <button class="review" style="margin: 0; flex: 1" :disabled="!canCreate" @click="download('word')">Word로 내보내기</button>
          </div>
    </template>
  </Modal>
</template>
