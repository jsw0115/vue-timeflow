<script setup>
import { tr } from '../../store/locale'
import { computed, ref } from 'vue'
import Modal from '../../components/Modal.vue'

/** 카테고리 관리 — 추가/수정/삭제와 하위 카테고리가 실제로 동작한다. */
const SWATCHES = ['var(--color-accent)', '#43596b', '#8a6a3c', '#b23b3b', '#4a4740', '#2f7a56']

const cats = ref([
  { id: 1, label: '업무', color: 'var(--color-accent)', subs: ['회의', '개발', '문서화'] },
  { id: 2, label: '공부', color: '#43596b', subs: [] },
  { id: 3, label: '건강', color: '#2f7a56', subs: [] },
  { id: 4, label: '휴식', color: '#8a6a3c', subs: [] },
  { id: 5, label: '개인', color: '#b23b3b', subs: [] },
  { id: 6, label: '기타', color: '#4a4740', subs: [] },
])

const editing = ref(null)
const draft = ref({ label: '', color: SWATCHES[0], subText: '' })

function openAdd() {
  editing.value = 'new'
  draft.value = { label: '', color: SWATCHES[0], subText: '' }
}
function openEdit(c) {
  editing.value = c.id
  draft.value = { label: c.label, color: c.color, subText: c.subs.join(', ') }
}
function save() {
  const label = draft.value.label.trim()
  if (!label) return
  const subs = draft.value.subText
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  if (editing.value === 'new') {
    cats.value.push({ id: Math.max(0, ...cats.value.map((c) => c.id)) + 1, label, color: draft.value.color, subs })
  } else {
    const target = cats.value.find((c) => c.id === editing.value)
    if (target) Object.assign(target, { label, color: draft.value.color, subs })
  }
  editing.value = null
}
function remove(c) {
  // 이 화면의 목록은 시연이라 지워도 기록의 분류는 바뀌지 않는다(예전 확인 문구는 '기타'로 옮긴다고 했다. PR-32 12단계에서 고침)
  if (!window.confirm(tr('‘{name}’ 카테고리를 목록에서 지울까요? 시연 화면이라 기록의 분류는 바뀌지 않아요.', { name: tr(c.label) }))) return
  cats.value = cats.value.filter((x) => x.id !== c.id)
  editing.value = null
}
const subCount = computed(() => cats.value.reduce((a, c) => a + c.subs.length, 0))
</script>

<template>
  <section class="card setting-content">
    <div class="setting-head">
      <div>
        <h2>{{ tr('카테고리') }}</h2>
        <p>{{ tr('기록을 분류하는 기준이에요. 카테고리 {n}개 · 하위 {m}개', { n: cats.length, m: subCount }) }}</p>
        <p class="sample-label">{{ tr('이 화면의 카테고리는 시연용이에요. 바꿔도 저장되지 않고 기록의 분류도 바뀌지 않아요.') }}</p>
      </div>
      <button type="button" class="button-secondary" @click="openAdd">{{ tr('+ 카테고리 추가') }}</button>
    </div>

    <div class="trow" v-for="c in cats" :key="c.id">
      <span style="display: flex; align-items: center; gap: 8px; flex: 1">
        <span class="cat-dot" :style="{ background: c.color }"></span>
        <b>{{ tr(c.label) }}</b>
        <span v-for="s in c.subs" :key="s" class="tag">{{ tr(s) }}</span>
        <small v-if="!c.subs.length" style="color: var(--color-muted)">{{ tr('하위 없음') }}</small>
      </span>
      <button class="review" style="margin: 0" @click="openEdit(c)">{{ tr('수정') }}</button>
      <button class="review" style="margin: 0" @click="remove(c)">{{ tr('삭제') }}</button>
    </div>
  </section>

  <Modal v-if="editing" :title="editing === 'new' ? tr('카테고리 추가') : tr('카테고리 수정')" @close="editing = null">
    <label>{{ tr('이름') }}<input v-model="draft.label" :placeholder="tr('예: 사이드 프로젝트')" autofocus @keyup.enter="save" /></label>
    <label>{{ tr('색상') }}</label>
    <div class="swatch-row">
      <button
        v-for="s in SWATCHES"
        :key="s"
        type="button"
        class="cat-swatch"
        :class="{ picked: draft.color === s }"
        :style="{ background: s }"
        @click="draft.color = s"
      ></button>
    </div>
    <label>{{ tr('하위 카테고리') }}<input v-model="draft.subText" :placeholder="tr('쉼표로 구분 · 예: 회의, 개발, 문서화')" /></label>

    <template #footer>
      <button type="button" class="modal-secondary" @click="editing = null">{{ tr('취소') }}</button>
      <button class="primary" @click="save">{{ editing === 'new' ? tr('추가하기') : tr('저장하기') }}</button>
    </template>
  </Modal>
</template>
