<script setup>
// 공지·팝업 관리. 서버 공지를 불러 등록·수정·노출 전환·삭제한다. 감사 로그는 서버가 남긴다(PR-10 UF-117 7-2).
import { computed, onMounted, ref } from 'vue'
import Modal from '../../components/Modal.vue'
import { apiRequest } from '../../features/auth/apiRequest.js'
import { adminErrorText } from '../../features/admin/adminClient.mjs'
import { NOTICE_FILTERS, createNoticeClient, noticeError, noticeState } from '../../features/notices/notices.mjs'
import { localDate } from '../../utils/postValidation.mjs'

const client = createNoticeClient({ request: apiRequest })
// 서버의 사용자 공지 조건은 서울 날짜 기준이다. 관리자 화면도 같은 날짜로 상태를 보인다
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date()) || localDate()
const notices = ref([])
const status = ref('loading')
const loadError = ref('')
const listMessage = ref('')
async function load() {
  status.value = 'loading'
  loadError.value = ''
  try { notices.value = await client.all(); status.value = 'ready' } catch (error) { loadError.value = adminErrorText(error); status.value = 'error' }
}
onMounted(load)

const filter = ref('all')
const sorted = computed(() => [...notices.value].sort((a, b) => String(b.updatedAt ?? '').localeCompare(String(a.updatedAt ?? ''))))
const visible = computed(() => (filter.value === 'all' ? sorted.value : sorted.value.filter((n) => noticeState(n, today).id === filter.value)))
const liveCount = computed(() => notices.value.filter((n) => noticeState(n, today).id === 'live').length)

const editing = ref(null)
const saving = ref({ state: 'idle', message: '' })
function open(notice = null) {
  saving.value = { state: 'idle', message: '' }
  editing.value = { base: notice, draft: { title: notice?.title ?? '', body: notice?.body ?? '', from: notice?.from ?? '', to: notice?.to ?? '', popup: notice?.popup === true, published: notice?.published === true } }
}
const error = computed(() => (editing.value ? noticeError(editing.value.draft) : ''))
function failText(error) {
  return error?.status === 409 ? '다른 관리자가 먼저 이 공지를 고쳤어요. 목록을 새로 불러온 뒤 다시 시도해 주세요.' : adminErrorText(error)
}
function replaceRow(row) {
  notices.value = notices.value.some((n) => n.id === row.id) ? notices.value.map((n) => (n.id === row.id ? row : n)) : [row, ...notices.value]
}
async function save() {
  if (error.value || saving.value.state === 'saving') return
  saving.value = { state: 'saving', message: '' }
  const { base, draft } = editing.value
  try {
    replaceRow(await (base ? client.update(base, draft) : client.create(draft)))
    editing.value = null
    saving.value = { state: 'idle', message: '' }
  } catch (e) { saving.value = { state: 'failed', message: failText(e) } }
}
async function togglePublished(notice) {
  listMessage.value = ''
  try { replaceRow(await client.update(notice, { ...notice, published: !notice.published })) } catch (e) { listMessage.value = failText(e) }
}
async function remove(notice) {
  if (!window.confirm('‘' + notice.title + '’ 공지를 삭제할까요?')) return
  listMessage.value = ''
  try { await client.remove(notice); notices.value = notices.value.filter((n) => n.id !== notice.id) } catch (e) { listMessage.value = failText(e) }
}
const period = (n) => (n.from || n.to ? `${n.from || '시작 제한 없음'} ~ ${n.to || '끝 제한 없음'}` : '기간 제한 없음')
</script>

<template>
  <div class="admin-page-head">
    <div><h2>공지 · 팝업</h2><p>로그인한 사용자 화면 위쪽(띠 공지)이나 한 번 뜨는 창(팝업)으로 보일 안내를 관리해요</p></div>
    <button type="button" class="primary" @click="open()">+ 새 공지</button>
  </div>

  <p v-if="status === 'loading'" class="input-field-help" role="status">공지를 불러오는 중이에요.</p>
  <div v-else-if="status === 'error'" class="empty-state" role="status"><p>{{ loadError }}</p><button type="button" class="button-secondary" @click="load">다시 시도</button></div>
  <template v-else>
    <div class="page-tools">
      <div class="filter" role="group" aria-label="공지 상태 거르기">
        <button v-for="f in NOTICE_FILTERS" :key="f.id" type="button" :class="{ selected: filter === f.id }" :aria-pressed="filter === f.id" @click="filter = f.id">{{ f.label }}</button>
      </div>
      <span class="badge ok">노출 중 {{ liveCount }}건 · 전체 {{ notices.length }}건</span>
    </div>
    <p class="input-field-help notice-rule">노출 중은 "노출"을 켰고 오늘({{ today }}, 서울 날짜)이 기간 안인 공지예요. 사용자 화면도 같은 조건으로 보여요.</p>
    <p v-if="listMessage" class="input-field-help" data-state="error" role="alert">{{ listMessage }}</p>

    <section class="card list">
      <div class="list-head notice-row"><span>제목</span><span>형태</span><span>노출 기간</span><span>상태</span><span>관리</span></div>
      <div v-for="n in visible" :key="n.id" class="row notice-row">
        <label class="notice-title">{{ n.title }}</label>
        <span class="tag">{{ n.popup ? '팝업' : '띠 공지' }}</span>
        <span class="figure">{{ period(n) }}</span>
        <span class="badge" :class="noticeState(n, today).id === 'live' ? 'ok' : ''">{{ noticeState(n, today).label }}</span>
        <span class="notice-actions">
          <button type="button" class="review" style="margin: 0" :aria-label="n.title + (n.published ? ' 내리기' : ' 노출하기')" @click="togglePublished(n)">{{ n.published ? '내리기' : '노출' }}</button>
          <button type="button" class="review" style="margin: 0" :aria-label="n.title + ' 수정'" @click="open(n)">수정</button>
          <button type="button" class="review" style="margin: 0" :aria-label="n.title + ' 삭제'" @click="remove(n)">삭제</button>
        </span>
      </div>
      <p v-if="!visible.length" class="empty-state" role="status">{{ notices.length ? '이 상태의 공지가 없어요. 다른 상태를 골라 보세요.' : '아직 등록한 공지가 없어요. + 새 공지로 첫 공지를 등록해 보세요.' }}</p>
    </section>
  </template>

  <Modal v-if="editing" :title="editing.base ? '공지 수정' : '새 공지'" wide @close="editing = null">
    <label>제목<input v-model="editing.draft.title" maxlength="200" required /></label>
    <label>내용<textarea v-model="editing.draft.body" rows="4" maxlength="20000" required></textarea></label>
    <label>형태<select v-model="editing.draft.popup"><option :value="false">띠 공지(화면 위쪽)</option><option :value="true">팝업(한 번 뜨는 창)</option></select></label>
    <div class="form-row">
      <label style="flex: 1">시작하는 날(선택)<input v-model="editing.draft.from" type="date" /></label>
      <label style="flex: 1">끝나는 날(선택)<input v-model="editing.draft.to" type="date" :min="editing.draft.from || undefined" /></label>
    </div>
    <label class="notice-publish"><input v-model="editing.draft.published" type="checkbox" />노출하기(끄면 저장만 하고 사용자에게 보이지 않아요)</label>
    <p v-if="error" class="input-field-help" data-state="error" role="alert">{{ error }}</p>
    <p v-if="saving.state === 'failed'" class="input-field-help" data-state="error" role="alert">{{ saving.message }}</p>
    <template #footer>
      <button v-if="saving.state === 'failed'" type="button" class="modal-secondary" @click="editing = null; load()">목록 새로 불러오기</button>
      <button type="button" class="modal-secondary" @click="editing = null">취소</button>
      <button type="button" class="primary" :disabled="Boolean(error) || saving.state === 'saving'" :aria-busy="saving.state === 'saving' ? 'true' : undefined" @click="save">{{ saving.state === 'saving' ? '저장하는 중' : editing.base ? '변경 저장' : '등록하기' }}</button>
    </template>
  </Modal>
</template>

<style scoped>
.notice-row { grid-template-columns: minmax(0, 2.2fr) minmax(0, .8fr) minmax(0, 1.8fr) minmax(0, .9fr) minmax(0, 1.5fr); }
.notice-title { overflow-wrap: anywhere; }
.notice-actions { display: flex; flex-wrap: wrap; gap: var(--space-xs); }
.notice-rule { display: block; margin: 0 0 var(--space-md); }
.notice-publish { display: flex; align-items: center; gap: var(--space-xs); }
</style>
