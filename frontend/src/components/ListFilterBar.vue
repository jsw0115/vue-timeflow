<script setup>
import { tr } from '../store/locale'
import { computed } from 'vue'

/**
 * 목록 화면 공통 검색·필터 바.
 * 일정/할 일/루틴/메모/플래너가 같은 조작감을 갖도록 한 컴포넌트로 통일한다.
 *
 * v-model:query   검색어
 * v-model:filters 활성 필터 { [groupId]: value }
 * groups          [{ id, label, options: [{ value, label }], all }]
 */
const props = defineProps({
  query: { type: String, default: '' },
  filters: { type: Object, default: () => ({}) },
  groups: { type: Array, default: () => [] },
  placeholder: { type: String, default: '' },
  resultCount: { type: Number, default: null },
  totalCount: { type: Number, default: null },
})
const emit = defineEmits(['update:query', 'update:filters'])

function setFilter(groupId, value) {
  emit('update:filters', { ...props.filters, [groupId]: value })
}
function valueOf(group) {
  return props.filters[group.id] ?? group.all ?? '전체'
}
/** 기본값이 아닌 필터 개수 — 초기화 버튼 노출 판단에 쓴다 */
const activeCount = computed(() => {
  const dirty = props.groups.filter((g) => valueOf(g) !== (g.all ?? '전체')).length
  return dirty + (props.query.trim() ? 1 : 0)
})
function reset() {
  emit('update:query', '')
  const cleared = {}
  props.groups.forEach((g) => (cleared[g.id] = g.all ?? '전체'))
  emit('update:filters', cleared)
}
</script>

<template>
  <div class="list-filter">
    <div class="list-filter-main">
      <label class="list-search">
        <span aria-hidden="true">⌕</span>
        <input
          :value="query"
          :placeholder="placeholder || tr('검색')"
          type="search"
          @input="emit('update:query', $event.target.value)"
        />
        <button v-if="query" class="person-info" type="button" :title="tr('검색어 지우기')" :aria-label="tr('검색어 지우기')" @click="emit('update:query', '')">×</button>
      </label>

      <div class="filter" v-for="g in groups" :key="g.id">
        <button
          v-for="o in g.options"
          :key="o.value"
          type="button"
          :class="{ selected: valueOf(g) === o.value }"
          @click="setFilter(g.id, o.value)"
        >{{ tr(o.label) }}</button>
      </div>

      <slot name="actions" />
    </div>

    <div class="list-filter-meta">
      <span v-if="resultCount !== null">
        {{ totalCount !== null && resultCount !== totalCount ? tr('{n}건 / 전체 {total}건', { n: resultCount, total: totalCount }) : tr('{n}건', { n: resultCount }) }}
      </span>
      <button v-if="activeCount" class="review" style="margin: 0; padding: 4px 10px" @click="reset">{{ tr('필터 초기화 ({n})', { n: activeCount }) }}</button>
    </div>
  </div>
</template>
