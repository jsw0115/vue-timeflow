<script setup>
import { computed, ref, useId } from 'vue'
import { contacts, isBlocked } from '../store/contacts'
const props = defineProps({ modelValue: { type: Array, default: () => [] } })
const emit = defineEmits(['update:modelValue'])
const title = ref(''), id = useId()
const people = computed(() => contacts.value.filter(person => !isBlocked(person.id)))
const done = computed(() => props.modelValue.filter(item => item.done).length)
function update(item, patch) { emit('update:modelValue', props.modelValue.map(value => value.id === item.id ? { ...value, ...patch } : value)) }
function add() { if (!title.value.trim()) return; emit('update:modelValue', [...props.modelValue, { id: crypto.randomUUID(), title: title.value.trim(), done: false, assigneeId: null }]); title.value = '' }
</script>
<template>
  <fieldset class="checklist-editor"><legend>체크리스트 <span>{{ done }}/{{ modelValue.length }}</span></legend>
    <ol><li v-for="(item, index) in modelValue" :key="item.id">
      <input type="checkbox" :aria-label="item.title + ' 완료'" :checked="item.done" @change="update(item, { done: $event.target.checked })" />
      <div class="checklist-item-fields"><input :aria-label="'항목 ' + (index + 1)" :value="item.title" maxlength="200" @input="update(item, { title: $event.target.value })" /><select :aria-label="item.title + ' 담당자'" :value="item.assigneeId ?? ''" @change="update(item, { assigneeId: $event.target.value || null })"><option value="">담당자 없음</option><option value="self">나</option><option v-for="person in people" :key="person.id" :value="String(person.id)">{{ person.name }}</option><option v-if="item.assigneeId && item.assigneeId !== 'self' && !people.some(person => String(person.id) === String(item.assigneeId))" :value="item.assigneeId">기존 담당자</option></select></div>
      <button type="button" :aria-label="item.title + ' 항목 삭제'" @click="emit('update:modelValue', modelValue.filter(value => value.id !== item.id))">×</button>
    </li></ol>
    <div class="checklist-add"><input :id="id" v-model="title" aria-label="새 체크리스트 항목" placeholder="작은 단계로 나눠보세요" maxlength="200" @keydown.enter.prevent="add" /><button type="button" :disabled="!title.trim()" @click="add">추가</button></div>
  </fieldset>
</template>
<style>
.checklist-editor { min-width: 0; margin: 20px 0; padding: 16px; border: 1px solid var(--color-hairline); border-radius: var(--radius-md); }
.checklist-editor legend { padding: 0 6px; font-size: .8125rem; font-weight: 600; }.checklist-editor legend span { color: var(--color-muted); }
.checklist-editor ol { list-style: none; padding: 0; margin: 0; }.checklist-editor li { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.checklist-item-fields { flex: 1; min-width: 0; display: grid; grid-template-columns: minmax(0, 1fr) minmax(110px, .5fr); gap: 8px; }
.checklist-item-fields input, .checklist-item-fields select { width: 100%; min-width: 0; margin: 0; box-sizing: border-box; }
.checklist-editor input[type="checkbox"] { flex: 0 0 18px; width: 18px; }.checklist-editor li > button { padding: 6px; }
.checklist-add { display: flex; gap: 8px; }.checklist-add input { flex: 1; width: 0; margin: 0; }.checklist-add button { padding: 8px 12px; border: 1px solid var(--color-hairline); border-radius: var(--radius-sm); font-size: .8125rem; }
@media (max-width: 480px) { .checklist-item-fields { grid-template-columns: 1fr; } .checklist-editor { padding: 12px; } }
</style>
