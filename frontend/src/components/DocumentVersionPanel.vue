<script setup>
// 이력서·경력기술서·포트폴리오의 버전 기록(PR-25). 지금 서버에 저장된 내용을 그대로 고정해 두고, 지원 기록에 제출본으로 이을 수 있다.
import { computed, onMounted, ref } from 'vue'
import DocumentVersionViewer from './DocumentVersionViewer.vue'
import { apiRequest } from '../features/auth/apiRequest.js'
import { MAX_VERSIONS, createDocumentVersionClient, documentLabel, savedAt, versionErrorText, versionName } from '../features/career/documentVersions.mjs'

const props = defineProps({ document: { type: String, required: true } })
const client = createDocumentVersionClient(apiRequest)
const versions = ref([])
const status = ref('loading')
const label = ref('')
const note = ref('')
const busy = ref(false)
const message = ref('')
const announce = ref('')
const viewing = ref(null)
const name = computed(() => documentLabel(props.document))

async function load() {
  try { versions.value = (await client.list(props.document)) ?? []; status.value = 'ready' } catch (error) { status.value = 'error'; message.value = versionErrorText(error) }
}
onMounted(load)
async function save() {
  busy.value = true; message.value = ''; announce.value = ''
  try {
    const created = await client.create(props.document, { label: label.value, note: note.value })
    label.value = ''; note.value = ''
    announce.value = `‘${versionName(created)}’ 버전을 저장했어요.`
    await load()
  } catch (error) { message.value = versionErrorText(error) } finally { busy.value = false }
}
async function remove(version) {
  if (!window.confirm(`‘${versionName(version)}’ 버전을 지울까요? 지운 버전은 되돌릴 수 없어요.`)) return
  busy.value = true; message.value = ''; announce.value = ''
  try { await client.remove(version.id); announce.value = `‘${versionName(version)}’ 버전을 지웠어요.`; await load() } catch (error) { message.value = versionErrorText(error) } finally { busy.value = false }
}
</script>

<template>
  <section class="card document-versions" :aria-labelledby="'versions-' + document">
    <h3 :id="'versions-' + document">{{ name }} 버전 <span class="figure">{{ versions.length }}/{{ MAX_VERSIONS }}</span></h3>
    <p class="input-field-help">지금 저장된 {{ name }} 내용을 그대로 고정해 둬요. 나중에 고쳐도 저장한 버전은 바뀌지 않고, 지원 기록에 제출본으로 연결할 수 있어요. 저장하지 않은 수정은 버전에 들어가지 않아요.</p>
    <div class="version-form">
      <label>버전 이름(선택)<input v-model="label" maxlength="100" placeholder="예: 가나다 제출용" /></label>
      <label>바뀐 점(선택)<input v-model="note" maxlength="500" placeholder="예: 성과 문장 수정" /></label>
      <button type="button" class="button-secondary" :disabled="busy || versions.length >= MAX_VERSIONS" :aria-busy="busy ? 'true' : undefined" @click="save">지금 내용으로 버전 저장</button>
    </div>
    <p v-if="status === 'loading'" class="input-field-help" role="status">버전을 불러오는 중이에요.</p>
    <ul v-else-if="versions.length" class="version-list">
      <li v-for="v in versions" :key="v.id">
        <span class="version-name"><b>{{ versionName(v) }}</b><small>저장 <span class="figure">{{ savedAt(v.createdAt) }}</span><template v-if="v.note"> · {{ v.note }}</template></small><small v-if="v.applicationCount">지원 <span class="figure">{{ v.applicationCount }}</span>건에 제출본으로 연결돼 지울 수 없어요</small></span>
        <span class="version-actions">
          <button type="button" class="button-text" :aria-label="versionName(v) + ' 열기'" @click="viewing = v.id">열기</button>
          <button type="button" class="button-text" :disabled="busy || v.applicationCount > 0" :aria-label="versionName(v) + ' 지우기'" @click="remove(v)">지우기</button>
        </span>
      </li>
    </ul>
    <p v-else-if="status === 'ready'" class="input-field-help">아직 저장한 버전이 없어요.</p>
    <p class="sr-only" role="status">{{ announce }}</p>
    <p v-if="message" class="input-field-help" data-state="error" role="alert">{{ message }}</p>
    <DocumentVersionViewer v-if="viewing" :version-id="viewing" @close="viewing = null" />
  </section>
</template>

<style scoped>
.document-versions { display: grid; gap: var(--space-sm); margin-top: var(--space-lg); }
.document-versions h3, .document-versions p { margin: 0; }
.version-form { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); align-items: end; gap: var(--space-sm); }
.version-form label { display: grid; gap: var(--space-xs); margin: 0; }
.version-list { display: grid; gap: var(--space-xs); margin: 0; padding: 0; list-style: none; }
.version-list li { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--space-xs) var(--space-md); padding: var(--space-sm) 0; border-top: 1px solid var(--color-hairline); }
.version-name { display: grid; gap: 2px; min-width: 0; overflow-wrap: anywhere; }
.version-name small { color: var(--color-muted); font-size: var(--type-caption-size); }
.version-actions { display: flex; gap: var(--space-sm); }
.figure { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }
</style>
