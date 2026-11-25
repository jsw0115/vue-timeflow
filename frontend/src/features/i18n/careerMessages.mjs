// 다국어 2단계(PR-32, 09 Q-38): 커리어 화면 본문 문구. 한국어가 원문이고 영어가 없으면 한국어 그대로다. 이번에는 커리어 대시보드부터 옮긴다.

export const CAREER_TEXT = {
  recordActivity: { ko: '활동 기록하기', en: 'Record an activity' },
  goalEyebrow: { ko: '커리어 목표', en: 'Career goal' },
  defaultTag: { ko: '기본값', en: 'Default' },
  goalNote: { ko: '목표는 화면 순서만 바꾸고 공개 범위나 권한은 바꾸지 않아요.', en: 'Your goal only changes the order of this page. It never changes who can see your records.' },
  close: { ko: '닫기', en: 'Close' },
  changeGoal: { ko: '목표 바꾸기', en: 'Change goal' },
  pickGoal: { ko: '지금 가장 가까운 목표를 골라 주세요', en: 'Pick the goal closest to you now' },
  selected: { ko: '선택됨', en: 'Selected' },
  saving: { ko: '저장하는 중이에요.', en: 'Saving.' },
  savesToAccount: { ko: '계정에 저장해요.', en: 'Saved to your account.' },
  savesToBrowser: { ko: '로그아웃 상태라 이 브라우저에 저장해요.', en: "You're signed out, so this is saved in this browser." },
  savingShort: { ko: '저장하는 중', en: 'Saving' },
  useGoal: { ko: '이 목표로 보기', en: 'Use this goal' },
  signedOut: { ko: '로그인하면 활동·경력·지원 기록을 계정에 모아 볼 수 있어요. 로그아웃 상태에서는 커리어 기록을 저장하지 않아요.', en: 'Sign in to collect your activities, experience and applications in your account. Career records are not saved while you are signed out.' },
  signIn: { ko: '로그인', en: 'Sign in' },
  'section.deadlines': { ko: '다가오는 마감·면접', en: 'Upcoming deadlines and interviews' },
  'section.pipeline': { ko: '지원 진행 현황', en: 'Application progress' },
  'section.activities': { ko: '최근 활동', en: 'Recent activities' },
  'section.experiences': { ko: '경력·경험', en: 'Experience' },
  'section.documents': { ko: '문서 준비', en: 'Documents' },
  applications: { ko: '지원 관리', en: 'Applications' },
  seeAll: { ko: '전체 보기', en: 'See all' },
  careerDocs: { ko: '경력·포트폴리오', en: 'Career & portfolio' },
  deadlinesBasis: { ko: '오늘부터 14일 안 · 진행 중인 지원 {open}건 기준', en: 'Next 14 days · Open applications: {open}' },
  loadingApplications: { ko: '지원 기록을 불러오는 중이에요.', en: 'Loading applications.' },
  applicationsFailed: { ko: '지원 기록을 불러오지 못했어요.', en: "Couldn't load applications." },
  retry: { ko: '다시 시도', en: 'Try again' },
  noUpcoming: { ko: '14일 안에 다가오는 마감이나 면접이 없어요. 지원 관리에서 마감·면접 날짜를 넣으면 여기에 보여요.', en: 'No deadlines or interviews in the next 14 days. Add dates in Applications and they appear here.' },
  pipelineBasis: { ko: '전체 지원 {all}건 · 진행 중 {open}건', en: 'Applications: {all} · Open: {open}' },
  noApplications: { ko: '아직 저장한 지원이 없어요. 관심 있는 공고부터 추가해 보세요.', en: 'No applications yet. Start with a posting you are interested in.' },
  count: { ko: '{n}건', en: '{n}' },
  activitiesBasis: { ko: '전체 활동 {all}건 중 최근 {recent}건', en: 'Activities: latest {recent} of {all}' },
  loadingActivities: { ko: '활동을 불러오는 중이에요.', en: 'Loading activities.' },
  activitiesFailed: { ko: '활동을 불러오지 못했어요.', en: "Couldn't load activities." },
  noActivities: { ko: '아직 남긴 활동이 없어요. 최근 업무나 학습 성과를 남기면 이력서·포트폴리오에 활용할 수 있어요.', en: 'No activities yet. Record recent work or study results to reuse them in your resume and portfolio.' },
  experiencesBasis: { ko: '경력 프로젝트 {n}건', en: 'Career projects: {n}' },
  loadingExperiences: { ko: '경력을 불러오는 중이에요.', en: 'Loading experience.' },
  noExperiences: { ko: '아직 경력 프로젝트가 없어요. 회사·인턴·프로젝트 경험을 추가하면 활동을 경력에 연결할 수 있어요.', en: 'No career projects yet. Add company, internship or project experience to link activities to it.' },
  resumeBasics: { ko: '이력서 기본 정보', en: 'Resume basics' },
  resumeFilled: { ko: '{total}개 중 {filled}개 입력', en: '{filled} of {total} filled' },
  portfolioItems: { ko: '포트폴리오 항목', en: 'Portfolio items' },
  resumeMissing: { ko: '{fields} 항목을 채우면 이력서를 내보낼 때 바로 쓸 수 있어요.', en: 'Fill in {fields} to export your resume right away.' },
  versionsHint: { ko: '지원 공고별로 낸 문서는 경력·포트폴리오에서 버전으로 남기고, 지원 기록의 "제출한 문서"에 이어 두세요.', en: 'Save the documents you send for each posting as versions in Career & portfolio, then attach them under "Submitted documents" in the application.' },
}

export const GOALS_EN = {
  'job-seeker': { label: 'Job seeking', desc: 'Shows application deadlines and stages, plus study and project records first.' },
  'job-changer': { label: 'Changing jobs', desc: 'Shows recent work records, experience and applications first.' },
  employee: { label: 'Growing at work', desc: 'Shows work records and experience first. Applications move to the back.' },
  'project-member': { label: 'Project work', desc: 'Shows project and study activities and deliverables first.' },
}
export const ACTIVITY_TYPES_EN = { work: 'Company work', intern: 'Internship', 'part-time': 'Part-time job', freelance: 'Freelance', project: 'Personal project', study: 'Study', community: 'Community activity' }
export const STATUSES_EN = { interested: 'Interested', preparing: 'Preparing', applied: 'Applied', 'screening-passed': 'Passed screening', interview: 'Interview scheduled', accepted: 'Offer accepted', rejected: 'Not selected', 'on-hold': 'On hold', withdrawn: 'Withdrawn' }
export const UPCOMING_EN = { '지원 마감': 'Application deadline', 면접: 'Interview' }
export const RESUME_FIELDS_EN = { 이름: 'Name', '한 줄 소개': 'Headline', 경력: 'Years of experience', '보유 기술': 'Skills', 학력: 'Education' }

export function careerText(key, locale, vars = {}) {
  const entry = CAREER_TEXT[key]
  if (!entry) return key
  const text = (locale === 'en' && entry.en) || entry.ko
  return text.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? ''))
}
const pick = (map, key, locale, korean) => (locale === 'en' && map[key]) || korean
export const goalText = (goal, locale) => ({ label: pick(GOALS_EN, goal.id, locale, null)?.label ?? goal.label, desc: pick(GOALS_EN, goal.id, locale, null)?.desc ?? goal.desc })
export const activityTypeText = (id, locale, korean) => pick(ACTIVITY_TYPES_EN, id, locale, korean)
export const statusText = (id, locale, korean) => pick(STATUSES_EN, id, locale, korean)
export const upcomingText = (label, locale) => pick(UPCOMING_EN, label, locale, label)
export const resumeFieldText = (label, locale) => pick(RESUME_FIELDS_EN, label, locale, label)
/** 남은 날 문구. 지난 마감도 비난하지 않는 중립 문구(DESIGN.md). */
export function dueText(days, locale, korean) {
  if (locale !== 'en' || days === null || days === undefined) return korean
  if (days === 0) return 'Today'
  return days > 0 ? `${days} day${days === 1 ? '' : 's'} left` : `${-days} day${days === -1 ? '' : 's'} ago`
}
