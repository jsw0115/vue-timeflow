<script setup>
defineProps({ draft: { type: Object, required: true } })
</script>
<template>
  <fieldset class="form-fieldset">
    <legend>시작 일시</legend>
    <div class="form-row">
      <label>시작 날짜<input v-model="draft.startDate" type="date" required /></label>
      <label>시작 시간<input v-model="draft.startTime" type="time" required /></label>
    </div>
  </fieldset>
  <fieldset class="form-fieldset">
    <legend>종료 일시</legend>
    <div class="form-row">
      <label>종료 날짜<input v-model="draft.endDate" type="date" required /></label>
      <label>종료 시간<input v-model="draft.endTime" type="time" required /></label>
    </div>
  </fieldset>
</template>
