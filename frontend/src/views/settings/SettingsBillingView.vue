<!-- 결제 제공 상태를 표시하고 확인되지 않은 구독·결제 이력을 노출하지 않는다. -->
<script setup>
import CapabilityStatusPanel from '../../features/integrations/CapabilityStatusPanel.vue'
</script>

<template>
  <CapabilityStatusPanel feature="billing" title="구독 및 결제" unavailable="현재 결제 제공자가 연결되지 않아 구독 신청·변경·해지를 사용할 수 없습니다.">
    <p>이 화면에서는 이용권과 결제 내역을 아직 조회할 수 없습니다. 확인되지 않은 결제일·영수증·구독 상태를 표시하지 않습니다.</p>
  </CapabilityStatusPanel>
</template>
