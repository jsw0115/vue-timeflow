<script setup>
// 약어 옆의 짧은 설명. 키보드(Enter·Space)와 터치로 열고, Esc·바깥 누름·포커스 이동·스크롤로 닫는다(PR-19 UF-135).
// 포커스는 버튼에 그대로 있어 닫아도 제자리다. 열린 설명은 aria-live 영역으로 화면 낭독기에 읽힌다.
// 표(.list)처럼 overflow로 잘리는 곳에서도 보이도록 화면 기준으로 띄우고, 열 때 화면 안으로 위치를 맞춘다.
import { tr } from '../store/locale'
import { computed, nextTick, onBeforeUnmount, ref, useId } from 'vue'
import { termOf } from '../features/help/terms.mjs'

const props = defineProps({ term: { type: String, required: true } })
const info = computed(() => termOf(props.term))
const open = ref(false)
const root = ref(null)
const button = ref(null)
const panel = ref(null)
const pos = ref({ top: '0px', left: '0px' })
const panelId = useId()

function listen(on) {
  const method = on ? 'addEventListener' : 'removeEventListener'
  document[method]('pointerdown', outside)
  window[method]('scroll', close, true)
  window[method]('resize', close)
}
function close() {
  if (!open.value) return
  open.value = false
  listen(false)
}
async function toggle() {
  if (open.value) return close()
  open.value = true
  listen(true)
  await nextTick()
  place()
}
/** 버튼 바로 아래(공간이 없으면 위)에 두고, 좌우는 화면 여백(--space-xl) 안으로 당긴다. */
function place() {
  if (!button.value || !panel.value) return
  const gutter = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--space-xl')) || 0
  const gap = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--space-xs')) || 0
  const anchor = button.value.getBoundingClientRect()
  const width = panel.value.offsetWidth
  const height = panel.value.offsetHeight
  const left = Math.max(gutter, Math.min(anchor.left, window.innerWidth - gutter - width))
  const below = anchor.bottom + gap
  const top = below + height > window.innerHeight && anchor.top - gap - height >= 0 ? anchor.top - gap - height : below
  pos.value = { top: `${Math.round(top)}px`, left: `${Math.round(left)}px` }
}
function outside(event) { if (root.value && !root.value.contains(event.target)) close() }
function onFocusOut(event) { if (!root.value?.contains(event.relatedTarget)) close() }
onBeforeUnmount(() => listen(false))
</script>

<template>
  <span v-if="info" ref="root" class="term-hint" @focusout="onFocusOut" @keydown.esc.stop="close">
    <button ref="button" type="button" class="term-hint-button" :aria-expanded="open ? 'true' : 'false'" :aria-controls="panelId" @click="toggle">
      {{ tr(term) }}<span class="sr-only"> {{ tr('뜻 보기') }}</span>
    </button>
    <span :id="panelId" ref="panel" class="term-hint-panel" :hidden="!open" :style="pos" aria-live="polite">
      <template v-if="open"><b>{{ tr(term) }}<template v-if="info.full"> ({{ info.full }})</template></b> {{ tr(info.desc) }}</template>
    </span>
  </span>
  <template v-else>{{ tr(term) }}</template>
</template>

<style scoped>
.term-hint { display: inline; }
.term-hint-button { padding: 0; border: 0; background: none; color: inherit; font: inherit; text-decoration: underline dotted; text-underline-offset: var(--space-xs); cursor: help; }
.term-hint-button:focus-visible { outline: var(--focus-ring-width) solid var(--color-accent); outline-offset: var(--focus-ring-offset); border-radius: var(--radius-xs); }
.term-hint-panel { position: fixed; z-index: 5; width: max-content; max-width: min(280px, calc(100vw - 2 * var(--space-xl))); padding: var(--space-md) var(--space-lg); border: 1px solid var(--color-hairline); border-radius: var(--radius-md); background: var(--color-card); box-shadow: var(--shadow-popover); color: var(--color-foreground); font-size: var(--type-body-sm-size); font-weight: 400; line-height: 1.5; white-space: normal; text-align: left; }
.term-hint-panel[hidden] { display: none; }
</style>
