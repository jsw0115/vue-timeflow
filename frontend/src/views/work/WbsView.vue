<script setup>
import { bodyLocale, tr } from '../../store/locale'
// 지표 단위는 한국어에만 붙인다(영어는 숫자만 보인다)
import { computed, ref, watch } from 'vue'
import WorkRecords from '../../components/WorkRecords.vue'
import TagMentionInput from '../../components/TagMentionInput.vue'
import { wbsNodes, wbsStore } from '../../store/wbs'
import StorageNote from '../../components/StorageNote.vue'
import { createSaveState } from '../../features/records/saveState.mjs'
import { syncPostCollection } from '../../store/tagging'
import Modal from '../../components/Modal.vue'
import HelpPopover from '../../components/HelpPopover.vue'
import TermHint from '../../components/TermHint.vue'
import { isFeatureOn } from '../../store/aiSettings'
import { useCapabilityStatus } from '../../features/integrations/useCapabilityStatus.mjs'
import PageActions from '../../components/PageActions.vue'

// AI 안내는 서버 제공 상태 기준이다. 확인 중·확인 실패에는 아무 안내도 하지 않는다
const { state: aiStatus } = useCapabilityStatus(() => 'ai')

/**
 * WBS — 작업을 계층으로 쪼개고 공수와 진척을 굴린다.
 * 부모 작업의 공수·진척은 자식에서 자동 집계된다(직접 입력하지 않는다).
 */
// 로그인하면 계정의 노드, 로그아웃이면 이 브라우저의 노드다(PR-10 4단계)
const nodes = wbsNodes
const saving = createSaveState({ fields: { md: ['md', '공수'], progress: ['progress', '진척'], parent: ['부모', '단계'] } })
watch(nodes, rows => syncPostCollection('wbs', rows, 'WBS', '/work/wbs'), { deep: true, immediate: true })
const same = (a, b) => a !== null && a !== undefined && b !== null && b !== undefined && String(a) === String(b)
const childrenOf = (id) => nodes.value.filter((n) => same(n.parentId, id))
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
    cur = nodes.value.find((x) => same(x.id, cur.parentId))
    if (!cur) break
    d += 1
  }
  return d
}
function isHidden(n) {
  let cur = n
  while (cur.parentId) {
    const parent = nodes.value.find((x) => same(x.id, cur.parentId))
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

/** 저장은 로그인 상태면 서버 성공 응답 뒤에 목록에 들어간다. 충돌·삭제됨이면 최신 목록을 다시 부른다. */
async function persist(task) {
  const result = await saving.run(task)
  if (!result.ok && ['conflict', 'notFound'].includes(result.error?.kind) && wbsStore.onServer()) await wbsStore.reload()
  return result
}
async function setMd(n, event) {
  const value = Number(event.target.value)
  const md = Number.isFinite(value) ? Math.max(0, value) : 0
  const result = await persist(() => wbsStore.update(n, { md }))
  if (!result.ok) event.target.value = n.md
}
async function toggleOpen(n) {
  if (isLeaf(n)) return
  await persist(() => wbsStore.update(n, { open: n.open === false }))
}
async function removeNode(n) {
  if (!window.confirm(tr('‘{title}’ 작업과 하위 작업을 모두 삭제할까요?', { title: n.title }))) return
  // 로그인 상태는 서버가 하위 작업까지 지우므로 목록을 다시 부른다
  if (wbsStore.onServer()) {
    if ((await persist(() => wbsStore.remove(n))).ok) await wbsStore.reload()
    return
  }
  const doomed = new Set([n.id])
  let grew = true
  while (grew) {
    grew = false
    nodes.value.forEach((x) => {
      if (x.parentId != null && doomed.has(x.parentId) && !doomed.has(x.id)) {
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
const draftError = computed(() => !draft.value.title.trim() ? tr('작업 이름을 입력해주세요.') : !Number.isFinite(draft.value.md) || draft.value.md < 0 || !Number.isFinite(draft.value.progress) || draft.value.progress < 0 || draft.value.progress > 100 ? tr('공수는 0 이상, 진척은 0~100으로 입력해주세요.') : (draft.value.startDate || draft.value.endDate) && (!draft.value.startDate || !draft.value.endDate || draft.value.endDate < draft.value.startDate) ? tr('시작·종료 날짜를 확인해주세요.') : '')
function openEdit(n) { saving.reset(); editingId.value = n.id; adding.value = n; draft.value = { title: n.title, md: n.md ?? 0, owner: n.owner ?? '', progress: n.progress ?? 0, body: n.body ?? '', startDate: n.startDate ?? '', endDate: n.endDate ?? '' } }
function openAdd(parent) {
  saving.reset()
  editingId.value = null
  adding.value = parent ?? { id: null, title: '최상위' }
  draft.value = { title: '', md: 1, owner: '', progress: 0, body: '', startDate: '', endDate: '' }
}
async function addNode() {
  if (draftError.value) return
  const fields = { title: draft.value.title.trim(), md: draft.value.md, progress: draft.value.progress, owner: draft.value.owner.trim() || '미지정', body: draft.value.body, startDate: draft.value.startDate, endDate: draft.value.endDate }
  if (editingId.value) {
    const target = nodes.value.find((n) => same(n.id, editingId.value))
    if ((await persist(() => wbsStore.update(target, fields))).ok) adding.value = null
    return
  }
  const parentId = adding.value.id ?? null
  const result = await persist(() => wbsStore.create({ ...fields, parentId }))
  if (!result.ok) return
  const parent = parentId == null ? null : nodes.value.find((n) => same(n.id, parentId))
  if (parent && parent.open === false) await persist(() => wbsStore.update(parent, { open: true }))
  adding.value = null
}
</script>

<template>
  <div class="page-tools">
    <b style="font-size: 1rem"><TermHint term="WBS" /> {{ tr('· 작업 분해') }}</b>
    <HelpPopover
      :title="tr('WBS 사용법')"
      :summary="tr('큰 일을 작은 작업으로 쪼개고, 공수와 진척이 위로 자동 합산되게 관리하는 화면이에요.')"
      :formula="tr('상위 공수 = 하위 공수 합계    |    상위 진척 = Σ(하위 진척 × 하위 공수) ÷ Σ(하위 공수)')"
      :steps="[
        tr('‘+ 최상위 작업’으로 프로젝트를 만들어요.'),
        tr('각 행의 ‘하위 추가’로 작업을 더 잘게 쪼개요.'),
        tr('가장 아래(말단) 작업에만 공수와 담당을 입력해요.'),
        tr('상위 행의 공수·진척은 자동으로 합산되니 직접 고치지 않아도 돼요.'),
        tr('행 앞의 ⌄ 를 눌러 하위 작업을 접었다 펼 수 있어요.'),
      ]"
      :terms="[
        { term: tr('말단 작업'), desc: tr('하위가 없는 가장 아래 작업이에요. 공수를 직접 입력할 수 있는 행이 이것뿐이에요.') },
        { term: tr('롤업(rollup)'), desc: tr('하위 값을 상위로 자동 합산하는 것. 공수는 단순 합, 진척은 공수 가중 평균이에요.') },
        { term: tr('공수 가중 평균'), desc: tr('큰 작업이 진척에 더 크게 반영되도록 공수를 가중치로 쓰는 계산이에요.') },
      ]"
      :tips="[
        tr('상위 행은 공수 칸이 입력란이 아니라 ‘합계’로 표시돼요.'),
        tr('작업을 삭제하면 그 아래 하위 작업도 함께 지워져요.'),
        tr('WBS는 업무 데이터라 다른 사용자에게 공개되지 않아요.'),
      ]"
    />
    <span class="badge danger">{{ tr('비공개 · 나만 보기') }}</span>
    <span></span>
    <PageActions><button class="primary" @click="openAdd(null)">{{ tr('+ 최상위 작업') }}</button></PageActions>
  </div>
  <StorageNote :mode="wbsStore.mode.value" />
  <p v-if="saving.state.message && !adding" class="input-field-help wbs-message" data-state="error" role="alert">{{ saving.state.message }}</p>
  <p v-if="wbsStore.onServer() && wbsStore.state.loading && !nodes.length" class="input-field-help" role="status">{{ tr('작업을 불러오는 중이에요.') }}</p>
  <section v-else-if="wbsStore.onServer() && wbsStore.state.error" class="card">
    <div class="empty-state" role="status"><p>{{ tr('작업을 불러오지 못했어요. 연결을 확인하고 다시 시도해 주세요.') }}</p><button type="button" class="button-secondary" @click="wbsStore.reload()">{{ tr('다시 시도') }}</button></div>
  </section>

  <div class="metrics" style="--metric-cols: 3; margin-bottom: 16px">
    <article><span>{{ tr('총 공수') }}</span><b class="figure">{{ totalMd }}<small>MD</small></b><small>{{ (totalMd / 20).toFixed(2) }} MM</small></article>
    <article><span>{{ tr('전체 진척') }}</span><b class="figure">{{ totalProgress }}<small>%</small></b><small>{{ tr('공수 가중 평균') }}</small></article>
    <article><span>{{ tr('작업 수') }}</span><b class="figure">{{ nodes.length }}<small v-if="bodyLocale === 'ko'">개</small></b><small>{{ tr('하위 포함') }}</small></article>
  </div>

  <section class="card list wbs-list">
    <div class="list-head wbs-grid"><span>{{ tr('작업') }}</span><span>{{ tr('담당') }}</span><span><TermHint term="공수" />(<TermHint term="MD" />)</span><span>{{ tr('진척') }}</span><span>{{ tr('관리') }}</span></div>
    <div class="row wbs-grid" v-for="n in rows" :key="n.id">
      <label :style="{ paddingLeft: depthOf(n) * 18 + 'px' }">
        <button class="wbs-caret" :class="{ leaf: isLeaf(n) }" @click="toggleOpen(n)">{{ isLeaf(n) ? '·' : n.open === false ? '›' : '⌄' }}</button>
        <span>{{ n.title }}<small v-if="n.startDate" class="date-end">{{ n.startDate }} ~ {{ n.endDate }}</small></span>
      </label>
      <span class="tag">{{ tr(n.owner) }}</span>
      <span v-if="isLeaf(n)"><input class="labor-input" type="number" min="0" step="0.5" :value="n.md" :aria-label="tr('{name} 공수(MD)', { name: n.title })" @change="setMd(n, $event)" /></span>
      <span v-else class="figure">{{ rollupMd(n) }} <small style="color: var(--color-muted)">{{ tr('합계') }}</small></span>
      <span style="display: flex; align-items: center; gap: 8px">
        <div class="progress" style="flex: 1; margin: 0"><em :style="{ width: rollupProgress(n) + '%' }"></em></div>
        <b class="figure">{{ rollupProgress(n) }}%</b>
      </span>
      <span style="display: flex; gap: 6px">
        <button class="review" style="margin: 0" @click="openEdit(n)">{{ tr('상세 · 수정') }}</button>
        <button class="review" style="margin: 0" @click="openAdd(n)">{{ tr('하위 추가') }}</button>
        <button class="review" style="margin: 0" @click="removeNode(n)">{{ tr('삭제') }}</button>
      </span>
    </div>
  </section>

  <p class="form-note" style="margin-top: 12px">
    {{ tr('상위 작업의 공수와 진척은 하위 작업에서 자동으로 합산돼요(진척은 공수 가중 평균).') }}
    <template v-if="isFeatureOn('wbs-draft', aiStatus.available)"> {{ tr('AI 초안 생성이 켜져 있어 새 프로젝트를 만들 때 작업 분해를 제안받을 수 있어요.') }}</template>
    <template v-else-if="aiStatus.available === false"> {{ tr('AI 기능은 준비 중이에요. 지금은 작업을 직접 나눠 주세요.') }}</template>
    <template v-else-if="aiStatus.available === true"> {{ tr('설정 > 자동화 > AI 연동에서 ‘WBS 초안 생성’을 켜면 작업 분해를 제안받을 수 있어요.') }}</template>
  </p>

  <WorkRecords :projects="nodes" />

  <Modal v-if="adding" :title="editingId ? tr('작업 수정') : adding.id ? tr('{title} 하위 작업 추가', { title: adding.title }) : tr('최상위 작업 추가')" :edit-resource="editingId ? 'wbs:' + editingId : ''" @close="adding = null">
    <label>{{ tr('작업 이름') }}<input v-model="draft.title" :placeholder="tr('예: API 연동')" autofocus /></label>
    <div class="form-row">
      <label style="flex: 1">{{ tr('담당') }}<input v-model="draft.owner" :placeholder="tr('이름')" /></label>
      <label style="flex: 1">{{ tr('공수(MD)') }}<input type="number" min="0" step="0.5" v-model.number="draft.md" /></label>
      <label style="flex: 1">{{ tr('진척(%)') }}<input type="number" min="0" max="100" step="5" v-model.number="draft.progress" /></label>
    </div>
    <div class="form-row"><label>{{ tr('시작 날짜') }}<input type="date" v-model="draft.startDate" /></label><label>{{ tr('종료 날짜') }}<input type="date" v-model="draft.endDate" /></label></div>
    <label>{{ tr('상세 내용 · 태그 · 멘션') }}<TagMentionInput v-model="draft.body" /></label>
    <p class="form-note" role="status">{{ draftError || tr('상위 작업의 공수·진척은 하위 작업에서 자동 집계됩니다.') }}</p>
    <p v-if="saving.state.message" class="input-field-help" data-state="error" role="alert">{{ saving.state.message }} {{ saving.state.fieldMessage }}</p>

    <template #footer>
      <button type="button" class="modal-secondary" @click="adding = null">{{ tr('취소') }}</button>
      <button class="primary" :disabled="!!draftError || saving.state.status === 'saving'" :aria-busy="saving.state.status === 'saving' ? 'true' : undefined" @click="addNode">{{ saving.state.status === 'saving' ? tr('저장하는 중') : editingId ? tr('변경 저장') : tr('추가하기') }}</button>
    </template>
  </Modal>
</template>

<style scoped>
.wbs-message { margin: 0 0 var(--space-lg); }
</style>
