<script setup>
import { tr } from '../../store/locale'
</script>

<template>
  <div class="auth-page">
    <div class="auth-form-inner">
      <h1 style="font-size: 1.5rem; color: var(--color-foreground); letter-spacing: -1px">{{ tr('계정 연동 관리') }}</h1>
      <p>{{ tr('소셜 계정을 연동하면 다음부터 한 번의 클릭으로 로그인할 수 있어요.') }}</p>
      <!-- 고정 예시 화면이다. 소셜 로그인 제공자가 연결되지 않아 아래 '연동됨'은 실제 상태가 아니다(PR-32 15단계에서 시연 표시를 붙임) -->
      <p class="sample-label">{{ tr('이 화면은 시연용 예시예요. 소셜 로그인 제공자가 아직 연결되지 않아 실제로 연동하거나 해제할 수 없어요.') }}</p>
      <section class="card" style="margin-top: 16px">
        <div class="trow">
          <span style="display: flex; align-items: center; gap: 10px"><i style="width: 32px; height: 32px; border-radius: 9px; background: var(--color-surface); color: var(--color-foreground); font-weight: 600; display: flex; align-items: center; justify-content: center; font-style: normal">G</i><b>Google<br /><small>{{ tr('jisu@gmail.com · 연동됨') }}</small></b></span>
          <span style="color: var(--color-status-danger); font-weight: 600; font-size: 0.8125rem">{{ tr('연동 해제') }}</span>
        </div>
        <div class="trow">
          <span style="display: flex; align-items: center; gap: 10px"><i style="width: 32px; height: 32px; border-radius: 9px; background: var(--color-surface); color: var(--color-foreground); font-weight: 600; display: flex; align-items: center; justify-content: center; font-style: normal">K</i><b>Kakao<br /><small>{{ tr('연동되지 않음') }}</small></b></span>
          <span style="color: var(--color-accent); font-weight: 600; font-size: 0.8125rem">{{ tr('연동하기') }}</span>
        </div>
        <div class="trow">
          <span style="display: flex; align-items: center; gap: 10px"><i style="width: 32px; height: 32px; border-radius: 9px; background: var(--color-surface); color: var(--color-foreground); font-weight: 600; display: flex; align-items: center; justify-content: center; font-style: normal">A</i><b>Apple<br /><small>{{ tr('연동되지 않음') }}</small></b></span>
          <span style="color: var(--color-accent); font-weight: 600; font-size: 0.8125rem">{{ tr('연동하기') }}</span>
        </div>
      </section>
      <p style="background: var(--color-surface); border-radius: 12px; padding: 14px 16px; margin-top: 16px">{{ tr('이메일 로그인 계정을 최소 1개는 유지해야 모든 연동을 해제할 수 있어요.') }}</p>
    </div>
  </div>
</template>
