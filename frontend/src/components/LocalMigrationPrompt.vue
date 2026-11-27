<!-- 로그인했을 때 이 브라우저에 남긴 기록이 있으면 종류별 건수를 보이고 계정으로 옮길지 묻는다(PR-07 3단계, UF-86). -->
<script setup>
import { computed } from 'vue'
import Modal from './Modal.vue'
import { tr, bodyLocale, unit } from '../store/locale'
import { localMigration as migration } from '../store/migration'

const visible = migration.visible
const candidates = migration.candidates
const state = migration.state
const droppedAssignees = computed(() => candidates.value.reduce((sum, group) => sum + (group.droppedAssignees ?? 0), 0))
const droppedAttendees = computed(() => candidates.value.reduce((sum, group) => sum + (group.droppedAttendees ?? 0), 0))
const yearGuessed = computed(() => candidates.value.reduce((sum, group) => sum + (group.yearGuessed ?? 0), 0))
const done = computed(() => state.finished && !state.failed)
const statusText = computed(() => {
  if (state.running) return tr('옮기는 중이에요. {done}/{total}건', { done: state.moved + state.failed, total: state.total })
  if (!state.finished) return ''
  if (!state.failed) return tr('{n}건을 계정으로 옮겼어요.', { n: state.moved })
  return tr('{n}건을 옮겼어요. {failed}건은 옮기지 못했어요. 연결을 확인하고 다시 시도해 주세요.', { n: state.moved, failed: state.failed })
})
function close() {
  if (state.running) return
  if (done.value) migration.close()
  else migration.dismiss()
}
</script>
<template>
  <Modal v-if="visible" :title="tr('이 브라우저의 기록을 계정으로 옮길까요?')" @close="close">
    <template v-if="!done">
      <p class="migration-lead">{{ tr('로그인하기 전에 이 브라우저에 남긴 기록이 있어요. 계정으로 옮기면 다른 기기에서도 볼 수 있어요.') }}</p>
      <ul class="migration-counts">
        <li v-for="group in candidates" :key="group.kind">{{ tr(group.label) }} <span class="migration-figure">{{ group.items.length }}</span>{{ unit('건', group.items.length) }}</li>
      </ul>
      <p class="input-field-help migration-note">{{ tr('시연용 기본 기록은 옮기지 않아요. 옮긴 기록은 계정에 저장되고 이 브라우저 목록에서는 빠져요.') }}</p>
      <p v-if="droppedAssignees" class="input-field-help migration-note"><template v-if="bodyLocale === 'ko'">주소록 연락처를 담당자로 정한 체크리스트 항목 <span class="migration-figure">{{ droppedAssignees }}</span>개는 담당자 없이 옮겨요. 주소록은 아직 이 브라우저에만 있어요.</template><template v-else>{{ tr('주소록 연락처를 담당자로 정한 체크리스트 항목 {n}개는 담당자 없이 옮겨요. 주소록은 아직 이 브라우저에만 있어요.', { n: droppedAssignees }) }}</template></p>
      <p v-if="droppedAttendees" class="input-field-help migration-note"><template v-if="bodyLocale === 'ko'">일정 참석자 <span class="migration-figure">{{ droppedAttendees }}</span>명은 주소록 연락처라 빼고 옮겨요.</template><template v-else>{{ tr('일정 참석자 {n}명은 주소록 연락처라 빼고 옮겨요.', { n: droppedAttendees }) }}</template></p>
      <p v-if="yearGuessed" class="input-field-help migration-note"><template v-if="bodyLocale === 'ko'">날짜에 연도가 없는 D-Day <span class="migration-figure">{{ yearGuessed }}</span>건은 올해 날짜로 옮겨요. 옮긴 뒤 상세에서 날짜를 바꿀 수 있어요.</template><template v-else>{{ tr('날짜에 연도가 없는 D-Day {n}건은 올해 날짜로 옮겨요. 옮긴 뒤 상세에서 날짜를 바꿀 수 있어요.', { n: yearGuessed }) }}</template></p>
    </template>
    <p class="migration-status" role="status" :data-state="state.finished && state.failed ? 'error' : undefined">{{ statusText }}</p>
    <template #footer>
      <button v-if="done" type="button" class="primary" @click="migration.close()">{{ tr('닫기') }}</button>
      <template v-else>
        <button type="button" class="modal-secondary" :disabled="state.running" @click="migration.dismiss()">{{ tr('나중에') }}</button>
        <button type="button" class="primary" :aria-busy="state.running ? 'true' : undefined" @click="migration.run()">{{ state.running ? tr('옮기는 중') : state.failed ? tr('다시 시도') : tr('계정으로 옮기기') }}</button>
      </template>
    </template>
  </Modal>
</template>
<style>
.migration-lead { margin: 0 0 var(--space-lg); }
.migration-counts { margin: 0 0 var(--space-lg); padding: 0; list-style: none; display: flex; flex-wrap: wrap; gap: var(--space-md); }
.migration-counts li { padding: var(--space-xs) var(--space-md); border: 1px solid var(--color-hairline); border-radius: var(--radius-sm); }
.migration-figure { font-family: var(--font-mono); font-variant-numeric: tabular-nums; font-weight: 600; }
.migration-note { display: block; margin: 0 0 var(--space-sm); }
.migration-status { margin: var(--space-md) 0 0; }
.migration-status:empty { display: none; }
.migration-status[data-state='error'] { color: var(--color-status-danger); font-weight: 600; }
</style>
