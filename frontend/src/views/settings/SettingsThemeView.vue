<script setup>
import { computed } from 'vue'
import { THEMES, ACCENTS, themeState } from '../../store/theme'
import { appearance, DENSITIES, FONT_SIZES } from '../../store/appearance'

const activeTheme = computed(() => THEMES[themeState.theme])
const stickerPacks = [
  { id: 'basic', label: '기본', items: ['🙂', '✅', '⭐'] },
  { id: 'animal', label: '동물', items: ['🐻', '🐰', '🐤'] },
  { id: 'plant', label: '식물', items: ['🌱', '🌿', '🍀'] },
]
</script>

<template>
  <section class="card setting-content">
    <div class="setting-head">
      <div>
        <h2>테마 · 디자인</h2>
        <p>표면 톤과 포인트 컬러를 고르면 앱 전체에 바로 적용돼요</p>
      </div>
      <span class="badge ok">{{ themeState.followSystem ? '시스템 설정 따름' : activeTheme.label }}</span>
    </div>

    <div class="section-label">표면 테마</div>
    <div class="theme-grid">
      <button
        v-for="(t, key) in THEMES"
        :key="key"
        class="theme-card"
        :class="{ selected: themeState.theme === key && !themeState.followSystem }"
        :disabled="themeState.followSystem"
        @click="themeState.theme = key"
      >
        <span class="theme-preview" :style="{ background: t.tokens['--color-canvas'], borderColor: t.tokens['--color-hairline'] }">
          <i :style="{ background: t.tokens['--color-foreground'] }"></i>
          <i :style="{ background: t.tokens['--color-surface'] }"></i>
          <i :style="{ background: t.tokens['--color-muted'] }"></i>
        </span>
        <b>{{ t.label }}</b>
        <small>{{ t.desc }}</small>
      </button>
    </div>

    <label class="task" style="border: 0; margin-top: 12px">
      <input type="checkbox" v-model="themeState.followSystem" />
      <span style="flex: 1"><b>시스템 설정 따르기</b><small>OS가 다크 모드면 자동으로 다크 테마를 써요</small></span>
    </label>

    <div class="section-label" style="margin-top: 22px">포인트 컬러</div>
    <p class="form-note" style="margin-top: 0">화면당 강조 요소 하나에만 쓰이는 색이에요. 대비 기준을 만족하는 톤만 제공합니다.</p>
    <div class="accent-row">
      <button
        v-for="(a, key) in ACCENTS"
        :key="key"
        class="accent-chip"
        :class="{ selected: themeState.accent === key }"
        @click="themeState.accent = key"
      >
        <i :style="{ background: a.value }"></i>{{ a.label }}
      </button>
    </div>

    <div class="section-label" style="margin-top: 22px">미리보기 <small style="font-weight: 400; color: var(--color-muted)">· 실제로 눌리지 않아요</small></div>
    <div class="theme-demo" aria-hidden="true">
      <div class="theme-demo-head"><b>오늘의 흐름</b><span class="badge ok">진행중</span></div>
      <p>계획한 일정과 실제 기록을 함께 확인해요.</p>
      <div class="progress"><em style="width: 62%"></em></div>
      <div class="form-row" style="margin-top: 12px">
        <button class="primary">기본 액션</button>
        <button class="review" style="margin: 0">보조 액션</button>
      </div>
    </div>

    <div class="section-label" style="margin-top: 22px">화면 밀도 · 글자 크기</div>
    <p class="form-note" style="margin-top: 0">
      지금 <b>{{ DENSITIES[appearance.density].label }}</b> · <b>{{ FONT_SIZES[appearance.fontSize].label }}</b> 로 설정돼 있어요.
      자세한 조절은 환경 설정에서 할 수 있어요.
    </p>

    <div class="section-label" style="margin-top: 22px">다이어리 스티커 팩</div>
    <div class="sticker-packs">
      <div v-for="p in stickerPacks" :key="p.id" class="sticker-pack">
        <b>{{ p.label }}</b>
        <span>{{ p.items.join(' ') }}</span>
      </div>
    </div>
  </section>
</template>
