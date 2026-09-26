import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createServer as createHttpServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { createServer } from 'vite'
import { readPreviewState } from '../dev-preview/model.mjs'

test('preview accepts supported dimensions and rejects external or recursive routes', () => {
  assert.deepEqual(readPreviewState(''), { view: 'both', route: '/', width: 390 })
  assert.deepEqual(readPreviewState('?view=mobile&screen=/tasks&width=320'), { view: 'mobile', route: '/tasks', width: 320 })
  for (const unsafe of ['https://example.com', '//example.com', 'javascript:alert(1)', '/__preview', '/api/auth/me', '/admin']) {
    assert.equal(readPreviewState('?screen=' + encodeURIComponent(unsafe)).route, '/')
  }
  assert.equal(readPreviewState('?width=999999&view=invalid').width, 390)
  assert.equal(readPreviewState('?view=invalid').view, 'both')
})

test('preview rejects writes; API proxy preserves path and authorization', async () => {
  const api = createHttpServer((req, res) => {
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ url: req.url, authorization: req.headers.authorization }))
  })
  await new Promise(resolve => api.listen(0, '127.0.0.1', resolve))
  const previous = process.env.DEV_API_TARGET
  process.env.DEV_API_TARGET = 'http://127.0.0.1:' + api.address().port
  let vite
  try {
    // Vite treats port 0 as its default; avoid the user's running 5173 server.
    vite = await createServer({
      root: fileURLToPath(new URL('../', import.meta.url)),
      configFile: fileURLToPath(new URL('../vite.config.js', import.meta.url)),
      server: { port: 15173, strictPort: false, open: false },
      logLevel: 'error',
    })
    await vite.listen()
    const origin = 'http://127.0.0.1:' + vite.httpServer.address().port
    const preview = await fetch(origin + '/__preview?view=mobile')
    assert.equal(preview.status, 200)
    assert.match(preview.headers.get('content-type'), /text\/html/)
    assert.match(preview.headers.get('content-security-policy'), /frame-src 'self'/)
    assert.match(await preview.text(), /id="mobile-frame"/)
    assert.equal((await fetch(origin + '/__preview', { method: 'POST' })).status, 405)
    assert.equal((await fetch(origin + '/dev-preview/main.js')).status, 200)
    const response = await fetch(origin + '/api/preview-probe?date=2026-09-25', { headers: { Authorization: 'Bearer test-placeholder' } })
    assert.deepEqual(await response.json(), { url: '/api/preview-probe?date=2026-09-25', authorization: 'Bearer test-placeholder' })
    assert.equal((await fetch(origin + '/src/main.js')).status, 200)
  } finally {
    if (vite) await vite.close()
    await new Promise(resolve => api.close(resolve))
    if (previous === undefined) delete process.env.DEV_API_TARGET
    else process.env.DEV_API_TARGET = previous
  }
})

test('production HTML excludes the development preview', async () => {
  const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8')
  assert.doesNotMatch(html, /dev-preview|__preview/)
})
