// 점수 숨기기가 홈·통계 보드·갓생 리포트의 점수만 감추고 저장된 배치와 기록은 바꾸지 않는지 검사한다(PR-19 UF-136).
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(new URL('../src/' + path, import.meta.url), 'utf8')

test('점수 숨기기 값은 true일 때만 켜지고 기본은 꺼짐이다', () => {
  const store = read('store/appearance.js')
  assert.match(store, /hideScores: parsed\.hideScores === true/)
  assert.match(store, /hideScores: false \}\)/)
})

test('홈과 통계 보드는 보이는 목록에서만 갓생 점수를 빼고 저장된 배치는 건드리지 않는다', () => {
  for (const [file, list] of [['views/home/HomeView.vue', 'dashboardState.layout'], ['views/stats/StatsBoardView.vue', 'statsState.portlets']]) {
    const source = read(file)
    assert.match(source, new RegExp(list.replace('.', '\\.') + "\\.filter\\(\\([wp]\\) => [wp]\\.visible && !\\(appearance\\.hideScores && [wp]\\.id === 'godlifeScore'\\)\\)"), file)
    assert.doesNotMatch(source, /hideScores[^\n]*(toggleVisible|splice|layout\s*=)/, file)
  }
})

test('갓생 리포트는 점수와 점수 구성만 감추고 다시 켜는 길을 보인다', () => {
  const view = read('views/stats/StatsGodlifeView.vue')
  const hidden = view.slice(view.indexOf('v-if="appearance.hideScores"'), view.indexOf('<template v-else>'))
  assert.match(hidden, /점수를 숨겨 두었어요/)
  assert.match(hidden, /\/settings\/env/)
  const shown = view.slice(view.indexOf('<template v-else>'), view.indexOf('</template>', view.indexOf('점수 구성')))
  assert.match(shown, /\{\{ total \}\}/)
  assert.match(shown, /점수 구성/)
  assert.ok(view.indexOf('골든 타임 존') > view.indexOf('<template v-else>') + shown.length, '골든타임은 점수가 아니라 그대로 보인다')
})

test('환경 설정은 이 브라우저 저장임을 밝히고 랭킹 참여는 랭킹 화면으로 안내한다', () => {
  const env = read('views/settings/SettingsEnvView.vue')
  assert.match(env, /v-model="appearance\.hideScores"/)
  assert.match(env, /이 브라우저에만 저장돼요/)
  assert.match(env, /랭킹에 나를 보이기/)
})
