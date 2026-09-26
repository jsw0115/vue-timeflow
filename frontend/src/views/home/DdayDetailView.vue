<script setup>
import { computed, ref, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { findDday, togglePin, updateDday, removeDday } from '../../store/ddays'

const route = useRoute()
const router = useRouter()
const item = computed(() => findDday(route.params.id))

const draft = ref({ title: '', category: '개인', date: '' })
watchEffect(() => {
  if (item.value) draft.value = { title: item.value.title, category: item.value.category, date: '' }
})

function save() {
  if (!item.value || !draft.value.title.trim()) return
  updateDday(item.value.id, { title: draft.value.title.trim(), category: draft.value.category, date: draft.value.date })
}
function remove() {
  if (!item.value) return
  removeDday(item.value.id)
  router.push('/dday')
}
</script>

<template>
  <div class="crumbs"><a @click="router.push('/dday')">D-Day</a> / 상세</div>
  <section v-if="item" class="card" style="max-width: 480px; margin: 0 auto">
    <div class="head">
      <div>
        <span class="badge brand">{{ item.category }}</span>
        <h2 style="margin: 10px 0 4px">{{ item.title }}</h2>
        <p>{{ item.date }}</p>
      </div>
      <button class="icon" :title="item.pinned ? '고정 해제' : '고정하기'" aria-label="item.pinned ? '고정 해제' : '고정하기'" @click="togglePin(item)">{{ item.pinned ? '★' : '☆' }}</button>
    </div>
    <b class="dday-num" style="display: block; margin: 12px 0">{{ item.dday }}</b>

    <div style="margin-top: 10px; padding-top: 20px; border-top: 1px solid var(--color-hairline)">
      <label>제목<input v-model="draft.title" /></label>
      <label>날짜 변경<input v-model="draft.date" type="date" /></label>
      <label>카테고리<select v-model="draft.category"><option>개인</option><option>업무</option><option>가족</option><option>건강</option><option>공부</option></select></label>
      <button class="primary" style="width: 100%; margin-top: 16px" @click="save">저장하기</button>
      <button style="width: 100%; margin-top: 8px; color: #b23b3b; font-weight: 700; padding: 10px" @click="remove">삭제하기</button>
    </div>
  </section>
  <p v-else>D-Day 항목을 찾을 수 없어요. <a @click="router.push('/dday')" style="color: var(--color-accent); font-weight: 700; cursor: pointer">목록으로 돌아가기</a></p>
</template>
