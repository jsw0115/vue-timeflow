<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const mode = ref('J')
</script>

<template>
  <div class="auth-page" style="background: radial-gradient(circle at 14% 8%, var(--color-surface) 0%, var(--color-surface) 42%)">
    <div style="width: min(760px, 100%)">
      <div style="text-align: center; margin-bottom: 24px">
        <p class="eyebrow" style="text-align: center">온보딩 (2/3)</p>
        <h1>지수님은 어떤 하루를<br />보내고 계신가요?</h1>
        <p>선택하신 모드에 맞춰 기본 카테고리와 홈 화면 구성을 준비해드려요</p>
      </div>
      <div class="three" style="margin-bottom: 20px">
        <button class="mode" :class="{ selected: mode === 'J' }" @click="mode = 'J'" style="flex-direction: column; align-items: flex-start; height: auto"><b>J</b><span style="margin-top: 10px">직장인 모드</span><small>업무 시간 중심의 타임바와 공수 리포트를 우선 보여드려요</small></button>
        <button class="mode" :class="{ selected: mode === 'P' }" @click="mode = 'P'" style="flex-direction: column; align-items: flex-start; height: auto"><b>P</b><span style="margin-top: 10px">개인/학업 모드</span><small>루틴과 다이어리, 자기계발 카테고리를 우선 보여드려요</small></button>
        <button class="mode" :class="{ selected: mode === 'B' }" @click="mode = 'B'" style="flex-direction: column; align-items: flex-start; height: auto"><b>B</b><span style="margin-top: 10px">균형 모드</span><small>업무와 개인 시간을 절반씩, 모든 카테고리를 고르게 보여드려요</small></button>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center">
        <span>← 이전</span>
        <button class="primary" @click="router.push('/')">다음 →</button>
      </div>
    </div>
  </div>
</template>
