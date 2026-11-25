// 문서 버전(PR-25)의 요청 경로·이름·고정본 표시와, 경력 화면·지원 관리 화면 연결을 검사한다.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { DOCUMENTS, MAX_VERSIONS, createDocumentVersionClient, savedAt, snapshotSections, versionErrorText, versionName } from '../src/features/career/documentVersions.mjs'

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8')

test('문서 종류와 한도는 서버와 같다', () => {
  const server = read('../backend/src/main/java/kr/timebar/diary/career/DocumentVersions.java')
  assert.match(server, /DOCUMENTS = List\.of\("resume", "career", "portfolio"\)/)
  assert.deepEqual(DOCUMENTS.map((doc) => doc.id), ['resume', 'career', 'portfolio'])
  assert.match(server, new RegExp(`MAX_VERSIONS = ${MAX_VERSIONS};`))
})

test('요청 경로와 본문: 빈 이름표·메모는 보내지 않고, 버전 내용은 보내지 않는다', async () => {
  const calls = []
  const client = createDocumentVersionClient(async (path, options = {}) => { calls.push([path, options.method ?? 'GET', options.body ?? null]); return [] })
  await client.list('resume')
  await client.create('career', { label: '  ', note: ' 성과 수정 ' })
  await client.remove('resume-2')
  await client.attach('app/1', 'resume-2')
  await client.detach('app/1', 'resume-2')
  assert.deepEqual(calls, [
    ['/api/career/document-versions?document=resume', 'GET', null],
    ['/api/career/document-versions', 'POST', JSON.stringify({ document: 'career', note: '성과 수정' })],
    ['/api/career/document-versions/resume-2', 'DELETE', null],
    ['/api/career/applications/app%2F1/documents', 'POST', JSON.stringify({ versionId: 'resume-2' })],
    ['/api/career/applications/app%2F1/documents/resume-2', 'DELETE', null],
  ])
})

test('고정본 내용은 문서별 읽기 전용 행이 되고, 빈 값은 빼며, 회사명 비공개 설정을 따른다', () => {
  const resume = snapshotSections({ document: 'resume', content: { resume: { name: '김지수', years: 0, headline: '', skills: 'Vue' } } })
  assert.deepEqual(resume, [{ heading: '기본 정보', rows: [['이름', '김지수'], ['경력', '0년'], ['보유 기술', 'Vue']] }])
  const career = snapshotSections({ document: 'career', content: { items: [{ id: 'c1', title: '결제', role: '개발', company: '가나다', startDate: '2025-01-02', employmentStatus: 'current', employmentType: 'intern', achievements: ['A', 'B'] }] } }, { maskCompany: true })
  assert.deepEqual(career[0].rows, [['기간', '2025.01 ~ 재직 중'], ['역할', '개발'], ['회사', '회사명 비공개'], ['고용 형태', '인턴'], ['재직 상태', '재직 중'], ['성과', 'A\nB']])
  const portfolio = snapshotSections({ document: 'portfolio', content: { items: [{ title: '케이스', kind: '문서', body: '' }] } })
  assert.deepEqual(portfolio, [{ heading: '케이스', rows: [['종류', '문서']] }])
})

test('이름·시각·오류 문구', () => {
  assert.equal(versionName({ document: 'resume', number: 3, title: '이력서 v3' }), '이력서 v3')
  assert.equal(versionName({ document: 'resume', number: 3, title: '가나다 제출용' }), '이력서 v3 · 가나다 제출용')
  assert.match(savedAt('2026-11-25T05:03:00Z'), /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)
  assert.equal(savedAt('bad'), '')
  assert.equal(versionErrorText({ status: 409, message: '연결된 버전은 지울 수 없어요.' }), '연결된 버전은 지울 수 없어요.')
  assert.equal(versionErrorText(new TypeError('fetch failed')), '서버에 연결하지 못했어요. 연결을 확인하고 다시 시도해 주세요.')
})

test('경력 화면 세 탭과 지원 수정 창에 연결되고, 로그인 상태에서만 보인다. 연결된 버전은 지우기 버튼이 막힌다', () => {
  const docs = read('src/views/work/CareerDocsView.vue')
  for (const doc of ['career', 'resume', 'portfolio']) assert.match(docs, new RegExp(`<DocumentVersionPanel v-if="onServer" document="${doc}" />`))
  const apps = read('src/views/career/JobApplicationsView.vue')
  assert.match(apps, /<ApplicationDocumentsPanel v-if="editor\.base\?\.id && typeof editor\.base\.id === 'string'" :application-id="editor\.base\.id" \/>/)
  const panel = read('src/components/DocumentVersionPanel.vue')
  assert.match(panel, /:disabled="busy \|\| v\.applicationCount > 0"/)
  assert.match(panel, /저장하지 않은 수정은 버전에 들어가지 않아요/)
  const viewer = read('src/components/DocumentVersionViewer.vue')
  assert.match(viewer, /지금 문서를 고쳐도 이 버전은 바뀌지 않아요/)
  for (const file of ['src/components/DocumentVersionPanel.vue', 'src/components/ApplicationDocumentsPanel.vue', 'src/components/DocumentVersionViewer.vue']) assert.doesNotMatch(read(file), /을\(를\)|를\(을\)|이\(가\)|\}을 /)
})
