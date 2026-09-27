<script setup>
import { computed, ref } from 'vue'
import Modal from '../../components/Modal.vue'
import HelpPopover from '../../components/HelpPopover.vue'
import ListFilterBar from '../../components/ListFilterBar.vue'
import RichText from '../../components/RichText.vue'
import TagMentionInput from '../../components/TagMentionInput.vue'
import PersonTag from '../../components/PersonTag.vue'
import {
  wiki, WIKI_SPACES, findDoc, childrenOf, pinnedDocs, wikiTags,
  addDoc, updateDoc, togglePin, removeDoc, searchDocs, resetWiki,
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
  editing.value = 'new'
  draft.value = empty(parentId)
}
function openEdit(doc) {
  editing.value = doc.id
  draft.value = { space: doc.space, title: doc.title, body: doc.body, parentId: doc.parentId }
}
const canSave = computed(() => Boolean(draft.value.title.trim()))
function save() {
  if (!canSave.value) return
  if (editing.value === 'new') {
    const doc = addDoc({ ...draft.value })
    activeId.value = doc.id
  } else {
    updateDoc(editing.value, { ...draft.value })
  }
  editing.value = null
}
function onRemove(doc) {
  if (!window.confirm('‘' + doc.title + '’ 문서를 삭제할까요? 하위 문서는 상위로 옮겨져요.')) return
  removeDoc(doc.id)
  if (activeId.value === doc.id) activeId.value = wiki.docs[0]?.id ?? null
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
    <b style="font-size: 1rem">업무 위키</b>
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
    <button class="review" style="margin: 0" @click="onReset">초기화</button>
    <button class="primary" @click="openAdd(null)">+ 새 문서</button>
  </div>

  <div class="metrics" style="grid-template-columns: repeat(4, 1fr); margin-bottom: 16px">
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
      <p v-if="!results.length" class="form-note" style="margin: 8px 0 0">조건에 맞는 문서가 없어요.</p>
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
        <button class="person-info" :title="active.pinned ? '고정 해제' : '고정'" :aria-label="active.pinned ? '고정 해제' : '고정'" @click="togglePin(active)">
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

      <div class="section-label" style="margin-top: 20px">변경 이력</div>
      <div class="event" v-for="(h, i) in active.history.slice(0, 5)" :key="i">
        <i></i>
        <span style="flex: 1"><b>{{ h.note }}</b><small>{{ h.by }}</small></span>
        <small class="figure">{{ h.at }}</small>
      </div>
    </aside>

    <aside class="card" v-else>
      <p class="form-note" style="margin: 0">왼쪽에서 문서를 선택하거나 새 문서를 만들어보세요.</p>
    </aside>
  </div>

  <Modal v-if="editing" :title="editing === 'new' ? '새 문서' : '문서 수정'" wide @close="editing = null">
    <label>제목<input v-model="draft.title" placeholder="예: 배포 절차" autofocus /></label>
    <div class="form-row">
      <label style="flex: 1">공간<select v-model="draft.space"><option v-for="s in WIKI_SPACES" :key="s">{{ s }}</option></select></label>
      <label style="flex: 1">상위 문서
        <select v-model="draft.parentId">
          <option :value="null">없음 (최상위)</option>
          <option v-for="d in wiki.docs.filter((x) => x.id !== editing)" :key="d.id" :value="d.id">{{ d.title }}</option>
        </select>
      </label>
    </div>
    <label>본문</label>
    <TagMentionInput v-model="draft.body" :rows="10" placeholder="문서 내용을 적어주세요. #태그 와 @이름 을 쓸 수 있어요" />
    <p v-if="!canSave" class="form-note">제목을 입력하면 저장할 수 있어요.</p>
    <button class="primary" :disabled="!canSave" @click="save">{{ editing === 'new' ? '문서 만들기' : '변경 저장' }}</button>
  </Modal>
</template>
