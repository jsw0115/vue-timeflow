<script setup>
import { onMounted, onBeforeUnmount, ref, useId } from 'vue'
defineProps({ wide: { type: Boolean, default: false }, title: { type: String, default: '' } })
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
        <slot />
      </div>
    </dialog>
  </Teleport>
</template>
<style>
.app-dialog { padding: 0; border: 0; border-radius: var(--radius-lg); background: var(--color-canvas); color: var(--color-foreground); max-width: calc(100vw - 24px); max-height: calc(100dvh - 24px); }
.app-dialog::backdrop { background: rgb(0 0 0 / 40%); }
.app-dialog .modal-card { max-height: calc(100dvh - 24px); box-shadow: none; }
</style>
