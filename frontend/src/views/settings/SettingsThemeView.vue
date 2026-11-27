<!-- 환경설정 > 화면 테마. 표면 모드와 색상 분위기를 고르면 미리보기에만 먼저 반영하고, 적용하기에서 계정(로그인)·이 브라우저에 저장한다(DESIGN.md 4장 Settings: theme customization). -->
<script setup>
import { tr } from '../../store/locale'
import { computed, reactive, ref, watch } from 'vue'
import { THEMES, ACCENTS, CUSTOM_ACCENT, themeState, resolveTheme } from '../../store/theme'
import { appearance, DENSITIES, FONT_SIZES } from '../../store/appearance'
import { contrast, luminance } from '../../utils/colorTheme.mjs'
import { session } from '../../features/auth/session.js'
import { apiRequest } from '../../features/auth/apiRequest.js'
import { createThemeAccount, sameTheme, themeErrorText, THEME_DEFAULT } from '../../features/settings/themeAccount.mjs'

const keys = { surfaces: Object.keys(THEMES), accents: Object.keys(ACCENTS) }
const account = createThemeAccount({ request: apiRequest, keys })
const stickerPacks = [
  { id: 'basic', label: '기본', items: ['🙂', '✅', '⭐'] },
  { id: 'animal', label: '동물', items: ['🐻', '🐰', '🐤'] },
  { id: 'plant', label: '식물', items: ['🌱', '🌿', '🍀'] },
]
const snapshot = () => ({ theme: themeState.theme, accent: themeState.accent, customAccent: themeState.customAccent, followSystem: themeState.followSystem })

/** 적용 전 고른 값. 미리보기에만 쓰고 앱 전체(themeState)는 적용하기에서 바꾼다. */
const draft = reactive(snapshot())
const status = ref('idle') // idle · saving · saved · error
const message = ref('')
const dirty = computed(() => !sameTheme(draft, themeState))
// 다른 곳(로그인 직후 계정 테마 불러오기 등)에서 적용 테마가 바뀌면 고치지 않은 미리보기도 따라간다
watch(() => snapshot(), (now, before) => { if (sameTheme(draft, before)) Object.assign(draft, now) })

const previewSurface = computed(() => (draft.followSystem && typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ? 'dark' : draft.theme))
const preview = computed(() => resolveTheme(previewSurface.value, draft.accent, draft.customAccent))
/** 미리보기 영역에만 쓰는 CSS 변수. 선택 틴트는 :root 계산값을 물려받지 않도록 미리보기 accent로 다시 만든다. */
const previewStyle = computed(() => {
  const t = preview.value.tokens
  return { ...t, '--color-accent-soft': `color-mix(in srgb, ${t['--color-accent']} 10%, ${t['--color-card']})`, colorScheme: previewSurface.value === 'dark' ? 'dark' : 'light' }
})
const optionTokens = (surface, accent = draft.accent) => resolveTheme(surface, accent, draft.customAccent).tokens

const appliedLabel = computed(() => `${themeState.followSystem ? tr('시스템 설정 따름') : tr(THEMES[themeState.theme].label)} · ${themeState.accent === CUSTOM_ACCENT ? tr('사용자 지정') : tr(ACCENTS[themeState.accent].label)}`)

/** 미리보기 조합의 대비. DESIGN.md 2장 Theme contrast rules의 기준과 함께 보인다. */
const checks = computed(() => {
  const t = preview.value.tokens
  const row = (label, a, b, min) => { const value = contrast(a, b); return { label: tr(label), value: value.toFixed(2), pass: value >= min, min } }
  return [
    row('본문 글자 / 바탕', t['--color-foreground'], t['--color-canvas'], 4.5),
    row('보조 글자 / 구획', t['--color-muted'], t['--color-surface'], 4.5),
    row('포인트 색 / 바탕', t['--color-accent'], t['--color-canvas'], 4.5),
    row('주 버튼 글자 / 주 버튼', t['--color-on-accent'], t['--color-accent'], 4.5),
    row('입력 경계 / 카드', t['--color-control-border'], t['--color-card'], 3),
    row('데이터 색 / 트랙', t['--color-data'], t['--color-hairline'], 3),
  ]
})
const customNote = computed(() => {
  if (draft.accent !== CUSTOM_ACCENT || !preview.value.adjusted) return ''
  const used = preview.value.tokens['--color-accent']
  return luminance(used) < luminance(draft.customAccent) ? tr('고른 색 {picked}는 대비 기준에 못 미쳐 {used}로 어둡게 맞춰 써요.', { picked: draft.customAccent, used }) : tr('고른 색 {picked}는 대비 기준에 못 미쳐 {used}로 밝게 맞춰 써요.', { picked: draft.customAccent, used })
})

function pickCustom(value) {
  draft.customAccent = value.toLowerCase()
  draft.accent = CUSTOM_ACCENT
}
function cancel() {
  Object.assign(draft, snapshot())
  status.value = 'idle'; message.value = ''
}
function restoreDefault() {
  Object.assign(draft, THEME_DEFAULT)
  status.value = 'idle'; message.value = '기본 테마(라이트 · 포레스트)로 돌아갑니다. 적용하기를 눌러야 저장돼요.'
}
/** 로그인 상태면 계정 저장이 성공한 뒤에만 앱에 적용하고 완료를 알린다. 실패하면 기존 설정을 그대로 둔다. */
async function apply() {
  if (status.value === 'saving' || !dirty.value) return
  const next = { ...draft }
  status.value = 'saving'; message.value = '테마를 적용하는 중이에요.'
  try {
    if (session.userId) await account.save(next)
    Object.assign(themeState, next)
    status.value = 'saved'
    message.value = session.userId ? '화면 테마를 적용했어요. 계정에 저장돼 다른 기기에서도 같은 테마를 써요.' : '화면 테마를 이 브라우저에 적용했어요. 로그인하면 계정에 저장할 수 있어요.'
  } catch (error) {
    status.value = 'error'; message.value = themeErrorText(error)
  }
}
</script>

<template>
  <section class="card setting-content theme-settings">
    <div class="setting-head">
      <div>
        <h2>{{ tr('화면 테마') }}</h2>
        <p>{{ tr('배경과 포인트 색을 조합해 나에게 편한 화면을 만들어 보세요.') }}</p>
      </div>
      <span class="tag applied">{{ tr('지금 적용 중 · {name}', { name: appliedLabel }) }}</span>
    </div>

    <div class="theme-layout">
      <div class="theme-controls">
        <fieldset class="option-group">
          <legend>{{ tr('표면 모드') }}</legend>
          <div class="surface-options">
            <label v-for="(t, key) in THEMES" :key="key" class="option-card" :class="{ selected: draft.theme === key }">
              <input v-model="draft.theme" class="option-input" type="radio" name="surface" :value="key" :aria-describedby="`surface-desc-${key}`" />
              <span class="surface-swatch" aria-hidden="true" :style="{ background: optionTokens(key)['--color-canvas'], borderColor: optionTokens(key)['--color-hairline'] }">
                <i class="swatch-card" :style="{ background: optionTokens(key)['--color-card'], borderColor: optionTokens(key)['--color-hairline'] }"><em :style="{ background: optionTokens(key)['--color-foreground'] }"></em><em :style="{ background: optionTokens(key)['--color-muted'] }"></em></i>
                <i class="swatch-button" :style="{ background: optionTokens(key)['--color-accent'] }"></i>
              </span>
              <span class="option-text"><b>{{ tr(t.label) }}</b><small :id="`surface-desc-${key}`">{{ tr(t.desc) }}</small></span>
              <svg v-if="draft.theme === key" class="option-check" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>
            </label>
          </div>
          <label class="follow-system"><input v-model="draft.followSystem" type="checkbox" /> {{ tr('기기의 다크 모드 설정 따르기') }}<small>{{ tr('켜면 기기가 다크 모드일 때 다크 표면을 써요.') }}</small></label>
        </fieldset>

        <fieldset class="option-group">
          <legend>{{ tr('색상 분위기') }}</legend>
          <div class="accent-options">
            <label v-for="(a, key) in ACCENTS" :key="key" class="option-card accent-card" :class="{ selected: draft.accent === key }">
              <input v-model="draft.accent" class="option-input" type="radio" name="accent" :value="key" :aria-describedby="`accent-desc-${key}`" />
              <span class="accent-chips" aria-hidden="true"><i :style="{ background: optionTokens(previewSurface, key)['--color-accent'] }"></i><i :style="{ background: optionTokens(previewSurface, key)['--color-data'] }"></i></span>
              <span class="option-text"><b>{{ tr(a.label) }}</b><small :id="`accent-desc-${key}`">{{ tr(a.desc) }}</small></span>
              <svg v-if="draft.accent === key" class="option-check" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>
            </label>
          </div>
          <details class="custom-accent" :open="draft.accent === CUSTOM_ACCENT">
            <summary>{{ tr('고급 설정 · 직접 고른 색') }}</summary>
            <label class="custom-row" :class="{ selected: draft.accent === CUSTOM_ACCENT }">
              <input type="color" :value="draft.customAccent" aria-describedby="custom-accent-help" @input="pickCustom($event.target.value)" />
              <span>{{ tr('직접 고른 색 쓰기') }} <span class="figure">{{ draft.customAccent }}</span></span>
            </label>
            <p id="custom-accent-help" class="input-field-help">{{ customNote || tr('고른 색이 대비 기준에 못 미치면 밝기만 맞춰 쓰고 여기서 알려 드려요.') }}</p>
          </details>
        </fieldset>
      </div>

      <div class="live-col">
        <p class="preview-state" role="status">{{ dirty ? tr('아직 저장되지 않은 테마를 미리 보고 있어요.') : tr('지금 적용 중인 테마예요.') }}</p>
        <!-- 실제 앱 요소로 만든 미리보기. 눌리지 않도록 inert로 둔다. -->
        <div class="live-preview" :style="previewStyle" inert>
          <div class="pv-shell">
            <div class="pv-side">
              <span class="pv-brand"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4.5v15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" /><path d="M9 8h10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-dasharray="2.2 2.2" /><path d="M9 16h6.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" /><circle cx="18" cy="16" r="2" fill="currentColor" /></svg>Timebar</span>
              <span class="pv-nav active">{{ tr('오늘') }}</span><span class="pv-nav">{{ tr('일간 플래너') }}</span><span class="pv-nav">{{ tr('할 일') }}</span>
            </div>
            <div class="pv-main">
              <div class="pv-head"><div><small>{{ tr('메인') }}</small><b>{{ tr('오늘') }}</b></div><span class="pv-primary">{{ tr('새 글 작성') }}</span></div>
              <div class="pv-card">
                <div class="pv-card-head"><b>{{ tr('오늘의 흐름') }}</b><span class="pv-tag">{{ tr('진행 중') }}</span></div>
                <p>{{ tr('계획과 실제 기록을 같은 시간축에서 비교해요.') }}</p>
                <div class="pv-block pv-plan">{{ tr('계획 · 디자인 리뷰') }} <span class="figure">10:00</span></div>
                <div class="pv-block pv-actual">{{ tr('실제 기록 · 디자인 리뷰') }} <span class="figure">{{ tr('48분') }}</span></div>
                <div class="pv-progress"><em></em></div>
                <div class="pv-row"><span class="pv-input">{{ tr('메모를 적어 주세요') }}</span><span class="pv-secondary">{{ tr('취소') }}</span></div>
                <div class="pv-row"><span class="pv-seg"><i class="on">{{ tr('오늘') }}</i><i>{{ tr('이번 주') }}</i></span><span class="pv-link">{{ tr('자세히 보기') }}</span><span class="pv-status">{{ tr('저장 실패 · 다시 시도') }}</span></div>
              </div>
            </div>
          </div>
        </div>
        <ul class="contrast-list" :aria-label="tr('미리보기 테마의 대비')">
          <li v-for="item in checks" :key="item.label"><span>{{ item.label }}</span><b class="figure">{{ item.value }}:1</b><em :class="{ fail: !item.pass }">{{ item.pass ? tr('통과 (기준 {min}:1)', { min: item.min }) : tr('기준 {min}:1 미달', { min: item.min }) }}</em></li>
        </ul>
      </div>
    </div>

    <div class="theme-actions">
      <button type="button" class="button-text" :disabled="status === 'saving'" @click="restoreDefault">{{ tr('기본값으로 복원') }}</button>
      <p v-if="message" class="theme-message" :class="status" :role="status === 'error' ? 'alert' : 'status'">{{ tr(message) }}</p>
      <span class="theme-action-buttons">
        <button type="button" class="button-secondary" :disabled="!dirty || status === 'saving'" @click="cancel">{{ tr('취소') }}</button>
        <button type="button" class="primary" :disabled="!dirty" :aria-busy="status === 'saving' ? 'true' : undefined" @click="apply">{{ status === 'saving' ? tr('적용하는 중') : tr('적용하기') }}</button>
      </span>
    </div>
    <p class="storage-note">{{ session.userId ? tr('적용하면 계정 환경설정에 저장돼요. 이 브라우저에도 함께 저장해 다음 실행 때 바로 보여요.') : tr('로그아웃 상태라 이 브라우저에만 저장돼요. 로그인하면 계정에 저장할 수 있어요.') }}</p>

    <div class="section-label theme-extra">{{ tr('화면 밀도 · 글자 크기') }}</div>
    <p class="form-note">
      <!-- 영어 어순이 달라 한 문장으로 옮긴다(PR-32 12단계) -->
      {{ tr('지금 {density} · {size}로 설정돼 있어요. 자세한 조절은 환경 설정에서 할 수 있어요.', { density: tr(DENSITIES[appearance.density].label), size: tr(FONT_SIZES[appearance.fontSize].label) }) }}
    </p>

    <div class="section-label theme-extra">{{ tr('다이어리 스티커 팩') }}</div>
    <div class="sticker-packs">
      <div v-for="p in stickerPacks" :key="p.id" class="sticker-pack">
        <b>{{ tr(p.label) }}</b>
        <span>{{ p.items.join(' ') }}</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.theme-settings .setting-head { align-items: flex-start; }
.applied { white-space: normal; text-align: right; }
.theme-layout { display: grid; grid-template-columns: minmax(0, 360px) minmax(0, 1fr); gap: var(--space-block); margin-top: var(--space-xxl); align-items: start; }
.option-group { margin: 0 0 var(--space-xxl); padding: 0; border: 0; min-width: 0; }
.option-group legend { padding: 0; margin-bottom: var(--space-lg); font-size: var(--type-body-sm-size); font-weight: 600; color: var(--color-foreground); }
.surface-options { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-md); }
.accent-options { display: grid; gap: var(--space-md); }
.option-card {
  position: relative; display: flex; flex-direction: column; gap: var(--space-md); min-width: 0; padding: var(--space-lg);
  border: 1px solid var(--color-hairline); border-radius: var(--radius-lg); background: var(--color-card); cursor: pointer;
  transition: border-color var(--motion-fast), background-color var(--motion-fast);
}
.option-card:hover { border-color: var(--color-control-border); }
/* 선택: accent 경계 + 옅은 accent 바탕 + 체크(DESIGN.md 2장 Color roles). 포커스는 전역 링과 다르게 보인다 */
.option-card.selected { border-color: var(--color-accent); background: var(--color-accent-soft); box-shadow: inset 0 0 0 1px var(--color-accent); }
.option-card:has(.option-input:focus-visible) { outline: var(--focus-ring-width) solid var(--color-accent); outline-offset: var(--focus-ring-offset); }
.option-input { position: absolute; opacity: 0; width: 1px; height: 1px; margin: 0; pointer-events: none; }
.option-text { display: grid; gap: 2px; min-width: 0; }
.option-text b { font-size: var(--type-body-sm-size); font-weight: 600; }
.option-text small { color: var(--color-muted); font-size: var(--type-caption-size); }
.option-check { position: absolute; top: var(--space-md); right: var(--space-md); width: 18px; height: 18px; color: var(--color-accent); }
.surface-swatch { position: relative; display: block; height: 56px; border: 1px solid; border-radius: var(--radius-sm); overflow: hidden; }
.swatch-card { position: absolute; left: var(--space-md); top: var(--space-md); right: 36%; bottom: var(--space-md); display: grid; align-content: center; gap: var(--space-xs); padding: 0 var(--space-sm); border: 1px solid; border-radius: var(--radius-xs); }
.swatch-card em { display: block; height: 4px; border-radius: var(--radius-xs); }
.swatch-card em + em { width: 60%; }
.swatch-button { position: absolute; right: var(--space-md); bottom: var(--space-md); width: 22%; height: 12px; border-radius: var(--radius-xs); }
.accent-card { flex-direction: row; align-items: center; padding-right: var(--space-block); }
.accent-chips { display: flex; flex: none; }
.accent-chips i { width: 22px; height: 22px; border-radius: var(--radius-full); box-shadow: 0 0 0 2px var(--color-card); }
.accent-chips i + i { margin-left: calc(var(--space-sm) * -1); }
.follow-system { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-sm); margin-top: var(--space-lg); font-size: var(--type-body-sm-size); cursor: pointer; }
.follow-system small { flex-basis: 100%; padding-left: 26px; color: var(--color-muted); }
.custom-accent { margin-top: var(--space-lg); }
.custom-accent summary { cursor: pointer; font-size: var(--type-body-sm-size); font-weight: 600; color: var(--color-foreground); min-height: 32px; }
.custom-row > span { min-width: 0; overflow-wrap: anywhere; }
.custom-row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-md); margin-top: var(--space-md); padding: var(--space-md) var(--space-lg); border: 1px solid var(--color-hairline); border-radius: var(--radius-md); font-size: var(--type-body-sm-size); cursor: pointer; }
.custom-row.selected { border-color: var(--color-accent); background: var(--color-accent-soft); }
.custom-row input[type='color'] { width: 28px; height: 28px; padding: 0; border: 1px solid var(--color-control-border); border-radius: var(--radius-full); background: none; cursor: pointer; flex: none; }
.custom-row input[type='color']::-webkit-color-swatch-wrapper { padding: 0; }
.custom-row input[type='color']::-webkit-color-swatch { border: 0; border-radius: var(--radius-full); }
.custom-accent .input-field-help { margin: var(--space-sm) 0 0; }

.live-col { position: sticky; top: 0; display: grid; gap: var(--space-lg); min-width: 0; }
.preview-state { margin: 0; font-size: var(--type-body-sm-size); font-weight: 600; color: var(--color-foreground); }
.live-preview { border: 1px solid var(--color-hairline); border-radius: var(--radius-xl); overflow: hidden; background: var(--color-canvas); color: var(--color-foreground); font-size: var(--type-body-sm-size); }
.pv-shell { display: grid; grid-template-columns: 112px minmax(0, 1fr); min-height: 300px; }
.pv-side { display: grid; align-content: start; gap: var(--space-xs); padding: var(--space-lg) var(--space-sm); background: var(--color-surface); border-right: 1px solid var(--color-hairline); }
.pv-brand { display: flex; align-items: center; gap: var(--space-xs); margin-bottom: var(--space-md); font-weight: 600; font-size: var(--type-caption-size); }
.pv-brand svg { width: 18px; height: 18px; color: var(--color-accent); }
.pv-nav { padding: var(--space-sm) var(--space-md); border-radius: var(--radius-sm); color: var(--color-body); font-size: var(--type-caption-size); }
.pv-nav.active { background: var(--color-accent-soft); color: var(--color-foreground); font-weight: 600; box-shadow: inset 2px 0 0 var(--color-accent); }
.pv-main { display: grid; align-content: start; gap: var(--space-lg); padding: var(--space-lg); min-width: 0; }
.pv-head { display: flex; justify-content: space-between; align-items: flex-end; gap: var(--space-md); }
.pv-head small { display: block; color: var(--color-muted); font-size: var(--type-caption-size); }
.pv-head b { font-size: var(--type-title-md-size); }
.pv-primary { padding: var(--space-sm) var(--space-lg); border-radius: var(--radius-md); background: var(--color-accent); color: var(--color-on-accent); font-weight: 600; font-size: var(--type-caption-size); white-space: nowrap; }
.pv-card { display: grid; gap: var(--space-md); padding: var(--space-lg); border: 1px solid var(--color-hairline); border-radius: var(--radius-lg); background: var(--color-card); }
.pv-card p { margin: 0; color: var(--color-body); font-size: var(--type-caption-size); }
.pv-card-head { display: flex; justify-content: space-between; align-items: center; gap: var(--space-sm); }
.pv-tag { padding: 2px var(--space-sm); border-radius: var(--radius-xs); background: var(--color-surface); font-size: var(--type-caption-size); }
.pv-block { padding: var(--space-xs) var(--space-md); border-radius: var(--radius-sm); background: var(--color-card); font-size: var(--type-caption-size); }
.pv-block.pv-plan { border: 1px dashed var(--color-control-border); color: var(--color-body); }
.pv-block.pv-actual { border: 1px solid var(--color-hairline); border-left: 3px solid var(--color-data); }
.pv-progress { height: 6px; border-radius: var(--radius-full); background: var(--color-hairline); overflow: hidden; }
.pv-progress em { display: block; width: 62%; height: 100%; background: var(--color-data); }
.pv-row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-sm); }
.pv-input { flex: 1; min-width: 120px; padding: var(--space-sm) var(--space-md); border: 1px solid var(--color-control-border); border-radius: var(--radius-md); background: var(--color-card); color: var(--color-muted); font-size: var(--type-caption-size); }
.pv-secondary { padding: var(--space-sm) var(--space-lg); border: 1px solid var(--color-control-border); border-radius: var(--radius-md); background: var(--color-card); font-size: var(--type-caption-size); font-weight: 600; }
.pv-seg { display: inline-flex; gap: 2px; padding: 2px; border-radius: var(--radius-md); background: var(--color-surface); }
.pv-seg i { padding: 2px var(--space-md); border: 1px solid transparent; border-radius: var(--radius-sm); font-style: normal; font-size: var(--type-caption-size); color: var(--color-body); }
.pv-seg i.on { background: var(--color-card); border-color: var(--color-control-border); color: var(--color-foreground); font-weight: 600; }
.pv-link { color: var(--color-accent); font-weight: 600; text-decoration: underline; font-size: var(--type-caption-size); }
.pv-status { color: var(--color-status-danger); font-weight: 600; font-size: var(--type-caption-size); }

.contrast-list { display: grid; gap: var(--space-xs); margin: 0; padding: 0; list-style: none; font-size: var(--type-caption-size); }
.contrast-list li { display: grid; grid-template-columns: minmax(0, 1fr) auto auto; gap: var(--space-md); align-items: baseline; padding: var(--space-xs) 0; border-bottom: 1px solid var(--color-hairline); }
.contrast-list span { color: var(--color-body); }
.contrast-list em { font-style: normal; color: var(--color-status-success); font-weight: 600; }
.contrast-list em.fail { color: var(--color-status-danger); }

.theme-actions { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-lg); margin-top: var(--space-xxl); padding-top: var(--space-xxl); border-top: 1px solid var(--color-hairline); }
.theme-action-buttons { display: flex; gap: var(--space-md); margin-left: auto; }
.theme-message { margin: 0; font-size: var(--type-body-sm-size); font-weight: 600; color: var(--color-body); }
.theme-message.saved { color: var(--color-status-success); }
.theme-message.error { color: var(--color-status-danger); }
.storage-note { margin: var(--space-sm) 0 0; font-size: var(--type-caption-size); color: var(--color-muted); text-align: right; }
.theme-extra { margin-top: var(--space-block); }

@media (max-width: 1000px) {
  .theme-layout { grid-template-columns: minmax(0, 1fr); }
  .live-col { position: static; }
}
@media (max-width: 600px) {
  .surface-options { grid-template-columns: minmax(0, 1fr); }
  .pv-shell { grid-template-columns: minmax(0, 1fr); }
  .pv-side { display: none; }
  .theme-action-buttons { width: 100%; margin-left: 0; }
  .theme-action-buttons button { flex: 1; }
  .storage-note { text-align: left; }
}
</style>
