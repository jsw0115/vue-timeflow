<script setup>
import { computed, ref } from 'vue'
import { modeState, modeContent } from '../../store/modeProfiles'

const range = ref('주간')
const content = computed(() => modeContent(modeState.activeMode).aiReport)
</script>

<template>
  <div class="page-tools">
    <b style="font-size: 16px">이번 주 AI 리포트</b>
    <span></span>
    <div class="tabs">
      <button :class="{ selected: range === '주간' }" @click="range = '주간'">주간</button>
      <button :class="{ selected: range === '월간' }" @click="range = '월간'">월간</button>
      <button :class="{ selected: range === '연간' }" @click="range = '연간'">연간</button>
    </div>
  </div>
  <section class="card hero" style="min-height: auto; padding: 26px; flex-direction: column; align-items: flex-start; margin-bottom: 16px">
    <span class="pill">이번 주 한 줄 요약</span>
    <p style="font-size: 14px; font-weight: 600; color: var(--color-foreground); margin-top: 12px">{{ content.summary }}</p>
  </section>
  <section class="card" style="margin-bottom: 16px">
    <h3>{{ content.insightTitle }}</h3>
    <p>{{ content.insightBody }}</p>
  </section>
  <section class="card">
    <h3>다음 액션 제안</h3>
    <div class="event"><i style="width: 22px; height: 22px; border-radius: 6px; background: var(--color-surface); color: var(--color-foreground); font-style: normal; display: flex; align-items: center; justify-content: center; font-size: 11px">1</i><span style="flex: 1">‘분기 보고서 작성’을 내일 오전 골든타임(9~11시)에 배치해보세요</span><b style="color: var(--color-accent); font-size: 11px">플래너에 추가</b></div>
    <div class="event" style="border-bottom: none"><i style="width: 22px; height: 22px; border-radius: 6px; background: var(--color-surface); color: var(--color-foreground); font-style: normal; display: flex; align-items: center; justify-content: center; font-size: 11px">2</i><span style="flex: 1">저녁 SNS 사용 알림을 20:00부터 켜보는 건 어떨까요?</span><b style="color: var(--color-accent); font-size: 11px">설정에서 켜기</b></div>
  </section>
</template>
