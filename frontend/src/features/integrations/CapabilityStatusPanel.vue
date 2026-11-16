<!-- AI·결제 기능의 제공 상태와 아직 확인할 수 없는 결과를 구분해 안내한다. -->
<script setup>
import { useCapabilityStatus } from './useCapabilityStatus.mjs'
const props = defineProps({ feature: { type: String, required: true }, title: { type: String, required: true }, unavailable: { type: String, required: true } })
const { state, refresh } = useCapabilityStatus(() => props.feature)
</script>

<template>
  <section class="card setting-content" :aria-busy="state.busy">
    <h2>{{ title }}</h2>
    <p v-if="state.busy" role="status">서버에서 제공 상태를 확인하고 있습니다.</p>
    <p v-else-if="state.error" role="alert">{{ state.error }}</p>
    <p v-else-if="state.available === false" role="status">{{ unavailable }}</p>
    <p v-else-if="state.available === true" role="status">서버의 기능 제공 상태를 확인했습니다. 이 화면의 결과 조회 기능은 아직 준비 중입니다.</p>
    <slot />
    <button type="button" class="review" :disabled="state.busy" @click="refresh">제공 상태 다시 확인</button>
  </section>
</template>
