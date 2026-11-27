<script setup>
import { tr } from '../store/locale'
import { computed, ref, useId } from 'vue'
import { contacts, isBlocked } from '../store/contacts'
import { assignableContacts } from '../store/accountContacts'
// accountOnly: 로그인 상태. 서버는 계정만 담당자로 받으므로, 주소록에서 계정과 연결한 연락처만 고를 수 있고 값은 계정 ID다(Q-21)
const props = defineProps({ modelValue: { type: Array, default: () => [] }, accountOnly: { type: Boolean, default: false } })
const emit = defineEmits(['update:modelValue'])
const title = ref(''), id = useId()
const people = computed(() => props.accountOnly ? assignableContacts.value : contacts.value.filter(person => !isBlocked(person.id)))
const done = computed(() => props.modelValue.filter(item => item.done).length)
function update(item, patch) { emit('update:modelValue', props.modelValue.map(value => value.id === item.id ? { ...value, ...patch } : value)) }
function add() { if (!title.value.trim()) return; emit('update:modelValue', [...props.modelValue, { id: crypto.randomUUID(), title: title.value.trim(), done: false, assigneeId: null }]); title.value = '' }
</script>
<template>
  <fieldset class="checklist-editor"><legend>{{ tr('체크리스트') }} <span>{{ done }}/{{ modelValue.length }}</span></legend>
    <ol><li v-for="(item, index) in modelValue" :key="item.id">
      <input type="checkbox" :aria-label="tr('{name} 완료', { name: item.title })" :checked="item.done" @change="update(item, { done: $event.target.checked })" />
      <div class="checklist-item-fields"><input :aria-label="tr('항목 {n}', { n: index + 1 })" :value="item.title" maxlength="200" @input="update(item, { title: $event.target.value })" /><select :aria-label="tr('{name} 담당자', { name: item.title })" :value="item.assigneeId ?? ''" @change="update(item, { assigneeId: $event.target.value || null })"><option value="">{{ tr('담당자 없음') }}</option><option value="self">{{ tr('나') }}</option><option v-for="person in people" :key="person.id" :value="String(person.id)">{{ person.name }}</option><option v-if="item.assigneeId && item.assigneeId !== 'self' && !people.some(person => String(person.id) === String(item.assigneeId))" :value="item.assigneeId">{{ tr('기존 담당자') }}</option></select></div>
      <button type="button" :aria-label="tr('{name} 항목 삭제', { name: item.title })" @click="emit('update:modelValue', modelValue.filter(value => value.id !== item.id))">×</button>
    </li></ol>
    <p v-if="accountOnly" class="input-field-help checklist-assignee-note">{{ tr('담당자는 \'나\'와, 주소록에서 계정과 연결한 사람만 고를 수 있어요.') }} <router-link to="/address">{{ tr('주소록에서 연결하기') }}</router-link></p>
    <div class="checklist-add"><input :id="id" v-model="title" :aria-label="tr('새 체크리스트 항목')" :placeholder="tr('작은 단계로 나눠보세요')" maxlength="200" @keydown.enter.prevent="add" /><button type="button" :disabled="!title.trim()" @click="add">{{ tr('추가') }}</button></div>
  </fieldset>
</template>
<style>
.checklist-editor { min-width: 0; margin: 20px 0; padding: 16px; border: 1px solid var(--color-hairline); border-radius: var(--radius-md); }
.checklist-editor legend { padding: 0 6px; font-size: .8125rem; font-weight: 600; }.checklist-editor legend span { color: var(--color-muted); }
.checklist-editor ol { list-style: none; padding: 0; margin: 0; }.checklist-editor li { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.checklist-item-fields { flex: 1; min-width: 0; display: grid; grid-template-columns: minmax(0, 1fr) minmax(110px, .5fr); gap: 8px; }
.checklist-item-fields input, .checklist-item-fields select { width: 100%; min-width: 0; margin: 0; box-sizing: border-box; }
.checklist-editor input[type="checkbox"] { flex: 0 0 18px; width: 18px; }.checklist-editor li > button { padding: 6px; }
.checklist-assignee-note { display: block; margin: 0 0 12px; }
.checklist-add { display: flex; gap: 8px; }.checklist-add input { flex: 1; width: 0; margin: 0; }.checklist-add button { padding: 8px 12px; border: 1px solid var(--color-hairline); border-radius: var(--radius-sm); font-size: .8125rem; }
@media (max-width: 480px) { .checklist-item-fields { grid-template-columns: 1fr; } .checklist-editor { padding: 12px; } }
</style>
