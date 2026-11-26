<script setup>
// 콘텐츠 관리. 명언·플래너 템플릿·스티커팩을 서버에 저장한다. 감사 로그는 서버가 남긴다(PR-10 UF-117 7-3).
// 공개 콘텐츠가 사용자 앱 어디에 보이는지 화면에 알린다(Q-29): 명언은 홈의 오늘의 문장, 플래너 템플릿은 템플릿 관리의 공용 템플릿. 스티커팩은 아직 보이는 곳이 없다.
import { tr } from '../../store/locale'
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
const failText = (e) => (e?.status === 409 ? tr('다른 관리자가 먼저 이 콘텐츠를 고쳤어요. 목록을 새로 불러온 뒤 다시 시도해 주세요.') : tr(adminErrorText(e)))
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
  if (!window.confirm(tr('‘{name}’ 콘텐츠를 삭제할까요?', { name: row.title }))) return
  listMessage.value = ''
  try { await client.remove(row); rows.value = rows.value.filter((r) => r.id !== row.id) } catch (e) { listMessage.value = failText(e) }
}
</script>

<template>
  <div class="admin-page-head">
    <div><h2>{{ tr('콘텐츠 관리') }}</h2><p>{{ tr('명언·플래너 템플릿·스티커팩을 서버에 저장하고 공개 여부를 정해요') }}</p></div>
    <button type="button" class="primary" @click="open()">{{ tr('+ 콘텐츠 추가') }}</button>
  </div>
  <p class="callout content-note" role="note">{{ tr('"공개"로 바꾸면 로그인한 사용자에게 보여요. 명언은 홈의 "오늘의 문장"에 날짜마다 하나씩, 플래너 템플릿은 템플릿 관리의 "공용 템플릿"에 보여요. 플래너 템플릿 내용은 한 줄에 하나씩 "07:00 아침 스트레칭"처럼 적어 주세요. 스티커팩은 그림 자료가 준비되면 연결해서, 지금은 사용자에게 보이지 않아요.') }}</p>

  <p v-if="status === 'loading'" class="input-field-help" role="status">{{ tr('콘텐츠를 불러오는 중이에요.') }}</p>
  <div v-else-if="status === 'error'" class="empty-state" role="status"><p>{{ tr(loadError) }}</p><button type="button" class="button-secondary" @click="load">{{ tr('다시 시도') }}</button></div>
  <template v-else>
    <div class="page-tools">
      <div class="filter" role="group" :aria-label="tr('콘텐츠 종류')">
        <button v-for="kind in CONTENT_KINDS" :key="kind" type="button" :class="{ selected: tab === kind }" :aria-pressed="tab === kind" @click="tab = kind">{{ tr(kind) }} {{ kindCount(kind) }}</button>
      </div>
      <input v-model="query" type="search" :aria-label="tr('이름·내용·위치 메모 검색')" :placeholder="tr('이름·내용·위치 메모 검색')" />
      <span class="badge">{{ tr('공개 설정 {n}건', { n: liveCount }) }}</span>
    </div>
    <p v-if="listMessage" class="input-field-help" data-state="error" role="alert">{{ tr(listMessage) }}</p>

    <section class="card list">
      <div class="list-head content-row"><span>{{ tr('이름 · 내용') }}</span><span>{{ tr('위치 메모') }}</span><span>{{ tr('수정일') }}</span><span>{{ tr('공개 설정') }}</span><span>{{ tr('관리') }}</span></div>
      <div v-for="row in visible" :key="row.id" class="row content-row">
        <span class="content-copy"><b>{{ row.title }}</b><small>{{ row.body }}</small></span>
        <span class="tag">{{ row.where || '—' }}</span>
        <span class="figure">{{ String(row.updatedAt ?? '').slice(0, 10) }}</span>
        <span class="badge">{{ row.live === true ? tr('공개') : tr('숨김') }}</span>
        <span class="content-actions">
          <button type="button" class="review" style="margin: 0" :aria-label="row.live ? tr('{name} 숨기기', { name: row.title }) : tr('{name} 공개로 바꾸기', { name: row.title })" @click="toggleLive(row)">{{ row.live ? tr('숨기기') : tr('공개') }}</button>
          <button type="button" class="review" style="margin: 0" :aria-label="tr('{name} 수정', { name: row.title })" @click="open(row)">{{ tr('수정') }}</button>
          <button type="button" class="review" style="margin: 0" :aria-label="tr('{name} 삭제', { name: row.title })" @click="remove(row)">{{ tr('삭제') }}</button>
        </span>
      </div>
      <p v-if="!visible.length" class="empty-state" role="status">{{ kindCount(tab) ? tr('검색어와 맞는 콘텐츠가 없어요. 다른 말로 찾아보세요.') : tr('등록된 {kind} 콘텐츠가 없어요. + 콘텐츠 추가로 등록해 보세요.', { kind: tr(tab) }) }}</p>
    </section>
  </template>

  <Modal v-if="editing" :title="editing.base ? tr('콘텐츠 수정') : tr('콘텐츠 추가')" @close="editing = null">
    <label>{{ tr('종류') }}<select v-model="editing.draft.kind"><option v-for="kind in CONTENT_KINDS" :key="kind" :value="kind">{{ tr(kind) }}</option></select></label>
    <label>{{ tr('이름') }}<input v-model="editing.draft.title" maxlength="200" required /></label>
    <label>{{ tr('내용') }}<textarea v-model="editing.draft.body" rows="4" maxlength="20000" required></textarea></label>
    <label>{{ tr('위치 메모(선택)') }}<input v-model="editing.draft.where" maxlength="200" :placeholder="tr('예: 홈 대시보드에 쓰려고 함')" /></label>
    <label class="content-live"><input v-model="editing.draft.live" type="checkbox" />{{ tr('공개로 설정(로그인한 사용자에게 보여요. 스티커팩은 아직 보이지 않아요)') }}</label>
    <p v-if="error" class="input-field-help" data-state="error" role="alert">{{ tr(error) }}</p>
    <p v-if="saving.state === 'failed'" class="input-field-help" data-state="error" role="alert">{{ tr(saving.message) }}</p>
    <template #footer>
      <button v-if="saving.state === 'failed'" type="button" class="modal-secondary" @click="editing = null; load()">{{ tr('목록 새로 불러오기') }}</button>
      <button type="button" class="modal-secondary" @click="editing = null">{{ tr('취소') }}</button>
      <button type="button" class="primary" :disabled="Boolean(error) || saving.state === 'saving'" :aria-busy="saving.state === 'saving' ? 'true' : undefined" @click="save">{{ saving.state === 'saving' ? tr('저장하는 중') : editing.base ? tr('변경 저장') : tr('추가하기') }}</button>
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
