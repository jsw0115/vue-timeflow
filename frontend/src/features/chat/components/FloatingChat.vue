<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import ChatWorkspace from '../views/ChatWorkspace.vue'
import { selectRoom, unreadChats } from '../model/chatStore'

const route = useRoute()
const key = 'timebar.chat.launcher-position'
const open = ref(false), loaded = ref(false), launcher = ref(null), panel = ref(null)
const size = 56, margin = 12
const viewport = ref({ width: window.innerWidth, height: window.innerHeight })
const position = ref({ x: 1, y: 1 })
try {
  const saved = JSON.parse(localStorage.getItem(key))
  if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) position.value = { x: Math.max(0, Math.min(1, saved.x)), y: Math.max(0, Math.min(1, saved.y)) }
} catch { /* Position still works when storage is unavailable. */ }
const bounds = computed(() => ({ x: Math.max(0, viewport.value.width - size - margin * 2), y: Math.max(0, viewport.value.height - size - margin * 2) }))
const buttonStyle = computed(() => ({ left: `${margin + position.value.x * bounds.value.x}px`, top: `${margin + position.value.y * bounds.value.y}px` }))
let drag = null, moved = false
function save() { try { localStorage.setItem(key, JSON.stringify(position.value)) } catch { /* Session position remains usable. */ } }
function start(event) {
  if (!event.isPrimary || event.button !== 0) return
  moved = false
  drag = { id: event.pointerId, x: event.clientX, y: event.clientY, origin: { ...position.value } }
  event.currentTarget.setPointerCapture(event.pointerId)
}
function move(event) {
  if (!drag || drag.id !== event.pointerId) return
  const dx = event.clientX - drag.x, dy = event.clientY - drag.y
  if (Math.hypot(dx, dy) > 6) moved = true
  if (!moved) return
  position.value = { x: Math.max(0, Math.min(1, drag.origin.x + dx / (bounds.value.x || 1))), y: Math.max(0, Math.min(1, drag.origin.y + dy / (bounds.value.y || 1))) }
}
function end() { if (drag) save(); drag = null }
async function toggle(event) {
  if (moved && event.detail !== 0) { moved = false; return }
  open.value = !open.value
  loaded.value = true
  await nextTick()
  if (open.value) panel.value?.focus()
}
async function close() { open.value = false; await nextTick(); launcher.value?.focus() }
function keyboard(event) {
  const directions = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }
  if (!directions[event.key]) return
  event.preventDefault()
  const [x, y] = directions[event.key], step = event.shiftKey ? 48 : 16
  position.value = { x: Math.max(0, Math.min(1, position.value.x + x * step / (bounds.value.x || 1))), y: Math.max(0, Math.min(1, position.value.y + y * step / (bounds.value.y || 1))) }
  save()
}
function reset() { position.value = { x: 1, y: 1 }; save() }
watch(() => [route.path, route.query.room], async ([path, room]) => {
  if (path !== '/chat') return
  loaded.value = true; open.value = true
  await nextTick()
  if (typeof room === 'string') await selectRoom(room)
  panel.value?.focus()
}, { immediate: true })
function resize() { viewport.value = { width: window.innerWidth, height: window.innerHeight } }
onMounted(() => window.addEventListener('resize', resize))
onBeforeUnmount(() => window.removeEventListener('resize', resize))
</script>

<template>
  <Teleport to="body">
    <section v-if="loaded" v-show="open" id="floating-chat" ref="panel" class="floating-chat" role="dialog" aria-label="채팅" tabindex="-1" @keydown.esc.stop="close">
      <div class="floating-chat-bar"><span>timebar</span><div><button @click="reset">버튼 위치 초기화</button><button aria-label="채팅 최소화" @click="close">−</button></div></div>
      <ChatWorkspace embedded :active="open" />
    </section>
    <button ref="launcher" class="floating-chat-launcher" :style="buttonStyle" :aria-expanded="open" aria-controls="floating-chat" aria-label="채팅 열기 · 드래그 또는 방향키로 위치 이동" title="채팅 · 끌어서 위치를 바꿀 수 있어요" @pointerdown="start" @pointermove="move" @pointerup="end" @pointercancel="end" @lostpointercapture="end" @keydown="keyboard" @click="toggle">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M20 11.5a8 8 0 0 1-8 8H5l-3 2v-10a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8Z"/><path d="M7 9h8M7 13h5"/></svg>
      <span v-if="unreadChats" class="floating-chat-badge">{{ unreadChats > 99 ? '99+' : unreadChats }}</span>
    </button>
  </Teleport>
</template>

<style>
.floating-chat-launcher { position: fixed; z-index: 90; width: 56px; height: 56px; display: grid; place-items: center; padding: 0; border: 1px solid var(--color-hairline); border-radius: var(--radius-full); background: var(--color-canvas); color: var(--color-foreground); box-shadow: var(--shadow-raised); cursor: grab; touch-action: none; user-select: none; }
.floating-chat-launcher:active { cursor: grabbing; }
.floating-chat-launcher:hover { background: var(--color-surface); }
.floating-chat-launcher svg { width: 25px; height: 25px; pointer-events: none; }
.floating-chat-badge { position: absolute; top: -4px; right: -4px; padding: 3px 6px; border-radius: var(--radius-full); background: var(--color-foreground); color: var(--color-on-primary); font-size: 0.75rem; font-family: 'JetBrains Mono', monospace; }
.floating-chat { position: fixed; z-index: 89; right: max(12px, env(safe-area-inset-right)); bottom: max(80px, env(safe-area-inset-bottom)); width: min(440px, calc(100vw - 24px)); height: min(700px, calc(100dvh - 104px)); display: flex; flex-direction: column; padding: 0; background: var(--color-canvas); color: var(--color-foreground); border: 1px solid var(--color-hairline); border-radius: var(--radius-lg); box-shadow: var(--shadow-raised); overflow: hidden; }
.floating-chat-bar { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 8px 16px; flex-shrink: 0; font-size: 0.75rem; border-bottom: 1px solid var(--color-hairline); }
.floating-chat-bar b { margin-left: 8px; font-weight: 500; }
.floating-chat-bar>div { display: flex; gap: 8px; align-items: center; }
.floating-chat-bar button { min-height: 32px; padding: 6px 10px; background: var(--color-surface); border-radius: var(--radius-full); font-size: 0.75rem; }
.floating-chat .chat-workspace { width: 100%; }
.floating-chat .chat-page-head { margin-bottom: 16px; }
.floating-chat .chat-page-head h1 { font-size: 1.5rem; letter-spacing: -.02em; }
.floating-chat .chat-page-head p:last-child { font-size: 0.75rem; }
.floating-chat .chat-layout { grid-template-columns: 240px minmax(0, 1fr); min-height: 0; }
.floating-chat .chat-tag-filter { padding: 8px 12px; }
.floating-chat .chat-compose-foot>small { display: block; font-size: 0.75rem; }
.floating-chat .chat-compose-foot { justify-content: flex-end; }
@media (max-width: 759px) {
  .floating-chat { padding: 0; }
  .floating-chat .chat-layout { min-height: 0; height: auto; }
  .floating-chat .chat-page-head h1 { font-size: 1.375rem; }
  .floating-chat .chat-page-head>.chat-primary { margin-top: 0; }
  .floating-chat .chat-sidebar-title { padding-top: 16px; }
}
</style>
