<script setup>
// 마감 알림 시점(Q-32). 로그인 계정 설정에 바로 저장한다. 알림은 앱·알림함을 열 때 서버가 만든다. 메일·메신저 발송은 아직 연결 전이다.
import { onMounted, ref } from 'vue'
import { apiRequest } from '../features/auth/apiRequest.js'
import { LEAD_DAYS, LEAD_MINUTES, createDueSettings } from '../features/notifications/dueSettings.mjs'

const client = createDueSettings({ request: apiRequest })
const form = ref({ enabled: true, leadMinutes: 60, leadDays: null })
const status = ref('loading')
const message = ref('')
onMounted(async () => {
  try { form.value = await client.load(); status.value = 'ready' } catch { status.value = 'error'; message.value = '마감 알림 설정을 불러오지 못했어요.' }
})
async function save(patch) {
  const before = form.value
  form.value = { ...form.value, ...patch }
  status.value = 'saving'; message.value = ''
  try { form.value = await client.save(form.value); status.value = 'saved'; message.value = '저장했어요.' } catch (error) {
    form.value = before; status.value = 'error'
    message.value = error?.status === 409 ? '다른 기기에서 설정이 바뀌었어요. 화면을 새로 고친 뒤 다시 바꿔 주세요.' : '저장하지 못했어요. 이전 설정을 유지했어요.'
  }
}
</script>

<template>
  <div class="due-settings">
    <div class="section-label">마감 알림</div>
    <label class="task due-toggle">
      <input type="checkbox" :checked="form.enabled" :disabled="status === 'loading'" @change="save({ enabled: $event.target.checked })" />
      <span><b>할 일·지원 마감 알림 받기</b><small>알림은 앱이나 알림함을 열 때 만들어져요.</small></span>
    </label>
    <div v-if="form.enabled" class="form-row due-selects">
      <label>할 일 마감<select :value="form.leadMinutes" :disabled="status === 'loading'" @change="save({ leadMinutes: Number($event.target.value) })"><option v-for="o in LEAD_MINUTES" :key="o.value" :value="o.value">{{ o.label }}</option></select></label>
      <label>지원 마감·면접<select :value="form.leadDays ?? ''" :disabled="status === 'loading'" @change="save({ leadDays: $event.target.value === '' ? null : Number($event.target.value) })"><option value="">커리어 목표에 따라</option><option v-for="o in LEAD_DAYS" :key="o.value" :value="o.value">{{ o.label }}</option></select></label>
    </div>
    <p class="form-note">시각이 없는 할 일은 그날 하루가 시작될 때 알려요. 지원 일정은 커리어 목표가 취업·이직 준비면 3일 전, 그 밖에는 하루 전에 알려요. 메일·메신저로 받는 마감 알림은 발송 서비스를 연결한 뒤 켤 수 있어요(준비 중).</p>
    <p v-if="message" class="input-field-help" role="status" :data-state="status === 'error' ? 'error' : status === 'saved' ? 'success' : undefined">{{ message }}</p>
  </div>
</template>

<style scoped>
.due-settings { display: grid; gap: var(--space-sm); margin-bottom: var(--space-xl); }
.due-toggle { display: inline-flex; margin: 0; border: 0; }
.due-toggle span { flex: 1; }
.due-selects { margin: 0; }
.due-settings p { margin: 0; }
@media (max-width: 480px) { .due-selects { flex-direction: column; } }
</style>
