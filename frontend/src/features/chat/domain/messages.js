// Keep database BIGINT cursors as strings, including values beyond JS safe integers.
export function mergeMessages(previous, incoming) {
  const byId = new Map(previous.map(message => [message.id, message]))
  for (const message of incoming) byId.set(message.id, message)
  return [...byId.values()].sort((a, b) => BigInt(a.sequence) < BigInt(b.sequence) ? -1 : BigInt(a.sequence) > BigInt(b.sequence) ? 1 : 0)
}
export function createSseParser(onEvent) {
  let buffer = ''
  return chunk => {
    buffer += chunk
    let match
    while ((match = /\r?\n\r?\n/.exec(buffer))) {
      const block = buffer.slice(0, match.index)
      buffer = buffer.slice(match.index + match[0].length)
      let event = 'message'
      const data = []
      for (const line of block.split(/\r?\n/)) {
        if (line.startsWith('event:')) event = line.slice(6).trim()
        if (line.startsWith('data:')) data.push(line.slice(5).replace(/^ /, ''))
      }
      if (data.length) {
        try { onEvent(event, JSON.parse(data.join('\n'))) } catch { /* Ignore malformed envelope. */ }
      }
    }
  }
}
