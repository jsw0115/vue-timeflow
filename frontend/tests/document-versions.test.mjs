// 문서 버전(PR-25)의 요청 경로·이름·고정본 표시와, 경력 화면·지원 관리 화면 연결을 검사한다.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { DOCUMENTS, MAX_VERSIONS, createDocumentVersionClient, savedAt, snapshotSections, versionErrorText, versionName } from '../src/features/career/documentVersions.mjs'

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8')

test('문서 종류와 한도는 서버와 같다', () => {
  const server = read('../backend/src/main/java/kr/timebar/diary/career/DocumentVersions.java')
  assert.match(server, /DOCUMENTS = List\.of\("resume", "career", "portfolio", "cover-letter"\)/)
  assert.deepEqual(DOCUMENTS.map((doc) => doc.id), ['resume', 'career', 'portfolio', 'cover-letter'])
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

test('버전 비교: 원본 ID로 항목을 맞춰 바뀐 칸·추가·삭제를 나누고, 다른 문서끼리는 비교하지 않는다(PR-25)', async () => {
  const { compareVersions } = await import('../src/features/career/documentVersions.mjs')
  const v1 = { document: 'career', content: { items: [{ id: 'c1', title: '결제', role: '개발', achievements: ['A'] }, { id: 'c2', title: '근태', role: '백엔드' }] } }
  const v2 = { document: 'career', content: { items: [{ id: 'c1', title: '결제 리뉴얼', role: '개발', achievements: ['A', 'B'] }, { id: 'c3', title: '위키', role: '기획' }] } }
  const diff = compareVersions(v1, v2)
  assert.deepEqual(diff.changed, [{ heading: '결제 리뉴얼', fields: [{ label: '제목', before: '결제', after: '결제 리뉴얼' }, { label: '성과', before: 'A', after: 'A\nB' }] }])
  assert.deepEqual(diff.added, [{ heading: '위키' }])
  assert.deepEqual(diff.removed, [{ heading: '근태' }])
  assert.equal(diff.unchanged, 0)
  const r1 = { document: 'resume', content: { resume: { name: '김지수', headline: '첫 소개' } } }
  const r2 = { document: 'resume', content: { resume: { name: '김지수', headline: '' } } }
  assert.deepEqual(compareVersions(r1, r2).changed, [{ heading: '기본 정보', fields: [{ label: '한 줄 소개', before: '첫 소개', after: '' }] }])
  assert.equal(compareVersions(r1, r1).unchanged, 1)
  assert.throws(() => compareVersions(r1, v1))
  const panel = read('src/components/DocumentVersionPanel.vue')
  assert.match(panel, /:disabled="!compareBase \|\| !compareTarget \|\| compareBase === compareTarget"/)
  const view = read('src/components/DocumentVersionCompare.vue')
  for (const word of ['바뀜', '추가됨', '삭제됨', '이전', '이후']) assert.ok(view.includes(`>{{ tr('${word}') }}<`), word)
})

test('자기소개서(PR-25 Q-41): 칸은 서버와 같고, 버전 보기·비교가 되며, 경력 화면 탭과 버전 묶음이 있다', async () => {
  const { COVER_LETTER_SECTIONS, createCoverLetterStore } = await import('../src/features/records/resumeStore.mjs')
  const { compareVersions } = await import('../src/features/career/documentVersions.mjs')
  const server = read('../backend/src/main/java/kr/timebar/diary/feature/FeatureType.java')
  assert.match(server, new RegExp(`COVER_LETTER\\("title ${COVER_LETTER_SECTIONS.map((s) => s.key).join(' ')}", "title"\\)`))
  assert.deepEqual(COVER_LETTER_SECTIONS.map((s) => s.label), ['지원 동기', '직무 역량', '문제 해결', '협업', '성장 경험'])
  const v1 = { document: 'cover-letter', content: { coverLetter: { title: '기본', motivation: '처음 동기' } } }
  const v2 = { document: 'cover-letter', content: { coverLetter: { title: '기본', motivation: '고친 동기', growth: '성장' } } }
  assert.deepEqual(snapshotSections(v2), [{ heading: '기본', rows: [['지원 동기', '고친 동기'], ['성장 경험', '성장']] }])
  assert.deepEqual(compareVersions(v1, v2).changed[0].fields.map((f) => f.label), ['지원 동기', '성장 경험'])
  const calls = []
  const store = createCoverLetterStore({ owner: () => 'ME', request: async (path, options = {}) => { calls.push([path, options.method ?? 'GET', options.body ? JSON.parse(options.body) : null]); return { title: '기본', version: 1 } } })
  await store.save({ title: ' 기본 ', motivation: '동기' })
  assert.deepEqual(calls[0], ['/api/work/cover-letter', 'PUT', { title: '기본', motivation: '동기', competency: '', problemSolving: '', collaboration: '', growth: '' }])
  const view = read('src/views/work/CareerDocsView.vue')
  assert.match(view, /\{ id: 'cover', label: '자기소개서' \}/)
  assert.match(view, /<DocumentVersionPanel v-if="onServer" document="cover-letter" \/>/)
})
