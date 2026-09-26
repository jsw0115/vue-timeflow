import { computed, ref } from 'vue'
import { localCollection } from './localCollection'
import { localDate } from '../utils/postValidation.mjs'
import { contacts, isBlocked } from './contacts'

/**
 * 해시태그 · 멘션 공통 엔진.
 * 메모·다이어리·게시글 등 글을 쓰는 모든 화면이 같은 규칙으로 파싱하고,
 * 여기 모인 인덱스를 태그 모아보기·멘션함이 함께 쓴다.
 */

/** #태그 — 한글/영문/숫자/밑줄, 2자 이상 */
const TAG_RE = /#([\w가-힣][\w가-힣]*)/g
/** @멘션 — 주소록에 있는 이름과 대조한다 */
const MENTION_RE = /@([\w가-힣]{2,10})/g

export function parseTags(text) {
  const found = [...String(text ?? '').matchAll(TAG_RE)].map((m) => m[1])
  return [...new Set(found)]
}

/** 실제 존재하는(차단되지 않은) 사용자만 멘션으로 인정한다 */
export function parseMentions(text) {
  const names = contacts.value.filter((c) => !isBlocked(c.id)).map((c) => c.name)
  const found = [...String(text ?? '').matchAll(MENTION_RE)]
    .map((m) => m[1])
    .filter((n) => names.includes(n))
  return [...new Set(found)]
}

/** 본문을 일반 텍스트 / 태그 / 멘션 조각으로 쪼갠다(하이라이트 렌더용) */
export function tokenize(text) {
  const src = String(text ?? '')
  const valid = contacts.value.filter((c) => !isBlocked(c.id)).map((c) => c.name)
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

export function addPost({ kind, title, body, author = ME, link = '/' }) {
  const post = {
    id: Math.max(0, ...posts.value.map((p) => p.id)) + 1,
    kind,
    title: String(title ?? '').trim(),
    body: String(body ?? '').trim(),
    author,
    at: localDate(),
    link,
  }
  posts.value.unshift(post)
  // 나를 멘션한 글이면 멘션함에 쌓는다
  if (author !== ME && parseMentions(post.body).includes(ME)) pushMention(post)
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
export const mentions = ref([
  { id: 1, postId: 2, from: '이서연', kind: '게시글', excerpt: '@김지수 내일 스터디 자료 공유 부탁해요 #스터디', at: '2026-09-06 14:02', read: false, link: '/community/board' },
  { id: 2, postId: 5, from: '최지우', kind: '게시글', excerpt: '@김지수 추천 감사해요 #독서', at: '2026-09-04 09:30', read: false, link: '/community/board' },
  { id: 3, postId: 3, from: '박민준', kind: '메모', excerpt: '@김지수 색상 토큰 정리 확인했어요 #디자인', at: '2026-09-03 18:11', read: true, link: '/memos' },
])
export const unreadMentions = computed(() => mentions.value.filter((m) => !m.read).length)

export function pushMention(post) {
  mentions.value.unshift({
    id: Math.max(0, ...mentions.value.map((m) => m.id)) + 1,
    postId: post.id,
    from: post.author,
    kind: post.kind,
    excerpt: post.body.slice(0, 60),
    at: new Date().toISOString().slice(0, 16).replace('T', ' '),
    read: false,
    link: post.link,
  })
}
export function markMentionRead(m) {
  m.read = true
}
export function markAllMentionsRead() {
  mentions.value.forEach((m) => (m.read = true))
}
export function removeMention(id) {
  mentions.value = mentions.value.filter((m) => m.id !== id)
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
    const payload = { kind, title: item.title ?? '', body: [item.body ?? item.desc ?? '', item.handover ?? '', ...(item.tags ?? []).map(tag => '#' + tag)].filter(Boolean).join('\n'), link: typeof link === 'function' ? link(item) : link }
    const found = posts.value.find(p => p.sourceKey === sourceKey)
    if (found) Object.assign(found, payload)
    else Object.assign(addPost(payload), { sourceKey })
  }
}
