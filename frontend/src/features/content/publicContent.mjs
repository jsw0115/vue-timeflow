// 관리자가 공개한 콘텐츠(/api/content)를 사용자 화면에 맞게 고른다(Q-29): 명언은 홈의 "오늘의 문장", 플래너 템플릿은 템플릿 관리의 "공용 템플릿".
// 스티커팩은 디자인 서버에서 그림 자료를 만든 뒤 붙이므로 여기서 다루지 않는다.

export const loadPublicContent = (request) => request('/api/content')

/**
 * "07:00 아침 스트레칭" 한 줄을 타임블록으로 바꾼다(템플릿 관리 화면과 같은 형식). 시는 두 자리로 맞춘다.
 * 시각을 읽지 못하면 time '--:--', valid false다.
 */
export function parseTemplateLine(line) {
  const m = String(line).trim().match(/^(\d{1,2}):(\d{2})\s+(.+)$/)
  if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) return { time: '--:--', title: String(line).trim(), valid: false }
  return { time: `${m[1].padStart(2, '0')}:${m[2]}`, title: m[3].trim(), valid: true }
}
export const parseTemplateText = (text) => String(text ?? '').split('\n').map((line) => line.trim()).filter(Boolean).map(parseTemplateLine)

/** 공용 템플릿: 종류가 '플래너 템플릿'이고 읽을 수 있는 줄이 하나 이상인 것. 읽지 못한 줄 수도 함께 준다. */
export function publicTemplates(items) {
  return (items ?? []).filter((item) => item?.kind === '플래너 템플릿').map((item) => {
    const lines = parseTemplateText(item.body)
    return { id: item.id, title: item.title, blocks: lines.filter((b) => b.valid).map(({ time, title }) => ({ time, title })), skipped: lines.filter((b) => !b.valid).length }
  }).filter((item) => item.blocks.length)
}

/** 날짜(YYYY-MM-DD)마다 같은 명언 하나. 공개 명언이 없으면 null이다. */
export function quoteOfDay(items, date) {
  const quotes = (items ?? []).filter((item) => item?.kind === '명언' && String(item.body ?? '').trim())
  if (!quotes.length) return null
  const seed = [...String(date)].reduce((sum, ch) => (sum * 31 + ch.charCodeAt(0)) >>> 0, 7)
  const pick = [...quotes].sort((a, b) => String(a.id).localeCompare(String(b.id)))[seed % quotes.length]
  return { text: String(pick.body).trim(), by: String(pick.title ?? '').trim() }
}
