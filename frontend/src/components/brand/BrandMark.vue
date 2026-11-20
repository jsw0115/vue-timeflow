<!-- Timebar Diary 심볼. 세로 시간축 위에 계획(점선)과 실제 기록(실선·점)을 둔 DESIGN.md 7장 기하를 그대로 그린다. 색은 currentColor라 테마를 따른다. -->
<script setup>
defineProps({
  /** 보조 기술에 읽힐 이름. 워드마크 옆에서 장식으로 쓰면 빈 문자열을 준다. */
  label: { type: String, default: 'Timebar Diary' },
})
</script>

<template>
  <svg viewBox="0 0 24 24" :role="label ? 'img' : undefined" :aria-label="label || undefined" :aria-hidden="label ? undefined : 'true'" focusable="false">
    <path d="M5 4.5v15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
    <path d="M9 8h10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-dasharray="2.2 2.2" />
    <path d="M9 16h6.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
    <circle cx="18" cy="16" r="2" fill="currentColor" />
  </svg>
</template>
