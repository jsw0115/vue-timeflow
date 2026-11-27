<!-- 저장 요청의 진행·성공·실패를 사실대로 알리고 실패하면 다시 시도할 수 있게 한다(PR-07, UF-82·UF-83). -->
<script setup>
import { tr } from '../store/locale'
import { computed } from 'vue'
const props = defineProps({
  state: { type: Object, required: true },
  mode: { type: String, default: 'server' },
  savedText: { type: String, default: '' },
})
const emit = defineEmits(['retry'])
const text = computed(() => {
  if (props.state.status === 'saving') return '저장하는 중이에요.'
  if (props.state.status === 'saved') return props.savedText || (props.mode === 'local' ? '이 브라우저에 저장했어요.' : '저장했어요.')
  if (props.state.status === 'failed') return props.state.message
  return ''
})
</script>
<template>
  <div class="save-status" role="status">
    <template v-if="text">
      <span class="input-field-help" :data-state="state.status === 'failed' ? 'error' : state.status === 'saved' ? 'success' : undefined">{{ tr(text) }}</span>
      <button v-if="state.status === 'failed' && state.error?.kind !== 'invalid' && state.error?.kind !== 'notFound'" type="button" class="button-secondary" @click="emit('retry')">{{ tr('다시 시도') }}</button>
    </template>
  </div>
</template>
<style>
.save-status { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-md); margin-top: var(--space-md); }
.save-status:empty { display: none; }
</style>
