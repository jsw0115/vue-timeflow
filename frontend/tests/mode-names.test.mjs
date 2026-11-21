// 하루 모드 표시 이름만 쉬운 말로 바뀌고 저장값·글양식 기준(J·P·B)은 그대로인지 검사한다(PR-19 UF-132, UT-234).
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('../src/store/modeProfiles.js', import.meta.url), 'utf8')

test('UT-234 표시 이름은 계획 중심·자유 기록·균형이고 저장값 키는 J·P·B 그대로다', () => {
  const meta = source.slice(source.indexOf('MODE_META'), source.indexOf('}', source.indexOf("B: { name:")) + 1)
  assert.match(meta, /J: \{ name: '계획 중심'/)
  assert.match(meta, /P: \{ name: '자유 기록'/)
  assert.match(meta, /B: \{ name: '균형'/)
  // 글양식·대시보드 기본 구성은 이름이 아니라 J·P·B 키로 고른다
  assert.match(source, /isFieldOn\(mode, section, field\)|export function isFieldOn\(/)
  assert.doesNotMatch(source, /profiles\[(?:'계획 중심'|'자유 기록'|'균형')\]/)
})

test('예전 이름(J형·계획형·즉흥형·밸런스형)이 사용자에게 보이는 화면 문구에 남지 않았다', () => {
  for (const file of ['../src/views/settings/SettingsFormStyleView.vue', '../src/views/admin/AdminSettingsView.vue', '../src/store/modeProfiles.js']) {
    const text = readFileSync(new URL(file, import.meta.url), 'utf8').replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')
    assert.doesNotMatch(text, /계획형|즉흥형|밸런스형/, file)
  }
})
