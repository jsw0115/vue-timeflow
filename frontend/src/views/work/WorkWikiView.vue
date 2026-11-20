<script setup>
import PageActions from '../../components/PageActions.vue'
import { computed, ref, watch } from 'vue'
import StorageNote from '../../components/StorageNote.vue'
import { createSaveState } from '../../features/records/saveState.mjs'
import { openPostComposer } from '../../store/appState'
import Modal from '../../components/Modal.vue'
import HelpPopover from '../../components/HelpPopover.vue'
import ListFilterBar from '../../components/ListFilterBar.vue'
import RichText from '../../components/RichText.vue'
import TagMentionInput from '../../components/TagMentionInput.vue'
import PersonTag from '../../components/PersonTag.vue'
import {
  wiki, wikiStore, WIKI_SPACES, findDoc, childrenOf, pinnedDocs, wikiTags,
  updateDoc, togglePin, removeDoc, searchDocs, resetWiki, wikiHistory,
} from '../../store/wiki'

/** 업무 위키 — 반복해서 찾는 지식을 문서로 쌓고 검색한다. 업무 데이터라 비공개다. */
const query = ref('')
const filters = ref({ space: '전체' })
const activeTag = ref('')
const FILTER_GROUPS = computed(() => [
  {
    id: 'space',
    all: '전체',
    options: [{ value: '전체', label: '전체 공간' }, ...WIKI_SPACES.map((s) => ({ value: s, label: s }))],
  },
])

const results = computed(() => searchDocs({ keyword: query.value, space: filters.value.space, tag: activeTag.value }))
const activeId = ref(wiki.docs[0]?.id ?? null)
const active = computed(() => findDoc(activeId.value))
// 로그인 상태는 목록이 나중에 오므로, 고른 문서가 없으면 첫 문서를 연다
watch(() => wiki.docs.map((d) => d.id).join(), () => { if (!active.value) activeId.value = wiki.docs[0]?.id ?? null })
const saving = createSaveState({ fields: { title: ['title', '제목'], space: ['space', '공간'], parent: ['부모', '단계'] } })
// 이전 버전. 로그인 상태는 서버가 남긴 이전 내용, 로그아웃 상태는 이 브라우저의 변경 메모다
const history = ref([])
const historyStatus = ref('idle')
const openedVersion = ref(null)
async function loadHistory() {
  openedVersion.value = null
  const doc = active.value
  if (!doc) { history.value = []; historyStatus.value = 'idle'; return }
  historyStatus.value = 'loading'
  try { const rows = await wikiHistory(doc); if (active.value === doc || active.value?.id === doc.id) { history.value = rows; historyStatus.value = 'ready' } } catch { historyStatus.value = 'error' }
}
watch(() => [active.value?.id, active.value?.version], loadHistory, { immediate: true })
const activeChildren = computed(() => (active.value ? childrenOf(active.value.id) : []))
const breadcrumb = computed(() => {
  const out = []
  let cur = active.value
  while (cur) {
    out.unshift(cur)
    cur = cur.parentId ? findDoc(cur.parentId) : null
  }
  return out
})

/* ---------- 작성 · 편집 ---------- */
const editing = ref(null) // 'new' | id
const draft = ref(empty())
function empty(parentId = null) {
  return { space: filters.value.space === '전체' ? WIKI_SPACES[0] : filters.value.space, title: '', body: '', parentId }
}
function openAdd(parentId = null) {
  openPostComposer('업무 위키', '', empty(parentId))
}
function openEdit(doc) {
  saving.reset()
  editing.value = doc.id
  draft.value = { space: doc.space, title: doc.title, body: doc.body, parentId: doc.parentId }
}
const canSave = computed(() => Boolean(draft.value.title.trim()))
async function save() {
  if (!canSave.value) return
  const doc = findDoc(editing.value)
  const result = await saving.run(() => updateDoc(doc, { ...draft.value, title: draft.value.title.trim() }))
  if (result.ok) editing.value = null
  else if (['conflict', 'notFound'].includes(result.error?.kind) && wikiStore.onServer()) await wikiStore.reload()
}
async function onRemove(doc) {
  if (!window.confirm('‘' + doc.title + '’ 문서를 삭제할까요? 하위 문서는 상위로 옮겨져요.')) return
  const result = await saving.run(() => removeDoc(doc))
  if (result.ok && activeId.value === doc.id) activeId.value = wiki.docs[0]?.id ?? null
}
async function onPin(doc) {
  await saving.run(() => togglePin(doc))
}
function onReset() {
  if (!window.confirm('위키를 초기 상태로 되돌릴까요? 작성한 문서가 사라져요.')) return
  resetWiki()
  activeId.value = wiki.docs[0]?.id ?? null
}
function pickTag(tag) {
  activeTag.value = activeTag.value === tag ? '' : tag
}
</script>

<template>
  <div class="page-tools">
    <HelpPopover
      title="업무 위키 사용법"
      summary="반복해서 찾는 업무 지식을 문서로 쌓아두는 공간이에요. 공간(폴더)과 해시태그로 정리하고 검색해서 찾습니다."
      :steps="[
        '왼쪽에서 공간을 고르거나 검색어를 입력해요.',
        '문서를 클릭하면 오른쪽에 본문이 열려요.',
        '‘하위 문서 추가’로 문서 아래에 세부 문서를 만들 수 있어요.',
        '본문에 #태그와 @이름을 쓰면 태그 모아보기·멘션함과 연결돼요.',
      ]"
      :terms="[
        { term: '공간', desc: '온보딩·개발·운영·회의록처럼 문서를 묶는 큰 분류예요.' },
        { term: '고정', desc: '자주 보는 문서를 목록 맨 위에 붙여둬요.' },
        { term: '변경 이력', desc: '문서를 언제 누가 고쳤는지 남는 기록이에요.' },
      ]"
      :tips="['업무 데이터라 다른 사용자에게 공개되지 않아요.', '문서를 지우면 하위 문서는 상위로 올라가요.']"
    />
    <span class="badge danger">비공개 · 나만 보기</span>
    <span></span>
    <button v-if="wikiStore.mode.value === 'local'" class="review" style="margin: 0" @click="onReset">초기화</button>
    <PageActions><button class="primary" @click="openAdd(null)">+ 새 문서</button></PageActions>
  </div>
  <StorageNote :mode="wikiStore.mode.value" />
  <p v-if="saving.state.message && !editing" class="input-field-help wiki-message" data-state="error" role="alert">{{ saving.state.message }}</p>
  <p v-if="wikiStore.onServer() && wikiStore.state.loading && !wiki.docs.length" class="input-field-help" role="status">문서를 불러오는 중이에요.</p>
  <section v-else-if="wikiStore.onServer() && wikiStore.state.error" class="card">
    <div class="empty-state" role="status"><p>문서를 불러오지 못했어요. 연결을 확인하고 다시 시도해 주세요.</p><button type="button" class="button-secondary" @click="wikiStore.reload()">다시 시도</button></div>
  </section>

  <div class="metrics" style="--metric-cols: 4; margin-bottom: 16px">
    <article><span>전체 문서</span><b class="figure">{{ wiki.docs.length }}<small>개</small></b></article>
    <article><span>공간</span><b class="figure">{{ WIKI_SPACES.length }}<small>개</small></b></article>
    <article><span>고정 문서</span><b class="figure">{{ pinnedDocs.length }}<small>개</small></b></article>
    <article><span>태그</span><b class="figure">{{ wikiTags.length }}<small>종</small></b></article>
  </div>

  <ListFilterBar
    v-model:query="query"
    v-model:filters="filters"
    :groups="FILTER_GROUPS"
    placeholder="문서 제목·본문 검색"
    :result-count="results.length"
    :total-count="wiki.docs.length"
  />

  <section v-if="wikiTags.length" class="card" style="margin-bottom: 16px">
    <div class="tag-cloud">
      <small style="color: var(--color-muted); margin-right: 4px">태그</small>
      <button v-for="t in wikiTags" :key="t.tag" class="tag-chip" :class="{ selected: activeTag === t.tag }" @click="pickTag(t.tag)">
        #{{ t.tag }}<em>{{ t.count }}</em>
      </button>
    </div>
  </section>

  <div class="manage">
    <section class="card wiki-list">
      <div class="section-label">문서 {{ results.length }}건</div>
      <button
        v-for="d in results"
        :key="d.id"
        class="wiki-item"
        :class="{ active: activeId === d.id, child: Boolean(d.parentId) }"
        @click="activeId = d.id"
      >
        <span class="wiki-item-main">
          <b>{{ d.pinned ? '★ ' : '' }}{{ d.title }}</b>
          <small>{{ d.space }} · {{ d.updatedAt }}</small>
        </span>
      </button>
      <p v-if="!results.length" class="empty-state" role="status">조건에 맞는 문서가 없어요. 검색어나 태그를 바꿔 보세요.</p>
    </section>

    <aside class="card" v-if="active">
      <div class="wiki-crumbs">
        <template v-for="(b, i) in breadcrumb" :key="b.id">
          <button class="wiki-crumb" @click="activeId = b.id">{{ b.title }}</button>
          <span v-if="i < breadcrumb.length - 1">/</span>
        </template>
      </div>

      <div class="head" style="margin-top: 8px">
        <div>
          <h3 style="margin: 0">{{ active.title }}</h3>
          <p style="margin: 4px 0 0">
            <span class="tag">{{ active.space }}</span>
            <PersonTag :name="active.author" /> · {{ active.updatedAt }} 수정
          </p>
        </div>
        <button class="person-info" :title="active.pinned ? '고정 해제' : '고정'" :aria-label="active.pinned ? '고정 해제' : '고정'" :disabled="saving.state.status === 'saving'" @click="onPin(active)">
          {{ active.pinned ? '★' : '☆' }}
        </button>
      </div>

      <div class="wiki-body"><RichText :text="active.body" /></div>

      <div v-if="activeChildren.length" class="section-label" style="margin-top: 18px">하위 문서 {{ activeChildren.length }}개</div>
      <div class="event" v-for="c in activeChildren" :key="c.id" style="cursor: pointer" @click="activeId = c.id">
        <i></i>
        <span style="flex: 1"><b>{{ c.title }}</b><small>{{ c.updatedAt }} 수정</small></span>
      </div>

      <div class="form-row" style="margin-top: 16px">
        <button class="primary" style="flex: 1" @click="openEdit(active)">문서 수정</button>
        <button class="review" style="margin: 0" @click="openAdd(active.id)">하위 문서 추가</button>
        <button class="review" style="margin: 0" @click="onRemove(active)">삭제</button>
      </div>

      <div class="section-label" style="margin-top: 20px">{{ wikiStore.onServer() ? '이전 버전' : '변경 이력' }}</div>
      <p v-if="historyStatus === 'loading'" class="input-field-help" role="status">이전 버전을 불러오는 중이에요.</p>
      <p v-else-if="historyStatus === 'error'" class="input-field-help" data-state="error" role="alert">이전 버전을 불러오지 못했어요. 문서를 다시 골라 주세요.</p>
      <template v-else>
        <div class="event wiki-version" v-for="(h, i) in history.slice(0, 10)" :key="h.version ?? i">
          <i></i>
          <span class="wiki-version-main"><b>{{ h.version ? h.version + '판 · ' : '' }}{{ h.label }}</b><small>{{ h.by }}</small></span>
          <small class="figure">{{ h.at }}</small>
          <button v-if="h.version" type="button" class="button-secondary" :aria-expanded="openedVersion === h.version" @click="openedVersion = openedVersion === h.version ? null : h.version">{{ openedVersion === h.version ? '접기' : '내용 보기' }}</button>
          <div v-if="openedVersion === h.version" class="wiki-body wiki-version-body"><RichText :text="h.body" /></div>
        </div>
        <p v-if="!history.length" class="input-field-help">아직 고친 적이 없어요. 문서를 고치면 이전 내용이 여기에 남아요.</p>
      </template>
    </aside>

    <aside class="card" v-else>
      <p class="form-note" style="margin: 0">왼쪽에서 문서를 선택하거나 새 문서를 만들어보세요.</p>
    </aside>
  </div>

  <Modal v-if="editing" :title="editing === 'new' ? '새 문서' : '문서 수정'" :edit-resource="editing !== 'new' ? 'wiki:' + editing : ''" wide @close="editing = null">
    <label>제목<input v-model="draft.title" placeholder="예: 배포 절차" autofocus /></label>
    <div class="form-row">
      <label style="flex: 1">공간<select v-model="draft.space"><option v-for="s in WIKI_SPACES" :key="s">{{ s }}</option></select></label>
      <label style="flex: 1">상위 문서
        <select v-model="draft.parentId">
          <option :value="null">없음 (최상위)</option>
          <option v-for="d in wiki.docs.filter((x) => String(x.id) !== String(editing))" :key="d.id" :value="d.id">{{ d.title }}</option>
        </select>
      </label>
    </div>
    <label>본문</label>
    <TagMentionInput v-model="draft.body" :rows="10" placeholder="문서 내용을 적어주세요. #태그 와 @이름 을 쓸 수 있어요" />
    <p v-if="!canSave" class="form-note">제목을 입력하면 저장할 수 있어요.</p>
    <p v-if="saving.state.message" class="input-field-help" data-state="error" role="alert">{{ saving.state.message }} {{ saving.state.fieldMessage }}</p>

    <template #footer>
      <button type="button" class="modal-secondary" @click="editing = null">취소</button>
      <button class="primary" :disabled="!canSave || saving.state.status === 'saving'" :aria-busy="saving.state.status === 'saving' ? 'true' : undefined" @click="save">{{ saving.state.status === 'saving' ? '저장하는 중' : '변경 저장' }}</button>
    </template>
  </Modal>
</template>

<style scoped>
.wiki-message { margin: 0 0 var(--space-lg); }
.wiki-version { flex-wrap: wrap; }
.wiki-version-main { flex: 1 1 160px; min-width: 0; }
.wiki-version-body { flex-basis: 100%; }
</style>
