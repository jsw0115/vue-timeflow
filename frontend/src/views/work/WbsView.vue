<script setup>
import { computed, ref, watch } from 'vue'
import WorkRecords from '../../components/WorkRecords.vue'
import TagMentionInput from '../../components/TagMentionInput.vue'
import { localCollection } from '../../store/localCollection'
import { syncPostCollection } from '../../store/tagging'
import Modal from '../../components/Modal.vue'
import HelpPopover from '../../components/HelpPopover.vue'
import { isFeatureOn } from '../../store/aiSettings'

/**
 * WBS — 작업을 계층으로 쪼개고 공수와 진척을 굴린다.
 * 부모 작업의 공수·진척은 자식에서 자동 집계된다(직접 입력하지 않는다).
 */
const nodes = localCollection('wbs', [
  { id: 1, parentId: null, title: '타임바 리뉴얼', md: 0, progress: 0, owner: '김지수', open: true },
  { id: 2, parentId: 1, title: '요구사항 정리', md: 0, progress: 0, owner: '김지수', open: true },
  { id: 3, parentId: 2, title: '사용자 인터뷰', md: 2, progress: 100, owner: '김지수' },
  { id: 4, parentId: 2, title: '기능 명세 작성', md: 3, progress: 60, owner: '이서연' },
  { id: 5, parentId: 1, title: '화면 개발', md: 0, progress: 0, owner: '박민준', open: true },
  { id: 6, parentId: 5, title: '홈·플래너', md: 8, progress: 45, owner: '박민준' },
  { id: 7, parentId: 5, title: '통계·리포트', md: 6, progress: 20, owner: '최지우' },
])

watch(nodes, rows => syncPostCollection('wbs', rows, 'WBS', '/work/wbs'), { deep: true, immediate: true })
const childrenOf = (id) => nodes.value.filter((n) => n.parentId === id)
const isLeaf = (n) => childrenOf(n.id).length === 0

function rollupMd(n) {
  if (isLeaf(n)) return n.md
  return Math.round(childrenOf(n.id).reduce((a, c) => a + rollupMd(c), 0) * 10) / 10
}
function rollupProgress(n) {
  if (isLeaf(n)) return n.progress
  const kids = childrenOf(n.id)
  const total = kids.reduce((a, c) => a + rollupMd(c), 0)
  if (!total) return 0
  return Math.round(kids.reduce((a, c) => a + rollupProgress(c) * rollupMd(c), 0) / total)
}
function depthOf(n) {
  let d = 0
  let cur = n
  while (cur.parentId) {
    cur = nodes.value.find((x) => x.id === cur.parentId)
    if (!cur) break
    d += 1
  }
  return d
}
function isHidden(n) {
  let cur = n
  while (cur.parentId) {
    const parent = nodes.value.find((x) => x.id === cur.parentId)
    if (!parent) break
    if (parent.open === false) return true
    cur = parent
  }
  return false
}
const rows = computed(() => nodes.value.filter((n) => !isHidden(n)))
const roots = computed(() => nodes.value.filter((n) => !n.parentId))
const totalMd = computed(() => Math.round(roots.value.reduce((a, r) => a + rollupMd(r), 0) * 10) / 10)
const totalProgress = computed(() => {
  const t = roots.value.reduce((a, r) => a + rollupMd(r), 0)
  if (!t) return 0
  return Math.round(roots.value.reduce((a, r) => a + rollupProgress(r) * rollupMd(r), 0) / t)
})

function setMd(n, event) { const value = Number(event.target.value); n.md = Number.isFinite(value) ? Math.max(0, value) : 0; event.target.value = n.md }
function toggleOpen(n) {
  if (isLeaf(n)) return
  n.open = n.open === false
}
function removeNode(n) {
  if (!window.confirm('‘' + n.title + '’과(와) 하위 작업을 모두 삭제할까요?')) return
  const doomed = new Set([n.id])
  let grew = true
  while (grew) {
    grew = false
    nodes.value.forEach((x) => {
      if (x.parentId && doomed.has(x.parentId) && !doomed.has(x.id)) {
        doomed.add(x.id)
        grew = true
      }
    })
  }
  nodes.value = nodes.value.filter((x) => !doomed.has(x.id))
}

const adding = ref(null) // 부모 노드
const editingId = ref(null)
const draft = ref({ title: '', md: 1, owner: '', progress: 0, body: '', startDate: '', endDate: '' })
const draftError = computed(() => !draft.value.title.trim() ? '작업 이름을 입력해주세요.' : !Number.isFinite(draft.value.md) || draft.value.md < 0 || !Number.isFinite(draft.value.progress) || draft.value.progress < 0 || draft.value.progress > 100 ? '공수는 0 이상, 진척은 0~100으로 입력해주세요.' : (draft.value.startDate || draft.value.endDate) && (!draft.value.startDate || !draft.value.endDate || draft.value.endDate < draft.value.startDate) ? '시작·종료 날짜를 확인해주세요.' : '')
function openEdit(n) { editingId.value = n.id; adding.value = n; draft.value = { body: '', startDate: '', endDate: '', ...n } }
function openAdd(parent) {
  editingId.value = null
  adding.value = parent ?? { id: null, title: '최상위' }
  draft.value = { title: '', md: 1, owner: '', progress: 0, body: '', startDate: '', endDate: '' }
}
function addNode() {
  if (draftError.value) return
  if (editingId.value) {
    const target = nodes.value.find(n => n.id === editingId.value)
    Object.assign(target, { ...draft.value, title: draft.value.title.trim() })
    adding.value = null
    return
  }
  nodes.value.push({
    id: Math.max(0, ...nodes.value.map((n) => n.id)) + 1,
    parentId: adding.value.id,
    body: draft.value.body, startDate: draft.value.startDate, endDate: draft.value.endDate,
    title: draft.value.title.trim(),
    md: draft.value.md,
    progress: draft.value.progress,
    owner: draft.value.owner.trim() || '미지정',
  })
  if (adding.value.id) {
    const parent = nodes.value.find((n) => n.id === adding.value.id)
    if (parent) parent.open = true
  }
  adding.value = null
}
</script>

<template>
  <div class="page-tools">
    <b style="font-size: 16px">WBS · 작업 분해</b>
    <HelpPopover
      title="WBS 사용법"
      summary="큰 일을 작은 작업으로 쪼개고, 공수와 진척이 위로 자동 합산되게 관리하는 화면이에요."
      formula="상위 공수 = 하위 공수 합계    |    상위 진척 = Σ(하위 진척 × 하위 공수) ÷ Σ(하위 공수)"
      :steps="[
        '‘+ 최상위 작업’으로 프로젝트를 만들어요.',
        '각 행의 ‘하위 추가’로 작업을 더 잘게 쪼개요.',
        '가장 아래(말단) 작업에만 공수와 담당을 입력해요.',
        '상위 행의 공수·진척은 자동으로 합산되니 직접 고치지 않아도 돼요.',
        '행 앞의 ⌄ 를 눌러 하위 작업을 접었다 펼 수 있어요.',
      ]"
      :terms="[
        { term: '말단 작업', desc: '하위가 없는 가장 아래 작업이에요. 공수를 직접 입력할 수 있는 행이 이것뿐이에요.' },
        { term: '롤업(rollup)', desc: '하위 값을 상위로 자동 합산하는 것. 공수는 단순 합, 진척은 공수 가중 평균이에요.' },
        { term: '공수 가중 평균', desc: '큰 작업이 진척에 더 크게 반영되도록 공수를 가중치로 쓰는 계산이에요.' },
      ]"
      :tips="[
        '상위 행은 공수 칸이 입력란이 아니라 ‘합계’로 표시돼요.',
        '작업을 삭제하면 그 아래 하위 작업도 함께 지워져요.',
        'WBS는 업무 데이터라 다른 사용자에게 공개되지 않아요.',
      ]"
    />
    <span class="badge danger">비공개 · 나만 보기</span>
    <span></span>
    <button class="primary" @click="openAdd(null)">+ 최상위 작업</button>
  </div>

  <div class="metrics" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 16px">
    <article><span>총 공수</span><b class="figure">{{ totalMd }}<small>MD</small></b><small>{{ (totalMd / 20).toFixed(2) }} MM</small></article>
    <article><span>전체 진척</span><b class="figure">{{ totalProgress }}<small>%</small></b><small>공수 가중 평균</small></article>
    <article><span>작업 수</span><b class="figure">{{ nodes.length }}<small>개</small></b><small>하위 포함</small></article>
  </div>

  <section class="card list wbs-list">
    <div class="list-head wbs-grid"><span>작업</span><span>담당</span><span>공수(MD)</span><span>진척</span><span>관리</span></div>
    <div class="row wbs-grid" v-for="n in rows" :key="n.id">
      <label :style="{ paddingLeft: depthOf(n) * 18 + 'px' }">
        <button class="wbs-caret" :class="{ leaf: isLeaf(n) }" @click="toggleOpen(n)">{{ isLeaf(n) ? '·' : n.open === false ? '›' : '⌄' }}</button>
        <span>{{ n.title }}<small v-if="n.startDate" class="date-end">{{ n.startDate }} ~ {{ n.endDate }}</small></span>
      </label>
      <span class="tag">{{ n.owner }}</span>
      <span v-if="isLeaf(n)"><input class="labor-input" type="number" min="0" step="0.5" :value="n.md" @change="setMd(n, $event)" /></span>
      <span v-else class="figure">{{ rollupMd(n) }} <small style="color: var(--color-muted)">합계</small></span>
      <span style="display: flex; align-items: center; gap: 8px">
        <div class="progress" style="flex: 1; margin: 0"><em :style="{ width: rollupProgress(n) + '%' }"></em></div>
        <b class="figure">{{ rollupProgress(n) }}%</b>
      </span>
      <span style="display: flex; gap: 6px">
        <button class="review" style="margin: 0" @click="openEdit(n)">상세 · 수정</button>
        <button class="review" style="margin: 0" @click="openAdd(n)">하위 추가</button>
        <button class="review" style="margin: 0" @click="removeNode(n)">삭제</button>
      </span>
    </div>
  </section>

  <p class="form-note" style="margin-top: 12px">
    상위 작업의 공수와 진척은 하위 작업에서 자동으로 합산돼요(진척은 공수 가중 평균).
    <template v-if="isFeatureOn('wbs-draft')"> AI 초안 생성이 켜져 있어 새 프로젝트를 만들 때 작업 분해를 제안받을 수 있어요.</template>
    <template v-else> 설정 &gt; 자동화 &gt; AI 연동에서 ‘WBS 초안 생성’을 켜면 작업 분해를 제안받을 수 있어요.</template>
  </p>

  <WorkRecords :projects="nodes" />

  <Modal v-if="adding" :title="editingId ? '작업 수정' : adding.id ? adding.title + ' 하위 작업 추가' : '최상위 작업 추가'" @close="adding = null">
    <label>작업 이름<input v-model="draft.title" placeholder="예: API 연동" autofocus /></label>
    <div class="form-row">
      <label style="flex: 1">담당<input v-model="draft.owner" placeholder="이름" /></label>
      <label style="flex: 1">공수(MD)<input type="number" min="0" step="0.5" v-model.number="draft.md" /></label>
      <label style="flex: 1">진척(%)<input type="number" min="0" max="100" step="5" v-model.number="draft.progress" /></label>
    </div>
    <div class="form-row"><label>시작 날짜<input type="date" v-model="draft.startDate" /></label><label>종료 날짜<input type="date" v-model="draft.endDate" /></label></div>
    <label>상세 내용 · 태그 · 멘션<TagMentionInput v-model="draft.body" /></label>
    <p class="form-note" role="status">{{ draftError || '상위 작업의 공수·진척은 하위 작업에서 자동 집계됩니다.' }}</p>
    <button class="primary" :disabled="!!draftError" @click="addNode">{{ editingId ? '변경 저장' : '추가하기' }}</button>
  </Modal>
</template>
