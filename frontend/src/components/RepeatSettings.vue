<script setup>
import { bodyLocale, tr } from '../store/locale'
import { formatDate } from '../features/i18n/locale.mjs'
import { computed, useId } from 'vue'
import { makeRecurrence, recurrenceError } from '../utils/recurrence.mjs'
const props = defineProps({ modelValue: Object, startDate: String, required: Boolean })
const emit = defineEmits(['update:modelValue'])
const id = useId()
const rule = computed(() => makeRecurrence(props.modelValue))
// 간격 문구("2주마다")와 요일 이름은 본문 언어로 보인다. 요일 단추의 값은 0(일)~6(토) 번호 그대로다
const EVERY = { daily: '일마다', weekly: '주마다', monthly: '개월마다', yearly: '년마다' }
const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토']
const dayShort = (index) => (bodyLocale.value === 'ko' ? WEEKDAY_KO[index] : formatDate(new Date(2024, 0, 7 + index), bodyLocale.value, { weekday: 'short' }))
const dayLong = (index) => (bodyLocale.value === 'ko' ? WEEKDAY_KO[index] + '요일' : formatDate(new Date(2024, 0, 7 + index), bodyLocale.value, { weekday: 'long' }))
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
    <legend>{{ tr('반복 설정') }}</legend>
    <div class="repeat-fields">
      <label :for="id + '-frequency'">{{ tr('주기') }}<select :aria-label="tr('반복 주기')" :id="id + '-frequency'" :value="rule.frequency" @change="update('frequency', $event.target.value)"><option v-if="!required" value="none">{{ tr('반복 안 함') }}</option><option value="daily">{{ tr('매일') }}</option><option value="weekly">{{ tr('매주') }}</option><option value="monthly">{{ tr('매월') }}</option><option value="yearly">{{ tr('매년') }}</option></select></label>
      <label v-if="rule.frequency !== 'none'" :for="id + '-interval'">{{ tr('간격') }}<div class="repeat-interval"><input :id="id + '-interval'" type="number" min="1" max="99" :value="rule.interval" @input="update('interval', $event.target.valueAsNumber)" /><span>{{ tr(EVERY[rule.frequency]) }}</span></div></label>
    </div>
    <template v-if="rule.frequency === 'weekly'">
      <div class="repeat-presets"><button type="button" @click="preset([0,1,2,3,4,5,6])">{{ tr('매일') }}</button><button type="button" @click="preset([1,2,3,4,5])">{{ tr('평일') }}</button><button type="button" @click="preset([0,6])">{{ tr('주말') }}</button></div>
      <div class="repeat-weekdays" role="group" :aria-label="tr('반복 요일')"><button v-for="index in [0, 1, 2, 3, 4, 5, 6]" :key="index" type="button" :aria-label="dayLong(index)" :aria-pressed="rule.weekdays.includes(index)" @click="toggle(index)">{{ dayShort(index) }}</button></div>
    </template>
    <div v-if="rule.frequency !== 'none'" class="repeat-fields">
      <label :for="id + '-end'">{{ tr('종료 조건') }}<select :aria-label="tr('반복 종료')" :id="id + '-end'" :value="rule.endMode" @change="update('endMode', $event.target.value)"><option value="never">{{ tr('종료 없이') }}</option><option value="until">{{ tr('날짜 지정') }}</option><option value="count">{{ tr('횟수 지정') }}</option></select></label>
      <label v-if="rule.endMode === 'until'" :for="id + '-until'">{{ tr('마지막 날짜') }}<input :id="id + '-until'" type="date" :min="startDate" :value="rule.until" @input="update('until', $event.target.value)" /></label>
      <label v-if="rule.endMode === 'count'" :for="id + '-count'">{{ tr('반복 횟수') }}<input :id="id + '-count'" type="number" min="1" max="999" :value="rule.count" @input="update('count', $event.target.valueAsNumber)" /></label>
    </div>
    <p v-if="['monthly','yearly'].includes(rule.frequency)" class="form-note">{{ tr('시작일과 같은 날짜에 반복해요. 해당 날짜가 없는 달은 건너뛰어요.') }}</p>
    <p v-if="error" :id="id + '-error'" class="form-note" role="status">{{ tr(error) }}</p>
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
.repeat-weekdays button[aria-pressed="true"] { background: var(--color-foreground); border-color: var(--color-foreground); color: var(--color-on-primary); }
@media (max-width: 400px) { .repeat-fields { grid-template-columns: 1fr; } .repeat-settings { padding: 12px; } .repeat-weekdays { gap: 3px; } }
</style>
