<script setup>
import { ref } from 'vue'
import Modal from '../../../components/Modal.vue'
import { chatApi } from '../api/chatApi'
import { isChatPreview } from '../model/chatIdentity'
const emit = defineEmits(['close', 'created'])
const email = ref(''), people = ref([]), kind = ref('DM'), name = ref(''), busy = ref(false), error = ref('')
async function find() {
  if (!email.value.trim() || busy.value) return
  busy.value = true; error.value = ''
  try {
    const person = await chatApi.person(email.value.trim())
    if (people.value.some(item => item.id === person.id)) { error.value = '이미 선택한 참여자예요.'; return }
    if (kind.value === 'DM') people.value = [person]
    else if (people.value.length < 19) people.value.push(person)
    else { error.value = '그룹은 나를 포함해 20명까지 참여할 수 있어요.'; return }
    email.value = ''
  } catch (err) { error.value = err.message }
  finally { busy.value = false }
}
async function create() {
  if (!people.value.length || busy.value) return
  busy.value = true; error.value = ''
  try { emit('created', await chatApi.create({ kind: kind.value, name: name.value.trim() || null, memberIds: people.value.map(person => person.id) })) }
  catch (err) { error.value = err.message }
  finally { busy.value = false }
}
</script>
<template>
  <Modal title="새 대화" @close="emit('close')">
    <div class="chat-new">
      <p>함께 계획을 나누고, 서로의 하루를 응원해요.</p>
      <label>대화 유형<select v-model="kind" @change="people = []"><option value="DM">개인 대화</option><option value="GROUP">그룹 대화</option></select></label>
      <label v-if="kind === 'GROUP'">그룹 이름<input v-model="name" maxlength="80" placeholder="예: 목요일 회고 모임" /></label>
      <form @submit.prevent="find">
        <label for="chat-person-email">상대의 가입 이메일</label>
        <div class="chat-person-search"><input id="chat-person-email" v-model="email" type="email" autocomplete="off" placeholder="name@example.com" required /><button :disabled="busy">찾기</button></div>
      </form>
      <ul class="chat-picked" aria-label="선택한 참여자"><li v-for="person in people" :key="person.id"><span>{{ person.nickname }}</span><button :aria-label="`${person.nickname} 선택 취소`" @click="people = people.filter(item => item.id !== person.id)">×</button></li></ul>
      <p v-if="isChatPreview" class="chat-note">샘플 참여자: seoyeon@example.test · minjun@example.test. 미리보기에서 나눈 대화는 새로고침하면 초기화돼요.</p>
      <p v-else class="chat-note">정확한 가입 이메일로 찾을 수 있어요. 선택한 사용자가 바로 대화에 참여합니다.</p>
      <p v-if="error" role="alert">{{ error }}</p>

    </div>

    <template #footer>
      <button type="button" class="modal-secondary" @click="emit('close')">취소</button>
      <button class="chat-primary" :disabled="busy || !people.length || (kind === 'GROUP' && !name.trim())" @click="create">{{ busy ? '확인하는 중…' : '대화 시작하기' }}</button>
    </template>
  </Modal>
</template>
