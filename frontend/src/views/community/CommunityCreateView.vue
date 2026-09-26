<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { communityComposer } from '../../store/communities'
const router = useRouter()
onMounted(() => { communityComposer.value = true; router.replace('/community') })
</script>
<template><p class="form-note">커뮤니티 만들기 창을 여는 중입니다.</p></template>
