// 표면 테마 × 색상 테마 × 사용자 지정 색이 모두 DESIGN.md 대비 기준을 지키는지 검사한다(PR-11 색 테마).
import test from 'node:test'
import assert from 'node:assert/strict'
import { contrast, fitContrast, isHex, themeTokens, MIN } from '../src/utils/colorTheme.mjs'
import { THEMES, ACCENTS } from '../src/store/theme.js'

const near = (value, expected) => Math.abs(value - expected) < 0.01

test('대비 계산은 DESIGN.md 실측값과 같다', () => {
  assert.ok(near(contrast('#2f5d46', '#ffffff'), 7.57))
  assert.ok(near(contrast('#4e7963', '#ffffff'), 4.95))
  assert.ok(near(contrast('#000000', '#ffffff'), 21))
  assert.equal(isHex('#2F5D46'), true)
  assert.equal(isHex('2f5d46'), false)
  assert.equal(isHex('#2f5d4'), false)
})

test('기본(라이트·포레스트)은 DESIGN.md 토큰 값을 그대로 낸다', () => {
  const { tokens, adjusted } = themeTokens(THEMES.light.tokens, { accent: ACCENTS.forest.value, data: ACCENTS.forest.data })
  assert.equal(adjusted, false)
  assert.equal(tokens['--color-accent'], '#2f5d46')
  assert.equal(tokens['--color-data'], '#4e7963')
  assert.equal(tokens['--color-on-accent'], '#ffffff')
  assert.equal(tokens['--color-status-danger'], '#b23b3b')
  assert.equal(tokens['--color-status-warning'], '#8a6a3c')
  assert.equal(tokens['--color-status-info'], '#43596b')
})

const cases = [
  ...Object.keys(THEMES).flatMap(surface => Object.entries(ACCENTS).map(([name, a]) => [surface, name, { accent: a.value, data: a.data }])),
  ...Object.keys(THEMES).flatMap(surface => ['#ffcc00', '#ff69b4', '#00bfff', '#ffffff', '#000000', '#123456', '#7fffd4'].map(hex => [surface, 'custom ' + hex, { accent: hex }])),
]
test('모든 표면 × 색상 조합이 포인트·데이터·상태 색 대비 기준을 지킨다', () => {
  for (const [surface, name, choice] of cases) {
    const t = themeTokens(THEMES[surface].tokens, choice).tokens
    const label = `${surface}/${name}`
    const canvas = t['--color-canvas'], surf = t['--color-surface'], hair = t['--color-hairline']
    assert.ok(contrast(t['--color-accent'], canvas) >= MIN.accentCanvas, `${label} accent/canvas`)
    assert.ok(contrast(t['--color-accent'], surf) >= MIN.accentSurface, `${label} accent/surface`)
    assert.ok(contrast(t['--color-on-accent'], t['--color-accent']) >= MIN.text, `${label} on-accent`)
    assert.ok(contrast(t['--color-on-data'], t['--color-data']) >= MIN.text, `${label} on-data`)
    for (const bg of [canvas, surf, hair]) assert.ok(contrast(t['--color-data'], bg) >= MIN.graphic, `${label} data/${bg}`)
    for (const s of ['danger', 'warning', 'info']) for (const bg of [canvas, surf]) assert.ok(contrast(t['--color-status-' + s], bg) >= MIN.status, `${label} ${s}/${bg}`)
    // 고대비 표면은 트랙이 진해 데이터 색이 포인트 컬러만큼 어두워질 수 있어 구분 검사에서 뺀다.
    if (surface !== 'contrast') assert.ok(contrast(t['--color-accent'], t['--color-data']) >= 1.2, `${label} accent≠data ${t['--color-accent']} ${t['--color-data']}`)
  }
})

test('사용자 지정 색: 기준을 넘는 색은 그대로, 못 미치는 색은 밝기만 바꿔 맞추고 알린다', () => {
  const light = THEMES.light.tokens
  const kept = themeTokens(light, { accent: '#123456' })
  assert.equal(kept.adjusted, false)
  assert.equal(kept.tokens['--color-accent'], '#123456')
  const fitted = themeTokens(light, { accent: '#ffcc00' })
  assert.equal(fitted.adjusted, true)
  assert.ok(contrast(fitted.tokens['--color-accent'], '#ffffff') >= MIN.accentCanvas)
  const dark = themeTokens(THEMES.dark.tokens, { accent: '#2f5d46' })
  assert.equal(dark.adjusted, true, '다크 표면에서는 포레스트를 밝게 맞춘다')
  assert.equal(dark.tokens['--color-on-accent'], THEMES.dark.tokens['--color-canvas'])
  assert.equal(themeTokens(light, { accent: 'red' }).tokens['--color-accent'], '#2f5d46', '잘못된 값은 기본 색으로')
  assert.equal(fitContrast('#2f5d46', [['#ffffff', 4.5]], false), '#2f5d46', '이미 맞으면 바꾸지 않는다')
})
