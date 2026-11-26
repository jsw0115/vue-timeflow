<script setup>
import { tr } from '../../store/locale'
import { useRouter } from 'vue-router'

const router = useRouter()</script>

<template>
  <div class="interstitial">
    <div class="interstitial-card">
      <div class="badge-icon" style="background: var(--color-surface); color: var(--color-foreground)">⚒</div>
      <h2>{{ tr('서비스 점검 중이에요') }}</h2>
      <p>{{ tr('더 안정적인 서비스를 위해 시스템을 점검하고 있어요.') }}<br />{{ tr('잠시 후 다시 만나요!') }}</p>
      <section class="card" style="margin: 20px 0">
        <small style="color: var(--color-muted)">{{ tr('예상 종료 시각') }}</small>
        <b style="display: block; font-size: 1.25rem; letter-spacing: -0.6px; margin-top: 4px">{{ tr('오늘 04:00') }}</b>
      </section>
      <button style="background: var(--color-surface); border-radius: 10px; padding: 11px 20px; font-size: 0.875rem; font-weight: 700" @click="router.push('/legal')">{{ tr('공지 자세히 보기') }}</button>
    </div>
  </div>
</template>
