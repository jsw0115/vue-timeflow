// 본문까지 표시 언어로 옮긴 화면 경로(PR-32). 영어를 고르고 이 화면에 있으면 문서 언어(<html lang>)를 en으로 둔다.
// 대화 상자는 문서 끝에 붙어 영역별 lang이 닿지 않으므로 문서 언어로 맞춘다. 목록에 없는 화면은 본문이 한국어라 ko로 둔다.
export const TRANSLATED_PATHS = ['/career', '/career/activities', '/career/applications', '/work/career', '/planner', '/planner/daily', '/planner/weekly', '/planner/monthly', '/planner/yearly', '/tasks', '/events', '/memos', '/diary', '/diary/entry', '/routines', '/routines/history', '/dday', '/events/dday', '/money', '/diary/summary', '/events/templates', '/planner/templates', '/planner/canvas', '/work', '/work/wbs', '/work/wiki', '/work/labor', '/work/history', '/', '/notifications', '/calendar', '/stats', '/stats/daily', '/stats/category', '/stats/compare', '/stats/godlife', '/stats/sources', '/settings', '/share', '/community', '/admin']
/** 상세 화면처럼 ID가 붙는 경로는 앞부분으로 본다(/tasks/12, 환경설정 구역 /settings/env). */
export const TRANSLATED_PREFIXES = ['/tasks/', '/dday/', '/settings/', '/share/', '/community/', '/admin/', '/auth/']
const translated = (path) => TRANSLATED_PATHS.includes(path) || TRANSLATED_PREFIXES.some((prefix) => path.startsWith(prefix))
export const documentLang = (locale, path) => (locale === 'en' && translated(path) ? 'en' : 'ko')
