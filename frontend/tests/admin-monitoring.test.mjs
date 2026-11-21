// 모니터링 값 표시 변환과, 서버가 모으지 않는 지표를 화면에 만들지 않는지 검사한다(PR-10 UF-117 7-6).
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { heapPercent, mib, uptimeLabel } from '../src/features/admin/monitoring.mjs'

test('가동 시간·메모리·사용률을 사람이 읽는 값으로 바꾼다', () => {
  assert.equal(uptimeLabel(59_999), '0분')
  assert.equal(uptimeLabel(3 * 86_400_000 + 4 * 3_600_000 + 5 * 60_000), '3일 4시간 5분')
  assert.equal(uptimeLabel(86_400_000), '1일 0시간 0분')
  assert.equal(uptimeLabel(-1), '—')
  assert.equal(mib(1_572_864), '1.5')
  assert.equal(heapPercent(256, 1024), 25)
  assert.equal(heapPercent(1, -1), null)
})

test('모니터링 화면은 서버 값만 쓰고 시연 지표·알림 규칙을 만들지 않는다', () => {
  const view = readFileSync(new URL('../src/views/admin/AdminMonitoringView.vue', import.meta.url), 'utf8')
  assert.match(view, /loadMonitoring/)
  assert.doesNotMatch(view, /store\/adminOps/)
  assert.doesNotMatch(view, /role="switch"/)
  assert.match(view, /서버가 모으지 않아 보이지 않아요/)
  assert.match(readFileSync(new URL('../src/AdminApp.vue', import.meta.url), 'utf8'), /'\/admin\/logs'/)
})
