// 경력 화면의 서버 연결(PR-07 7단계)을 검사한다. 경력 프로젝트·포트폴리오 값 변환, 이력서 한 건 저장의 version 처리.
import test from 'node:test'
import assert from 'node:assert/strict'
import { ref } from 'vue'
import { createFeatureStore } from '../src/features/records/featureStore.mjs'
import { careerKind, portfolioKind, achievementsFromText } from '../src/features/records/featureKinds.mjs'
import { createResumeStore } from '../src/features/records/resumeStore.mjs'

const settle = () => new Promise((resolve) => setImmediate(resolve))
const ME = '01HZY0000000000000000000ME'
const failure = (status, message = '실패') => Object.assign(new Error(message), { status })

test('경력 프로젝트는 서버 필드만 보내고 성과는 한 줄에 하나씩 배열로 바꾼다', async () => {
  assert.deepEqual(achievementsFromText(' 첫 성과 \n\n둘째 성과\n'), ['첫 성과', '둘째 성과'])
  const sent = []
  const request = async (path, options = {}) => {
    sent.push({ path, method: options.method ?? 'GET', body: options.body ? JSON.parse(options.body) : undefined })
    if ((options.method ?? 'GET') === 'GET') return { items: [], total: 0 }
    return { ...JSON.parse(options.body), id: 'c1', version: 1, updatedAt: '2026-11-19T03:00:00Z' }
  }
  const careers = createFeatureStore({ local: ref([]), request, owner: () => ME, ...careerKind })
  await settle()
  await careers.create({ title: ' 리뉴얼 ', period: '2026.03 ~ 2026.09', role: '리드', company: '타임바', stack: 'Vue', achievements: ['성과'], editing: true })
  assert.deepEqual(sent.at(-1), { path: '/api/work/career/projects', method: 'POST', body: { title: '리뉴얼', period: '2026.03 ~ 2026.09', role: '리드', company: '타임바', stack: 'Vue', achievements: ['성과'] } })
  careers.stop()
})

test('포트폴리오는 서버 수정 시각을 화면의 수정일로 보인다', () => {
  const local = portfolioKind.toLocal({ id: 'p1', title: '케이스 스터디', kind: '문서', body: '', version: 2, updatedAt: '2026-11-19T03:00:00Z' })
  assert.equal(local.updated, '2026.11.19')
})

test('이력서는 처음 저장할 때 version 없이 보내고, 그 뒤에는 받은 version으로 보내며, 충돌이면 최신 값을 준다', async () => {
  let row = null
  const sent = []
  const request = async (path, options = {}) => {
    const method = options.method ?? 'GET', body = options.body ? JSON.parse(options.body) : undefined
    sent.push({ method, body })
    if (method === 'GET') return row ?? { version: 0 }
    if (row && body.version !== row.version) throw failure(409)
    if (!row && body.version !== undefined) throw failure(400, 'version')
    const { version, ...fields } = body
    row = { ...fields, id: 'default', version: (row?.version ?? 0) + 1 }
    return row
  }
  const resume = createResumeStore({ request, owner: () => ME })
  await resume.load()
  assert.deepEqual([resume.state.loaded, resume.state.version, resume.state.value.name], [true, 0, ''])
  await resume.save({ name: '김지수', headline: '엔지니어', years: 6, skills: 'Vue', education: '학사' })
  assert.equal('version' in sent.at(-1).body, false, '처음 저장은 version 없이')
  assert.equal(resume.state.version, 1)
  await resume.save({ ...resume.state.value, years: 7 })
  assert.equal(sent.at(-1).body.version, 1)
  row = { ...row, headline: '다른 기기에서 고침', version: 5 }
  const conflict = await resume.save({ ...resume.state.value, years: 8 }).catch((error) => error)
  assert.equal(conflict.kind, 'conflict')
  assert.equal(conflict.latest.headline, '다른 기기에서 고침')
  assert.equal(row.years, 7, '자동으로 덮어쓰지 않는다')
})

test('로그아웃 상태 이력서는 서버를 부르지 않는다', async () => {
  const resume = createResumeStore({ request: async () => assert.fail('서버를 부르지 않는다'), owner: () => '' })
  await resume.load()
  assert.equal(resume.state.loaded, false)
})
