export const normalizeSearch = value => String(value ?? '').normalize('NFKC').toLowerCase().trim()
function grams(text) {
  const chars = Array.from(text), result = new Set()
  for (let size = 1; size <= 3; size++) for (let i = 0; i + size <= chars.length; i++) result.add(chars.slice(i, i + size).join(''))
  return result
}
export class SearchIndex {
  documents = new Map()
  inverted = new Map()
  sync(entries) {
    const ids = new Set(entries.map(entry => String(entry.id)))
    for (const id of this.documents.keys()) if (!ids.has(id)) this.remove(id)
    for (const entry of entries) {
      const id = String(entry.id), text = normalizeSearch([entry.title, entry.body, entry.meta].join(' ')), previous = this.documents.get(id)
      if (previous?.text === text) { previous.entry = entry; continue }
      this.remove(id)
      const tokens = grams(text)
      this.documents.set(id, { entry, text, tokens })
      for (const token of tokens) { if (!this.inverted.has(token)) this.inverted.set(token, new Set()); this.inverted.get(token).add(id) }
    }
  }
  remove(id) {
    const previous = this.documents.get(id)
    if (!previous) return
    for (const token of previous.tokens) { const ids = this.inverted.get(token); ids.delete(id); if (!ids.size) this.inverted.delete(token) }
    this.documents.delete(id)
  }
  search(query, scope = '전체', offset = 0, limit = 40) {
    const text = normalizeSearch(query), counts = {}, items = []
    if (!text) return { items, counts, total: 0 }
    const chars = Array.from(text), size = Math.min(3, chars.length), tokens = []
    for (let i = 0; i + size <= chars.length; i++) tokens.push(chars.slice(i, i + size).join(''))
    const sets = [...new Set(tokens)].map(token => this.inverted.get(token))
    if (sets.some(set => !set)) return { items, counts, total: 0 }
    sets.sort((a, b) => a.size - b.size)
    let total = 0
    for (const id of sets[0]) {
      if (!sets.every(set => set.has(id))) continue
      const doc = this.documents.get(id)
      if (!doc.text.includes(text)) continue
      counts[doc.entry.kind] = (counts[doc.entry.kind] ?? 0) + 1
      counts['전체'] = (counts['전체'] ?? 0) + 1
      if (scope !== '전체' && doc.entry.kind !== scope) continue
      if (total >= offset && items.length < limit) items.push(doc.entry)
      total++
    }
    return { items, counts, total }
  }
}
