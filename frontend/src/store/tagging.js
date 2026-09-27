import { computed } from 'vue'
import { localCollection } from './localCollection'
import { localDate } from '../utils/postValidation.mjs'
import { contacts, isBlocked } from './contacts'

/**
 * 해시태그 · 멘션 공통 엔진.
 * 메모·다이어리·게시글 등 글을 쓰는 모든 화면이 같은 규칙으로 파싱하고,
 * 여기 모인 인덱스를 태그 모아보기·멘션함이 함께 쓴다.
 */

/** #태그 — 한글/영문/숫자/밑줄, 2자 이상 */
const TAG_RE = /(?:^|\s)#([\p{L}\p{N}_-]{1,32})(?![\p{L}\p{N}_-])/gu
/** @멘션 — 주소록에 있는 이름과 대조한다 */
const MENTION_RE = /@([\w가-힣]{2,10})/g

export function parseTags(text) {
  const found = [...String(text ?? '').normalize('NFKC').matchAll(TAG_RE)].map((m) => m[1].toLowerCase())
  return [...new Set(found)]
}

/** 실제 존재하는(차단되지 않은) 사용자만 멘션으로 인정한다 */
export function parseMentions(text) {
  const names = [ME, ...contacts.value.filter((c) => !isBlocked(c.id)).map((c) => c.name)]
  const found = [...String(text ?? '').matchAll(MENTION_RE)]
    .map((m) => m[1])
    .filter((n) => names.includes(n))
  return [...new Set(found)]
}

/** 본문을 일반 텍스트 / 태그 / 멘션 조각으로 쪼갠다(하이라이트 렌더용) */
export function tokenize(text) {
  const src = String(text ?? '')
  const valid = [ME, ...contacts.value.filter((c) => !isBlocked(c.id)).map((c) => c.name)]
  const out = []
  let last = 0
  const re = /#([\w가-힣]+)|@([\w가-힣]{2,10})/g
  let m
  while ((m = re.exec(src)) !== null) {
    const isMention = Boolean(m[2])
    // 주소록에 없는 @이름은 평범한 글자로 둔다
    if (isMention && !valid.includes(m[2])) continue
    if (m.index > last) out.push({ type: 'text', value: src.slice(last, m.index) })
    out.push({ type: isMention ? 'mention' : 'tag', value: m[1] ?? m[2] })
    last = m.index + m[0].length
  }
  if (last < src.length) out.push({ type: 'text', value: src.slice(last) })
  return out
}

/* ---------------- 글 인덱스 ---------------- */
/** 앱 전체의 글을 한곳에 모은다. 태그 모아보기·멘션함·내 글 모아보기가 이걸 읽는다. */
export const ME = '김지수'

export const posts = localCollection('post-index', [
  { id: 1, kind: '게시글', title: '오늘도 6km 완주', body: '오늘도 6km 완주! #러닝 #갓생 @이서연 같이 뛰어요', author: ME, at: '2026-09-06', link: '/community/board' },
  { id: 2, kind: '게시글', title: '아침 스트레칭', body: '아침 스트레칭 15분 완료! #운동 다들 화이팅이에요', author: '이서연', at: '2026-09-06', link: '/community/board' },
  { id: 3, kind: '메모', title: '디자인 리뷰 아이디어', body: '색상 토큰을 카테고리별로 분리하면 좋을 듯 #디자인 #아이디어 @박민준 의견 주세요', author: ME, at: '2026-09-05', link: '/memos' },
  { id: 4, kind: '다이어리', title: '8월 24일 기록', body: '프로젝트 킥오프 준비로 바빴다 #회고 #업무', author: ME, at: '2026-08-24', link: '/diary' },
  { id: 5, kind: '게시글', title: '독서 인증', body: '이번 주 2권 완독 #독서 #갓생 @김지수 추천 감사해요', author: '최지우', at: '2026-09-04', link: '/community/board' },
  { id: 6, kind: '메모', title: '회고 메모', body: '이번 주는 계획 대비 실행률이 낮았다 #회고', author: ME, at: '2026-08-18', link: '/memos' },
])

export function addPost({ kind, title, body, author = ME, link = '/', at = localDate() }) {
  const post = {
    id: Math.max(0, ...posts.value.map((p) => Number(p.id) || 0)) + 1,
    kind,
    title: String(title ?? '').trim(),
    body: String(body ?? '').trim(),
    author,
    at,
    link,
  }
  posts.value.unshift(post)
  // 멘션함은 원본 인덱스에서 파생하므로 수정·삭제도 즉시 반영된다.
  return post
}

/** 태그별 사용 횟수 — 많이 쓴 순 */
export const tagCounts = computed(() => {
  const map = new Map()
  posts.value.forEach((p) => parseTags(p.title + ' ' + p.body).forEach((t) => map.set(t, (map.get(t) ?? 0) + 1)))
  return [...map.entries()].map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
})

export function postsByTag(tag) {
  return posts.value.filter((p) => parseTags(p.title + ' ' + p.body).includes(tag))
}
export const myPosts = computed(() => posts.value.filter((p) => p.author === ME))

/* ---------------- 멘션함 ---------------- */
const mentionStates = localCollection('mention-states', [])
export const mentions = computed(() => posts.value
  .filter(post => post.author !== ME && parseMentions(post.title + ' ' + post.body).includes(ME))
  .map(post => ({ id: post.sourceKey || String(post.id), postId: post.id, from: post.author, kind: post.kind, title: post.title, excerpt: post.body, at: post.at, link: post.link, read: !!mentionStates.value.find(state => state.id === (post.sourceKey || String(post.id)))?.read }))
  .filter(item => !mentionStates.value.find(state => state.id === item.id)?.hidden))
export const unreadMentions = computed(() => mentions.value.filter((m) => !m.read).length)

export function pushMention(post) {
  if (!posts.value.some(item => item.id === post.id)) posts.value.unshift(post)
}
export function markMentionRead(m) {
  let state = mentionStates.value.find(item => item.id === String(m.id))
  if (!state) { state = { id: String(m.id), read: true }; mentionStates.value.push(state) }
  else state.read = true
}
export function markAllMentionsRead() {
  mentions.value.forEach(markMentionRead)
}
export function removeMention(id) {
  const state = mentionStates.value.find(item => item.id === String(id))
  if (state) state.hidden = true
  else mentionStates.value.push({ id: String(id), hidden: true })
}

/** 입력 중 @ 뒤 글자로 후보를 좁힌다(자동완성용) */
export function mentionCandidates(keyword) {
  const k = String(keyword ?? '').trim()
  return contacts.value
    .filter((c) => !isBlocked(c.id) && (!k || c.name.includes(k)))
    .slice(0, 6)
}

// 동일 원본을 수정하면 인덱스를 갱신하고, 원본 삭제 시 검색 결과도 제거합니다.
export function syncPostCollection(source, items, kind, link) {
  const ids = new Set(items.map(item => source + ':' + item.id))
  posts.value = posts.value.filter(p => !p.sourceKey?.startsWith(source + ':') || ids.has(p.sourceKey))
  for (const item of items) {
    const sourceKey = source + ':' + item.id
    const payload = { kind, title: item.title ?? item.body?.split('\n')[0]?.slice(0, 60) ?? '', body: [item.body ?? item.desc ?? item.description ?? '', item.handover ?? '', ...(item.tags ?? []).map(tag => '#' + String(tag).replace(/^#/, ''))].filter(Boolean).join('\n'), author: item.author ?? item.name ?? ME, link: typeof link === 'function' ? link(item) : link }
    if (item.createdAt || item.at) payload.at = item.createdAt || item.at
    const found = posts.value.find(p => p.sourceKey === sourceKey)
    if (found) Object.assign(found, payload)
    else Object.assign(addPost(payload), { sourceKey })
  }
}
