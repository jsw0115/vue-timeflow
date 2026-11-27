<script setup>
import { computed, ref } from 'vue'
import Modal from './Modal.vue'
import { tr } from '../store/locale'

/**
 * 화면 사용법 도움말. 제목 옆 ⓘ 버튼을 누르면 모달로 열린다.
 * steps: 사용 순서, terms: 용어 설명, tips: 주의사항 — 각각 없으면 그 섹션은 숨긴다.
 */
const props = defineProps({
  title: { type: String, required: true },
  summary: { type: String, default: '' },
  steps: { type: Array, default: () => [] },
  terms: { type: Array, default: () => [] }, // [{ term, desc }]
  tips: { type: Array, default: () => [] },
  formula: { type: String, default: '' },
})

const open = ref(false)
// 제목이 이미 "…사용법"이면 그대로 쓴다(예전에는 "루틴 사용법 사용법"처럼 겹쳐 읽혔다)
const buttonLabel = computed(() => (/사용법$|^How to use/.test(props.title) ? props.title : tr('{title} 사용법', { title: props.title })))
</script>

<template>
  <button class="help-btn" type="button" :aria-label="buttonLabel" @click="open = true">
    <span aria-hidden="true">ⓘ</span> {{ tr('사용법') }}
  </button>

  <Modal v-if="open" :title="title" wide @close="open = false">
    <p v-if="summary" class="help-summary">{{ summary }}</p>

    <div v-if="formula" class="help-formula">
      <span class="pill">{{ tr('계산식') }}</span>
      <code>{{ formula }}</code>
    </div>

    <template v-if="steps.length">
      <div class="section-label">{{ tr('이렇게 쓰세요') }}</div>
      <ol class="help-steps">
        <li v-for="(s, i) in steps" :key="i"><b>{{ i + 1 }}</b><span>{{ s }}</span></li>
      </ol>
    </template>

    <template v-if="terms.length">
      <div class="section-label">{{ tr('용어') }}</div>
      <div class="help-terms">
        <div v-for="t in terms" :key="t.term">
          <b>{{ t.term }}</b>
          <span>{{ t.desc }}</span>
        </div>
      </div>
    </template>

    <template v-if="tips.length">
      <div class="callout" style="margin-top: 16px">
        <b>{{ tr('알아두면 좋아요') }}</b>
        <p v-for="(t, i) in tips" :key="i" style="margin: 6px 0 0">· {{ t }}</p>
      </div>
    </template>

    <template #footer>
      <button class="primary" @click="open = false">{{ tr('닫기') }}</button>
    </template>
  </Modal>
</template>
