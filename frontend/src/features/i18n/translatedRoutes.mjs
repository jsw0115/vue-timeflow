// 본문까지 표시 언어로 옮긴 화면 경로(PR-32). 영어를 고르고 이 화면에 있으면 문서 언어(<html lang>)를 en으로 둔다.
// 대화 상자는 문서 끝에 붙어 영역별 lang이 닿지 않으므로 문서 언어로 맞춘다. 목록에 없는 화면은 본문이 한국어라 ko로 둔다.
export const TRANSLATED_PATHS = ['/career', '/career/activities', '/career/applications', '/work/career', '/planner', '/planner/daily', '/planner/weekly', '/planner/monthly', '/planner/yearly']
export const documentLang = (locale, path) => (locale === 'en' && TRANSLATED_PATHS.includes(path) ? 'en' : 'ko')
