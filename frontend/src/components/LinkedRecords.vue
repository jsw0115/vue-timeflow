<!-- 한 기록(할 일·일정·실제 기록)에 연결된 기록을 서버에서 불러와 이동 링크로 보인다. 실제 기록이면 원본도 보인다(PR-08 UF-92·UF-93). -->
<script setup>
import { computed, ref, watch } from 'vue'
import { session } from '../features/auth/session.js'
import { tr } from '../store/locale'
import { KIND_LABEL, createLinkClient, linkRoute, originOf } from '../features/records/recordLinks.mjs'

const props = defineProps({
  kind: { type: String, required: true },
  id: { type: String, required: true },
  // 실제 기록이면 그 기록. 원본(sourceKind·sourceId)이 지워졌는지 알려 준다
  record: { type: Object, default: null },
  // 바꾸면 다시 불러온다(배치·기록 시작 뒤)
  refreshKey: { type: Number, default: 0 },
})
const client = createLinkClient()
const state = ref({ status: 'idle', links: [] })
let generation = 0

async function load() {
  const expected = ++generation
  if (!session.userId) { state.value = { status: 'idle', links: [] }; return }
  state.value = { status: 'loading', links: state.value.links }
  try {
    const links = await client.list(props.kind, props.id)
    if (expected === generation) state.value = { status: 'ready', links }
  } catch {
    if (expected === generation) state.value = { status: 'error', links: [] }
  }
}
watch(() => [props.kind, props.id, props.refreshKey, session.userId], load, { immediate: true })

const origin = computed(() => (props.kind === 'actual' && state.value.status === 'ready' ? originOf(props.record, state.value.links) : null))
// 원본은 따로 보이므로 목록에서는 뺀다
const others = computed(() => state.value.links.filter((link) => !(origin.value && !origin.value.deleted && link.kind === origin.value.kind && link.id === origin.value.id)))
</script>

<template>
  <section v-if="session.userId" class="linked-records" :aria-label="tr('연결된 기록')">
    <div class="section-label">{{ tr('연결된 기록') }}</div>
    <p v-if="state.status === 'loading' && !state.links.length" class="input-field-help" role="status">{{ tr('연결된 기록을 불러오는 중이에요.') }}</p>
    <div v-else-if="state.status === 'error'" role="status">
      <p class="input-field-help" data-state="error">{{ tr('연결된 기록을 불러오지 못했어요.') }}</p>
      <button type="button" class="button-secondary" @click="load">{{ tr('다시 불러오기') }}</button>
    </div>
    <template v-else-if="state.status === 'ready'">
      <p v-if="origin">{{ tr('원본 {kind}', { kind: tr(KIND_LABEL[origin.kind]) }) }} ·
        <span v-if="origin.deleted">{{ origin.title }}</span>
        <RouterLink v-else :to="linkRoute(origin)">{{ origin.title }}</RouterLink>
      </p>
      <ul v-if="others.length">
        <li v-for="link in others" :key="link.kind + ':' + link.id">{{ tr(KIND_LABEL[link.kind]) }} · <RouterLink :to="linkRoute(link)">{{ link.title }}</RouterLink></li>
      </ul>
      <p v-else-if="!origin" class="empty-state">{{ tr('아직 연결된 기록이 없어요. 할 일이나 일정에서 기록을 시작하면 여기에 보여요.') }}</p>
    </template>
  </section>
</template>

<style scoped>
.linked-records { margin-top: var(--space-lg); }
.linked-records ul { margin: var(--space-sm) 0 0; padding-left: var(--space-xl); }
.linked-records li { margin: var(--space-xs) 0; }
</style>
