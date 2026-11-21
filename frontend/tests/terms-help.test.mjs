// 화면 라벨의 계획·실제 기록 통일과 약어 도움말(WBS·공수·MD·MM)을 검사한다(PR-19 UF-135, UT-239·UT-240).
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { TERMS, termOf } from '../src/features/help/terms.mjs'

const read = (path) => readFileSync(new URL('../src/' + path, import.meta.url), 'utf8')
const visible = (text) => text.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '')

test('UT-239 계획·실제 필터는 라벨만 한국어이고 내부 값 Plan·Actual은 그대로다', () => {
  const daily = read('views/planner/PlannerDailyView.vue')
  assert.match(daily, /\{ id: 'Plan', label: '계획' \}, \{ id: 'Actual', label: '실제 기록' \}/)
  assert.match(daily, /view !== 'Actual'/)
  assert.match(daily, /view !== 'Plan'/)
})

test('범례·표 머리글·글양식 필드 이름에 영어 Plan·Actual이나 줄인 "실제"가 남지 않았다', () => {
  for (const file of ['views/home/HomeView.vue', 'views/stats/StatsBoardView.vue', 'views/stats/StatsCompareView.vue', 'views/stats/StatsDailyView.vue', 'views/work/WorkReportView.vue']) {
    const text = visible(read(file))
    assert.doesNotMatch(text, /<i class="swatch actual"><\/i>실제<\/span>/, file)
    assert.doesNotMatch(text, /<span>실제<\/span>/, file)
  }
  const labels = [...read('store/modeProfiles.js').matchAll(/label: '([^']+)'/g)].map((match) => match[1])
  assert.ok(labels.includes('계획 시간대'))
  for (const label of labels) assert.doesNotMatch(label, /\b(Plan|Actual)\b/, label)
})

test('약어 사전은 WBS·공수·MD·MM을 설명하고 사용법 모달의 용어 설명과 뜻이 같다', () => {
  for (const key of ['WBS', '공수', 'MD', 'MM']) assert.ok(termOf(key)?.desc.trim(), key)
  assert.equal(termOf('없는 용어'), null)
  assert.equal(termOf('toString'), null)
  const labor = read('views/work/LaborReportView.vue')
  assert.ok(labor.includes(`desc: '${TERMS.MD.desc}'`), 'MD 설명이 공수 계산 사용법과 같다')
  assert.match(labor, /const MD_PER_MM = 20\b/)
  assert.match(TERMS.MM.desc, /20일/)
})

test('UT-240 약어 설명은 키보드로 열고 Esc로 닫으며 포커스를 옮기지 않는다', () => {
  const hint = read('components/TermHint.vue')
  assert.match(hint, /<button ref="button" type="button"/)
  assert.match(hint, /:aria-expanded=/)
  assert.match(hint, /:aria-controls="panelId"/)
  assert.match(hint, /@keydown\.esc\.stop="close"/)
  assert.match(hint, /aria-live="polite"/)
  assert.doesNotMatch(hint, /\.focus\(\)/)
  assert.match(hint, /window\[method\]\('scroll', close, true\)/)
  assert.doesNotMatch(hint, /#[0-9a-fA-F]{3,8}\b/)
  const wbs = read('views/work/WbsView.vue')
  assert.match(wbs, /<TermHint term="WBS" \/> · 작업 분해/)
  const labor = read('views/work/LaborReportView.vue')
  for (const term of ['공수', 'MD', 'MM']) assert.match(labor, new RegExp(`<TermHint term="${term}" />`))
})
