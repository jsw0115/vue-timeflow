<script setup>
import { onMounted, onBeforeUnmount, ref, useId } from 'vue'
import EditPresence from './EditPresence.vue'
defineProps({ wide: { type: Boolean, default: false }, title: { type: String, default: '' }, editResource: { type: String, default: '' } })
const emit = defineEmits(['close'])
const dialog = ref(null)
const titleId = useId()
let previousFocus
onMounted(() => {
  previousFocus = document.activeElement
  dialog.value.showModal()
})
onBeforeUnmount(() => {
  dialog.value?.close()
  if (previousFocus?.isConnected) previousFocus.focus()
})
function backdrop(event) {
  if (event.target !== dialog.value) return
  const rect = dialog.value.getBoundingClientRect()
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) emit('close')
}
</script>
<template>
  <Teleport to="body">
    <dialog ref="dialog" class="app-dialog" :aria-labelledby="titleId" @cancel.prevent="emit('close')" @click="backdrop">
      <div class="modal-card" :class="{ wide }">
        <div class="modal-head">
          <h3 :id="titleId">{{ title }}</h3>
          <button type="button" class="icon" aria-label="닫기" @click="emit('close')">×</button>
        </div>
        <div v-if="$slots.toolbar" class="modal-toolbar"><slot name="toolbar" /></div>
        <EditPresence v-if="editResource" :resource="editResource" />
        <div class="modal-body"><slot /></div>
        <div class="modal-footer"><slot name="footer"><button type="button" class="modal-secondary" @click="emit('close')">닫기</button></slot></div>
      </div>
    </dialog>
  </Teleport>
</template>
<style>
.app-dialog { padding: 0; border: 1px solid var(--color-hairline); border-radius: var(--radius-lg); background: var(--color-canvas); color: var(--color-foreground); width: min(720px, calc(100vw - 24px)); height: min(740px, calc(100dvh - 24px)); max-width: calc(100vw - 24px); max-height: calc(100dvh - 24px); overflow: hidden; }
.app-dialog::backdrop { background: rgb(0 0 0 / 40%); }
.app-dialog .modal-card, .app-dialog .modal-card.wide { width: 100%; height: 100%; max-width: none; max-height: none; box-shadow: none; display: flex; flex-direction: column; padding: 0; overflow: hidden; }
.app-dialog .modal-head { flex-shrink: 0; padding: 20px 24px; margin: 0; border-bottom: 1px solid var(--color-hairline); }
.modal-toolbar { padding: 16px 24px 0; flex-shrink: 0; }
.modal-body { flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: 20px 24px; }
.modal-footer { display: flex; align-items: center; justify-content: flex-end; flex-wrap: wrap; gap: 12px; flex-shrink: 0; padding: 16px 24px; border-top: 1px solid var(--color-hairline); background: var(--color-canvas); }
.app-dialog .modal-footer .primary { width: auto; margin: 0; }
.modal-footer>.form-row { width: 100%; margin: 0; }
.modal-footer .chat-leave { margin-top: 0; }
.modal-secondary { padding: 10px 18px; border: 1px solid var(--color-hairline); border-radius: var(--radius-full); background: var(--color-canvas); color: var(--color-foreground); font-size: 13px; }
@media(max-width: 480px) { .app-dialog .modal-head, .modal-body, .modal-footer { padding: 16px; }.modal-toolbar { padding: 12px 16px 0; } }
</style>
