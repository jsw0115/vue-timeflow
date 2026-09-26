<script setup>
import { percent } from '../../data/mock'

const props = defineProps({ screen: { type: Object, required: true } })
const score = percent(props.screen.id, 0, 55, 92)
</script>

<template>
  <div class="drawer-stage">
    <p class="eyebrow">이 화면은 {{ screen.type }} — 목록/캘린더 등 다른 화면 옆(웹) 또는 아래(모바일)에서 슬라이드로 열립니다</p>
    <div class="drawer-preview card">
      <div class="head">
        <div><i class="avatar">지</i></div>
        <button class="icon" type="button">×</button>
      </div>
      <h3>지수 김</h3>
      <p class="eyebrow">{{ screen.role }}</p>
      <div class="progress"><em :style="{ width: score + '%' }"></em></div>
      <p>이번 달 공유 활동 {{ score }}%</p>
      <label>관계 메모<textarea placeholder="이 사람과의 관계를 기록해보세요"></textarea></label>
      <button class="primary">저장</button>
    </div>
  </div>
</template>
