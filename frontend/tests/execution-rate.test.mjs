// 계획 실행률(PR-19 UF-136, Q-40): 요청 경로, 단계, 기간, 최고 달성일, 월간·연간 화면이 계정 기록과 예시를 구분하는지 검사한다.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { LEVELS, bestDay, fetchExecution, hoursText, monthRange, rateLevel, yearRange } from '../src/features/planner/executionRate.mjs'

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8')

test('요청 경로·기간·단계', async () => {
  const calls = []
  await fetchExecution(async (path) => { calls.push(path); return {} }, '2026-11-01', '2026-11-30')
  assert.deepEqual(calls, ['/api/stat/execution?from=2026-11-01&to=2026-11-30'])
  assert.deepEqual(monthRange(2026, 1), { from: '2026-02-01', to: '2026-02-28' })
  assert.deepEqual(monthRange(2028, 1), { from: '2028-02-01', to: '2028-02-29' })
  assert.deepEqual(yearRange(2026), { from: '2026-01-01', to: '2026-12-31' })
  assert.deepEqual([rateLevel(null), rateLevel(0), rateLevel(33), rateLevel(34), rateLevel(66), rateLevel(67), rateLevel(120)], [0, 1, 1, 2, 2, 3, 3])
  assert.equal(LEVELS[0], '계획 없음')
})

test('최고 달성일은 계획이 있는 날 중 실행률이 가장 높은 앞 날짜다. 계획이 없는 날은 빠진다', () => {
  assert.deepEqual(bestDay([{ date: '2026-11-01', rate: null }, { date: '2026-11-02', rate: 80 }, { date: '2026-11-03', rate: 80 }, { date: '2026-11-04', rate: 40 }]), { date: '2026-11-02', rate: 80 })
  assert.equal(bestDay([{ date: '2026-11-01', rate: null }]), null)
  assert.deepEqual([hoursText(45), hoursText(120), hoursText(125)], ['45분', '2시간', '2시간 5분'])
})

test('월간·연간 화면: 로그인 상태는 서버 값, 예시는 예시라고 밝히고, 계획 없는 날을 실패로 쓰지 않는다', () => {
  const month = read('src/views/planner/PlannerMonthlyView.vue')
  assert.match(month, /fetchExecution\(apiRequest, from, to\)/)
  assert.match(month, /계획 밖에서 한 활동은 실패로 세지 않고 실제 활동 시간에만 넣어요/)
  assert.match(month, /\{\{ tr\('카테고리 비중'\) \}\} <small class="sample-label">\{\{ tr\('예시'\) \}\}<\/small>/)
  assert.match(month, /평균 실행률\(예시\)/)
  const year = read('src/views/planner/PlannerYearlyView.vue')
  assert.match(year, /yearRange\(cursor\.value\.getFullYear\(\)\)/)
  assert.match(year, /올해 총 집중 시간'\) \}\}<template v-if="real"> \{\{ tr\('\(예시\)'\) \}\}<\/template>/)
  const server = read('../backend/src/main/java/kr/timebar/diary/records/ExecutionRate.java')
  assert.match(server, /out\.put\("rate", planned == 0 \? null :/)
})
