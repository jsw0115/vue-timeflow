// 업무 보고서 초안(PR-19 UF-138): 요청 경로·저장 키·기간 고르기·초안 문장과, 화면이 자동 발송 없이 원본을 바꾸지 않는다고 밝히는지 검사한다.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createProjectReportClient, draftKey, draftText, hm, periodRange } from '../src/features/work/projectReport.mjs'

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8')

test('요청 경로와 저장 본문. 저장한 초안이 없으면(404) null이다', async () => {
  const calls = []
  const client = createProjectReportClient(async (path, options = {}) => {
    calls.push([path, options.method ?? 'GET', options.body ?? null])
    if (path.startsWith('/api/reports/') && !options.method) { const e = new Error('없음'); e.status = 404; throw e }
    return {}
  })
  await client.candidates('P1', '2026-11-23', '2026-11-29')
  await client.link('P1', 'A1')
  await client.unlink('P1', 'A/1')
  await client.draft('P1', '2026-11-23', '2026-11-29')
  assert.equal(await client.saved('wd-P1-2026-11-23-2026-11-29'), null)
  await client.save('wd-P1-2026-11-23-2026-11-29', { title: '보고', body: '본문', date: '2026-11-29' }, 3)
  assert.deepEqual(calls.map((c) => c.slice(0, 2)), [
    ['/api/work/projects/P1/actuals?from=2026-11-23&to=2026-11-29', 'GET'],
    ['/api/work/projects/P1/actuals', 'POST'],
    ['/api/work/projects/P1/actuals/A%2F1', 'DELETE'],
    ['/api/work/projects/P1/report-draft?from=2026-11-23&to=2026-11-29', 'GET'],
    ['/api/reports/wd-P1-2026-11-23-2026-11-29', 'GET'],
    ['/api/reports/wd-P1-2026-11-23-2026-11-29', 'POST'],
  ])
  assert.deepEqual(JSON.parse(calls[5][2]), { title: '보고', body: '본문', date: '2026-11-29', category: 'work-draft', version: 3 })
})

test('저장 키는 서버 규칙(영문·숫자·_·- 100자)을 따른다', () => {
  assert.equal(draftKey('01JX', '2026-11-23', '2026-11-29'), 'wd-01JX-2026-11-23-2026-11-29')
  assert.equal(draftKey('한글', '2026-11-23', '2026-11-29'), null)
  assert.equal(draftKey('x'.repeat(90), '2026-11-23', '2026-11-29'), null)
  assert.match(read('../backend/src/main/java/kr/timebar/diary/contract/ReportController.java'), /\[A-Za-z0-9_-\]\{1,100\}/)
})

test('기간: 주는 월요일 시작, 지난주, 이번 달', () => {
  assert.deepEqual(periodRange('this-week', '2026-11-25'), { from: '2026-11-23', to: '2026-11-29' })
  assert.deepEqual(periodRange('this-week', '2026-11-29'), { from: '2026-11-23', to: '2026-11-29' })
  assert.deepEqual(periodRange('last-week', '2026-11-23'), { from: '2026-11-16', to: '2026-11-22' })
  assert.deepEqual(periodRange('this-month', '2026-02-10'), { from: '2026-02-01', to: '2026-02-28' })
  assert.equal(periodRange('custom', '2026-11-25'), null)
})

test('초안 문장은 서버 재료의 합계·완료·남은 일·기록을 그대로 옮긴다', () => {
  const text = draftText({ projectTitle: '결제 리뉴얼', from: '2026-11-23', to: '2026-11-29', actualMinutes: 150, sessions: [{ startedAt: '2026-11-23T01:00:00Z', title: '결제 화면', minutes: 120 }, { startedAt: '2026-11-29T14:30:00Z', title: '결제 API', minutes: 30 }], done: [{ title: '설계' }], remaining: [{ title: 'API 연동', progress: 30 }] })
  assert.match(text, /^\[결제 리뉴얼 업무 보고 · 2026-11-23 ~ 2026-11-29\]/)
  assert.match(text, /실제 시간: 2시간 30분 \(실제 기록 2건\)/)
  assert.match(text, /완료한 작업\n- 설계/)
  assert.match(text, /남은 작업\n- API 연동 \(진척 30%\)/)
  assert.match(draftText({ projectTitle: 'X', from: 'a', to: 'b', actualMinutes: 0, sessions: [], done: [], remaining: [] }), /완료한 작업\n- 없음/)
  assert.equal(hm(61), '1시간 1분')
})

test('화면: 자동 발송 없음·원본 그대로 안내, 다시 만들기 전 확인, 예시 통계 표시', () => {
  const panel = read('src/components/ProjectReportPanel.vue')
  assert.match(panel, /자동으로 보내지 않고, 초안을 고쳐도 원본 기록은 바뀌지 않아요/)
  assert.match(panel, /window\.confirm\('고친 초안 글을 지금 기록으로 다시 만들까요\?/)
  assert.doesNotMatch(panel, /mail|send|fetch\(/i)
  const view = read('src/views/work/WorkReportView.vue')
  assert.match(view, /<ProjectReportPanel \/>/)
  assert.match(view, /아래 업무 유형별 통계와 업무보고는 화면 예시예요/)
})
