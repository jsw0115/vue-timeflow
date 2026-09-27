<script setup>
import { computed, ref } from 'vue'
import Modal from '../../components/Modal.vue'
import {
  workPrivacy, VISIBILITY, isPortfolioShared, togglePortfolioShared, logAccess,
} from '../../store/workPrivacy'
import { aiSettings, isFeatureOn } from '../../store/aiSettings'
import HelpPopover from '../../components/HelpPopover.vue'
import { exportPdf, exportWord, sectionsToHtml } from '../../store/docExport'

/**
 * 경력기술서 · 이력서 · 포트폴리오.
 * 세 탭 모두 기본이 나만 보기이며, 포트폴리오만 항목 단위로 링크 공개를 켤 수 있다.
 */
const tab = ref('career')
const TABS = [
  { id: 'career', label: '경력기술서' },
  { id: 'resume', label: '이력서' },
  { id: 'portfolio', label: '포트폴리오' },
  { id: 'privacy', label: '보안 설정' },
]

const projects = ref([
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

const resume = ref({
  name: '김지수',
  headline: '기록으로 팀의 리듬을 만드는 프로덕트 엔지니어',
  years: 6,
  skills: 'Vue 3 · TypeScript · Spring Boot · MySQL · 디자인 시스템',
  education: '한국대학교 컴퓨터공학 학사 (2020)',
})

const portfolio = ref([
  { id: 1, title: '타임바 리뉴얼 케이스 스터디', kind: '케이스 스터디', updated: '2026.09.02' },
  { id: 2, title: '디자인 토큰 시스템 문서', kind: '문서', updated: '2026.08.18' },
  { id: 3, title: '근태 자동화 회고', kind: '회고', updated: '2025.12.20' },
])

function mask(v) {
  return workPrivacy.maskCompanyNames ? v.replace(/./g, '•') : v
}

/* 경력기술서 문장 생성 — AI 연동이 꺼져 있으면 규칙 기반으로 만든다 */
const generating = ref(null)
const generated = ref('')
function generateStatement(p) {
  generating.value = p
  const head = p.period + ' · ' + p.role + ' (' + (workPrivacy.maskCompanyNames ? '회사명 비공개' : p.company) + ')'
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
      sections.push({ type: 'meta', text: p.period + ' · ' + p.role + ' · ' + companyLabel(p) })
      sections.push({ type: 'list', items: p.achievements })
      sections.push({ type: 'p', text: '사용 기술: ' + p.stack })
    })
    return { title: resume.value.name + ' 경력기술서', sections }
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
          rows: projects.value.map((p) => [p.period, p.role, companyLabel(p), p.title]),
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
  exportNotice.value = '내보냈어요. 열람 기록에 남았습니다.'
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
    <b style="font-size: 1rem">경력 · 이력 · 포트폴리오</b>
    <HelpPopover
      title="경력 · 이력 · 포트폴리오 사용법"
      summary="프로젝트 기록을 경력기술서·이력서·포트폴리오로 정리하고, 필요할 때 PDF나 Word로 내보내는 화면이에요. 모든 내용은 기본이 나만 보기입니다."
      :steps="[
        '경력기술서 탭에서 프로젝트별 성과를 확인하고 ‘문장 만들기’로 초안을 뽑아요.',
        '이력서 탭에서 기본 정보와 보유 기술을 채워요.',
        '포트폴리오 탭에서 공개 범위를 정하고, 링크 공개할 항목만 골라요.',
        '오른쪽 위 PDF/Word 버튼으로 지금 보고 있는 탭을 문서로 내보내요.',
      ]"
      :terms="[
        { term: '나만 보기', desc: '어디에도 공개되지 않는 기본 상태예요. 커뮤니티·랭킹·검색 어디에도 나오지 않아요.' },
        { term: '링크가 있는 사람', desc: '포트폴리오에만 쓸 수 있는 옵션으로, 링크를 받은 사람이 고른 항목만 볼 수 있어요.' },
        { term: '워터마크', desc: '내보낸 문서 하단에 작성자와 날짜를 남겨 유출 경로를 추적할 수 있게 해요.' },
      ]"
      :tips="[
        '회사명 가리기를 켜면 내보낸 문서에도 회사명이 •로 나가요.',
        '내보내기는 열람 기록에 남아 나중에 확인할 수 있어요.',
      ]"
    />
    <span class="badge danger">비공개 · 타 사용자 노출 없음</span>
    <span></span>
    <button class="review" style="margin: 0" @click="exportDoc('pdf')">PDF 내보내기</button>
    <button class="review" style="margin: 0" @click="exportDoc('word')">Word 내보내기</button>
  </div>
  <p v-if="exportNotice" class="badge ok" style="display: inline-block; margin-bottom: 12px">{{ exportNotice }}</p>

  <div class="tabs" style="width: fit-content; margin-bottom: 16px">
    <button v-for="t in TABS" :key="t.id" :class="{ selected: tab === t.id }" @click="tab = t.id">{{ t.label }}</button>
  </div>

  <!-- 경력기술서 -->
  <template v-if="tab === 'career'">
    <section class="card" v-for="p in projects" :key="p.id" style="margin-bottom: 12px">
      <div class="head">
        <div>
          <h3 style="margin: 0">{{ p.title }}</h3>
          <p style="margin: 4px 0 0">{{ p.period }} · {{ p.role }} · {{ workPrivacy.maskCompanyNames ? mask(p.company) : p.company }}</p>
        </div>
        <button class="review" style="margin: 0" @click="generateStatement(p)">문장 만들기</button>
      </div>
      <ul class="career-list">
        <li v-for="a in p.achievements" :key="a">{{ a }}</li>
      </ul>
      <p class="form-note" style="margin: 8px 0 0">기술: {{ p.stack }}</p>
    </section>
    <p class="form-note">
      프로젝트 단위로 계속 갱신할 수 있어요.
      <template v-if="isFeatureOn('career-doc')">AI 문장 다듬기가 켜져 있어요.</template>
      <template v-else>AI 다듬기는 설정 &gt; 자동화 &gt; AI 연동에서 민감 데이터 사용에 동의해야 켜집니다.</template>
    </p>
  </template>

  <!-- 이력서 -->
  <template v-else-if="tab === 'resume'">
    <section class="card">
      <h3>기본 정보</h3>
      <div class="form-row" style="margin-top: 12px">
        <label style="flex: 1">이름<input v-model="resume.name" /></label>
        <label style="flex: 1">경력<input type="number" min="0" v-model.number="resume.years" /></label>
      </div>
      <label>한 줄 소개<input v-model="resume.headline" /></label>
      <label>보유 기술<input v-model="resume.skills" /></label>
      <label>학력<input v-model="resume.education" /></label>
      <p class="form-note">이력서는 어떤 경우에도 커뮤니티·랭킹·공유 화면에 나타나지 않아요.</p>
    </section>
  </template>

  <!-- 포트폴리오 -->
  <template v-else-if="tab === 'portfolio'">
    <section class="card" style="margin-bottom: 16px">
      <div class="head">
        <div><h3 style="margin: 0">공개 범위</h3><p style="margin: 4px 0 0">{{ VISIBILITY[workPrivacy.portfolioVisibility].desc }}</p></div>
        <span class="badge" :class="workPrivacy.portfolioVisibility === 'private' ? 'ok' : 'warn'">
          {{ VISIBILITY[workPrivacy.portfolioVisibility].label }}
        </span>
      </div>
      <div class="filter" style="width: fit-content; margin-top: 12px">
        <button v-for="(v, key) in VISIBILITY" :key="key" :class="{ selected: workPrivacy.portfolioVisibility === key }" @click="onVisibilityChange(key)">
          {{ v.label }}
        </button>
      </div>
      <p class="form-note">링크 공개를 켜도, 아래에서 직접 고른 항목만 열립니다. 지금 공개중인 항목 {{ sharedCount }}개.</p>
    </section>

    <section class="card list">
      <div class="list-head" style="grid-template-columns: 2fr 1fr 1fr 1fr"><span>항목</span><span>종류</span><span>수정일</span><span>링크 공개</span></div>
      <div class="row" style="grid-template-columns: 2fr 1fr 1fr 1fr" v-for="p in portfolio" :key="p.id">
        <label>{{ p.title }}</label>
        <span class="tag">{{ p.kind }}</span>
        <span class="figure">{{ p.updated }}</span>
        <span>
          <button
            type="button"
            role="switch"
            class="toggle"
            :aria-checked="isPortfolioShared(p.id)"
            :disabled="workPrivacy.portfolioVisibility !== 'link'"
            :class="{ on: isPortfolioShared(p.id) }"
            :style="{ opacity: workPrivacy.portfolioVisibility === 'link' ? 1 : 0.4 }"
            @click="togglePortfolioShared(p.id)"
          ><em></em></button>
        </span>
      </div>
    </section>
  </template>

  <!-- 보안 설정 -->
  <template v-else>
    <section class="card">
      <h3>보호 규칙</h3>
      <label class="task" style="border: 0">
        <input type="checkbox" v-model="workPrivacy.maskCompanyNames" />
        <span style="flex: 1"><b>회사·기관명 가리기</b><small>내보내기와 문장 생성에서 회사명을 •로 바꿔요</small></span>
      </label>
      <label class="task" style="border: 0">
        <input type="checkbox" v-model="workPrivacy.excludeFromRanking" />
        <span style="flex: 1"><b>랭킹·비교에서 제외</b><small>업무 기록이 갓생 랭킹이나 사용자 비교에 쓰이지 않아요</small></span>
      </label>
      <label class="task" style="border: 0">
        <input type="checkbox" v-model="workPrivacy.excludeFromAi" />
        <span style="flex: 1"><b>AI 입력에서 제외</b><small>AI 연동을 켜도 업무·경력 기록은 보내지 않아요</small></span>
      </label>
      <label class="task" style="border: 0">
        <input type="checkbox" v-model="workPrivacy.watermarkExports" />
        <span style="flex: 1"><b>내보내기에 워터마크</b><small>PDF·이미지로 내보낼 때 열람자 정보를 남겨요</small></span>
      </label>
      <p class="form-note">
        업무 카테고리와 경력·이력·포트폴리오는 공유 페이로드 생성 단계에서 한 번 더 걸러져요.
        설정과 무관하게 다른 사용자에게 목록조차 노출되지 않습니다.
      </p>
    </section>

    <h3 style="margin: 24px 0 12px">열람 기록</h3>
    <section class="card">
      <div class="event" v-for="a in workPrivacy.accessLog" :key="a.id">
        <i></i>
        <span style="flex: 1"><b>{{ a.what }}</b><small>{{ a.who }} · {{ a.from }}</small></span>
        <small class="figure">{{ a.at }}</small>
      </div>
    </section>
  </template>

  <Modal v-if="generating" :title="generating.title + ' 경력기술서 문장'" wide @close="generating = null">
    <p class="form-note" style="margin-top: 0">
      {{ isFeatureOn('career-doc') && !workPrivacy.excludeFromAi ? 'AI 다듬기가 켜져 있어요.' : '규칙 기반으로 만들었어요. AI 다듬기는 꺼져 있습니다.' }}
    </p>
    <textarea class="report-draft" :value="generated" readonly rows="12"></textarea>
    <button class="primary" @click="generating = null">닫기</button>
  </Modal>
</template>
