// 업무 위키를 로그인하면 계정에, 로그아웃이면 이 브라우저에 저장하고 검색·태그·이력을 준다(PR-10 4단계, UF-52).
import { computed, ref, watch } from 'vue'
import { parseTags } from './tagging'
import { apiRequest } from '../features/auth/apiRequest.js'
import { createFeatureStore } from '../features/records/featureStore.mjs'
import { wikiKind } from '../features/records/featureKinds.mjs'
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
export const WIKI_SEEDS = seed().docs
function load() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    return parsed?.docs?.length ? parsed.docs : null
  } catch {
    return null
  }
}
// 로그아웃 상태의 문서. 예전과 같은 키·모양({ docs })으로 저장해 이미 쓴 문서를 잃지 않는다
const localDocs = ref(load() ?? seed().docs)
watch(localDocs, (docs) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ docs })) } catch { /* 저장할 수 없는 환경 — 세션 내 상태만 유지 */ }
}, { deep: true, flush: 'sync' })

export const wikiStore = createFeatureStore({ local: localDocs, ...wikiKind })
/** 지금 보이는 문서. 로그인하면 계정 문서, 로그아웃이면 이 브라우저 문서다. */
export const wiki = {
  get docs() { return wikiStore.list.value },
  set docs(value) { localDocs.value = value },
}
const today = () => new Date().toISOString().slice(0, 10)
const same = (a, b) => a !== null && a !== undefined && b !== null && b !== undefined && String(a) === String(b)

export function findDoc(id) {
  return wiki.docs.find((d) => same(d.id, id)) ?? null
}
export function childrenOf(id) {
  return wiki.docs.filter((d) => same(d.parentId, id))
}
export const rootDocs = computed(() => wiki.docs.filter((d) => !d.parentId))
export const pinnedDocs = computed(() => wiki.docs.filter((d) => d.pinned))
export const wikiTags = computed(() => {
  const map = new Map()
  wiki.docs.forEach((d) => parseTags(d.title + ' ' + d.body).forEach((t) => map.set(t, (map.get(t) ?? 0) + 1)))
  return [...map.entries()].map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count)
})
/** 로그인 상태는 서버 성공 응답 뒤에 목록에 들어간다. 로그아웃 상태는 이 브라우저에 쓰고 변경 메모를 남긴다. */
export async function addDoc({ space, title, body, parentId = null }) {
  const fields = { space, title: title.trim(), body: body ?? '', parentId: parentId ?? null, pinned: false }
  if (wikiStore.onServer()) return wikiStore.create(fields)
  return wikiStore.create({ ...fields, author: '나', updatedAt: today(), history: [{ at: today(), by: '나', note: '최초 작성' }] })
}
export async function updateDoc(doc, patch, note = '내용 수정') {
  if (wikiStore.onServer()) return wikiStore.update(doc, patch)
  return wikiStore.update(doc, { ...patch, updatedAt: today(), history: [{ at: today(), by: '나', note }, ...(doc.history ?? [])] })
}
export async function togglePin(doc) {
  return updateDoc(doc, { pinned: !doc.pinned }, doc.pinned ? '고정 해제' : '고정')
}
/** 문서를 지우면 하위 문서는 상위로 끌어올린다(고아 문서 방지). 로그인 상태는 서버가 옮기므로 목록을 다시 부른다. */
export async function removeDoc(doc) {
  if (wikiStore.onServer()) {
    await wikiStore.remove(doc)
    await wikiStore.reload()
    return
  }
  childrenOf(doc.id).forEach((c) => (c.parentId = doc.parentId))
  await wikiStore.remove(doc)
}
/**
 * 이전 버전. 로그인 상태는 서버가 수정할 때마다 남긴 이전 내용(최근 것부터), 로그아웃 상태는 이 브라우저의 변경 메모다.
 * 서버 이력 ID는 `문서ID@버전`이다.
 */
export async function wikiHistory(doc) {
  if (!wikiStore.onServer()) return (doc.history ?? []).map((h) => ({ at: h.at, label: h.note, by: h.by }))
  const rows = (await apiRequest(`/api/work/wiki/${encodeURIComponent(doc.id)}/history`)) ?? []
  return rows
    .map((row) => ({ version: Number(String(row.id).split('@')[1]) || 0, at: String(row.updatedAt ?? '').slice(0, 10), label: row.title, body: row.body ?? '', by: '나' }))
    .sort((a, b) => b.version - a.version)
}
export function searchDocs({ keyword = '', space = '전체', tag = '' } = {}) {
  const k = keyword.trim()
  return wiki.docs.filter((d) => {
    if (space !== '전체' && d.space !== space) return false
    if (tag && !parseTags(d.title + ' ' + d.body).includes(tag)) return false
    if (k && !d.title.includes(k) && !(d.body ?? '').includes(k)) return false
    return true
  })
}
/** 시연 문서로 되돌린다. 이 브라우저 문서에만 쓴다(계정 문서는 지우지 않는다). */
export function resetWiki() {
  localDocs.value = seed().docs
}
