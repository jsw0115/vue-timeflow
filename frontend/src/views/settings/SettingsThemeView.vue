<script setup>
import { computed, useId } from 'vue'
import { THEMES, ACCENTS, CUSTOM_ACCENT, themeState, resolveTheme, effectiveTheme } from '../../store/theme'
import { appearance, DENSITIES, FONT_SIZES } from '../../store/appearance'
import { contrast, luminance } from '../../utils/colorTheme.mjs'

const activeTheme = computed(() => THEMES[themeState.theme])
const customId = useId()
const surfaceKey = computed(() => effectiveTheme())
/** 지금 표면에서 각 색상 테마가 실제로 쓰일 포인트·데이터 색 */
const swatches = computed(() => Object.fromEntries(
  [...Object.keys(ACCENTS), CUSTOM_ACCENT].map((key) => [key, resolveTheme(surfaceKey.value, key, themeState.customAccent).tokens]),
))
const current = computed(() => resolveTheme(surfaceKey.value, themeState.accent, themeState.customAccent))
const ratio = (a, b) => contrast(a, b).toFixed(1)
const summary = computed(() => {
  const t = current.value.tokens
  return {
    accent: ratio(t['--color-accent'], t['--color-canvas']),
    data: ratio(t['--color-on-data'], t['--color-data']),
    track: ratio(t['--color-data'], t['--color-hairline']),
  }
})
/** 사용자 지정 색을 대비 기준 때문에 바꿨으면 어느 쪽으로 바꿨는지 알려 준다 */
const customNote = computed(() => {
  if (themeState.accent !== CUSTOM_ACCENT || !current.value.adjusted) return ''
  const used = current.value.tokens['--color-accent']
  const way = luminance(used) < luminance(themeState.customAccent) ? '어둡게' : '밝게'
  return `고른 색 ${themeState.customAccent}는 글자 대비 기준에 못 미쳐 ${used}로 조금 ${way} 맞춰 쓰고 있어요.`
})
function pickCustom(value) {
  themeState.customAccent = value.toLowerCase()
  themeState.accent = CUSTOM_ACCENT
}
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
        :aria-pressed="themeState.theme === key && !themeState.followSystem"
        :disabled="themeState.followSystem"
        @click="themeState.theme = key"
      >
        <span class="theme-preview" :style="{ background: t.tokens['--color-canvas'], borderColor: t.tokens['--color-hairline'] }">
          <i :style="{ background: t.tokens['--color-foreground'] }"></i>
          <i :style="{ background: t.tokens['--color-surface'] }"></i>
          <i :style="{ background: resolveTheme(key).tokens['--color-data'] }"></i>
          <i :style="{ background: resolveTheme(key).tokens['--color-accent'] }"></i>
        </span>
        <b>{{ t.label }}</b>
        <small>{{ t.desc }}</small>
      </button>
    </div>

    <label class="task" style="border: 0; margin-top: 12px; display: inline-flex;">
      <input type="checkbox" v-model="themeState.followSystem" />
      <span style="flex: 1"><b>시스템 설정 따르기</b><small>OS가 다크 모드면 자동으로 다크 테마를 써요</small></span>
    </label>

    <div class="section-label" style="margin-top: 22px">색상 테마</div>
    <p class="form-note" style="margin-top: 0">고른 색은 화면당 강조 하나와 포커스 표시에 쓰이고, 같은 계열의 밝은 색이 진행 막대·차트 같은 기록 데이터에 쓰여요. 표면 테마에 맞춰 대비 기준을 넘도록 밝기를 자동으로 맞춰요.</p>
    <div class="accent-row" role="group" aria-label="색상 테마">
      <button
        v-for="(a, key) in ACCENTS"
        :key="key"
        type="button"
        class="accent-chip"
        :class="{ selected: themeState.accent === key }"
        :aria-pressed="themeState.accent === key"
        @click="themeState.accent = key"
      >
        <i :style="{ background: swatches[key]['--color-accent'] }"></i><i :style="{ background: swatches[key]['--color-data'] }"></i>{{ a.label }}
      </button>
      <label class="accent-chip accent-custom" :class="{ selected: themeState.accent === CUSTOM_ACCENT }" :for="customId">
        <input :id="customId" type="color" :value="themeState.customAccent" @input="pickCustom($event.target.value)" />
        <span>직접 고르기</span>
        <small v-if="themeState.accent === CUSTOM_ACCENT" class="figure">{{ themeState.customAccent }}</small>
      </label>
    </div>
    <p class="theme-contrast" role="status">
      지금 대비 · 포인트 색 <b class="figure">{{ summary.accent }}:1</b>, 데이터 색 위 글자 <b class="figure">{{ summary.data }}:1</b>, 막대와 트랙 <b class="figure">{{ summary.track }}:1</b>.
      <template v-if="customNote"> {{ customNote }}</template>
    </p>

    <div class="section-label" style="margin-top: 22px">미리보기 <small style="font-weight: 400; color: var(--color-muted)">· 실제로 눌리지 않아요</small></div>
    <div class="theme-demo" aria-hidden="true">
      <div class="theme-demo-head"><b>오늘의 흐름</b><span class="badge ok">진행중</span></div>
      <p>계획한 일정과 실제 기록을 함께 확인해요.</p>
      <div class="progress"><em style="width: 62%"></em></div>
      <div class="theme-demo-row">
        <span class="filter"><button class="selected" tabindex="-1">오늘</button><button tabindex="-1">이번 주</button></span>
        <label class="task" style="border: 0; padding: 0"><input type="checkbox" checked tabindex="-1" />완료한 항목</label>
        <a class="theme-demo-link">강조 글자</a>
        <span class="badge danger">기한 초과</span>
      </div>
      <div class="form-row" style="margin-top: 12px">
        <button class="primary" tabindex="-1">기본 액션</button>
        <button class="button-secondary" tabindex="-1">보조 액션</button>
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

<style scoped>
.theme-preview i:nth-child(4) { height: 24%; }
.accent-chip i + i { margin-left: calc(-1 * var(--space-sm)); box-shadow: 0 0 0 2px var(--color-canvas); }
.accent-row { align-items: center; }
.accent-row .accent-custom { display: inline-flex; align-items: center; gap: var(--space-sm); margin: 0; cursor: pointer; }
/* .setting-content input 공통 규칙(블록·폭 100%)보다 우선하도록 상위 클래스를 붙인다 */
.accent-row .accent-custom input[type='color'] { display: inline-block; width: 22px; height: 22px; margin: 0; padding: 0; border: 1px solid var(--color-hairline); border-radius: var(--radius-full); background: none; cursor: pointer; }
.theme-contrast { margin: var(--space-md) 0 0; font-size: 0.8125rem; line-height: 1.6; color: var(--color-muted); }
.accent-custom input[type='color']::-webkit-color-swatch-wrapper { padding: 0; }
.accent-custom input[type='color']::-webkit-color-swatch { border: 0; border-radius: var(--radius-full); }
.accent-custom input[type='color']::-moz-color-swatch { border: 0; border-radius: var(--radius-full); }
.theme-demo-row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-lg); margin-top: var(--space-lg); }
.theme-demo-link { color: var(--color-accent); font-weight: 600; text-decoration: underline; }
@media (max-width: 600px) { .theme-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
</style>
