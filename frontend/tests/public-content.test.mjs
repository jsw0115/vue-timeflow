// 관리자 공개 콘텐츠의 사용자 화면 표시(Q-29): 오늘의 문장, 공용 템플릿 줄 해석, 템플릿 관리의 서버 연결과 정직한 예시 문구를 검사한다.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parseTemplateLine, parseTemplateText, publicTemplates, quoteOfDay } from '../src/features/content/publicContent.mjs'

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8')
const CONTENT = [
  { id: 'q2', kind: '명언', title: '세네카', body: '시작이 반이다.' },
  { id: 'q1', kind: '명언', title: '', body: '오늘 한 걸음.' },
  { id: 'q3', kind: '명언', title: '빈 내용', body: '  ' },
  { id: 't1', kind: '플래너 템플릿', title: '재택 하루', body: '7:00 스트레칭\n09:30 집중 블록\n점심\n25:00 잘못' },
  { id: 't2', kind: '플래너 템플릿', title: '빈 템플릿', body: '메모만' },
  { id: 's1', kind: '스티커팩', title: '꽃', body: '...' },
]

test('줄 해석은 화면과 같은 "07:00 내용" 형식이고 시를 두 자리로 맞춘다', () => {
  assert.deepEqual(parseTemplateLine('7:05 러닝'), { time: '07:05', title: '러닝', valid: true })
  assert.deepEqual(parseTemplateLine('점심'), { time: '--:--', title: '점심', valid: false })
  assert.equal(parseTemplateLine('24:00 자정').valid, false)
  assert.equal(parseTemplateText('a\n\n09:00 b').length, 2)
})

test('공용 템플릿은 읽을 수 있는 줄만 블록으로 쓰고, 읽을 줄이 없는 것과 다른 종류는 뺀다', () => {
  assert.deepEqual(publicTemplates(CONTENT), [{ id: 't1', title: '재택 하루', blocks: [{ time: '07:00', title: '스트레칭' }, { time: '09:30', title: '집중 블록' }], skipped: 2 }])
})

test('오늘의 문장은 날짜마다 같은 명언 하나이고 빈 명언·다른 종류는 고르지 않는다', () => {
  const a = quoteOfDay(CONTENT, '2026-11-22'), b = quoteOfDay(CONTENT, '2026-11-22')
  assert.deepEqual(a, b)
  assert.ok(['시작이 반이다.', '오늘 한 걸음.'].includes(a.text))
  assert.equal(quoteOfDay([{ kind: '스티커팩', body: 'x' }], '2026-11-22'), null)
  const dates = new Set(Array.from({ length: 10 }, (_, i) => quoteOfDay(CONTENT, `2026-11-${String(i + 10)}`).text))
  assert.equal(dates.size, 2, '날짜가 바뀌면 다른 명언도 나온다')
})

test('화면 연결: 홈 오늘의 문장, 템플릿 관리 서버 연결·공용 템플릿, 예시는 넣은 것처럼 보이지 않음', () => {
  const home = read('../src/views/home/HomeView.vue')
  assert.match(home, /<figure v-if="quote" class="today-quote"/)
  assert.doesNotMatch(home, /v-html="quote/)
  const tpl = read('../src/views/planner/PlannerTemplatesView.vue')
  assert.match(tpl, /\/api\/planner\/templates\/\$\{encodeURIComponent\(t\.id\)\}\/apply/)
  assert.match(tpl, /예시 템플릿이라 실제 플래너에는 넣지 않았어요/)
  assert.match(tpl, /내 템플릿으로 가져오기/)
  assert.doesNotMatch(read('../src/views/admin/AdminContentView.vue'), /읽어 보여 주는 화면이 없어요/)
})
