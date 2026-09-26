<script setup>
import { computed, ref } from 'vue'

const TYPES = ['전체', '일정', '할 일', '메모']
const filter = ref('전체')
const items = ref([
  { id: 1, title: '분기 킥오프 미팅', type: '일정', deleted: '8/18', left: 22 },
  { id: 2, title: '디자인 리뷰 아이디어', type: '메모', deleted: '8/15', left: 19 },
  { id: 3, title: '세금 신고 준비', type: '할 일', deleted: '7/30', left: 3 },
  { id: 4, title: '주간 회고 메모', type: '메모', deleted: '8/20', left: 24 },
  { id: 5, title: '헬스장 등록하기', type: '할 일', deleted: '8/21', left: 25 },
])

const visible = computed(() => (filter.value === '전체' ? items.value : items.value.filter((i) => i.type === filter.value)))
function countOf(type) {
  return type === '전체' ? items.value.length : items.value.filter((i) => i.type === type).length
}
function restore(item) {
  items.value = items.value.filter((i) => i.id !== item.id)
}
function purge(item) {
  items.value = items.value.filter((i) => i.id !== item.id)
}
</script>

<template>
  <div class="setting-head">
    <div>
      <h2>휴지통</h2>
      <p>삭제한 항목을 30일간 보관해요. 기간이 지나면 자동으로 사라져요.</p>
    </div>
  </div>

  <div class="page-tools">
    <div class="filter">
      <button v-for="t in TYPES" :key="t" :class="{ selected: filter === t }" @click="filter = t">{{ t }} {{ countOf(t) }}</button>
    </div>
    <span></span>
    <small style="color: var(--color-muted)">30일이 지나면 자동으로 영구 삭제돼요</small>
  </div>
  <section class="card list">
    <div class="list-head" style="grid-template-columns: 2fr 0.8fr 1fr 1fr 1.2fr">
      <span>이름</span><span>유형</span><span>삭제일</span><span>남은 기간</span><span>관리</span>
    </div>
    <div class="row" style="grid-template-columns: 2fr 0.8fr 1fr 1fr 1.2fr" v-for="i in visible" :key="i.id">
      <label>{{ i.title }}</label>
      <span class="tag">{{ i.type }}</span>
      <span>{{ i.deleted }}</span>
      <span :style="{ color: i.left <= 7 ? '#b23b3b' : 'var(--color-muted)', fontWeight: i.left <= 7 ? 700 : 400 }">{{ i.left }}일</span>
      <span style="display: flex; gap: 8px">
        <button class="review" style="margin: 0; padding: 6px 10px" @click="restore(i)">복구</button>
        <button class="review" style="margin: 0; padding: 6px 10px; color: #b23b3b" @click="purge(i)">영구 삭제</button>
      </span>
    </div>
    <p v-if="visible.length === 0" style="padding: 20px 0">휴지통에 {{ filter === '전체' ? '' : filter + ' ' }}항목이 없어요.</p>
  </section>
</template>
