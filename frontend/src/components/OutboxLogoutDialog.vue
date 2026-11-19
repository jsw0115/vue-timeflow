<!-- 보내지 않은 기록이 있을 때 로그아웃하면 보낸 뒤 로그아웃·기기에 남기기·지우기 중에서 고르게 한다(PR-12, UF-105). -->
<script setup>
import { ref } from 'vue'
import Modal from './Modal.vue'
import { outbox, sendPending } from '../features/offline/offlineQueue.js'

const emit = defineEmits(['logout', 'close'])
const busy = ref('')
const notice = ref('')

async function sendThenLogout() {
  busy.value = 'send'
  notice.value = ''
  try {
    await sendPending()
    if (outbox.state.items.length) { notice.value = '아직 ' + outbox.state.items.length + '건을 보내지 못했어요. 연결을 확인하거나 다른 방법을 골라 주세요.'; return }
    emit('logout')
  } finally { busy.value = '' }
}
async function clearThenLogout() {
  busy.value = 'clear'
  try { await outbox.clear(); emit('logout') } finally { busy.value = '' }
}
</script>

<template>
  <Modal title="보내지 않은 기록이 있어요" @close="emit('close')">
    <p>보내지 않은 기록이 <span class="figure">{{ outbox.state.items.length }}</span>건 있어요. 로그아웃하기 전에 어떻게 할지 골라 주세요.</p>
    <p class="form-note">기기에 남기면 이 계정으로 다시 로그인했을 때 보내요. 다른 계정으로 로그인해도 보내지 않아요.</p>
    <p v-if="notice" class="input-field-help" data-state="error" role="status">{{ notice }}</p>
    <template #footer>
      <button type="button" class="button-secondary" :disabled="!!busy" :aria-busy="busy === 'clear' ? 'true' : undefined" @click="clearThenLogout">{{ busy === 'clear' ? '지우는 중' : '지우고 로그아웃' }}</button>
      <button type="button" class="button-secondary" :disabled="!!busy" @click="emit('logout')">기기에 남기고 로그아웃</button>
      <button type="button" class="primary" :disabled="!!busy" :aria-busy="busy === 'send' ? 'true' : undefined" @click="sendThenLogout">{{ busy === 'send' ? '보내는 중' : '보낸 뒤 로그아웃' }}</button>
    </template>
  </Modal>
</template>
