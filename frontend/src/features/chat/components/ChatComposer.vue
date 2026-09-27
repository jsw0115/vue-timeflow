<script setup>
import { ref } from 'vue'
const props = defineProps({ modelValue: { type: String, default: '' }, disabled: Boolean, members: { type: Array, default: () => [] }, mentions: { type: Array, default: () => [] } })
const emit = defineEmits(['update:modelValue', 'send', 'typing', 'mention', 'unmention'])
const showMentions = ref(false)
const composing = ref(false)
let lastTyping = 0
function input(event) {
  emit('update:modelValue', event.target.value)
  if (Date.now() - lastTyping > 2000) { lastTyping = Date.now(); emit('typing') }
}
function keydown(event) {
  if (event.key !== 'Enter' || event.shiftKey || event.isComposing || composing.value || event.keyCode === 229) return
  event.preventDefault()
  if (props.modelValue.trim() && !props.disabled) emit('send')
}
</script>
<template>
  <form class="chat-compose" @submit.prevent="emit('send')">
    <div class="chat-compose-tools"><button type="button" :aria-expanded="showMentions" @click="showMentions = !showMentions">@ 멘션</button><small>#태그를 적으면 태그함에 모여요</small></div>
    <div v-if="showMentions" class="chat-mention-picker" aria-label="멘션할 참여자"><button v-for="member in members" :key="member.userId" type="button" :disabled="mentions.includes(member.userId)" @click="emit('mention', member); showMentions = false">{{ member.nickname }}</button><span v-if="!members.length">멘션할 참여자가 없어요.</span></div>
    <div v-if="mentions.length" class="chat-mention-chips"><button v-for="id in mentions" :key="id" type="button" :aria-label="`${members.find(member => member.userId === id)?.nickname || '참여자'} 멘션 취소`" @click="emit('unmention', id)">@{{ members.find(member => member.userId === id)?.nickname || '참여자' }} ×</button></div>
    <label class="chat-sr" for="chat-message">메시지</label>
    <textarea id="chat-message" :value="modelValue" rows="2" maxlength="4000" :disabled="disabled" placeholder="함께 나누고 싶은 이야기를 적어보세요" @input="input" @keydown="keydown" @compositionstart="composing = true" @compositionend="composing = false" />
    <div class="chat-compose-foot">
      <small>Enter 전송 · Shift+Enter 줄바꿈 <span v-if="modelValue.length > 3500">· {{ modelValue.length.toLocaleString() }}/4,000</span></small>
      <button class="chat-primary" type="submit" :disabled="disabled || !modelValue.trim()">보내기 <span aria-hidden="true">↗</span></button>
    </div>
  </form>
</template>
