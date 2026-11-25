<script setup>
// 문서 버전 비교(PR-25). 같은 문서의 두 고정본을 원본 항목 단위로 맞춰 추가·삭제·바뀐 칸을 글자로 보인다(색만으로 구분하지 않음).
import { computed, onMounted, ref } from 'vue'
import Modal from './Modal.vue'
import { apiRequest } from '../features/auth/apiRequest.js'
import { compareVersions, createDocumentVersionClient, versionErrorText, versionName as plainName } from '../features/career/documentVersions.mjs'
import { tr } from '../store/locale'
import { workPrivacy } from '../store/workPrivacy'

const props = defineProps({ baseId: { type: String, required: true }, targetId: { type: String, required: true } })
const emit = defineEmits(['close'])
const client = createDocumentVersionClient(apiRequest)
const base = ref(null)
const target = ref(null)
const message = ref('')
onMounted(async () => {
  try { [base.value, target.value] = await Promise.all([client.get(props.baseId), client.get(props.targetId)]) } catch (error) { message.value = versionErrorText(error) }
})
const diff = computed(() => (base.value && target.value ? compareVersions(base.value, target.value, { maskCompany: workPrivacy.maskCompanyNames, t: tr }) : null))
const versionName = (version) => plainName(version, tr)
const empty = computed(() => diff.value && !diff.value.added.length && !diff.value.removed.length && !diff.value.changed.length)
</script>

<template>
  <Modal :title="tr('버전 비교')" wide @close="emit('close')">
    <p v-if="!diff && !message" class="input-field-help" role="status">{{ tr('두 버전을 불러오는 중이에요.') }}</p>
    <p v-if="message" class="input-field-help" data-state="error" role="alert">{{ tr(message) }}</p>
    <template v-if="diff">
      <p class="compare-head"><b>{{ versionName(base) }}</b> → <b>{{ versionName(target) }}</b></p>
      <p class="input-field-help">{{ tr('바뀐 항목') }} <span class="figure">{{ diff.changed.length }}</span> {{ tr('· 추가') }} <span class="figure">{{ diff.added.length }}</span> {{ tr('· 삭제') }} <span class="figure">{{ diff.removed.length }}</span> {{ tr('· 그대로') }} <span class="figure">{{ diff.unchanged }}</span></p>
      <p v-if="empty" class="input-field-help">{{ tr('두 버전의 내용이 같아요.') }}</p>
      <section v-for="(c, i) in diff.changed" :key="'c' + i" class="compare-item">
        <h3><span class="tag">{{ tr('바뀜') }}</span> {{ c.heading }}</h3>
        <dl>
          <template v-for="f in c.fields" :key="f.label">
            <dt>{{ f.label }}</dt>
            <dd><span class="compare-label">{{ tr('이전') }}</span><span class="compare-text">{{ f.before || tr('(비어 있음)') }}</span></dd>
            <dd><span class="compare-label">{{ tr('이후') }}</span><span class="compare-text">{{ f.after || tr('(비어 있음)') }}</span></dd>
          </template>
        </dl>
      </section>
      <section v-if="diff.added.length" class="compare-item">
        <h3><span class="tag">{{ tr('추가') }}</span> {{ tr('새로 들어간 항목') }}</h3>
        <ul><li v-for="(a, i) in diff.added" :key="'a' + i">{{ a.heading }}</li></ul>
      </section>
      <section v-if="diff.removed.length" class="compare-item">
        <h3><span class="tag">{{ tr('삭제') }}</span> {{ tr('빠진 항목') }}</h3>
        <ul><li v-for="(r, i) in diff.removed" :key="'r' + i">{{ r.heading }}</li></ul>
      </section>
    </template>
    <template #footer><button type="button" class="primary" @click="emit('close')">{{ tr('닫기') }}</button></template>
  </Modal>
</template>

<style scoped>
.compare-head { margin: 0 0 var(--space-xs); overflow-wrap: anywhere; }
.compare-item { margin-top: var(--space-lg); padding-top: var(--space-md); border-top: 1px solid var(--color-hairline); }
.compare-item h3 { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-sm); margin: 0 0 var(--space-sm); font-size: var(--type-body-size); }
.compare-item dl { display: grid; gap: var(--space-xs); margin: 0; }
.compare-item dt { margin-top: var(--space-sm); color: var(--color-muted); font-size: var(--type-caption-size); font-weight: 600; }
.compare-item dd { display: grid; grid-template-columns: 3em 1fr; gap: var(--space-sm); margin: 0; }
.compare-label { color: var(--color-muted); font-size: var(--type-caption-size); }
.compare-text { white-space: pre-line; overflow-wrap: anywhere; }
.compare-item ul { margin: 0; padding-left: var(--space-xl); }
</style>
