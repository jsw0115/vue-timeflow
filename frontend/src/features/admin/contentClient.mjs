// 관리자 콘텐츠(명언·플래너 템플릿·스티커팩)의 입력 검사와 서버 API 호출을 정한다(PR-10 UF-117 7-3).
// 서버 모델(FeatureType.CONTENT): title·body·kind 필수, where(노출 위치 메모)·live(boolean) 선택.
// 공개 콘텐츠(/api/content)는 홈의 오늘의 문장(명언)과 템플릿 관리의 공용 템플릿(플래너 템플릿)이 읽는다(Q-29). 스티커팩은 아직 읽는 곳이 없다.

export const CONTENT_KINDS = ['명언', '플래너 템플릿', '스티커팩']

export function contentError(draft) {
  if (!String(draft?.title ?? '').trim()) return '이름을 입력해 주세요.'
  if (!String(draft?.body ?? '').trim()) return '내용을 입력해 주세요.'
  if (!CONTENT_KINDS.includes(draft?.kind)) return '종류를 골라 주세요.'
  return ''
}

export function contentBody(draft) {
  const out = { title: String(draft.title).trim(), body: String(draft.body).trim(), kind: draft.kind, live: draft.live === true }
  if (String(draft.where ?? '').trim()) out.where = String(draft.where).trim()
  return out
}

/** request는 apiRequest처럼 성공 응답의 data를 돌려주고 실패하면 status를 담아 던진다. */
export function createContentClient({ request }) {
  const item = (row) => `/api/admin/content/${encodeURIComponent(row.id)}`
  return {
    async all({ maxPages = 20 } = {}) {
      const items = []
      for (let page = 0; page < maxPages; page += 1) {
        const chunk = await request(`/api/admin/content?page=${page}&size=100`)
        items.push(...(chunk?.items ?? []))
        if (!chunk?.items?.length || items.length >= (chunk?.total ?? 0)) break
      }
      return items
    },
    create: (draft) => request('/api/admin/content', { method: 'POST', body: JSON.stringify(contentBody(draft)) }),
    update: (row, draft) => request(item(row), { method: 'PUT', body: JSON.stringify({ ...contentBody(draft), version: row.version }) }),
    remove: (row) => request(`${item(row)}?version=${encodeURIComponent(row.version)}`, { method: 'DELETE' }),
  }
}
