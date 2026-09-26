<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'

/**
 * SNS 공유 이미지 — canvas에 실제로 그려서 PNG로 내려받는다.
 * 비율을 바꾸면 미리보기와 저장 결과가 함께 바뀐다.
 */
const SHAPES = [
  { id: 'square', label: '정사각형', w: 1080, h: 1080 },
  { id: 'story', label: '스토리', w: 1080, h: 1920 },
  { id: 'card', label: '카드형', w: 1200, h: 630 },
]
const shape = ref('square')
const active = computed(() => SHAPES.find((s) => s.id === shape.value))

const title = ref('이번 주 갓생 점수')
const value = ref('87점')
const caption = ref('12일 연속 기록 중 · 오전 골든타임 최적화')
const canvasEl = ref(null)
const notice = ref('')

/** 실제 픽셀로 그린다 — 미리보기는 CSS로 축소만 한다 */
function draw() {
  const cv = canvasEl.value
  if (!cv) return
  const { w, h } = active.value
  cv.width = w
  cv.height = h
  const ctx = cv.getContext('2d')
  if (!ctx) return

  const styles = getComputedStyle(document.documentElement)
  const accent = styles.getPropertyValue('--color-accent').trim() || '#2f5d46'
  const onAccent = styles.getPropertyValue('--color-on-accent').trim() || '#ffffff'

  ctx.fillStyle = accent
  ctx.fillRect(0, 0, w, h)

  const pad = Math.round(w * 0.09)
  ctx.fillStyle = onAccent
  ctx.globalAlpha = 0.8
  ctx.font = '600 ' + Math.round(w * 0.026) + 'px sans-serif'
  ctx.fillText('TIMEBAR DIARY', pad, pad + w * 0.03)

  ctx.globalAlpha = 1
  ctx.font = '600 ' + Math.round(w * 0.05) + 'px sans-serif'
  ctx.fillText(title.value, pad, h / 2 - w * 0.04)

  ctx.font = '700 ' + Math.round(w * 0.13) + 'px sans-serif'
  ctx.fillText(value.value, pad, h / 2 + w * 0.08)

  ctx.globalAlpha = 0.85
  ctx.font = '400 ' + Math.round(w * 0.028) + 'px sans-serif'
  ctx.fillText(caption.value, pad, h - pad)
  ctx.globalAlpha = 1
}

onMounted(() => nextTick(draw))
watch([shape, title, value, caption], () => nextTick(draw))

function download() {
  const cv = canvasEl.value
  if (!cv) return
  try {
    const url = cv.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = 'timebar-' + shape.value + '.png'
    a.click()
    flash('이미지를 저장했어요.')
  } catch {
    flash('이미지를 만들지 못했어요. 잠시 후 다시 시도해주세요.')
  }
}
async function copyImage() {
  try {
    const blob = await new Promise((res) => canvasEl.value.toBlob(res, 'image/png'))
    await navigator.clipboard.write([new window.ClipboardItem({ 'image/png': blob })])
    flash('클립보드에 복사했어요.')
  } catch {
    flash('이 브라우저에서는 복사를 지원하지 않아요. 저장을 이용해주세요.')
  }
}
function flash(t) {
  notice.value = t
  setTimeout(() => (notice.value = ''), 3000)
}
</script>

<template>
  <div class="modal-stage">
    <section class="card modal-preview">
      <h3>SNS 공유 이미지 만들기</h3>

      <div class="share-canvas-wrap" :class="shape">
        <canvas ref="canvasEl" class="share-canvas"></canvas>
      </div>

      <div class="filter" style="margin: 14px 0">
        <button v-for="s in SHAPES" :key="s.id" :class="{ selected: shape === s.id }" @click="shape = s.id">{{ s.label }}</button>
      </div>
      <p class="form-note" style="margin-top: 0">{{ active.w }} × {{ active.h }} px</p>

      <label>제목<input v-model="title" /></label>
      <label>강조 숫자<input v-model="value" /></label>
      <label>설명<input v-model="caption" /></label>

      <p v-if="notice" class="badge ok" style="display: inline-block; margin-top: 8px">{{ notice }}</p>
      <div class="form-row">
        <button class="primary" style="flex: 1" @click="download">이미지 저장</button>
        <button class="review" style="margin: 0" @click="copyImage">복사</button>
      </div>
    </section>
  </div>
</template>
