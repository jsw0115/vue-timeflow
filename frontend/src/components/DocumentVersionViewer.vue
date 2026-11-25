<script setup>
// 문서 버전 하나를 읽기 전용으로 보인다(PR-25). 저장한 때의 내용이라 지금 문서와 다를 수 있다.
import { computed, onMounted, ref } from 'vue'
import Modal from './Modal.vue'
import { apiRequest } from '../features/auth/apiRequest.js'
import { createDocumentVersionClient, documentLabel, savedAt, snapshotSections, versionErrorText, versionTitle } from '../features/career/documentVersions.mjs'
import { tr } from '../store/locale'
import { workPrivacy } from '../store/workPrivacy'

const props = defineProps({ versionId: { type: String, required: true } })
const emit = defineEmits(['close'])
const client = createDocumentVersionClient(apiRequest)
const version = ref(null)
const message = ref('')
onMounted(async () => {
  try { version.value = await client.get(props.versionId) } catch (error) { message.value = versionErrorText(error) }
})
const sections = computed(() => (version.value ? snapshotSections(version.value, { maskCompany: workPrivacy.maskCompanyNames, t: tr }) : []))
</script>

<template>
  <Modal :title="version ? versionTitle(version, tr) : tr('문서 버전')" wide @close="emit('close')">
    <p v-if="!version && !message" class="input-field-help" role="status">{{ tr('버전을 불러오는 중이에요.') }}</p>
    <p v-if="message" class="input-field-help" data-state="error" role="alert">{{ tr(message) }}</p>
    <template v-if="version">
      <p class="input-field-help version-meta">{{ tr(documentLabel(version.document)) }} <span class="figure">v{{ version.number }}</span> · {{ tr('저장 시각') }} <span class="figure">{{ savedAt(version.createdAt) }}</span><template v-if="version.applicationCount"> · {{ tr('지원 {n}건에 제출본으로 연결', { n: version.applicationCount }) }}</template></p>
      <p v-if="version.note" class="version-note">{{ tr('바뀐 점: {note}', { note: version.note }) }}</p>
      <p class="input-field-help">{{ tr('저장한 때의 내용이에요. 지금 문서를 고쳐도 이 버전은 바뀌지 않아요.') }}</p>
      <section v-for="(section, index) in sections" :key="index" class="version-section">
        <h3>{{ section.heading }}</h3>
        <dl>
          <template v-for="[label, value] in section.rows" :key="label"><dt>{{ label }}</dt><dd>{{ value }}</dd></template>
        </dl>
      </section>
    </template>
    <template #footer>
      <button type="button" class="primary" @click="emit('close')">{{ tr('닫기') }}</button>
    </template>
  </Modal>
</template>

<style scoped>
.version-meta, .version-note { margin: 0 0 var(--space-sm); }
.version-section { margin-top: var(--space-lg); padding-top: var(--space-md); border-top: 1px solid var(--color-hairline); }
.version-section h3 { margin: 0 0 var(--space-sm); font-size: var(--type-body-size); }
.version-section dl { display: grid; grid-template-columns: max-content 1fr; gap: var(--space-xs) var(--space-lg); margin: 0; }
.version-section dt { color: var(--color-muted); font-size: var(--type-caption-size); }
.version-section dd { margin: 0; white-space: pre-line; overflow-wrap: anywhere; }
</style>
