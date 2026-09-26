<script setup></script>

<template>
  <div class="auth-page">
    <div class="auth-form-inner">
      <h1 style="font-size: 24px; color: var(--color-foreground); letter-spacing: -1px">계정 연동 관리</h1>
      <p>소셜 계정을 연동하면 다음부터 한 번의 클릭으로 로그인할 수 있어요.</p>
      <section class="card" style="margin-top: 16px">
        <div class="trow">
          <span style="display: flex; align-items: center; gap: 10px"><i style="width: 32px; height: 32px; border-radius: 9px; background: var(--color-surface); color: #8a6a3c; font-weight: 700; display: flex; align-items: center; justify-content: center; font-style: normal">G</i><b>Google<br /><small>jisu@gmail.com · 연동됨</small></b></span>
          <span style="color: #b23b3b; font-weight: 700; font-size: 11px">연동 해제</span>
        </div>
        <div class="trow">
          <span style="display: flex; align-items: center; gap: 10px"><i style="width: 32px; height: 32px; border-radius: 9px; background: var(--color-surface); color: var(--color-foreground); font-weight: 700; display: flex; align-items: center; justify-content: center; font-style: normal">K</i><b>Kakao<br /><small>연동되지 않음</small></b></span>
          <span style="color: var(--color-accent); font-weight: 700; font-size: 11px">연동하기</span>
        </div>
        <div class="trow">
          <span style="display: flex; align-items: center; gap: 10px"><i style="width: 32px; height: 32px; border-radius: 9px; background: var(--color-surface); color: var(--color-foreground); font-weight: 700; display: flex; align-items: center; justify-content: center; font-style: normal">A</i><b>Apple<br /><small>연동되지 않음</small></b></span>
          <span style="color: var(--color-accent); font-weight: 700; font-size: 11px">연동하기</span>
        </div>
      </section>
      <p style="background: var(--color-surface); border-radius: 12px; padding: 14px 16px; margin-top: 16px">이메일 로그인 계정을 최소 1개는 유지해야 모든 연동을 해제할 수 있어요.</p>
    </div>
  </div>
</template>
