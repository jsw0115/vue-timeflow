// 공유 첨부 클라이언트의 업로드 전 크기 확인과 화면 행 변환을 검사한다(PR-10 5단계, UT-198).
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  MAX_FILE_BYTES, FILE_LIMIT_TEXT, fileError, createAttachmentClient, toFileRow, mergeFiles, expiryLabel, isExpired, attachmentErrorText, fileKind,
} from '../src/features/attachments/attachmentClient.mjs'

const fakeFile = (size, name = 'a.bin') => ({ size, name })

test('UT-198 10 MiB보다 1바이트 큰 파일은 한도 문구를 보이고 요청을 보내지 않는다', async () => {
  const calls = []
  const client = createAttachmentClient({ request: async (...args) => { calls.push(args); return {} }, fetcher: async () => ({ ok: true }) })
  assert.match(fileError(fakeFile(MAX_FILE_BYTES + 1)), /파일당 10 MiB까지 올릴 수 있어요/)
  await assert.rejects(client.upload(fakeFile(MAX_FILE_BYTES + 1)), (error) => error.local === true && error.message.startsWith(FILE_LIMIT_TEXT))
  await assert.rejects(client.upload(fakeFile(0)), /빈 파일/)
  assert.equal(calls.length, 0)
})

test('정확히 10 MiB는 보낸다. 보관 기간과 그룹은 쿼리로 간다', async () => {
  const calls = []
  const client = createAttachmentClient({ request: async (path, options) => { calls.push({ path, options }); return { id: 'f1' } } })
  assert.equal(fileError(fakeFile(MAX_FILE_BYTES)), '')
  await client.upload(new Blob([new Uint8Array(4)]), { retentionDays: 7, groupId: 'G1' })
  assert.equal(calls.length, 1)
  assert.equal(calls[0].path, '/api/attachments?retentionDays=7&groupId=G1')
  assert.equal(calls[0].options.method, 'POST')
  assert.ok(calls[0].options.body instanceof FormData)
})

test('서버 행을 화면 행으로 바꾸고, 내 파일과 그룹 파일의 중복을 한 번만 둔다', () => {
  const mine = { id: 'A', ownerId: 'me', ownerName: '김', groupId: 'G1', name: '사진.PNG', sizeBytes: 10, createdAt: '2026-11-20T01:00:00Z', expiresAt: null }
  const other = { id: 'B', ownerId: 'u2', ownerName: '이서연', groupId: 'G1', name: '회의록.docx', sizeBytes: 10, createdAt: '2026-11-19T01:00:00Z', expiresAt: null }
  const merged = mergeFiles([[mine], [other, mine]])
  assert.deepEqual(merged.map((r) => r.id), ['A', 'B'])
  const rows = merged.map((r) => toFileRow(r, { me: 'me', groups: { G1: '스터디' } }))
  assert.equal(rows[0].from, '나')
  assert.equal(rows[0].kind, 'image')
  assert.equal(rows[1].from, '이서연')
  assert.equal(rows[1].source, '스터디')
  assert.equal(toFileRow({ ...mine, groupId: null }, { me: 'me' }).source, '나만 보기')
  assert.equal(fileKind('clip.mp4'), 'video')
})

test('만료 시각이 지나면 만료됨, 무기한은 무기한이다', () => {
  const now = Date.parse('2026-11-20T03:00:00Z')
  assert.equal(expiryLabel({ expiresAt: null }, now), '무기한')
  assert.equal(isExpired({ expiresAt: '2026-11-20T02:59:59Z' }, now), true)
  assert.equal(expiryLabel({ expiresAt: '2026-11-20T02:59:59Z' }, now), '만료됨')
  assert.match(expiryLabel({ expiresAt: '2026-11-27T03:00:00Z' }, now), /^\d+일 남음$/)
})

test('프록시가 본문 없이 413을 주면 한도 문구를 보인다', () => {
  assert.equal(attachmentErrorText({ status: 413 }), FILE_LIMIT_TEXT)
  assert.match(attachmentErrorText({ status: 0 }), /연결/)
})
