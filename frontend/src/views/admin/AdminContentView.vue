<script setup>
// 콘텐츠 관리. 명언·플래너 템플릿·스티커팩을 서버에 저장한다. 감사 로그는 서버가 남긴다(PR-10 UF-117 7-3).
// 사용자 앱에는 아직 이 콘텐츠를 읽어 보이는 화면이 없어, 공개로 바꿔도 사용자에게 보이지 않는다는 사실을 화면에 알린다.
import { computed, onMounted, ref } from 'vue'
import Modal from '../../components/Modal.vue'
import { apiRequest } from '../../features/auth/apiRequest.js'
import { adminErrorText } from '../../features/admin/adminClient.mjs'
import { CONTENT_KINDS, contentError, createContentClient } from '../../features/admin/contentClient.mjs'

const client = createContentClient({ request: apiRequest })
const rows = ref([])
const status = ref('loading')
const loadError = ref('')
const listMessage = ref('')
async function load() {
  status.value = 'loading'
  loadError.value = ''
  try { rows.value = await client.all(); status.value = 'ready' } catch (error) { loadError.value = adminErrorText(error); status.value = 'error' }
}
onMounted(load)

const tab = ref(CONTENT_KINDS[0])
const query = ref('')
const visible = computed(() => {
  const keyword = query.value.trim()
  return rows.value
    .filter((row) => row.kind === tab.value && (!keyword || [row.title, row.body, row.where].some((value) => String(value ?? '').includes(keyword))))
    .sort((a, b) => String(b.updatedAt ?? '').localeCompare(String(a.updatedAt ?? '')))
})
const liveCount = computed(() => rows.value.filter((row) => row.kind === tab.value && row.live === true).length)
const kindCount = (kind) => rows.value.filter((row) => row.kind === kind).length

const editing = ref(null)
const saving = ref({ state: 'idle', message: '' })
function open(row = null) {
  saving.value = { state: 'idle', message: '' }
  editing.value = { base: row, draft: { title: row?.title ?? '', body: row?.body ?? '', kind: row?.kind ?? tab.value, where: row?.where ?? '', live: row?.live === true } }
}
const error = computed(() => (editing.value ? contentError(editing.value.draft) : ''))
const failText = (e) => (e?.status === 409 ? '다른 관리자가 먼저 이 콘텐츠를 고쳤어요. 목록을 새로 불러온 뒤 다시 시도해 주세요.' : adminErrorText(e))
function replaceRow(row) {
  rows.value = rows.value.some((r) => r.id === row.id) ? rows.value.map((r) => (r.id === row.id ? row : r)) : [row, ...rows.value]
}
async function save() {
  if (error.value || saving.value.state === 'saving') return
  saving.value = { state: 'saving', message: '' }
  const { base, draft } = editing.value
  try { replaceRow(await (base ? client.update(base, draft) : client.create(draft))); editing.value = null; saving.value = { state: 'idle', message: '' } } catch (e) { saving.value = { state: 'failed', message: failText(e) } }
}
async function toggleLive(row) {
  listMessage.value = ''
  try { replaceRow(await client.update(row, { ...row, live: row.live !== true })) } catch (e) { listMessage.value = failText(e) }
}
async function remove(row) {
  if (!window.confirm('‘' + row.title + '’ 콘텐츠를 삭제할까요?')) return
  listMessage.value = ''
  try { await client.remove(row); rows.value = rows.value.filter((r) => r.id !== row.id) } catch (e) { listMessage.value = failText(e) }
}
</script>

<template>
  <div class="admin-page-head">
    <div><h2>콘텐츠 관리</h2><p>명언·플래너 템플릿·스티커팩을 서버에 저장하고 공개 여부를 정해요</p></div>
    <button type="button" class="primary" @click="open()">+ 콘텐츠 추가</button>
  </div>
  <p class="callout content-note" role="note">아직 사용자 앱에는 이 콘텐츠를 읽어 보여 주는 화면이 없어요. "공개"로 바꿔도 지금은 사용자에게 보이지 않아요. 어느 화면에 보일지는 정해지면 연결해요.</p>

  <p v-if="status === 'loading'" class="input-field-help" role="status">콘텐츠를 불러오는 중이에요.</p>
  <div v-else-if="status === 'error'" class="empty-state" role="status"><p>{{ loadError }}</p><button type="button" class="button-secondary" @click="load">다시 시도</button></div>
  <template v-else>
    <div class="page-tools">
      <div class="filter" role="group" aria-label="콘텐츠 종류">
        <button v-for="kind in CONTENT_KINDS" :key="kind" type="button" :class="{ selected: tab === kind }" :aria-pressed="tab === kind" @click="tab = kind">{{ kind }} {{ kindCount(kind) }}</button>
      </div>
      <input v-model="query" type="search" aria-label="이름·내용·위치 메모 검색" placeholder="이름·내용·위치 메모 검색" />
      <span class="badge">공개 설정 {{ liveCount }}건</span>
    </div>
    <p v-if="listMessage" class="input-field-help" data-state="error" role="alert">{{ listMessage }}</p>

    <section class="card list">
      <div class="list-head content-row"><span>이름 · 내용</span><span>위치 메모</span><span>수정일</span><span>공개 설정</span><span>관리</span></div>
      <div v-for="row in visible" :key="row.id" class="row content-row">
        <span class="content-copy"><b>{{ row.title }}</b><small>{{ row.body }}</small></span>
        <span class="tag">{{ row.where || '—' }}</span>
        <span class="figure">{{ String(row.updatedAt ?? '').slice(0, 10) }}</span>
        <span class="badge">{{ row.live === true ? '공개' : '숨김' }}</span>
        <span class="content-actions">
          <button type="button" class="review" style="margin: 0" :aria-label="row.title + (row.live ? ' 숨기기' : ' 공개로 바꾸기')" @click="toggleLive(row)">{{ row.live ? '숨기기' : '공개' }}</button>
          <button type="button" class="review" style="margin: 0" :aria-label="row.title + ' 수정'" @click="open(row)">수정</button>
          <button type="button" class="review" style="margin: 0" :aria-label="row.title + ' 삭제'" @click="remove(row)">삭제</button>
        </span>
      </div>
      <p v-if="!visible.length" class="empty-state" role="status">{{ kindCount(tab) ? '검색어와 맞는 콘텐츠가 없어요. 다른 말로 찾아보세요.' : `등록된 ${tab} 콘텐츠가 없어요. + 콘텐츠 추가로 등록해 보세요.` }}</p>
    </section>
  </template>

  <Modal v-if="editing" :title="editing.base ? '콘텐츠 수정' : '콘텐츠 추가'" @close="editing = null">
    <label>종류<select v-model="editing.draft.kind"><option v-for="kind in CONTENT_KINDS" :key="kind" :value="kind">{{ kind }}</option></select></label>
    <label>이름<input v-model="editing.draft.title" maxlength="200" required /></label>
    <label>내용<textarea v-model="editing.draft.body" rows="4" maxlength="20000" required></textarea></label>
    <label>위치 메모(선택)<input v-model="editing.draft.where" maxlength="200" placeholder="예: 홈 대시보드에 쓰려고 함" /></label>
    <label class="content-live"><input v-model="editing.draft.live" type="checkbox" />공개로 설정(지금은 사용자 화면에 보이지 않아요)</label>
    <p v-if="error" class="input-field-help" data-state="error" role="alert">{{ error }}</p>
    <p v-if="saving.state === 'failed'" class="input-field-help" data-state="error" role="alert">{{ saving.message }}</p>
    <template #footer>
      <button v-if="saving.state === 'failed'" type="button" class="modal-secondary" @click="editing = null; load()">목록 새로 불러오기</button>
      <button type="button" class="modal-secondary" @click="editing = null">취소</button>
      <button type="button" class="primary" :disabled="Boolean(error) || saving.state === 'saving'" :aria-busy="saving.state === 'saving' ? 'true' : undefined" @click="save">{{ saving.state === 'saving' ? '저장하는 중' : editing.base ? '변경 저장' : '추가하기' }}</button>
    </template>
  </Modal>
</template>

<style scoped>
.content-note { margin-bottom: var(--space-md); }
.content-row { grid-template-columns: minmax(0, 2.4fr) minmax(0, 1.1fr) minmax(0, .9fr) minmax(0, .8fr) minmax(0, 1.5fr); }
.content-copy { display: grid; gap: var(--space-xs); min-width: 0; }
.content-copy b, .content-copy small { overflow-wrap: anywhere; }
.content-copy small { color: var(--color-body); font-size: var(--type-body-sm-size); }
.content-actions { display: flex; flex-wrap: wrap; gap: var(--space-xs); }
.content-live { display: flex; align-items: center; gap: var(--space-xs); }
</style>
