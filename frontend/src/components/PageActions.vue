<script setup>
// 화면의 대표 행동을 앱 헤더 오른쪽(제목과 같은 줄)으로 옮긴다(DESIGN.md 5장 "주요 페이지 제목은 좌측, 화면 대표 CTA는 우측").
// 앱 헤더가 없는 곳(대화 화면·관리자 창·전체 화면 라우트)에서는 쓰인 자리에 그대로 그린다.
import { inject, onBeforeUnmount, onMounted } from 'vue'

const slot = inject('pageActionSlot', null)
onMounted(() => slot?.register())
onBeforeUnmount(() => slot?.unregister())
</script>

<template>
  <Teleport to="#page-actions" defer :disabled="!slot?.available.value">
    <slot />
  </Teleport>
</template>
