<!-- 이메일이 정확히 같은 사람을 찾는다. 찾은 사람에게 할 행동 버튼은 부모가 slot으로 준다(PR-10 2단계, Q-24). -->
<script setup>
import { tr } from '../../store/locale'
import { ref, useId } from 'vue'
import { shareClient } from '../../features/share/share.js'
import { shareErrorText } from '../../features/share/shareClient.mjs'

const email = ref('')
const person = ref(null)
const error = ref('')
const busy = ref(false)
const helpId = useId()

async function find() {
  if (busy.value) return
  person.value = null
  if (!email.value.trim()) { error.value = tr('찾을 사람의 이메일을 입력해 주세요.'); return }
  busy.value = true
  error.value = ''
  try { person.value = await shareClient.findPerson(email.value) } catch (e) { error.value = shareErrorText(e) } finally { busy.value = false }
}
</script>

<template>
  <form class="person-finder" @submit.prevent="find">
    <label class="input-field">{{ tr('이메일') }}<input v-model="email" type="email" autocomplete="off" :aria-invalid="error ? 'true' : undefined" :aria-describedby="helpId" /><span :id="helpId" class="input-field-help" :data-state="error ? 'error' : undefined" role="status">{{ error || tr('가입할 때 쓴 이메일을 정확히 입력해야 찾을 수 있어요.') }}</span></label>
    <button type="submit" class="button-secondary" :disabled="busy" :aria-busy="busy ? 'true' : undefined">{{ busy ? tr('찾는 중') : tr('찾기') }}</button>
  </form>
  <div v-if="person" class="event">
    <span class="person-name"><b>{{ person.nickname || tr('이름 없음') }}</b><small>{{ tr('이메일이 일치하는 계정') }}</small></span>
    <slot :person="person" />
  </div>
</template>

<style scoped>
.person-finder { display: flex; flex-wrap: wrap; gap: var(--space-md); align-items: flex-end; }
.person-finder .input-field { flex: 1 1 200px; min-width: 0; }
.person-name { flex: 1; min-width: 0; }
</style>
