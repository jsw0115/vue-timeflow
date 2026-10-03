// The preview is tab-local sample data. It never reads or writes the server.
export function createDemoChatApi(now = new Date()) {
  const me = 'preview-jisoo'
  const people = [
    { id: me, nickname: '지수', email: 'jisoo@example.test' },
    { id: 'preview-seoyeon', nickname: '서연', email: 'seoyeon@example.test' },
    { id: 'preview-minjun', nickname: '민준', email: 'minjun@example.test' },
  ]
  const stamp = offset => new Date(now.getTime() + offset * 60000).toISOString()
  const rooms = [
    { id: 'preview-group', kind: 'GROUP', name: '목요일 회고 모임', ids: people.map(p => p.id), ownerId: me, createdAt: stamp(-60), updatedAt: stamp(0) },
    { id: 'preview-seoyeon-dm', kind: 'DM', name: '서연', ids: [me, people[1].id], ownerId: me, createdAt: stamp(-62), updatedAt: stamp(-20) },
    { id: 'preview-minjun-dm', kind: 'DM', name: '민준', ids: [me, people[2].id], ownerId: me, createdAt: stamp(-64), updatedAt: stamp(-30) },
  ]
  const messages = [], reads = {}, mentionReads = new Set()
  function fail(message) { const error = new Error(message); error.status = 400; throw error }
  function findRoom(id) { return rooms.find(room => room.id === id && !room.left) || fail('대화를 찾지 못했어요.') }
  function tagsOf(body) { return [...new Set([...body.normalize('NFKC').matchAll(/(?:^|\s)#([\p{L}\p{N}_-]{1,32})(?![\p{L}\p{N}_-])/gu)].map(match => match[1].toLowerCase()))] }
  function append(roomId, senderId, body, mentionUserIds = [], offset = 0, clientMessageId = crypto.randomUUID()) {
    const item = { id: `preview-message-${String(messages.length + 1).padStart(6, '0')}`, roomId, sequence: String(messages.filter(row => row.roomId === roomId).length + 1), senderId, senderName: people.find(p => p.id === senderId).nickname, clientMessageId, body, createdAt: stamp(offset), tags: tagsOf(body), mentionUserIds }
    messages.push(item); return item
  }
  append('preview-group', people[1].id, '이번 주도 수고 많았어요. 오늘은 작은 성취 하나씩 나눠볼까요? #회고', [], -12)
  append('preview-group', me, '좋아요! 저는 아침에 20분씩 책 읽는 루틴을 지켰어요. #작은성취', [], -10)
  append('preview-group', people[2].id, '@지수 저도 다음 주부터 함께하고 싶어요. 추천하는 책이 있나요? #독서', [me], -7)
  append('preview-group', me, '@서연 함께 읽을 책을 골라볼게요. #회고', [people[1].id])
  function view(room) {
    const items = messages.filter(item => item.roomId === room.id)
    return { ...room, members: room.ids.map(userId => ({ userId, nickname: people.find(p => p.id === userId).nickname, lastReadSequence: reads[`${room.id}:${userId}`] || '0' })), lastSequence: items.at(-1)?.sequence || '0', lastMessage: items.at(-1) || null, unreadCount: items.filter(item => item.senderId !== me && BigInt(item.sequence) > BigInt(reads[`${room.id}:${me}`] || '0')).length }
  }
  function page(items, limit = 50, cursor = item => item.id) {
    const size = Math.max(1, Math.min(Number(limit) || 50, 100)), hasNext = items.length > size
    const selected = items.slice(0, size)
    return structuredClone({ items: selected, hasNext, nextCursor: hasNext ? cursor(selected.at(-1)) : null })
  }
  function accessible(item) { return rooms.some(room => room.id === item.roomId && !room.left) }
  function inbox(items, query) {
    return page(items.filter(accessible).filter(item => !query.before || item.id < query.before).sort((a, b) => b.id.localeCompare(a.id)).map(message => ({ message, roomName: findRoom(message.roomId).name, read: mentionReads.has(message.id) })), query.limit, item => item.message.id)
  }
  return {
    rooms: () => page(rooms.filter(room => !room.left).map(view)),
    room: id => structuredClone(view(findRoom(id))),
    person: email => structuredClone(people.find(p => p.id !== me && p.email === email.toLowerCase()) || fail('미리보기에서는 seoyeon@example.test 또는 minjun@example.test로 찾아보세요.')),
    create: data => {
      if (!data.memberIds?.length || data.memberIds.some(id => !people.some(p => p.id === id))) fail('미리보기 참여자를 선택해주세요.')
      const existing = data.kind === 'DM' && rooms.find(room => !room.left && room.kind === 'DM' && room.ids.includes(data.memberIds[0]))
      if (existing) return view(existing)
      const room = { id: `preview-${crypto.randomUUID()}`, kind: data.kind, name: data.name || people.find(p => p.id === data.memberIds[0]).nickname, ids: [me, ...data.memberIds], ownerId: me, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      rooms.unshift(room); return view(room)
    },
    messages: (id, query = {}) => {
      findRoom(id)
      let items = messages.filter(item => item.roomId === id && (!query.before || BigInt(item.sequence) < BigInt(query.before)) && (!query.after || BigInt(item.sequence) > BigInt(query.after)) && (!query.tag || item.tags.includes(query.tag.replace(/^#/, '').normalize('NFKC').toLowerCase())))
      if (query.after === undefined) items = [...items].reverse()
      const result = page(items, query.limit, item => item.sequence)
      if (query.after === undefined) result.items.reverse()
      return result
    },
    send: (id, data) => {
      const room = findRoom(id)
      if (!data.body?.trim() || data.body.length > 4000) fail('메시지를 1~4,000자로 입력해주세요.')
      if ((data.mentionUserIds || []).some(user => !room.ids.includes(user) || user === me)) fail('참여자를 확인해주세요.')
      const old = messages.find(item => item.roomId === id && item.senderId === me && item.clientMessageId === data.clientMessageId)
      if (old) return structuredClone(old)
      const item = append(id, me, data.body.trim(), data.mentionUserIds, 0, data.clientMessageId)
      item.createdAt = new Date().toISOString(); room.updatedAt = item.createdAt
      return structuredClone(item)
    },
    read: (id, sequence) => {
      findRoom(id)
      reads[`${id}:${me}`] = String(BigInt(sequence) > BigInt(reads[`${id}:${me}`] || '0') ? sequence : reads[`${id}:${me}`] || '0')
      return { roomId: id, lastReadSequence: reads[`${id}:${me}`] }
    },
    typing: () => null,
    presence: () => null,
    peoplePresence: () => [], // Sample people never claim to be online.
    search: (query = {}) => inbox(messages.filter(item => (!query.roomId || item.roomId === query.roomId) && item.body.normalize('NFKC').toLowerCase().includes((query.q || '').trim().normalize('NFKC').toLowerCase())), query),
    leave: id => { const room = findRoom(id); if (room.kind === 'DM' || room.ownerId === me) fail('그룹의 방장을 넘긴 뒤 나갈 수 있어요.'); room.left = true },
    transfer: (id, userId) => { const room = findRoom(id); if (room.ownerId !== me || !room.ids.includes(userId)) fail('참여자를 확인해주세요.'); room.ownerId = userId },
    mentions: (query = {}) => inbox(messages.filter(item => item.mentionUserIds.includes(me) && (!query.unread || !mentionReads.has(item.id))), query),
    readMention: id => { mentionReads.add(id) },
    tags: after => {
      const counts = new Map()
      for (const message of messages.filter(accessible)) for (const tag of message.tags) counts.set(tag, (counts.get(tag) || 0) + 1)
      return page([...counts].filter(([name]) => !after || name > after).sort(([a], [b]) => a.localeCompare(b)).map(([name, messageCount]) => ({ name, messageCount })), 50, item => item.name)
    },
    tagged: (query = {}) => inbox(messages.filter(item => item.tags.includes((query.tag || '').replace(/^#/, '').normalize('NFKC').toLowerCase())), query),
  }
}
export const demoChatApi = createDemoChatApi()
