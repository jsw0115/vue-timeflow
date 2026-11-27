<script setup>
import { tr } from '../store/locale'
import Modal from './Modal.vue'
import SearchPanel from './SearchPanel.vue'
defineEmits(['close'])
</script>
<template><Modal :title="tr('통합 검색')" @close="$emit('close')"><SearchPanel @close="$emit('close')" /><template #footer><button class="modal-secondary" @click="$emit('close')">{{ tr('닫기') }}</button></template></Modal></template>
