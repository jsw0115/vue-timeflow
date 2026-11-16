<!-- AI 제공 상태를 확인하고 미생성 보고서를 실제 분석으로 표시하지 않는다. -->
<script setup>
import CapabilityStatusPanel from '../../features/integrations/CapabilityStatusPanel.vue'
</script>

<template>
  <CapabilityStatusPanel feature="ai" title="AI 리포트" unavailable="현재 AI 분석 제공자가 연결되지 않아 보고서를 생성할 수 없습니다.">
    <p>현재 표시할 분석 결과가 없습니다. AI 분석과 플래너 행동 추가는 제공 준비가 완료된 뒤 사용할 수 있습니다.</p>
  </CapabilityStatusPanel>
</template>
