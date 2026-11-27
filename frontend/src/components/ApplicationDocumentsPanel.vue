<script setup>
// 지원 건에 제출한 문서 버전(PR-25). 문서 종류마다 버전 하나를 고르고, 제출 당시 내용을 다시 연다.
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import DocumentVersionViewer from './DocumentVersionViewer.vue'
import { apiRequest } from '../features/auth/apiRequest.js'
import { DOCUMENTS, createDocumentVersionClient, savedAt, versionErrorText, versionName } from '../features/career/documentVersions.mjs'
import { tr } from '../store/locale'

const props = defineProps({ applicationId: { type: String, required: true } })
const client = createDocumentVersionClient(apiRequest)
const versions = ref([])
const attached = ref([])
const status = ref('loading')
const busy = ref(false)
const message = ref('')
const announce = ref('')
const viewing = ref(null)

onMounted(async () => {
  try {
    const [all, linked] = await Promise.all([client.list(), client.attached(props.applicationId)])
    versions.value = all ?? []; attached.value = linked ?? []; status.value = 'ready'
  } catch (error) { status.value = 'error'; message.value = versionErrorText(error) }
})
const rows = computed(() => DOCUMENTS.map((doc) => ({
  ...doc,
  options: versions.value.filter((v) => v.document === doc.id),
  current: attached.value.find((v) => v.document === doc.id) ?? null,
})))

async function choose(doc, versionId) {
  const current = rows.value.find((row) => row.id === doc.id)?.current
  if ((current?.id ?? '') === versionId) return
  busy.value = true; message.value = ''; announce.value = ''
  try {
    attached.value = (versionId ? await client.attach(props.applicationId, versionId) : await client.detach(props.applicationId, current.id)) ?? []
    announce.value = versionId ? tr('제출한 {name}를 바꿨어요.', { name: tr(doc.label) }) : tr('제출한 {name} 연결을 뺐어요.', { name: tr(doc.label) })
  } catch (error) { message.value = versionErrorText(error) } finally { busy.value = false }
}
</script>

<template>
  <fieldset class="application-documents">
    <legend>{{ tr('제출한 문서') }}</legend>
    <p class="input-field-help">{{ tr('이 지원에 낸 문서 버전을 골라 두면, 나중에 문서를 고쳐도 제출 당시 내용을 다시 열 수 있어요.') }}</p>
    <p v-if="status === 'loading'" class="input-field-help" role="status">{{ tr('버전을 불러오는 중이에요.') }}</p>
    <template v-else-if="status === 'ready'">
      <div v-for="row in rows" :key="row.id" class="document-row">
        <label>{{ tr(row.label) }}<select :value="row.current?.id ?? ''" :disabled="busy || (!row.options.length && !row.current)" @change="choose(row, $event.target.value)">
          <option value="">{{ row.options.length ? tr('연결 안 함') : tr('저장한 버전이 없어요') }}</option>
          <option v-for="v in row.options" :key="v.id" :value="v.id">{{ versionName(v, tr) }}{{ v.language === 'en' ? ' · ' + tr('영어') : '' }} ({{ savedAt(v.createdAt) }})</option>
        </select></label>
        <button v-if="row.current && !row.current.broken" type="button" class="button-text" :aria-label="tr('{name} 제출본 열기', { name: tr(row.label) })" @click="viewing = row.current.id">{{ tr('열기') }}</button>
      </div>
      <p v-if="!versions.length" class="input-field-help">{{ tr('아직 저장한 문서 버전이 없어요.') }} <RouterLink to="/work/career">{{ tr('경력·포트폴리오') }}</RouterLink>{{ tr('에서 버전을 먼저 저장해 주세요.') }}</p>
    </template>
    <p class="sr-only" role="status">{{ announce }}</p>
    <p v-if="message" class="input-field-help" data-state="error" role="alert">{{ tr(message) }}</p>
    <DocumentVersionViewer v-if="viewing" :version-id="viewing" @close="viewing = null" />
  </fieldset>
</template>

<style scoped>
.application-documents { display: grid; gap: var(--space-sm); margin: var(--space-md) 0; padding: var(--space-md); border: 1px solid var(--color-hairline); border-radius: var(--radius-md); }
.application-documents legend { padding: 0 var(--space-xs); font-weight: 600; }
.application-documents p { margin: 0; }
.document-row { display: flex; flex-wrap: wrap; align-items: flex-end; gap: var(--space-sm); }
.document-row label { flex: 1 1 200px; min-width: 0; display: grid; gap: var(--space-xs); margin: 0; }
.document-row select { width: 100%; }
</style>
