// 백업 파일 선택·미리보기·실패 후 동일 작업 재시도와 multipart 인증 헤더를 검증한다.
import test from 'node:test'
import assert from 'node:assert/strict'
import { backupForm, createBackupClient, MAX_BACKUP_BYTES } from '../src/features/backup/backupClient.mjs'

test('empty and oversized files are rejected before uploading', () => {
  assert.throws(() => backupForm(null), /8 MiB/)
  assert.throws(() => backupForm(new File([], 'empty.json')), /8 MiB/)
  assert.throws(() => backupForm({ size: MAX_BACKUP_BYTES + 1 }), /8 MiB/)
})
test('preview is mandatory and lost restore responses can reuse the same job and file', async () => {
  const file = new File(['{}'], 'backup.json', { type: 'application/json' }), id = 'restore-' + 'a'.repeat(64), requests = []
  let lose = true
  const client = createBackupClient(async (path, options) => {
    requests.push([path, await options.body.get('file').text()])
    if (lose) throw new Error('offline')
    return { state: 'COMPLETED', id }
  })
  await assert.rejects(client.restore(file, ''), /미리보기/)
  assert.equal(requests.length, 0)
  await assert.rejects(client.restore(file, id), /offline/)
  lose = false; assert.equal((await client.restore(file, id)).state, 'COMPLETED')
  assert.deepEqual(requests[0], requests[1])
})
test('incomplete export and restore responses never report success', async () => {
  const client = createBackupClient(async () => ({ state: 'FAILED' }))
  await assert.rejects(client.download(), /생성 결과/)
  await assert.rejects(client.restore(new File(['{}'], 'backup.json'), 'restore-' + 'b'.repeat(64)), /완료를 확인하지 못했습니다/)
})
test('authorized multipart upload keeps the browser boundary while JSON keeps its content type', async () => {
  globalThis.sessionStorage = { getItem: () => null, setItem: () => {} }
  const original = globalThis.fetch, calls = []
  try {
    globalThis.fetch = async (url, options) => { calls.push(options); return { status: 200 } }
    const { session, authorizedFetch } = await import('../src/features/auth/session.js')
    session.accessToken = 'test-token'
    await authorizedFetch('/api/user/data/backup/preview', { method: 'POST', body: backupForm(new File(['{}'], 'backup.json')) })
    await authorizedFetch('/api/planner/recordings/start', { method: 'POST', body: '{}' })
    assert.equal(calls[0].headers['Content-Type'], undefined)
    assert.equal(calls[0].headers.Authorization, 'Bearer test-token')
    assert.equal(calls[1].headers['Content-Type'], 'application/json')
    delete session.accessToken
  } finally { globalThis.fetch = original; delete globalThis.sessionStorage }
})
