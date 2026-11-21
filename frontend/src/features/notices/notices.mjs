// 공지의 노출 상태 계산, 입력 검사, 관리자·사용자 공지 API 호출을 정한다(PR-10 UF-117 7-2).
// 서버 모델(FeatureType.NOTICE): title·body 필수, from·to(YYYY-MM-DD, 선택), published·popup(boolean).
// 사용자 공지 API(/api/notices)는 published이고 오늘(서울 날짜)이 기간 안인 공지만 돌려준다.

/** 오늘 날짜 기준 공지 상태. 서버의 사용자 공지 조건과 같은 규칙이다. */
export function noticeState(notice, today) {
  if (notice?.published !== true) return { id: 'draft', label: '내림' }
  if (notice.from && notice.from > today) return { id: 'scheduled', label: '노출 예정' }
  if (notice.to && notice.to < today) return { id: 'ended', label: '기간 끝남' }
  return { id: 'live', label: '노출 중' }
}

export const NOTICE_FILTERS = [
  { id: 'all', label: '전체' }, { id: 'live', label: '노출 중' }, { id: 'scheduled', label: '노출 예정' },
  { id: 'ended', label: '기간 끝남' }, { id: 'draft', label: '내림' },
]

/** 입력 오류 문구. 없으면 빈 문자열. */
export function noticeError(draft) {
  if (!String(draft?.title ?? '').trim()) return '공지 제목을 입력해 주세요.'
  if (!String(draft?.body ?? '').trim()) return '공지 내용을 입력해 주세요.'
  if (draft.from && draft.to && draft.to < draft.from) return '끝나는 날은 시작하는 날과 같거나 그 뒤여야 해요.'
  return ''
}

/** 서버 본문. 빈 날짜는 보내지 않는다(기간 제한 없음). */
export function noticeBody(draft) {
  const out = { title: String(draft.title).trim(), body: String(draft.body).trim(), published: draft.published === true, popup: draft.popup === true }
  if (draft.from) out.from = draft.from
  if (draft.to) out.to = draft.to
  return out
}

/** request는 apiRequest처럼 성공 응답의 data를 돌려주고 실패하면 status를 담아 던진다. */
export function createNoticeClient({ request }) {
  const item = (notice) => `/api/admin/notices/${encodeURIComponent(notice.id)}`
  return {
    /** 관리자 목록. 서버는 한 쪽에 최대 100건이라 끝까지 이어 부른다(최대 maxPages쪽). */
    async all({ maxPages = 20 } = {}) {
      const items = []
      for (let page = 0; page < maxPages; page += 1) {
        const chunk = await request(`/api/admin/notices?page=${page}&size=100`)
        items.push(...(chunk?.items ?? []))
        if (!chunk?.items?.length || items.length >= (chunk?.total ?? 0)) break
      }
      return items
    },
    create: (draft) => request('/api/admin/notices', { method: 'POST', body: JSON.stringify(noticeBody(draft)) }),
    update: (notice, draft) => request(item(notice), { method: 'PUT', body: JSON.stringify({ ...noticeBody(draft), version: notice.version }) }),
    remove: (notice) => request(`${item(notice)}?version=${encodeURIComponent(notice.version)}`, { method: 'DELETE' }),
    /** 사용자에게 지금 보이는 공지. */
    active: () => request('/api/notices'),
  }
}

/** 이 브라우저에서 닫은 공지. 공지를 고치면(version이 바뀌면) 다시 보인다. */
export const dismissKey = (notice) => `${notice.id}@${notice.version}`
