<script setup>
import { computed, useId } from 'vue'
import { makeRecurrence, recurrenceError } from '../utils/recurrence.mjs'
const props = defineProps({ modelValue: Object, startDate: String, required: Boolean })
const emit = defineEmits(['update:modelValue'])
const id = useId()
const rule = computed(() => makeRecurrence(props.modelValue))
const labels = { daily: '일', weekly: '주', monthly: '개월', yearly: '년' }
const error = computed(() => recurrenceError(rule.value, props.startDate))
function update(key, value) {
  const next = { ...rule.value, [key]: value }
  if (key === 'frequency' && value === 'weekly' && !next.weekdays.length) next.weekdays = [new Date((props.startDate || '2026-01-01') + 'T12:00:00').getDay()]
  emit('update:modelValue', next)
}
function toggle(day) { update('weekdays', rule.value.weekdays.includes(day) ? rule.value.weekdays.filter(item => item !== day) : [...rule.value.weekdays, day].sort()) }
function preset(days) { emit('update:modelValue', { ...rule.value, frequency: 'weekly', interval: 1, weekdays: days }) }
</script>
<template>
  <fieldset class="repeat-settings" :aria-describedby="error ? id + '-error' : undefined">
    <legend>반복 설정</legend>
    <div class="repeat-fields">
      <label :for="id + '-frequency'">주기<select aria-label="반복 주기" :id="id + '-frequency'" :value="rule.frequency" @change="update('frequency', $event.target.value)"><option v-if="!required" value="none">반복 안 함</option><option value="daily">매일</option><option value="weekly">매주</option><option value="monthly">매월</option><option value="yearly">매년</option></select></label>
      <label v-if="rule.frequency !== 'none'" :for="id + '-interval'">간격<div class="repeat-interval"><input :id="id + '-interval'" type="number" min="1" max="99" :value="rule.interval" @input="update('interval', $event.target.valueAsNumber)" /><span>{{ labels[rule.frequency] }}마다</span></div></label>
    </div>
    <template v-if="rule.frequency === 'weekly'">
      <div class="repeat-presets"><button type="button" @click="preset([0,1,2,3,4,5,6])">매일</button><button type="button" @click="preset([1,2,3,4,5])">평일</button><button type="button" @click="preset([0,6])">주말</button></div>
      <div class="repeat-weekdays" role="group" aria-label="반복 요일"><button v-for="(day, index) in ['일','월','화','수','목','금','토']" :key="day" type="button" :aria-label="day + '요일'" :aria-pressed="rule.weekdays.includes(index)" @click="toggle(index)">{{ day }}</button></div>
    </template>
    <div v-if="rule.frequency !== 'none'" class="repeat-fields">
      <label :for="id + '-end'">종료<select aria-label="반복 종료" :id="id + '-end'" :value="rule.endMode" @change="update('endMode', $event.target.value)"><option value="never">종료 없이</option><option value="until">날짜 지정</option><option value="count">횟수 지정</option></select></label>
      <label v-if="rule.endMode === 'until'" :for="id + '-until'">마지막 날짜<input :id="id + '-until'" type="date" :min="startDate" :value="rule.until" @input="update('until', $event.target.value)" /></label>
      <label v-if="rule.endMode === 'count'" :for="id + '-count'">반복 횟수<input :id="id + '-count'" type="number" min="1" max="999" :value="rule.count" @input="update('count', $event.target.valueAsNumber)" /></label>
    </div>
    <p v-if="['monthly','yearly'].includes(rule.frequency)" class="form-note">시작일과 같은 날짜에 반복해요. 해당 날짜가 없는 달은 건너뛰어요.</p>
    <p v-if="error" :id="id + '-error'" class="form-note" role="status">{{ error }}</p>
  </fieldset>
</template>
<style>
.repeat-settings { min-width: 0; margin: 20px 0; padding: 16px; border: 1px solid var(--color-hairline); border-radius: var(--radius-md); }
.repeat-settings legend { padding: 0 6px; font-size: .8125rem; font-weight: 600; }
.repeat-fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.repeat-fields label { min-width: 0; margin: 8px 0; }
.repeat-fields input, .repeat-fields select { width: 100%; min-width: 0; box-sizing: border-box; }
.repeat-interval { display: flex; align-items: center; gap: 8px; }
.repeat-interval input { flex: 1; width: 0; }.repeat-interval span { white-space: nowrap; font-size: .8125rem; }
.repeat-presets { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0; }
.repeat-presets button { padding: 6px 12px; font-size: .8125rem; border: 1px solid var(--color-hairline); border-radius: var(--radius-sm); }
.repeat-weekdays { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 6px; margin-bottom: 12px; }
.repeat-weekdays button { min-width: 0; min-height: 40px; padding: 8px 0; border: 1px solid var(--color-hairline); border-radius: var(--radius-sm); font-size: .8125rem; }
.repeat-weekdays button[aria-pressed="true"] { background: var(--color-accent); border-color: var(--color-accent); color: white; }
@media (max-width: 400px) { .repeat-fields { grid-template-columns: 1fr; } .repeat-settings { padding: 12px; } .repeat-weekdays { gap: 3px; } }
</style>
