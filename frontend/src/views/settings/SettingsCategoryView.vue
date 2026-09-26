<script setup>
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
  if (!window.confirm('‘' + c.label + '’ 카테고리를 삭제할까요? 이 카테고리로 분류된 기록은 ‘기타’로 옮겨져요.')) return
  cats.value = cats.value.filter((x) => x.id !== c.id)
  editing.value = null
}
const subCount = computed(() => cats.value.reduce((a, c) => a + c.subs.length, 0))
</script>

<template>
  <section class="card setting-content">
    <div class="setting-head">
      <div>
        <h2>카테고리</h2>
        <p>기록을 분류하는 기준이에요. 카테고리 {{ cats.length }}개 · 하위 {{ subCount }}개</p>
      </div>
      <button class="primary" @click="openAdd">+ 카테고리 추가</button>
    </div>

    <div class="trow" v-for="c in cats" :key="c.id">
      <span style="display: flex; align-items: center; gap: 8px; flex: 1">
        <span class="cat-dot" :style="{ background: c.color }"></span>
        <b>{{ c.label }}</b>
        <span v-for="s in c.subs" :key="s" class="tag">{{ s }}</span>
        <small v-if="!c.subs.length" style="color: var(--color-muted)">하위 없음</small>
      </span>
      <button class="review" style="margin: 0" @click="openEdit(c)">수정</button>
      <button class="review" style="margin: 0" @click="remove(c)">삭제</button>
    </div>
  </section>

  <Modal v-if="editing" :title="editing === 'new' ? '카테고리 추가' : '카테고리 수정'" @close="editing = null">
    <label>이름<input v-model="draft.label" placeholder="예: 사이드 프로젝트" autofocus @keyup.enter="save" /></label>
    <label>색상</label>
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
    <label>하위 카테고리<input v-model="draft.subText" placeholder="쉼표로 구분 · 예: 회의, 개발, 문서화" /></label>
    <button class="primary" @click="save">{{ editing === 'new' ? '추가하기' : '저장하기' }}</button>
  </Modal>
</template>
