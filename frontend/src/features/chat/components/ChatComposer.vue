<script setup>
import { computed, nextTick, ref, useId, watch } from 'vue'
const props = defineProps({ modelValue: { type: String, default: '' }, disabled: Boolean, members: { type: Array, default: () => [] }, mentions: { type: Array, default: () => [] } })
const emit = defineEmits(['update:modelValue', 'send', 'typing', 'mention', 'unmention'])
const manual = ref(false), textarea = ref(null), caret = ref(0), focused = ref(false), dismissed = ref(false), active = ref(0), id = useId()
const token = computed(() => props.modelValue.slice(0, caret.value).match(/(?:^|\s)@([^\s@]*)$/u))
const showMentions = computed(() => !props.disabled && (manual.value || (focused.value && token.value && !dismissed.value)))
const candidates = computed(() => props.members.filter(member => !token.value || manual.value || member.nickname.toLocaleLowerCase().includes(token.value[1].toLocaleLowerCase())))
watch(candidates, () => { active.value = 0 })
watch(active, async () => { await nextTick(); if (typeof document !== 'undefined') document.getElementById(id + '-option-' + active.value)?.scrollIntoView({ block: 'nearest' }) })
const composing = ref(false)
let lastTyping = 0
function input(event) {
  emit('update:modelValue', event.target.value)
  caret.value = event.target.selectionStart; dismissed.value = false
  if (Date.now() - lastTyping > 2000) { lastTyping = Date.now(); emit('typing') }
}
function keydown(event) {
  if (event.isComposing || composing.value || event.keyCode === 229) return
  if (event.key === 'Enter' && event.shiftKey) return
  if (showMentions.value && ['ArrowDown', 'ArrowUp', 'Escape', 'Enter', 'Tab'].includes(event.key)) {
    if (event.key === 'Escape') { event.preventDefault(); manual.value = false; dismissed.value = true; return }
    if (candidates.value.length) {
      event.preventDefault()
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') active.value = (active.value + (event.key === 'ArrowDown' ? 1 : -1) + candidates.value.length) % candidates.value.length
      else void pick(candidates.value[active.value])
      return
    }
    if (event.key === 'Enter') { event.preventDefault(); return }
  }
  if (event.key !== 'Enter' || event.shiftKey || event.isComposing || composing.value || event.keyCode === 229) return
  event.preventDefault()
  if (props.modelValue.trim() && !props.disabled) emit('send')
}
async function pick(member) {
  const end = textarea.value?.selectionStart ?? props.modelValue.length
  const match = props.modelValue.slice(0, end).match(/(?:^|\s)@([^\s@]*)$/u)
  const start = match ? end - match[1].length - 1 : end
  const prefix = props.modelValue.slice(0, start), insert = `${prefix && !/\s$/.test(prefix) && !match ? ' ' : ''}@${member.nickname} `
  const value = prefix + insert + props.modelValue.slice(end)
  if (value.length > 4000) return
  emit('update:modelValue', value); emit('mention', member)
  manual.value = false; dismissed.value = true
  await nextTick(); textarea.value?.focus(); textarea.value?.setSelectionRange(start + insert.length, start + insert.length); caret.value = start + insert.length
}
</script>
<template>
  <form class="chat-compose" @submit.prevent="emit('send')">
    <div v-if="showMentions" :id="id + '-list'" class="chat-mention-picker" role="listbox" aria-label="멘션할 참여자"><button v-for="(member, index) in candidates" :id="id + '-option-' + index" :key="member.userId" type="button" role="option" :aria-selected="index === active" @pointerdown.prevent @click="pick(member)">@{{ member.nickname }}</button><span v-if="!candidates.length">일치하는 참여자가 없어요.</span></div>
    <div v-if="mentions.length" class="chat-mention-chips"><button v-for="id in mentions" :key="id" type="button" :aria-label="`${members.find(member => member.userId === id)?.nickname || '참여자'} 멘션 취소`" @click="emit('unmention', id)">@{{ members.find(member => member.userId === id)?.nickname || '참여자' }} ×</button></div>
    <label class="chat-sr" for="chat-message">메시지</label>
    <textarea ref="textarea" id="chat-message" :value="modelValue" rows="2" maxlength="4000" :disabled="disabled" placeholder="메시지 입력 · @로 참여자 멘션" :aria-controls="showMentions ? id + '-list' : undefined" :aria-activedescendant="showMentions && candidates.length ? id + '-option-' + active : undefined" @input="input" @click="caret = $event.target.selectionStart; dismissed = false" @keyup="caret = $event.target.selectionStart" @focus="focused = true" @blur="focused = false" @keydown="keydown" @compositionstart="composing = true" @compositionend="composing = false" />
    <div class="chat-compose-foot">
      <button class="chat-compose-mention" type="button" aria-label="참여자 멘션" :aria-expanded="!!showMentions" :disabled="disabled" @click="manual = !manual">@</button>
      <small>Enter 전송 · Shift+Enter 줄바꿈 <span v-if="modelValue.length > 3500">· {{ modelValue.length.toLocaleString() }}/4,000</span></small>
      <button class="chat-primary" type="submit" aria-label="메시지 보내기" :disabled="disabled || !modelValue.trim()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m12 19 0-14m-6 6 6-6 6 6"/></svg></button>
    </div>
  </form>
</template>
