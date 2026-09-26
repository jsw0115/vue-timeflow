<script setup>
import { computed, nextTick, ref, watch, useId } from 'vue'
import { mentionCandidates, parseTags, parseMentions, tagCounts } from '../store/tagging'

/**
 * #태그 · @멘션을 지원하는 본문 입력기.
 * 마지막으로 입력 중인 # 또는 @ 토큰을 감지해 후보를 띄우고, 고르면 그 자리에 채운다.
 */
const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '내용을 입력하세요. #태그 와 @이름 을 쓸 수 있어요' },
  rows: { type: Number, default: 4 },
})
const emit = defineEmits(['update:modelValue'])

const el = ref(null)
const caret = ref(0)
const focused = ref(false)
const dismissed = ref(false)
const activeIndex = ref(0)
const listId = useId()
const showSuggestions = computed(() => focused.value && !dismissed.value && suggestions.value.length > 0)
watch(() => props.modelValue, () => { activeIndex.value = 0 })
function onKey(event) {
  if (event.isComposing || !showSuggestions.value) return
  if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); dismissed.value = true }
  else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    activeIndex.value = (activeIndex.value + (event.key === 'ArrowDown' ? 1 : -1) + suggestions.value.length) % suggestions.value.length
  } else if (event.key === 'Enter' && !event.ctrlKey && !event.shiftKey) {
    event.preventDefault()
    pick(suggestions.value[activeIndex.value] ?? suggestions.value[0])
  }
}

/** 커서 앞쪽에서 아직 완성되지 않은 #/@ 토큰을 찾는다 */
const token = computed(() => {
  const upto = props.modelValue.slice(0, caret.value)
  const m = upto.match(/([#@])([\w가-힣]*)$/)
  if (!m) return null
  return { sign: m[1], word: m[2], start: caret.value - m[0].length }
})

const suggestions = computed(() => {
  const t = token.value
  if (!t) return []
  if (t.sign === '@') return mentionCandidates(t.word).map((c) => ({ label: c.name, hint: c.relation }))
  return tagCounts.value
    .filter((x) => !t.word || x.tag.includes(t.word))
    .slice(0, 6)
    .map((x) => ({ label: x.tag, hint: x.count + '회 사용' }))
})

function onInput(e) {
  dismissed.value = false
  caret.value = e.target.selectionStart ?? 0
  emit('update:modelValue', e.target.value)
}
function syncCaret(e) {
  caret.value = e.target.selectionStart ?? 0
}
function pick(s) {
  const t = token.value
  if (!t || !s) return
  dismissed.value = true
  const before = props.modelValue.slice(0, t.start)
  const after = props.modelValue.slice(caret.value)
  const inserted = t.sign + s.label + ' '
  emit('update:modelValue', before + inserted + after)
  nextTick(() => {
    const pos = (before + inserted).length
    el.value?.setSelectionRange(pos, pos)
    el.value?.focus()
    caret.value = pos
  })
}

const tags = computed(() => parseTags(props.modelValue))
const mentions = computed(() => parseMentions(props.modelValue))
</script>

<template>
  <div class="tag-input" @focusin="focused = true" @focusout="focused = $event.currentTarget.contains($event.relatedTarget)">
    <textarea
      ref="el"
      :value="modelValue"
      :rows="rows"
      aria-label="본문 · 태그와 멘션 입력"
      aria-autocomplete="list"
      :aria-controls="showSuggestions ? listId : undefined"
      :aria-activedescendant="showSuggestions ? listId + '-' + activeIndex : undefined"
      @keydown="onKey"
      :placeholder="placeholder"
      @input="onInput"
      @click="syncCaret"
      @keyup="syncCaret"
    ></textarea>

    <div v-if="showSuggestions" :id="listId" class="tag-suggest" role="listbox" aria-label="태그·멘션 추천">
      <button v-for="(s, index) in suggestions" :key="s.label" :id="listId + '-' + index" type="button" role="option" :aria-selected="activeIndex === index" tabindex="-1" @mousedown.prevent @click="pick(s)">
        <b>{{ token.sign }}{{ s.label }}</b><small>{{ s.hint }}</small>
      </button>
    </div>

    <p v-if="tags.length || mentions.length" class="tag-preview">
      <span v-for="t in tags" :key="'t' + t" class="rt-tag">#{{ t }}</span>
      <span v-for="m in mentions" :key="'m' + m" class="rt-mention">@{{ m }}</span>
    </p>
    <p v-else class="form-note" style="margin: 6px 0 0">#으로 태그를, @로 사람을 언급할 수 있어요.</p>
  </div>
</template>
