<script setup>
import { computed, ref, watch } from 'vue'
import Modal from '../../components/Modal.vue'
import SaveStatus from '../../components/SaveStatus.vue'
import ConflictCompare from '../../components/ConflictCompare.vue'
import { careerStore, coverLetterStore, portfolioStore, resumeStore } from '../../store/career'
import { COVER_LETTER_SECTIONS } from '../../features/records/resumeStore.mjs'
import { achievementsFromText } from '../../features/records/featureKinds.mjs'
import { EMPLOYMENT_STATUSES, EMPLOYMENT_TYPES, GAP_NOTICE_DAYS, careerDetailError, careerPeriodNotes, employmentTypeLabel, periodLabel } from '../../features/career/careerPeriods.mjs'
import { localDate } from '../../utils/postValidation.mjs'
import { tr } from '../../store/locale'
import { createSaveState, saveFailureMessage } from '../../features/records/saveState.mjs'
import {
  workPrivacy, VISIBILITY, isPortfolioShared, togglePortfolioShared, logAccess,
} from '../../store/workPrivacy'
import { aiSettings, isFeatureOn } from '../../store/aiSettings'
import { useCapabilityStatus } from '../../features/integrations/useCapabilityStatus.mjs'
import HelpPopover from '../../components/HelpPopover.vue'
import PortfolioLinkPanel from '../../components/PortfolioLinkPanel.vue'
import DocumentVersionPanel from '../../components/DocumentVersionPanel.vue'
import { activityStore } from '../../store/careerLedger'
import { MAX_ACTIVITIES, MAX_LINKS, PORTFOLIO_SECTIONS, evidenceOf, filledSections, linksFromText, portfolioDraft, portfolioValues } from '../../features/career/portfolioItems.mjs'
import { exportPdf, exportWord, sectionsToHtml } from '../../store/docExport'

/**
 * 경력기술서 · 이력서 · 포트폴리오.
 * 세 탭 모두 기본이 나만 보기이며, 포트폴리오만 항목 단위로 링크 공개를 켤 수 있다.
 */
const tab = ref('career')
const TABS = [
  { id: 'career', label: '경력기술서' },
  { id: 'resume', label: '이력서' },
  { id: 'cover', label: '자기소개서' },
  { id: 'portfolio', label: '포트폴리오' },
  { id: 'privacy', label: '보안 설정' },
]

const demoProjects = ref([
  {
    id: 1,
    title: '타임바 다이어리 리뉴얼',
    period: '2026.03 ~ 2026.09',
    role: '프론트엔드 리드',
    company: '타임바',
    stack: 'Vue 3, Vite, Spring Boot',
    achievements: ['설계 화면 120종 재구축', '초기 렌더 시간 42% 단축', '디자인 토큰 시스템 도입'],
  },
  {
    id: 2,
    title: '사내 근태 자동 집계',
    period: '2025.07 ~ 2025.12',
    role: '백엔드 개발',
    company: '타임바',
    stack: 'Java 17, MySQL',
    achievements: ['월 마감 공수 8시간 → 30분', '공수 편차 5% 이내 유지'],
  },
])

const demoResume = ref({
  name: '김지수',
  headline: '기록으로 팀의 리듬을 만드는 프로덕트 엔지니어',
  years: 6,
  skills: 'Vue 3 · TypeScript · Spring Boot · MySQL · 디자인 시스템',
  education: '한국대학교 컴퓨터공학 학사 (2020)',
})

const demoPortfolio = ref([
  { id: 1, title: '타임바 리뉴얼 케이스 스터디', kind: '케이스 스터디', updated: '2026.09.02' },
  { id: 2, title: '디자인 토큰 시스템 문서', kind: '문서', updated: '2026.08.18' },
  { id: 3, title: '근태 자동화 회고', kind: '회고', updated: '2025.12.20' },
])

/* 로그인 상태는 계정의 서버 기록(PR-07 7단계), 로그아웃 상태는 위 예시를 보인다 */
const careerMode = careerStore.mode
const onServer = computed(() => careerMode.value === 'server')
const projects = computed(() => (onServer.value ? careerStore.list.value : demoProjects.value))
const portfolio = computed(() => (onServer.value ? portfolioStore.list.value : demoPortfolio.value))
const resumeDraft = ref({ ...resumeStore.state.value })
// 자기소개서(PR-25 Q-41): 로그인 상태에서만 쓰고 계정에 하나다. 회사별 제출본은 아래 버전으로 남긴다
const coverDraft = ref({ ...coverLetterStore.state.value })
const resume = computed(() => (onServer.value ? resumeDraft.value : demoResume.value))
watch(careerMode, async (mode) => {
  if (mode !== 'server') return
  await resumeStore.load()
  resumeDraft.value = { ...resumeStore.state.value }
  await coverLetterStore.load()
  coverDraft.value = { ...coverLetterStore.state.value }
}, { immediate: true })
const listMessage = ref('')

/* 경력 프로젝트 추가·수정(로그인 상태) */
const projectEditor = ref(null)
const projectSaving = createSaveState({ fields: { title: ['title', '제목'], role: ['role', '역할'] } })
const projectConflict = ref(null)
const projectDetailError = computed(() => (projectEditor.value ? careerDetailError(projectEditor.value.draft) : ''))
const projectCanSave = computed(() => !!projectEditor.value?.draft.title.trim() && !!projectEditor.value?.draft.role.trim() && !projectDetailError.value)
function openProject(p = null) {
  projectSaving.reset()
  projectConflict.value = null
  projectEditor.value = {
    base: p ? { ...p } : null,
    draft: {
      title: p?.title ?? '', period: p?.period ?? '', role: p?.role ?? '', company: p?.company ?? '', stack: p?.stack ?? '', achievementsText: (p?.achievements ?? []).join('\n'),
      employmentType: p?.employmentType ?? '', department: p?.department ?? '', startDate: p?.startDate ?? '', endDate: p?.endDate ?? '', employmentStatus: p?.employmentStatus ?? '', duties: p?.duties ?? '',
    },
  }
}
async function saveProject() {
  const { base, draft } = projectEditor.value
  if (!projectCanSave.value) return
  const values = {
    title: draft.title.trim(), period: draft.period, role: draft.role.trim(), company: draft.company, stack: draft.stack, achievements: achievementsFromText(draft.achievementsText),
    employmentType: draft.employmentType, department: draft.department, startDate: draft.startDate, endDate: draft.employmentStatus === 'current' ? '' : draft.endDate, employmentStatus: draft.employmentStatus, duties: draft.duties,
  }
  projectConflict.value = null
  const result = await projectSaving.run(() => (base ? careerStore.update(base, values) : careerStore.create(values)))
  if (result.ok) { projectEditor.value = null; return }
  if (result.error.kind === 'conflict') projectConflict.value = { latest: { ...(result.error.latest ?? base) } }
}
const projectCompareRows = computed(() => {
  if (!projectConflict.value) return []
  const latest = projectConflict.value.latest, mine = projectEditor.value.draft
  return [
    { label: '프로젝트', mine: mine.title.trim(), latest: latest.title },
    { label: '기간 · 역할', mine: periodLabel(mine, tr) + ' · ' + mine.role, latest: periodLabel(latest, tr) + ' · ' + latest.role },
    { label: '회사 · 부서', mine: [mine.company, mine.department].filter(Boolean).join(' · '), latest: [latest.company, latest.department].filter(Boolean).join(' · ') },
    { label: '고용 형태 · 상태', mine: detailLabel(mine), latest: detailLabel(latest) },
    { label: '담당 업무', mine: mine.duties ?? '', latest: latest.duties ?? '' },
    { label: '성과', mine: achievementsFromText(mine.achievementsText).join('\n'), latest: (latest.achievements ?? []).join('\n') },
  ]
})
function detailLabel(p) {
  return [employmentTypeLabel(p.employmentType), EMPLOYMENT_STATUSES.find((item) => item.value === p.employmentStatus)?.label].filter(Boolean).map((label) => tr(label)).join(' · ')
}
/* 기간 겹침·공백 안내(REQ-F25). 저장은 막지 않는다 */
const periodNotes = computed(() => (onServer.value ? careerPeriodNotes(projects.value, localDate()) : { overlaps: [], gaps: [], compared: 0 }))
function keepMyProject() {
  projectEditor.value.base = { ...projectConflict.value.latest }
  projectConflict.value = null
  saveProject()
}
function useLatestProject() {
  openProject(projectConflict.value.latest)
}
async function removeProject(p) {
  if (!window.confirm(tr('‘{title}’ 프로젝트를 삭제할까요?', { title: p.title }))) return
  listMessage.value = ''
  try { await careerStore.remove(p) } catch (error) {
    if (error.kind !== 'stale' && error.kind !== 'notFound') listMessage.value = error.kind === 'conflict' ? tr('다른 곳에서 먼저 고쳐서 삭제하지 않았어요. 최신 내용을 확인한 뒤 다시 삭제해 주세요.') : tr(saveFailureMessage(error).replace('저장하지', '삭제하지'))
  }
}

/* 이력서 저장(로그인 상태). 처음 저장은 version 없이, 그 뒤에는 받은 version으로 보낸다 */
const resumeSaving = createSaveState({ fields: { name: ['name', '이름'], years: ['years', '경력'] } })
const resumeConflict = ref(null)
async function saveResume() {
  resumeConflict.value = null
  const result = await resumeSaving.run(() => resumeStore.save(resumeDraft.value))
  if (result.ok) { resumeDraft.value = { ...result.value }; return }
  if (result.error.kind === 'conflict' && result.error.latest) resumeConflict.value = { latest: result.error.latest, version: result.error.latestVersion }
}
const resumeCompareRows = computed(() => {
  if (!resumeConflict.value) return []
  const latest = resumeConflict.value.latest, mine = resumeDraft.value
  return ['name', 'headline', 'years', 'skills', 'education'].map((key) => ({ label: { name: '이름', headline: '한 줄 소개', years: '경력', skills: '보유 기술', education: '학력' }[key], mine: String(mine[key] ?? ''), latest: String(latest[key] ?? '') }))
})
function keepMyResume() {
  resumeStore.adopt(resumeConflict.value.latest, resumeConflict.value.version)
  resumeConflict.value = null
  saveResume()
}
function useLatestResume() {
  resumeStore.adopt(resumeConflict.value.latest, resumeConflict.value.version)
  resumeDraft.value = { ...resumeConflict.value.latest }
  resumeConflict.value = null
  resumeSaving.reset()
}

/* 자기소개서 저장(로그인 상태). 이력서와 같은 version·충돌 처리다 */
const coverSaving = createSaveState({ fields: { title: ['title', '제목'] } })
const coverConflict = ref(null)
async function saveCover() {
  coverConflict.value = null
  const result = await coverSaving.run(() => coverLetterStore.save(coverDraft.value))
  if (result.ok) { coverDraft.value = { ...result.value }; return }
  if (result.error.kind === 'conflict' && result.error.latest) coverConflict.value = { latest: result.error.latest, version: result.error.latestVersion }
}
const coverCompareRows = computed(() => {
  if (!coverConflict.value) return []
  const latest = coverConflict.value.latest, mine = coverDraft.value
  return [{ key: 'title', label: '제목' }, ...COVER_LETTER_SECTIONS].map((sec) => ({ label: sec.label, mine: String(mine[sec.key] ?? ''), latest: String(latest[sec.key] ?? '') }))
})
function keepMyCover() {
  coverLetterStore.adopt(coverConflict.value.latest, coverConflict.value.version)
  coverConflict.value = null
  saveCover()
}
function useLatestCover() {
  coverLetterStore.adopt(coverConflict.value.latest, coverConflict.value.version)
  coverDraft.value = { ...coverConflict.value.latest }
  coverConflict.value = null
  coverSaving.reset()
}

/* 포트폴리오 항목 추가·수정·삭제(로그인 상태). 구성 칸·결과물 링크·근거 연결은 PR-26 */
const PORTFOLIO_KINDS = ['케이스 스터디', '문서', '회고', '기타']
// 종류는 한국어로 저장한다. 정해진 종류만 화면 언어로 보이고, 예전에 직접 적은 값은 그대로 둔다
const kindText = (kind) => (PORTFOLIO_KINDS.includes(kind) ? tr(kind) : kind)
const portfolioEditor = ref(null)
const portfolioSaving = createSaveState({ fields: { title: ['title', '제목'], kind: ['kind', '종류'], links: ['links', '결과물 링크'] } })
const portfolioConflict = ref(null)
const activities = computed(() => activityStore.list.value)
const evidenceLoaded = computed(() => !!activityStore.state.loaded && !!careerStore.state.loaded)
const evidence = (p) => evidenceOf(p, { activities: activities.value, experiences: careerStore.list.value, loaded: evidenceLoaded.value })
const portfolioLinks = computed(() => (portfolioEditor.value ? linksFromText(portfolioEditor.value.draft.linksText) : { links: [], invalid: [] }))
const portfolioBroken = computed(() => (portfolioEditor.value ? evidence(portfolioEditor.value.draft).activities.filter((a) => a.broken) : []))
const portfolioCanSave = computed(() => {
  const draft = portfolioEditor.value?.draft
  return !!draft?.title.trim() && !portfolioLinks.value.invalid.length && portfolioLinks.value.links.length <= MAX_LINKS && draft.activityIds.length <= MAX_ACTIVITIES
})
function openPortfolio(p = null) {
  portfolioSaving.reset()
  portfolioConflict.value = null
  portfolioEditor.value = { base: p ? { ...p } : null, draft: portfolioDraft(p, PORTFOLIO_KINDS[0]) }
}
function toggleEvidence(id) {
  const ids = portfolioEditor.value.draft.activityIds
  portfolioEditor.value.draft.activityIds = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
}
async function savePortfolio() {
  if (!portfolioCanSave.value) return
  const { base, draft } = portfolioEditor.value
  const values = portfolioValues(draft)
  portfolioConflict.value = null
  const result = await portfolioSaving.run(() => (base ? portfolioStore.update(base, values) : portfolioStore.create(values)))
  if (result.ok) { portfolioEditor.value = null; return }
  if (result.error.kind === 'conflict') portfolioConflict.value = { latest: { ...(result.error.latest ?? base) } }
}
const portfolioCompareRows = computed(() => {
  if (!portfolioConflict.value) return []
  const latest = portfolioConflict.value.latest, mine = portfolioValues(portfolioEditor.value.draft)
  return [
    { label: '항목 · 종류', mine: mine.title + ' · ' + mine.kind, latest: (latest.title ?? '') + ' · ' + (latest.kind ?? '') },
    ...PORTFOLIO_SECTIONS.map((sec) => ({ label: sec.label, mine: mine[sec.key], latest: String(latest[sec.key] ?? '') })),
    { label: '결과물 링크', mine: mine.links.join('\n'), latest: (latest.links ?? []).join('\n') },
  ]
})
function keepMyPortfolio() {
  portfolioEditor.value.base = { ...portfolioConflict.value.latest }
  portfolioConflict.value = null
  savePortfolio()
}
function useLatestPortfolio() {
  openPortfolio(portfolioConflict.value.latest)
}
async function removePortfolio(p) {
  if (!window.confirm(tr('‘{title}’ 항목을 삭제할까요?', { title: p.title }))) return
  listMessage.value = ''
  try { await portfolioStore.remove(p) } catch (error) {
    if (error.kind !== 'stale' && error.kind !== 'notFound') listMessage.value = error.kind === 'conflict' ? tr('다른 곳에서 먼저 고쳐서 삭제하지 않았어요. 최신 내용을 확인한 뒤 다시 삭제해 주세요.') : tr(saveFailureMessage(error).replace('저장하지', '삭제하지'))
  }
}

function mask(v) {
  return workPrivacy.maskCompanyNames ? v.replace(/./g, '•') : v
}

/* 경력기술서 문장 생성 — AI 연동이 꺼져 있으면 규칙 기반으로 만든다 */
// AI 다듬기 안내는 서버 제공 상태 기준이다. 확인 중·확인 실패에는 아무 안내도 하지 않는다
const { state: aiStatus } = useCapabilityStatus(() => 'ai')
const careerAiOn = computed(() => isFeatureOn('career-doc', aiStatus.available))
const generating = ref(null)
const generated = ref('')
function generateStatement(p) {
  generating.value = p
  const head = periodLabel(p) + ' · ' + p.role + ' (' + (workPrivacy.maskCompanyNames ? '회사명 비공개' : p.company) + ')'
  const body = p.achievements.map((a) => '- ' + a).join('\n')
  generated.value = [
    head,
    '',
    p.title + ' 프로젝트에서 ' + p.role + '로 참여해 다음 성과를 만들었습니다.',
    body,
    '',
    '사용 기술: ' + p.stack,
  ].join('\n')
  logAccess('경력기술서 문장 생성 · ' + p.title)
}

/* ---------- PDF · Word 내보내기 ---------- */
const exportNotice = ref('')
function watermark() {
  return workPrivacy.watermarkExports ? '타임바 다이어리 · ' + resume.value.name + ' · ' + new Date().toISOString().slice(0, 10) : ''
}
function companyLabel(p) {
  return workPrivacy.maskCompanyNames ? '회사명 비공개' : p.company
}
/** 탭별로 내보낼 문서 구조를 만든다 — 마스킹 설정이 그대로 반영된다 */
function buildDoc(kind) {
  if (kind === 'career') {
    const sections = [
      { type: 'title', text: resume.value.name + ' 경력기술서' },
      { type: 'meta', text: '작성일 ' + new Date().toISOString().slice(0, 10) + ' · 프로젝트 ' + projects.value.length + '건' },
    ]
    projects.value.forEach((p) => {
      sections.push({ type: 'h2', text: p.title })
      sections.push({ type: 'meta', text: [periodLabel(p), p.role, companyLabel(p), p.department, employmentTypeLabel(p.employmentType)].filter(Boolean).join(' · ') })
      if (p.duties) sections.push({ type: 'p', text: '담당 업무: ' + p.duties })
      sections.push({ type: 'list', items: p.achievements })
      sections.push({ type: 'p', text: '사용 기술: ' + p.stack })
    })
    return { title: resume.value.name + ' 경력기술서', sections }
  }
  if (kind === 'cover') {
    const c = coverDraft.value
    return {
      title: resume.value.name + ' 자기소개서',
      sections: [{ type: 'title', text: c.title || '자기소개서' }, ...COVER_LETTER_SECTIONS.filter((sec) => String(c[sec.key] ?? '').trim()).flatMap((sec) => [{ type: 'h2', text: sec.label }, { type: 'p', text: c[sec.key] }])],
    }
  }
  if (kind === 'resume') {
    return {
      title: resume.value.name + ' 이력서',
      sections: [
        { type: 'title', text: resume.value.name },
        { type: 'meta', text: resume.value.headline + ' · 경력 ' + resume.value.years + '년' },
        { type: 'h2', text: '보유 기술' },
        { type: 'p', text: resume.value.skills },
        { type: 'h2', text: '학력' },
        { type: 'p', text: resume.value.education },
        { type: 'h2', text: '주요 경력' },
        {
          type: 'table',
          head: ['기간', '역할', '소속', '프로젝트'],
          rows: projects.value.map((p) => [periodLabel(p), p.role, companyLabel(p), p.title]),
        },
      ],
    }
  }
  const items = portfolio.value
  return {
    title: resume.value.name + ' 포트폴리오',
    sections: [
      { type: 'title', text: resume.value.name + ' 포트폴리오' },
      { type: 'meta', text: '항목 ' + items.length + '건 · 공개 범위 ' + VISIBILITY[workPrivacy.portfolioVisibility].label },
      { type: 'table', head: ['항목', '종류', '수정일'], rows: items.map((p) => [p.title, p.kind, p.updated]) },
      // 항목별 구성 칸과 결과물 링크(PR-26). 근거 연결(활동·경력)은 내보내지 않는다
      ...items.flatMap((p) => [
        { type: 'h2', text: p.title },
        ...filledSections(p).flatMap((sec) => [{ type: 'meta', text: sec.label }, { type: 'p', text: sec.value }]),
        ...((p.links ?? []).length ? [{ type: 'meta', text: '결과물 링크' }, { type: 'list', items: p.links }] : []),
      ]),
    ],
  }
}
function exportDoc(format) {
  const kind = tab.value === 'privacy' ? 'career' : tab.value
  const doc = buildDoc(kind)
  const bodyHtml = sectionsToHtml(doc.sections)
  const result = format === 'pdf'
    ? exportPdf({ title: doc.title, bodyHtml, watermark: watermark() })
    : exportWord({ title: doc.title, bodyHtml, watermark: watermark() })
  if (!result.ok) {
    exportNotice.value = result.reason
    setTimeout(() => (exportNotice.value = ''), 4000)
    return
  }
  logAccess(doc.title + ' ' + (format === 'pdf' ? 'PDF' : 'Word') + ' 내보내기')
  exportNotice.value = tr('내보냈어요. 열람 기록에 남았습니다.')
  setTimeout(() => (exportNotice.value = ''), 3000)
}

const sharedCount = computed(() => portfolio.value.filter((p) => isPortfolioShared(p.id)).length)
function onVisibilityChange(v) {
  workPrivacy.portfolioVisibility = v
  if (v === 'private') workPrivacy.portfolioSharedIds = []
  logAccess('포트폴리오 공개 범위를 ' + VISIBILITY[v].label + '(으)로 변경')
}
</script>

<template>
  <div class="page-tools">
    <b style="font-size: 1rem">{{ tr('경력 · 이력 · 포트폴리오') }}</b>
    <HelpPopover
      :title="tr('경력 · 이력 · 포트폴리오 사용법')"
      :summary="tr('프로젝트 기록을 경력기술서·이력서·포트폴리오로 정리하고, 필요할 때 PDF나 Word로 내보내는 화면이에요. 모든 내용은 기본이 나만 보기입니다.')"
      :steps="[
        tr('경력기술서 탭에서 프로젝트별 성과를 확인하고 ‘문장 만들기’로 초안을 뽑아요.'),
        tr('이력서 탭에서 기본 정보와 보유 기술을 채워요.'),
        tr('포트폴리오 탭에서 공개 범위를 정하고, 링크 공개할 항목만 골라요.'),
        tr('오른쪽 위 PDF/Word 버튼으로 지금 보고 있는 탭을 문서로 내보내요.'),
      ]"
      :terms="[
        { term: tr('나만 보기'), desc: tr('어디에도 공개되지 않는 기본 상태예요. 커뮤니티·랭킹·검색 어디에도 나오지 않아요.') },
        { term: tr('링크가 있는 사람'), desc: tr('포트폴리오에만 쓸 수 있는 옵션으로, 링크를 받은 사람이 고른 항목만 볼 수 있어요.') },
        { term: tr('워터마크'), desc: tr('내보낸 문서 하단에 작성자와 날짜를 남겨 유출 경로를 추적할 수 있게 해요.') },
      ]"
      :tips="[
        tr('회사명 가리기를 켜면 내보낸 문서에도 회사명이 •로 나가요.'),
        tr('내보내기는 열람 기록에 남아 나중에 확인할 수 있어요.'),
      ]"
    />
    <span class="badge danger">{{ tr('비공개 · 타 사용자 노출 없음') }}</span>
    <span></span>
    <button class="review" style="margin: 0" @click="exportDoc('pdf')">{{ tr('PDF 내보내기') }}</button>
    <button class="review" style="margin: 0" @click="exportDoc('word')">{{ tr('Word 내보내기') }}</button>
  </div>
  <p v-if="exportNotice" class="badge ok" style="display: inline-block; margin-bottom: 12px">{{ tr(exportNotice) }}</p>

  <div class="tabs" style="width: fit-content; margin-bottom: 16px">
    <button v-for="t in TABS" :key="t.id" :class="{ selected: tab === t.id }" @click="tab = t.id">{{ tr(t.label) }}</button>
  </div>

  <!-- 경력기술서 -->
  <p v-if="!onServer" class="input-field-help career-note">{{ tr('지금 보이는 경력·이력서·포트폴리오는 예시예요. 로그인하면 계정에 저장하고 고칠 수 있어요.') }}</p>
  <p v-if="listMessage" class="input-field-help" data-state="error" role="status">{{ tr(listMessage) }}</p>
  <template v-if="tab === 'career'">
    <p v-if="onServer && careerStore.state.loading && !careerStore.state.loaded" class="input-field-help" role="status">{{ tr('경력을 불러오는 중이에요.') }}</p>
    <div v-else-if="onServer && careerStore.state.error && !careerStore.state.loaded" class="empty-state" role="status"><p>{{ tr('경력을 불러오지 못했어요. 연결을 확인하고 다시 시도해 주세요.') }}</p><button type="button" class="button-secondary" @click="careerStore.reload()">{{ tr('다시 시도') }}</button></div>
    <div v-else-if="onServer && !projects.length" class="empty-state" role="status"><p>{{ tr('아직 남긴 경력 프로젝트가 없어요. 프로젝트를 추가해 보세요.') }}</p></div>
    <button v-if="onServer" type="button" class="button-secondary" style="margin-bottom: 12px" @click="openProject()">{{ tr('프로젝트 추가') }}</button>
    <div v-if="periodNotes.overlaps.length || periodNotes.gaps.length" class="career-period-notes" role="note">
      <p class="section-label">{{ tr('기간 확인') }}</p>
      <ul>
        <li v-for="[a, b] in periodNotes.overlaps" :key="'o' + a.id + '-' + b.id">{{ tr('‘{a}’, ‘{b}’ 기간이 겹쳐요. 겸직이나 동시 프로젝트라면 그대로 두셔도 돼요.', { a: a.title, b: b.title }) }}</li>
        <li v-for="gap in periodNotes.gaps" :key="'g' + gap.after.id + '-' + gap.before.id">{{ tr('‘{after}’ 뒤 ‘{before}’ 시작까지 {days}일이 비어요.', { after: gap.after.title, before: gap.before.title, days: gap.days }) }}</li>
      </ul>
      <p class="input-field-help">{{ tr('시작일이 있는 경력만 비교해요. 공백은 {n}일보다 길 때만 알려요.', { n: GAP_NOTICE_DAYS }) }}</p>
    </div>
    <section class="card" v-for="p in projects" :key="p.id" style="margin-bottom: 12px">
      <div class="head">
        <div>
          <h3 style="margin: 0">{{ p.title }}</h3>
          <p style="margin: 4px 0 0">{{ [periodLabel(p, tr), p.role, workPrivacy.maskCompanyNames ? mask(p.company ?? '') : p.company, p.department, p.employmentType ? tr(employmentTypeLabel(p.employmentType)) : ''].filter(Boolean).join(' · ') }}</p>
        </div>
        <span style="display: flex; flex-wrap: wrap; gap: 6px">
          <button class="review" style="margin: 0" @click="generateStatement(p)">{{ tr('문장 만들기') }}</button>
          <template v-if="onServer">
            <button class="review" style="margin: 0" @click="openProject(p)">{{ tr('수정') }}</button>
            <button class="review" style="margin: 0" @click="removeProject(p)">{{ tr('삭제') }}</button>
          </template>
        </span>
      </div>
      <p v-if="p.duties" class="career-duties">{{ tr('담당 업무: {text}', { text: p.duties }) }}</p>
      <ul class="career-list">
        <li v-for="a in p.achievements" :key="a">{{ a }}</li>
      </ul>
      <p class="form-note" style="margin: 8px 0 0">{{ tr('기술: {text}', { text: p.stack }) }}</p>
    </section>
    <p class="form-note">
      {{ tr('프로젝트 단위로 계속 갱신할 수 있어요.') }}
      <template v-if="careerAiOn">{{ tr('AI 문장 다듬기가 켜져 있어요.') }}</template>
      <template v-else-if="aiStatus.available === false">{{ tr('AI 기능은 준비 중이에요. 지금은 규칙 기반으로 만들어요.') }}</template>
      <template v-else-if="aiStatus.available === true">{{ tr('AI 다듬기는 설정 > 자동화 > AI 연동에서 민감 데이터 사용에 동의해야 켜집니다.') }}</template>
    </p>
    <DocumentVersionPanel v-if="onServer" document="career" />
  </template>

  <!-- 이력서 -->
  <template v-else-if="tab === 'resume'">
    <section class="card">
      <h3>{{ tr('기본 정보') }}</h3>
      <div class="form-row" style="margin-top: 12px">
        <label style="flex: 1">{{ tr('이름') }}<input v-model="resume.name" /></label>
        <label style="flex: 1">{{ tr('경력') }}<input type="number" min="0" v-model.number="resume.years" /></label>
      </div>
      <label>{{ tr('한 줄 소개') }}<input v-model="resume.headline" /></label>
      <label>{{ tr('보유 기술') }}<input v-model="resume.skills" /></label>
      <label>{{ tr('학력') }}<input v-model="resume.education" /></label>
      <p class="form-note">{{ tr('이력서는 어떤 경우에도 커뮤니티·랭킹·공유 화면에 나타나지 않아요.') }}</p>
      <template v-if="onServer">
        <ConflictCompare v-if="resumeConflict" :rows="resumeCompareRows" :busy="resumeSaving.state.status === 'saving'" @keep-mine="keepMyResume" @use-latest="useLatestResume" />
        <SaveStatus :state="resumeSaving.state" mode="server" @retry="saveResume" />
        <button type="button" class="button-secondary" style="margin-top: 12px" :disabled="!resume.name.trim() || !!resumeConflict || !resumeStore.state.loaded" :aria-busy="resumeSaving.state.status === 'saving' ? 'true' : undefined" @click="saveResume">{{ resumeSaving.state.status === 'saving' ? tr('저장하는 중') : tr('이력서 저장') }}</button>
        <p v-if="resumeStore.state.error" class="input-field-help" data-state="error" role="status">{{ tr('이력서를 불러오지 못했어요. 새로고침한 뒤 다시 시도해 주세요.') }}</p>
      </template>
    </section>
    <DocumentVersionPanel v-if="onServer" document="resume" />
  </template>

  <!-- 자기소개서(PR-25 Q-41) -->
  <template v-else-if="tab === 'cover'">
    <div v-if="!onServer" class="empty-state" role="status"><p>{{ tr('자기소개서는 로그인하면 쓰고 계정에 저장할 수 있어요. 로그인한 뒤 이 탭을 다시 열어 주세요.') }}</p></div>
    <section v-else class="card cover-letter">
      <h3>{{ tr('자기소개서') }}</h3>
      <p class="form-note">{{ tr('회사별로 고친 글은 아래 \'버전\'에 이름을 붙여 남기고, 지원 기록에 제출본으로 이어 두세요. 자기소개서도 커뮤니티·랭킹·공유 화면에 나타나지 않아요.') }}</p>
      <label>{{ tr('제목') }}<input v-model="coverDraft.title" maxlength="200" :placeholder="tr('예: 기본 자기소개서')" /></label>
      <label v-for="sec in COVER_LETTER_SECTIONS" :key="sec.key">{{ tr(sec.label) }}<textarea v-model="coverDraft[sec.key]" rows="5" maxlength="20000"></textarea></label>
      <ConflictCompare v-if="coverConflict" :rows="coverCompareRows" :busy="coverSaving.state.status === 'saving'" @keep-mine="keepMyCover" @use-latest="useLatestCover" />
      <SaveStatus :state="coverSaving.state" mode="server" @retry="saveCover" />
      <p v-if="!coverDraft.title.trim()" class="form-note">{{ tr('제목을 넣어야 저장할 수 있어요.') }}</p>
      <button type="button" class="button-secondary" style="margin-top: 12px" :disabled="!coverDraft.title.trim() || !!coverConflict || !coverLetterStore.state.loaded" :aria-busy="coverSaving.state.status === 'saving' ? 'true' : undefined" @click="saveCover">{{ coverSaving.state.status === 'saving' ? tr('저장하는 중') : tr('자기소개서 저장') }}</button>
      <p v-if="coverLetterStore.state.error" class="input-field-help" data-state="error" role="status">{{ tr('자기소개서를 불러오지 못했어요. 새로고침한 뒤 다시 시도해 주세요.') }}</p>
    </section>
    <DocumentVersionPanel v-if="onServer" document="cover-letter" />
  </template>

  <!-- 포트폴리오 -->
  <template v-else-if="tab === 'portfolio'">
    <!-- 로그인 상태: 계정 포트폴리오의 공개 링크(Q-22). 아래 공개 범위 토글은 로그아웃 상태의 예시에만 쓴다 -->
    <PortfolioLinkPanel v-if="onServer" :items="portfolio" />
    <section v-else class="card" style="margin-bottom: 16px">
      <div class="head">
        <div><h3 style="margin: 0">{{ tr('공개 범위') }}</h3><p style="margin: 4px 0 0">{{ tr(VISIBILITY[workPrivacy.portfolioVisibility].desc) }}</p></div>
        <span class="badge" :class="workPrivacy.portfolioVisibility === 'private' ? 'ok' : 'warn'">
          {{ tr(VISIBILITY[workPrivacy.portfolioVisibility].label) }}
        </span>
      </div>
      <div class="filter" style="width: fit-content; margin-top: 12px">
        <button v-for="(v, key) in VISIBILITY" :key="key" :class="{ selected: workPrivacy.portfolioVisibility === key }" @click="onVisibilityChange(key)">
          {{ tr(v.label) }}
        </button>
      </div>
      <p class="form-note">{{ tr('링크 공개를 켜도, 아래에서 직접 고른 항목만 열립니다. 지금 공개중인 항목 {n}개.', { n: sharedCount }) }}</p>
    </section>
    <button v-if="onServer" type="button" class="button-secondary" style="margin-bottom: 12px" @click="openPortfolio()">{{ tr('항목 추가') }}</button>
    <div v-if="onServer && portfolioStore.state.loaded && !portfolio.length" class="empty-state" role="status"><p>{{ tr('아직 포트폴리오 항목이 없어요. 항목을 추가해 보세요.') }}</p></div>

    <section class="card list">
      <div class="list-head" style="grid-template-columns: 2fr 1fr 1fr 1fr"><span>{{ tr('항목') }}</span><span>{{ tr('종류') }}</span><span>{{ tr('수정일') }}</span><span>{{ onServer ? tr('관리') : tr('링크 공개') }}</span></div>
      <div class="row" style="grid-template-columns: 2fr 1fr 1fr 1fr" v-for="p in portfolio" :key="p.id">
        <span class="portfolio-title">{{ p.title }}<small v-if="onServer && (p.activityIds?.length || p.experienceId)" class="portfolio-evidence">{{ tr('근거 {n}건', { n: evidence(p).activities.length + (p.experienceId ? 1 : 0) }) }}<template v-if="evidence(p).activities.some((a) => a.broken) || evidence(p).experience?.broken"> {{ tr('· 지워진 근거 있음') }}</template></small></span>
        <span class="tag">{{ kindText(p.kind) }}</span>
        <span class="figure">{{ p.updated }}</span>
        <span v-if="onServer" style="display: flex; align-items: center; gap: 6px"><button class="review" style="margin: 0" :aria-label="tr('{name} 수정', { name: p.title })" @click="openPortfolio(p)">{{ tr('수정') }}</button><button class="review" style="margin: 0" :aria-label="tr('{name} 삭제', { name: p.title })" @click="removePortfolio(p)">{{ tr('삭제') }}</button></span>
        <span v-else>
          <button
            type="button"
            role="switch"
            class="toggle"
            :aria-label="tr('{name} 링크 공개', { name: p.title })"
            :aria-checked="isPortfolioShared(p.id)"
            :disabled="workPrivacy.portfolioVisibility !== 'link'"
            :class="{ on: isPortfolioShared(p.id) }"
            :style="{ opacity: workPrivacy.portfolioVisibility === 'link' ? 1 : 0.4 }"
            @click="togglePortfolioShared(p.id)"
          ><em></em></button>
        </span>
      </div>
    </section>
    <DocumentVersionPanel v-if="onServer" document="portfolio" />
  </template>

  <!-- 보안 설정 -->
  <template v-else>
    <section class="card">
      <h3>{{ tr('보호 규칙') }}</h3>
      <label class="task" style="border: 0">
        <input type="checkbox" v-model="workPrivacy.maskCompanyNames" />
        <span style="flex: 1"><b>{{ tr('회사·기관명 가리기') }}</b><small>{{ tr('내보내기와 문장 생성에서 회사명을 •로 바꿔요') }}</small></span>
      </label>
      <label class="task" style="border: 0">
        <input type="checkbox" v-model="workPrivacy.excludeFromRanking" />
        <span style="flex: 1"><b>{{ tr('랭킹·비교에서 제외') }}</b><small>{{ tr('업무 기록이 갓생 랭킹이나 사용자 비교에 쓰이지 않아요') }}</small></span>
      </label>
      <label class="task" style="border: 0">
        <input type="checkbox" v-model="workPrivacy.excludeFromAi" />
        <span style="flex: 1"><b>{{ tr('AI 입력에서 제외') }}</b><small>{{ tr('AI 연동을 켜도 업무·경력 기록은 보내지 않아요') }}</small></span>
      </label>
      <label class="task" style="border: 0">
        <input type="checkbox" v-model="workPrivacy.watermarkExports" />
        <span style="flex: 1"><b>{{ tr('내보내기에 워터마크') }}</b><small>{{ tr('PDF·이미지로 내보낼 때 열람자 정보를 남겨요') }}</small></span>
      </label>
      <p class="form-note">
        {{ tr('업무 카테고리와 경력·이력·포트폴리오는 공유 페이로드 생성 단계에서 한 번 더 걸러져요. 설정과 무관하게 다른 사용자에게 목록조차 노출되지 않습니다.') }}
      </p>
    </section>

    <h3 style="margin: 24px 0 12px">{{ tr('열람 기록') }}</h3>
    <section class="card">
      <div class="event" v-for="a in workPrivacy.accessLog" :key="a.id">
        <i></i>
        <span style="flex: 1"><b>{{ a.what }}</b><small>{{ tr(a.who) }} · {{ tr(a.from) }}</small></span>
        <small class="figure">{{ a.at }}</small>
      </div>
    </section>
  </template>

  <Modal v-if="generating" :title="tr('{title} 경력기술서 문장', { title: generating.title })" wide @close="generating = null">
    <p class="form-note" style="margin-top: 0">
      {{ careerAiOn && !workPrivacy.excludeFromAi ? tr('AI 다듬기가 켜져 있어요.') : aiStatus.available === false ? tr('규칙 기반으로 만들었어요. AI 기능은 준비 중이에요.') : tr('규칙 기반으로 만들었어요. AI 다듬기는 꺼져 있습니다.') }}
    </p>
    <textarea class="report-draft" :value="generated" readonly rows="12"></textarea>

    <template #footer>
      <button class="primary" @click="generating = null">{{ tr('닫기') }}</button>
    </template>
  </Modal>
  <Modal v-if="projectEditor" :title="projectEditor.base ? tr('경력 프로젝트 수정') : tr('경력 프로젝트 추가')" @close="projectEditor = null">
    <label>{{ tr('프로젝트') }}<input v-model="projectEditor.draft.title" maxlength="200" /></label>
    <div class="career-detail-grid">
      <label>{{ tr('회사') }}<input v-model="projectEditor.draft.company" maxlength="200" /></label>
      <label>{{ tr('부서') }}<input v-model="projectEditor.draft.department" maxlength="200" /></label>
      <label>{{ tr('역할') }}<input v-model="projectEditor.draft.role" maxlength="200" /></label>
      <label>{{ tr('고용 형태') }}<select v-model="projectEditor.draft.employmentType"><option value="">{{ tr('선택 안 함') }}</option><option v-for="item in EMPLOYMENT_TYPES" :key="item.value" :value="item.value">{{ tr(item.label) }}</option></select></label>
    </div>
    <div class="career-detail-grid career-period-grid">
      <label>{{ tr('재직 상태') }}<select v-model="projectEditor.draft.employmentStatus"><option value="">{{ tr('선택 안 함') }}</option><option v-for="item in EMPLOYMENT_STATUSES" :key="item.value" :value="item.value">{{ tr(item.label) }}</option></select></label>
      <label>{{ tr('시작일') }}<input v-model="projectEditor.draft.startDate" type="date" /></label>
      <label>{{ tr('종료일') }}<input v-model="projectEditor.draft.endDate" type="date" :min="projectEditor.draft.startDate || undefined" :disabled="projectEditor.draft.employmentStatus === 'current'" :aria-describedby="projectEditor.draft.employmentStatus === 'current' ? 'career-end-help' : undefined" /></label>
    </div>
    <p v-if="projectEditor.draft.employmentStatus === 'current'" id="career-end-help" class="input-field-help">{{ tr('재직 중이면 종료일 없이 저장해요.') }}</p>
    <p v-if="!projectEditor.draft.startDate && projectEditor.draft.period" class="input-field-help">{{ tr('예전에 적은 기간: {period}. 시작일을 넣으면 날짜 기준으로 바뀌어요.', { period: projectEditor.draft.period }) }}</p>
    <p v-if="projectDetailError" class="input-field-help" data-state="error" role="alert">{{ tr(projectDetailError) }}</p>
    <label>{{ tr('담당 업무') }}<textarea v-model="projectEditor.draft.duties" rows="3" maxlength="20000"></textarea></label>
    <label>{{ tr('기술') }}<input v-model="projectEditor.draft.stack" maxlength="200" /></label>
    <label>{{ tr('성과 (한 줄에 하나)') }}<textarea v-model="projectEditor.draft.achievementsText" rows="5"></textarea></label>
    <p v-if="!projectEditor.draft.title.trim() || !projectEditor.draft.role.trim()" class="form-note">{{ tr('프로젝트와 역할을 입력해주세요.') }}</p>
    <p v-if="projectSaving.state.fieldMessage" class="input-field-help" data-state="error" role="alert">{{ tr(projectSaving.state.fieldMessage) }}</p>
    <ConflictCompare v-if="projectConflict" :rows="projectCompareRows" :busy="projectSaving.state.status === 'saving'" @keep-mine="keepMyProject" @use-latest="useLatestProject" />
    <SaveStatus :state="projectSaving.state" mode="server" @retry="saveProject" />
    <template #footer>
      <button type="button" class="modal-secondary" @click="projectEditor = null">{{ tr('취소') }}</button>
      <button class="primary" :disabled="!projectCanSave || !!projectConflict" :aria-busy="projectSaving.state.status === 'saving' ? 'true' : undefined" @click="saveProject">{{ projectSaving.state.status === 'saving' ? tr('저장하는 중') : tr('저장하기') }}</button>
    </template>
  </Modal>
  <Modal v-if="portfolioEditor" :title="portfolioEditor.base ? tr('포트폴리오 항목 수정') : tr('포트폴리오 항목 추가')" wide @close="portfolioEditor = null">
    <div class="career-detail-grid">
      <label>{{ tr('항목') }}<input v-model="portfolioEditor.draft.title" maxlength="200" /></label>
      <label>{{ tr('종류') }}<select v-model="portfolioEditor.draft.kind"><option v-for="kind in PORTFOLIO_KINDS" :key="kind" :value="kind">{{ tr(kind) }}</option></select></label>
    </div>
    <p class="input-field-help portfolio-public-note">{{ tr('공개 링크를 열면 아래 칸과 결과물 링크가 그대로 보여요. 회사 기밀·개인정보·비공개 저장소 내용은 적지 마세요. 근거 연결은 공개 화면에 나가지 않아요.') }}</p>
    <template v-for="sec in PORTFOLIO_SECTIONS" :key="sec.key">
      <label v-if="sec.long">{{ tr(sec.label) }}<textarea v-model="portfolioEditor.draft[sec.key]" rows="3" maxlength="20000"></textarea></label>
      <label v-else>{{ tr(sec.label) }}<input v-model="portfolioEditor.draft[sec.key]" maxlength="200" /></label>
    </template>
    <label>{{ tr('결과물 링크(한 줄에 하나, 최대 {n}개)', { n: MAX_LINKS }) }}<textarea v-model="portfolioEditor.draft.linksText" rows="2" placeholder="https://" :aria-invalid="portfolioLinks.invalid.length ? 'true' : undefined" aria-describedby="portfolio-links-help"></textarea></label>
    <p id="portfolio-links-help" class="input-field-help" :data-state="portfolioLinks.invalid.length || portfolioLinks.links.length > MAX_LINKS ? 'error' : undefined">{{ portfolioLinks.invalid.length ? tr('http 또는 https 주소만 넣을 수 있어요: {links}', { links: portfolioLinks.invalid.join(', ') }) : portfolioLinks.links.length > MAX_LINKS ? tr('결과물 링크는 {n}개까지예요.', { n: MAX_LINKS }) : tr('시연 주소나 결과물 문서 주소를 넣어요.') }}</p>
    <fieldset class="portfolio-evidence-pick">
      <legend>{{ tr('근거') }} <span class="figure">{{ portfolioEditor.draft.activityIds.length }}/{{ MAX_ACTIVITIES }}</span></legend>
      <p class="input-field-help">{{ tr('이 항목의 근거가 되는 경력과 커리어 활동을 골라요. 나만 보고, 지워진 근거는 저장할 때 빠져요.') }}</p>
      <label>{{ tr('연결할 경력') }}<select v-model="portfolioEditor.draft.experienceId"><option value="">{{ tr('연결 안 함') }}</option><option v-for="c in careerStore.list.value" :key="c.id" :value="c.id">{{ c.title }}</option></select></label>
      <p v-if="!activities.length" class="input-field-help">{{ tr('커리어 활동이 아직 없어요. 활동 타임라인에서 먼저 남겨 주세요.') }}</p>
      <div v-else class="portfolio-activity-list">
        <label v-for="a in activities" :key="a.id" class="menu-check"><input type="checkbox" :checked="portfolioEditor.draft.activityIds.includes(a.id)" :disabled="!portfolioEditor.draft.activityIds.includes(a.id) && portfolioEditor.draft.activityIds.length >= MAX_ACTIVITIES" @change="toggleEvidence(a.id)" />{{ a.date }} {{ a.title }}</label>
      </div>
      <p v-if="portfolioBroken.length" class="input-field-help">{{ tr('지워진 활동 {n}건은 저장할 때 빠져요.', { n: portfolioBroken.length }) }}</p>
    </fieldset>
    <p v-if="portfolioSaving.state.fieldMessage" class="input-field-help" data-state="error" role="alert">{{ tr(portfolioSaving.state.fieldMessage) }}</p>
    <ConflictCompare v-if="portfolioConflict" :rows="portfolioCompareRows" :busy="portfolioSaving.state.status === 'saving'" @keep-mine="keepMyPortfolio" @use-latest="useLatestPortfolio" />
    <SaveStatus :state="portfolioSaving.state" mode="server" @retry="savePortfolio" />
    <template #footer>
      <button type="button" class="modal-secondary" @click="portfolioEditor = null">{{ tr('취소') }}</button>
      <button class="primary" :disabled="!portfolioCanSave || !!portfolioConflict" :aria-busy="portfolioSaving.state.status === 'saving' ? 'true' : undefined" @click="savePortfolio">{{ portfolioSaving.state.status === 'saving' ? tr('저장하는 중') : portfolioEditor.base ? tr('저장하기') : tr('항목 추가') }}</button>
    </template>
  </Modal>
</template>

<style>
.career-note { display: block; margin: 0 0 var(--space-md); }
.career-period-notes { margin: 0 0 var(--space-md); padding: var(--space-md) var(--space-lg); border: 1px solid var(--color-hairline); border-radius: var(--radius-md); background: var(--color-card); }
.career-period-notes ul { margin: var(--space-xs) 0; padding-left: var(--space-lg); }
.career-duties { margin: var(--space-sm) 0 0; white-space: pre-line; overflow-wrap: anywhere; }
.cover-letter textarea { width: 100%; }
.portfolio-title { display: grid; gap: 2px; min-width: 0; overflow-wrap: anywhere; }
.portfolio-evidence { color: var(--color-muted); font-size: var(--type-caption-size); }
.portfolio-public-note { margin: var(--space-md) 0 0; }
.portfolio-evidence-pick { display: grid; gap: var(--space-xs); margin: var(--space-lg) 0 0; padding: var(--space-md); border: 1px solid var(--color-hairline); border-radius: var(--radius-md); min-width: 0; }
.portfolio-evidence-pick legend { padding: 0 var(--space-xs); font-weight: 600; }
.portfolio-evidence-pick p { margin: 0; }
.portfolio-activity-list { display: grid; max-height: 200px; overflow-y: auto; }
.portfolio-activity-list .menu-check { display: flex; align-items: center; gap: var(--space-sm); margin: 0; min-height: var(--input-height); font-weight: 400; overflow-wrap: anywhere; }
.portfolio-activity-list .menu-check input { width: auto; margin: 0; }
/* 경력 편집 창의 상세 입력. 좁은 화면에서는 한 열로 내린다. 전역 규칙의 첫 label 여백 0을 칸마다 같게 맞춘다 */
.career-detail-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); column-gap: var(--space-md); }
.career-period-grid { grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); }
.modal-card .career-detail-grid > label, .modal-card .career-detail-grid > label:first-child { margin-top: var(--space-lg); }
</style>
