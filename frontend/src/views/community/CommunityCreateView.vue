<script setup>
import { tr } from '../../store/locale'
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { communityComposer } from '../../store/communities'
const router = useRouter()
// 주소를 먼저 옮긴 뒤 창을 연다. 창은 화면이 바뀌면 닫히므로(IMP-025) 순서가 바뀌면 바로 닫힌다
onMounted(async () => { await router.replace('/community'); communityComposer.value = true })
</script>
<template><p class="form-note">{{ tr('커뮤니티 만들기 창을 여는 중입니다.') }}</p></template>
