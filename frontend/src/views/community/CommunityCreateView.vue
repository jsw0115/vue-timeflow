<script setup>
import { tr } from '../../store/locale'
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { communityComposer } from '../../store/communities'
const router = useRouter()
onMounted(() => { communityComposer.value = true; router.replace('/community') })
</script>
<template><p class="form-note">{{ tr('커뮤니티 만들기 창을 여는 중입니다.') }}</p></template>
