<script setup>
import { tr } from '../../store/locale'
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
      <h2>{{ tr('휴지통') }}</h2>
      <p>{{ tr('삭제한 항목을 30일간 보관해요. 기간이 지나면 자동으로 사라져요.') }}</p>
      <!-- 지금 휴지통은 화면 예시뿐이다. 기록을 지워도 여기에 모이지 않아 시연 표시를 붙인다(CLAUDE.md: 시연을 실제처럼 보이지 않기) -->
      <p class="sample-label">{{ tr('이 화면의 항목은 시연용 예시 데이터예요. 기록을 지워도 아직 여기에 모이지 않아요.') }}</p>
    </div>
  </div>

  <div class="page-tools">
    <div class="filter">
      <button v-for="t in TYPES" :key="t" :class="{ selected: filter === t }" @click="filter = t">{{ tr(t) }} {{ countOf(t) }}</button>
    </div>
    <span></span>
    <small style="color: var(--color-muted)">{{ tr('30일이 지나면 자동으로 영구 삭제돼요') }}</small>
  </div>
  <section class="card list">
    <div class="list-head" style="grid-template-columns: 2fr 0.8fr 1fr 1fr 1.2fr">
      <span>{{ tr('이름') }}</span><span>{{ tr('유형') }}</span><span>{{ tr('삭제일') }}</span><span>{{ tr('남은 기간') }}</span><span>{{ tr('관리') }}</span>
    </div>
    <div class="row" style="grid-template-columns: 2fr 0.8fr 1fr 1fr 1.2fr" v-for="i in visible" :key="i.id">
      <label>{{ i.title }}</label>
      <span class="tag">{{ tr(i.type) }}</span>
      <span>{{ i.deleted }}</span>
      <span :style="{ color: i.left <= 7 ? 'var(--color-status-danger)' : 'var(--color-muted)', fontWeight: i.left <= 7 ? 700 : 400 }">{{ i.left === 1 ? tr('1일') : tr('{n}일', { n: i.left }) }}</span>
      <span style="display: flex; gap: 8px">
        <button class="review" style="margin: 0; padding: 6px 10px" @click="restore(i)">{{ tr('복구') }}</button>
        <button class="review" style="margin: 0; padding: 6px 10px; color: var(--color-status-danger)" @click="purge(i)">{{ tr('영구 삭제') }}</button>
      </span>
    </div>
    <p v-if="visible.length === 0" style="padding: 20px 0">{{ filter === '전체' ? tr('휴지통에 항목이 없어요.') : tr('휴지통에 {type} 항목이 없어요.', { type: tr(filter) }) }}</p>
  </section>
</template>
