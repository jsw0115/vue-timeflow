<!-- 로그인 상태에서 서버 목록을 불러오는 중이거나 불러오지 못했을 때 알리고 다시 시도하게 한다(BUG-007). 이 상태에서는 화면이 빈 목록 문구를 숨긴다(listPending). -->
<script setup>
import { tr } from '../store/locale'
import { listFailed, listLoading } from '../features/records/listLoadState.mjs'
defineProps({ store: { type: Object, required: true }, loading: { type: String, required: true }, failed: { type: String, required: true } })
</script>

<template>
  <p v-if="listLoading(store)" class="input-field-help" role="status">{{ tr(loading) }}</p>
  <div v-else-if="listFailed(store)" class="empty-state" role="status"><p>{{ tr(failed) }}</p><button type="button" class="button-secondary" @click="store.reload()">{{ tr('다시 시도') }}</button></div>
</template>
