import test from 'node:test'
import assert from 'node:assert/strict'
import { mergeMessages, createSseParser } from '../src/features/chat/domain/messages.js'

test('retry and out-of-order events merge once, preserving BIGINT order', () => {
  const previous = [{ id: 'a', sequence: '9007199254740993', body: 'old' }]
  const result = mergeMessages(previous, [{ id: 'b', sequence: '9007199254740992' }, { id: 'a', sequence: '9007199254740993', body: 'saved' }])
  assert.deepEqual(result.map(m => m.id), ['b', 'a'])
  assert.equal(result[1].body, 'saved')
})
test('SSE parser accepts split CRLF, multiple frames and multiline data', () => {
  const events = [], parse = createSseParser((type, data) => events.push({ type, data }))
  parse('event: changed\r\ndata: {"roomId": "한')
  parse('글"}\r\n\r')
  parse('\nevent: connected\ndata: {\ndata: "reconcile": true}\n\n')
  assert.deepEqual(events, [{ type: 'changed', data: { roomId: '한글' } }, { type: 'connected', data: { reconcile: true } }])
})
test('SSE parser ignores comments and malformed frames, then recovers', () => {
  const events = [], parse = createSseParser((type, data) => events.push(data))
  parse(': heartbeat\n\ndata: bad\n\ndata: {"ok":true}\n\n')
  assert.deepEqual(events, [{ ok: true }])
})
