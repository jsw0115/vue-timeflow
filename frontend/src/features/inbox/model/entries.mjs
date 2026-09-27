export const contentKinds = ['전체', '채팅', '플래너', 'D-day', '일정', '할 일', '루틴', '챌린지', '게시글', '다이어리', '커뮤니티', '메모']
export function matchesKind(actual, selected) {
  return selected === '전체' || actual === selected || (selected === '플래너' && ['플래너', '일정', '할 일', '루틴'].includes(actual))
}
export function normalizeTag(value) { return String(value || '').trim().replace(/^#/, '').normalize('NFKC').toLowerCase() }
export function filterEntries(entries, { kind = '전체', query = '', unread = false } = {}) {
  const term = query.trim().toLocaleLowerCase()
  return entries.filter(item => matchesKind(item.kind, kind) && (!unread || !item.read) && (!term || [item.title, item.body, item.author].join(' ').toLocaleLowerCase().includes(term)))
    .sort((a, b) => String(b.at).localeCompare(String(a.at)) || a.key.localeCompare(b.key))
}
export function chatEntry(item) {
  return { key: `chat:${item.message.id}`, kind: '채팅', title: item.roomName, body: item.message.body, author: item.message.senderName, at: item.message.createdAt, tags: item.message.tags || [], read: item.read, chatId: item.message.id, link: { path: '/chat', query: { room: item.message.roomId } } }
}
