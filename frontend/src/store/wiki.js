import { computed, reactive } from 'vue'
import { parseTags } from './tagging'

/**
 * 업무 위키 — 팀에서 반복해서 찾는 지식을 문서로 쌓는다.
 * 업무 데이터이므로 workPrivacy 정책에 따라 다른 사용자에게 공개되지 않는다.
 */
const STORAGE_KEY = 'timeflow.wiki.v1'

export const WIKI_SPACES = ['온보딩', '개발', '운영', '회의록']

function seed() {
  return {
    docs: [
      {
        id: 1,
        space: '온보딩',
        title: '신규 입사자 첫 주 가이드',
        body: '## 1일차\n- 계정 발급 요청 #온보딩\n- 개발 환경 세팅 문서 확인\n\n## 2일차\n- 코드베이스 투어\n- 첫 이슈 할당받기\n\n담당: @김지수',
        author: '김지수',
        updatedAt: '2026-09-02',
        parentId: null,
        pinned: true,
        history: [{ at: '2026-09-02', by: '김지수', note: '2일차 항목 추가' }],
      },
      {
        id: 2,
        space: '개발',
        title: '배포 절차',
        body: '1. main 브랜치 머지\n2. 태그 생성 후 CI 통과 확인\n3. 화요일 오전에만 배포 #배포 #운영\n\n실패 시 롤백은 직전 태그로.',
        author: '박민준',
        updatedAt: '2026-08-30',
        parentId: null,
        pinned: true,
        history: [{ at: '2026-08-30', by: '박민준', note: '롤백 절차 보강' }],
      },
      {
        id: 3,
        space: '개발',
        title: '디자인 토큰 규칙',
        body: '색상은 반드시 var(--color-*) 토큰을 쓴다. 하드코딩 금지 #디자인',
        author: '김지수',
        updatedAt: '2026-09-01',
        parentId: 2,
        pinned: false,
        history: [{ at: '2026-09-01', by: '김지수', note: '최초 작성' }],
      },
      {
        id: 4,
        space: '회의록',
        title: '9월 1주차 주간회의',
        body: '- 리뉴얼 QA 일정 확정 #회의록\n- 다음 주 배포 목표\n\n참석: @박민준 @이서연',
        author: '이서연',
        updatedAt: '2026-09-05',
        parentId: null,
        pinned: false,
        history: [{ at: '2026-09-05', by: '이서연', note: '최초 작성' }],
      },
    ],
  }
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    if (!parsed?.docs?.length) return null
    return parsed
  } catch {
    return null
  }
}

export const wiki = reactive(load() ?? seed())

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ docs: wiki.docs }))
  } catch {
    // 저장할 수 없는 환경 — 세션 내 상태만 유지
  }
}

export function findDoc(id) {
  return wiki.docs.find((d) => String(d.id) === String(id)) ?? null
}
export function childrenOf(id) {
  return wiki.docs.filter((d) => d.parentId === id)
}
export const rootDocs = computed(() => wiki.docs.filter((d) => !d.parentId))
export const pinnedDocs = computed(() => wiki.docs.filter((d) => d.pinned))

export const wikiTags = computed(() => {
  const map = new Map()
  wiki.docs.forEach((d) => parseTags(d.title + ' ' + d.body).forEach((t) => map.set(t, (map.get(t) ?? 0) + 1)))
  return [...map.entries()].map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count)
})

export function addDoc({ space, title, body, parentId = null, author = '김지수' }) {
  const doc = {
    id: Math.max(0, ...wiki.docs.map((d) => d.id)) + 1,
    space,
    title: title.trim(),
    body: body ?? '',
    author,
    updatedAt: new Date().toISOString().slice(0, 10),
    parentId,
    pinned: false,
    history: [{ at: new Date().toISOString().slice(0, 10), by: author, note: '최초 작성' }],
  }
  wiki.docs.push(doc)
  persist()
  return doc
}
export function updateDoc(id, patch, note = '내용 수정') {
  const doc = findDoc(id)
  if (!doc) return null
  Object.assign(doc, patch)
  doc.updatedAt = new Date().toISOString().slice(0, 10)
  doc.history.unshift({ at: doc.updatedAt, by: '김지수', note })
  persist()
  return doc
}
export function togglePin(doc) {
  doc.pinned = !doc.pinned
  persist()
}
/** 문서를 지우면 하위 문서는 상위로 끌어올린다(고아 문서 방지) */
export function removeDoc(id) {
  const doc = findDoc(id)
  if (!doc) return
  childrenOf(id).forEach((c) => (c.parentId = doc.parentId))
  wiki.docs = wiki.docs.filter((d) => d.id !== id)
  persist()
}
export function searchDocs({ keyword = '', space = '전체', tag = '' } = {}) {
  const k = keyword.trim()
  return wiki.docs.filter((d) => {
    if (space !== '전체' && d.space !== space) return false
    if (tag && !parseTags(d.title + ' ' + d.body).includes(tag)) return false
    if (k && !d.title.includes(k) && !d.body.includes(k)) return false
    return true
  })
}
export function resetWiki() {
  wiki.docs = seed().docs
  persist()
}
