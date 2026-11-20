<!-- 다른 곳에서 먼저 고친 기록을 저장하려 할 때 내 입력과 최신 내용을 나란히 보이고 고르게 한다. 고르기 전에는 아무것도 바꾸지 않는다(PR-07, UF-84). -->
<script setup>
import { nextTick, onMounted, ref, useId } from 'vue'
const props = defineProps({
  // [{ label, mine, latest }] 형식. 값은 화면에 보일 글자다
  rows: { type: Array, required: true },
  busy: { type: Boolean, default: false },
})
const emit = defineEmits(['keep-mine', 'use-latest'])
const id = useId(), heading = ref(null)
onMounted(async () => { await nextTick(); heading.value?.focus() })
const shown = (value) => (value === '' || value == null ? '비어 있음' : value)
</script>
<template>
  <section class="conflict-compare" role="group" :aria-labelledby="id">
    <h3 :id="id" ref="heading" tabindex="-1">다른 곳에서 먼저 고쳤어요</h3>
    <p>내 입력과 최신 내용을 비교해 골라 주세요. 고르기 전에는 아무것도 바뀌지 않아요.</p>
    <div class="conflict-columns">
      <div>
        <h4>내 입력</h4>
        <dl><template v-for="row in rows" :key="row.label"><dt>{{ row.label }}</dt><dd :class="{ changed: row.mine !== row.latest }">{{ shown(row.mine) }}</dd></template></dl>
      </div>
      <div>
        <h4>최신 내용</h4>
        <dl><template v-for="row in rows" :key="row.label"><dt>{{ row.label }}</dt><dd :class="{ changed: row.mine !== row.latest }">{{ shown(row.latest) }}</dd></template></dl>
      </div>
    </div>
    <div class="conflict-actions">
      <button type="button" class="button-secondary" :disabled="busy" :aria-busy="busy ? 'true' : undefined" @click="emit('keep-mine')">{{ busy ? '저장하는 중' : '내 내용으로 다시 저장' }}</button>
      <button type="button" class="button-secondary" :disabled="busy" @click="emit('use-latest')">서버 내용 쓰기</button>
    </div>
  </section>
</template>
<style>
.conflict-compare { margin: var(--space-lg) 0; padding: var(--space-lg); border: 1px solid var(--color-hairline); border-radius: var(--radius-md); background: var(--color-card); }
.conflict-compare h3 { margin: 0 0 var(--space-xs); font-size: var(--type-body-size); font-weight: 600; }
.conflict-compare h3:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }
.conflict-compare > p { margin: 0 0 var(--space-lg); font-size: var(--type-caption-size); color: var(--color-muted); }
.conflict-columns { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr)); gap: var(--space-lg); }
.conflict-columns h4 { margin: 0 0 var(--space-sm); font-size: var(--type-caption-size); font-weight: 600; }
.conflict-columns dl { margin: 0; }
.conflict-columns dt { font-size: var(--type-caption-size); color: var(--color-muted); }
.conflict-columns dd { margin: 0 0 var(--space-md); overflow-wrap: anywhere; white-space: pre-line; }
.conflict-columns dd.changed { font-weight: 600; }
.conflict-actions { display: flex; flex-wrap: wrap; gap: var(--space-md); margin-top: var(--space-md); }
</style>
