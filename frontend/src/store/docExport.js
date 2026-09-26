/**
 * 문서 내보내기 — 경력기술서·이력서·포트폴리오·인수인계 문서를 PDF/Word로 저장한다.
 *
 * 라이브러리를 새로 넣지 않고 브라우저 기능만 쓴다.
 *  - PDF: 인쇄용 창을 열고 window.print()를 띄운다(사용자가 "PDF로 저장" 선택).
 *  - Word: application/msword MIME의 HTML을 .doc로 내려받는다(워드가 그대로 연다).
 * 워터마크·마스킹 같은 보안 설정은 호출부에서 내용에 이미 반영해 넘긴다.
 */

function documentHtml({ title, bodyHtml, watermark }) {
  return `<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8" /><title>${escapeHtml(title)}</title>
<style>
  @page { size: A4; margin: 18mm; }
  body { font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif; color: #111; line-height: 1.7; font-size: 11pt; }
  h1 { font-size: 20pt; margin: 0 0 4pt; }
  h2 { font-size: 13pt; margin: 18pt 0 6pt; border-bottom: 1px solid #ccc; padding-bottom: 4pt; }
  h3 { font-size: 11.5pt; margin: 12pt 0 4pt; }
  p, li { font-size: 10.5pt; }
  .meta { color: #666; font-size: 9.5pt; margin: 0 0 12pt; }
  ul { margin: 4pt 0 0 16pt; padding: 0; }
  table { border-collapse: collapse; width: 100%; margin-top: 6pt; }
  th, td { border: 1px solid #ccc; padding: 5pt 7pt; font-size: 10pt; text-align: left; }
  th { background: #f2f2f2; }
  .watermark { position: fixed; bottom: 10mm; right: 10mm; color: #999; font-size: 8pt; }
</style></head><body>
${bodyHtml}
${watermark ? `<div class="watermark">${escapeHtml(watermark)}</div>` : ''}
</body></html>`
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** PDF 저장 — 새 창에 인쇄용 문서를 그리고 인쇄 대화상자를 띄운다 */
export function exportPdf({ title, bodyHtml, watermark }) {
  const win = window.open('', '_blank', 'width=900,height=1000')
  if (!win) return { ok: false, reason: '팝업이 차단됐어요. 팝업 허용 후 다시 시도해주세요.' }
  win.document.write(documentHtml({ title, bodyHtml, watermark }))
  win.document.close()
  win.focus()
  // 렌더가 끝난 뒤 인쇄 대화상자를 띄운다
  win.onload = () => win.print()
  setTimeout(() => {
    try {
      win.print()
    } catch {
      // onload에서 이미 호출됐다면 무시
    }
  }, 400)
  return { ok: true }
}

/** Word(.doc) 저장 — 워드가 그대로 여는 HTML 문서를 내려받는다 */
export function exportWord({ title, bodyHtml, watermark, fileName }) {
  const html = documentHtml({ title, bodyHtml, watermark })
  const blob = new Blob(['﻿', html], { type: 'application/msword' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = (fileName || title).replace(/[\\/:*?"<>|]/g, '_') + '.doc'
  a.click()
  URL.revokeObjectURL(url)
  return { ok: true }
}

/** 문단 배열을 문서 본문 HTML로 바꾼다 */
export function sectionsToHtml(sections) {
  return sections
    .map((s) => {
      if (s.type === 'title') return `<h1>${escapeHtml(s.text)}</h1>`
      if (s.type === 'meta') return `<p class="meta">${escapeHtml(s.text)}</p>`
      if (s.type === 'h2') return `<h2>${escapeHtml(s.text)}</h2>`
      if (s.type === 'h3') return `<h3>${escapeHtml(s.text)}</h3>`
      if (s.type === 'list') return `<ul>${s.items.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ul>`
      if (s.type === 'table') {
        const head = `<tr>${s.head.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr>`
        const rows = s.rows.map((r) => `<tr>${r.map((c) => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`).join('')
        return `<table>${head}${rows}</table>`
      }
      return `<p>${escapeHtml(s.text)}</p>`
    })
    .join('\n')
}
