// 커리어 활동 원장·지원 관리·커리어 목표의 화면 규칙과 서버 계약 정합을 검사한다(docs/design 03·04 Career OS 1단계).
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { ref } from 'vue'
import { createFeatureStore } from '../src/features/records/featureStore.mjs'
import {
  ACTIVITY_TYPES, APPLICATION_STATUSES, CAREER_GOALS, activityKind, applicationKind, daysUntil, dueLabel, goalOf,
  groupByMonth, isWebUrl, listFromText, pipelineCounts, resumeProgress, upcomingDates,
} from '../src/features/career/careerModel.mjs'
import { cleanGoal, createCareerGoalAccount, GOAL_PATH } from '../src/features/career/careerGoalAccount.mjs'

const root = new URL('../../', import.meta.url)
const read = (path) => readFileSync(new URL(path, root), 'utf8')
const settle = () => new Promise((resolve) => setImmediate(resolve))
const ME = '01HZY0000000000000000000ME'

test('활동 유형·지원 상태·커리어 목표가 서버 허용값과 같다', () => {
  const input = read('backend/src/main/java/kr/timebar/diary/feature/FeatureInput.java')
  const javaList = (name) => JSON.parse('[' + input.match(new RegExp(name + ' = List\\.of\\(([^)]*)\\)'))[1] + ']')
  assert.deepEqual(ACTIVITY_TYPES.map((type) => type.id), javaList('ACTIVITY_TYPES'))
  assert.deepEqual(APPLICATION_STATUSES.map((status) => status.id), javaList('APPLICATION_STATUSES'))
  const settings = read('backend/src/main/java/kr/timebar/diary/operations/SettingsService.java')
  const goals = JSON.parse('[' + settings.match(/CAREER_GOALS = Set\.of\(([^)]*)\)/)[1] + ']')
  assert.deepEqual([...goals].sort(), CAREER_GOALS.map((goal) => goal.id).sort())
  assert.match(settings, /"career"\);/)
})

test('활동은 비공개로만 보내고 빈 선택 값은 빼며 서버 필드 이름(skillTags)을 쓴다', async () => {
  const sent = []
  const request = async (path, options = {}) => {
    sent.push({ path, method: options.method ?? 'GET', body: options.body ? JSON.parse(options.body) : undefined })
    if ((options.method ?? 'GET') === 'GET') return { items: [], total: 0 }
    return { ...JSON.parse(options.body), id: 'a1', version: 1 }
  }
  const store = createFeatureStore({ local: ref([]), request, owner: () => ME, ...activityKind })
  await settle()
  await store.create({ title: ' 결제 개선 ', activityType: 'work', date: '2026-11-02', endDate: '', experienceId: '', role: '', skillTags: ['Vue'], achievements: ['문의 감소'], links: ['https://example.test/pr/1'], body: '', editing: true })
  assert.deepEqual(sent.at(-1), {
    path: '/api/career/activities', method: 'POST',
    body: { title: '결제 개선', activityType: 'work', date: '2026-11-02', skillTags: ['Vue'], achievements: ['문의 감소'], links: ['https://example.test/pr/1'], visibility: 'private' },
  })
  store.stop()
  const local = activityKind.toLocal({ id: 'a1', title: 'x', version: 1 })
  assert.deepEqual([local.skillTags, local.achievements, local.links], [[], [], []])
})

test('지원 기록은 빈 날짜·주소를 보내지 않는다', () => {
  const pick = (item) => Object.fromEntries(applicationKind.fields.filter((key) => item[key] !== undefined).map((key) => [key, item[key]]))
  const body = applicationKind.toBody({ title: '개발자', company: '회사', status: 'interested', postingUrl: '', deadline: '2026-12-01', appliedDate: '', interviewDate: '', body: '' }, pick)
  assert.deepEqual(body, { title: '개발자', company: '회사', status: 'interested', deadline: '2026-12-01' })
})

test('링크는 http·https 절대 주소만 인정한다', () => {
  for (const ok of ['https://example.test/a?b=1,2', 'http://example.test']) assert.equal(isWebUrl(ok), true, ok)
  for (const bad of ['javascript:alert(1)', '/relative', 'ftp://example.test', 'data:text/html,x', '', null]) assert.equal(isWebUrl(bad), false, String(bad))
  assert.deepEqual(listFromText('Vue, Spring\nVue\n , '), ['Vue', 'Spring'])
})

test('다가오는 마감·면접은 진행 중인 지원만 14일 안에서 날짜순으로 모으고 지난 날은 중립 문구다', () => {
  const apps = [
    { id: '1', title: 'A', company: 'a', status: 'applied', deadline: '2026-11-25', interviewDate: '2026-11-21' },
    { id: '2', title: 'B', company: 'b', status: 'rejected', deadline: '2026-11-22' },
    { id: '3', title: 'C', company: 'c', status: 'interested', deadline: '2026-12-30' },
    { id: '4', title: 'D', company: 'd', status: 'preparing', deadline: '2026-11-19' },
  ]
  const rows = upcomingDates(apps, '2026-11-20', 14)
  assert.deepEqual(rows.map((row) => [row.appId, row.label, row.days]), [['1', '면접', 1], ['1', '지원 마감', 5]])
  assert.equal(daysUntil('2026-11-19', '2026-11-20'), -1)
  assert.equal(dueLabel(-1), '1일 지남')
  assert.equal(dueLabel(0), '오늘')
  assert.equal(daysUntil('2026-02-30x', '2026-11-20'), null)
  const counts = pipelineCounts(apps)
  assert.deepEqual(counts.map((row) => row.id), APPLICATION_STATUSES.map((status) => status.id))
  assert.equal(counts.find((row) => row.id === 'applied').count, 1)
})

test('이력서 입력 현황은 분모와 빠진 항목을 함께 준다', () => {
  assert.deepEqual(resumeProgress({ name: '김', headline: '', years: 0, skills: ' ', education: '학사' }), { filled: 3, total: 5, missing: ['한 줄 소개', '보유 기술'] })
  assert.deepEqual(resumeProgress(null).filled, 0)
})

test('목표마다 대시보드 영역 다섯 개를 한 번씩 갖고, 모르는 목표는 기본 목표로 본다', () => {
  for (const goal of CAREER_GOALS) assert.deepEqual([...goal.sections].sort(), ['activities', 'deadlines', 'documents', 'experiences', 'pipeline'])
  assert.equal(goalOf('unknown').id, 'job-seeker')
  assert.deepEqual(groupByMonth([{ id: 1, date: '2026-10-02' }, { id: 2, date: '2026-11-01' }]).map((group) => group.label), ['2026년 11월', '2026년 10월'])
})

test('커리어 목표는 career 구역의 다른 값을 지우지 않고 version과 함께 저장한다', async () => {
  let row = { id: 'career', version: 0, value: {} }
  const sent = []
  const request = async (path, options = {}) => {
    assert.equal(path, GOAL_PATH)
    const method = options.method ?? 'GET'
    if (method === 'GET') return row
    const body = JSON.parse(options.body); sent.push(body)
    row = { id: 'career', version: (row.version || 0) + 1, value: body.value }
    return row
  }
  const account = createCareerGoalAccount({ request })
  assert.equal(await account.load(), null)
  assert.equal(await account.save('job-changer'), 'job-changer')
  assert.deepEqual(sent[0], { value: { goal: 'job-changer' } })
  row.value.note = '유지'
  await account.save('employee')
  assert.deepEqual(sent[1], { value: { note: '유지', goal: 'employee' }, version: 1 })
  await assert.rejects(() => account.save('admin'))
  assert.equal(cleanGoal('admin'), null)
})

test('사이드바는 커리어를 메인 다음 묶음으로 두고 기존 경력 경로를 그대로 쓴다. 관리자 콘솔 버튼은 서버 확인 뒤에만 보인다', () => {
  const router = read('frontend/src/router/index.js')
  const groups = [...router.slice(0, router.indexOf('export const adminGroups')).matchAll(/label: '([^']+)'/g)].map((match) => match[1])
  assert.deepEqual(groups, ['메인', '커리어', '플래너', '업무·프로젝트', '기록', '인사이트', '소셜'])
  for (const path of ['/career', '/career/activities', '/career/applications', '/work/career', '/work/wbs', '/work/wiki', '/work']) assert.match(router, new RegExp(`path: '${path}'`))
  const app = read('frontend/src/App.vue')
  assert.match(app, /v-if="canOpenAdmin"[^>]*openAdmin\('\/admin'\)/)
  // 버튼은 서버가 DB에서 읽은 내 역할(/api/auth/me)로 정한다(IMP-021). 콘솔은 들어갈 때 관리자 지표 API로 다시 확인한다
  assert.match(app, /const canOpenAdmin = computed\(\(\) => adminButton\.visible\)/)
  assert.match(read('frontend/src/features/admin/adminClient.mjs'), /request\('\/api\/auth\/me'\)\)\?\.role === 'ADMIN'/)
  assert.match(read('frontend/src/AdminApp.vue'), /adminAccess\.state === 'allowed'/)
})

test('지원 달력은 월요일 시작 주로 만들고 마감·면접을 날짜 칸에 넣으며 끝난 지원을 표시한다', async () => {
  const { calendarMonth, shiftMonth } = await import('../src/features/career/careerModel.mjs')
  const weeks = calendarMonth([
    { id: 'a', company: 'A', title: 'FE', status: 'applied', deadline: '2026-11-25', interviewDate: '2026-11-27' },
    { id: 'b', company: 'B', title: 'BE', status: 'rejected', deadline: '2026-11-02' },
  ], '2026-11')
  assert.equal(weeks.length, 6)
  assert.deepEqual([weeks[0][0].date, weeks[0][0].inMonth, weeks[0][6].date], ['2026-10-26', false, '2026-11-01'])
  const filled = weeks.flat().filter((cell) => cell.items.length).map((cell) => [cell.date, cell.items.map((item) => item.label + (item.closed ? '(끝)' : ''))])
  assert.deepEqual(filled, [['2026-11-02', ['마감(끝)']], ['2026-11-25', ['마감']], ['2026-11-27', ['면접']]])
  assert.deepEqual([shiftMonth('2026-01', -1), shiftMonth('2026-12', 1)], ['2025-12', '2027-01'])
})

test('지원 관리에 달력 보기가 있고 홈에는 커리어 요약 위젯이 모든 모드 기본 배치에 있다', async () => {
  assert.match(read('frontend/src/views/career/JobApplicationsView.vue'), /view === 'calendar'/)
  const { WIDGET_CATALOG, MODE_LAYOUTS } = await import('../src/store/dashboard.js').catch(() => ({}))
  // dashboard.js는 브라우저 저장소를 쓰므로 Node에서 읽히지 않으면 원문으로 확인한다
  if (WIDGET_CATALOG) {
    assert.ok(WIDGET_CATALOG.career)
    for (const mode of Object.keys(MODE_LAYOUTS)) assert.ok(MODE_LAYOUTS[mode].some((w) => w.id === 'career' && w.visible))
  } else {
    const source = read('frontend/src/store/dashboard.js')
    assert.match(source, /career: \{ title: '커리어 요약'/)
    assert.equal((source.match(/\{ id: 'career', size: 'md', visible: true \}/g) ?? []).length, 3)
  }
  assert.match(read('frontend/src/views/home/HomeView.vue'), /w\.id === 'career'/)
})
