<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { session } from '../features/auth/session'
import { ME } from '../store/tagging'
import { liveEditors } from '../utils/editPresence.mjs'
const props = defineProps({ resource: { type: String, required: true }, active: { type: Boolean, default: true } })
const clientId = typeof crypto !== 'undefined' ? crypto.randomUUID() : 'ssr'
const name = computed(() => session.user?.nickname || session.nickname || ME)
const peers = ref([]), now = ref(Date.now())
const others = computed(() => liveEditors(peers.value, props.resource, now.value, clientId))
let channel, heartbeat, announced
function publish() {
  if (typeof document === 'undefined') return
  const resource = props.active && !document.hidden ? props.resource : ''
  announced = resource
  channel?.postMessage({ type: 'editor', resource, clientId, name: name.value, expiresAt: Date.now() + 15000 })
}
function visibility() { publish() }
watch(() => [props.resource, props.active], publish)
onMounted(() => {
  if (typeof BroadcastChannel === 'undefined') return
  channel = new BroadcastChannel('timeflow.local-editors.v1')
  channel.onmessage = ({ data }) => {
    if (data?.type === 'hello') { publish(); return }
    if (data?.type !== 'editor' || typeof data.clientId !== 'string' || typeof data.resource !== 'string' || typeof data.name !== 'string' || !Number.isFinite(data.expiresAt)) return
    peers.value = [...peers.value.filter(peer => peer.clientId !== data.clientId && peer.expiresAt > Date.now()), data]
  }
  channel.postMessage({ type: 'hello' }); publish()
  heartbeat = setInterval(() => { now.value = Date.now(); publish() }, 4000)
  document.addEventListener('visibilitychange', visibility)
})
onBeforeUnmount(() => { clearInterval(heartbeat); document.removeEventListener('visibilitychange', visibility); if (announced) channel?.postMessage({ type: 'editor', clientId, name: name.value, resource: '', expiresAt: 0 }); channel?.close() })
</script>
<template>
  <div v-if="others.length || active" class="edit-presence" role="status"><i aria-hidden="true"></i><span>{{ others.length ? [...new Set(others.map(peer => peer.name))].join(', ') + '님이 다른 창에서 수정 중이에요.' : name + '님이 수정 중이에요.' }}<small v-if="others.length">다른 창의 변경 내용을 확인한 뒤 저장해주세요.</small></span></div>
</template>
<style>
.edit-presence { display: flex; gap: 8px; align-items: flex-start; padding: 10px 16px; font-size: .8125rem; color: var(--color-accent); background: var(--color-surface); border-bottom: 1px solid var(--color-hairline); flex-shrink: 0; }
.edit-presence i { width: 6px; height: 6px; flex: 0 0 6px; border-radius: 50%; background: currentColor; margin-top: 6px; }.edit-presence small { display: block; margin-top: 4px; color: var(--color-muted); font-size: .75rem; }
</style>
