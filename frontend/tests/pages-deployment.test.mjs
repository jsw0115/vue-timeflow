import test from 'node:test'
import assert from 'node:assert/strict'
import { apiEndpoint, normalizeApiBase } from '../src/features/auth/apiEndpoint.mjs'
import { pagesSettings } from '../scripts/pages-settings.mjs'

test('same-origin development retains existing API requests', () => {
  assert.equal(apiEndpoint('/api/auth/login'), '/api/auth/login')
  assert.equal(apiEndpoint('/api/chat/search?q=test'), '/api/chat/search?q=test')
})

test('external API origin and /api suffix resolve once for auth and chat SSE', () => {
  for (const baseUrl of ['https://api.example.test', 'https://api.example.test/api/']) {
    assert.equal(apiEndpoint('/api/auth/login', { baseUrl }), 'https://api.example.test/api/auth/login')
    assert.equal(apiEndpoint('/api/chat/events', { baseUrl }), 'https://api.example.test/api/chat/events')
  }
})

test('reverse-proxy API prefixes and encoded search queries are preserved', () => {
  const path = '/api/chat/search?q=%ED%95%A0%20%EC%9D%BC&limit=20'
  assert.equal(apiEndpoint(path, { baseUrl: 'https://example.test/timeflow/api' }),
    'https://example.test/timeflow/api/chat/search?q=%ED%95%A0%20%EC%9D%BC&limit=20')
})

test('preview can build without an API but cannot accidentally call the Pages host', () => {
  assert.equal(pagesSettings().apiBase, '')
  assert.throws(() => apiEndpoint('/api/auth/login', { target: 'pages' }), /서버 연결/)
})

test('production Pages settings require HTTPS and can require API configuration', () => {
  assert.throws(() => pagesSettings({ VITE_API_BASE_URL: 'http://api.example.test/api' }), /HTTPS/)
  assert.throws(() => pagesSettings({ PAGES_REQUIRE_API: 'true' }), /VITE_API_BASE_URL/)
  assert.equal(pagesSettings({ PAGES_REQUIRE_API: 'true', VITE_API_BASE_URL: 'https://api.example.test' }).apiBase,
    'https://api.example.test/api')
})

test('relative assets and explicit project bases work with hash routing', () => {
  for (const base of ['./', '/', '/vue-timeflow/', '/group/project/']) {
    const settings = pagesSettings({ PAGES_BASE_PATH: base })
    assert.equal(settings.base, base)
    assert.equal(settings.routerMode, 'hash')
  }
  for (const base of ['project/', 'https://example.test/', '/project', '/space here/']) {
    assert.throws(() => pagesSettings({ PAGES_BASE_PATH: base }), /PAGES_BASE_PATH/)
  }
})

test('API settings reject credentials and URL token/query fragments', () => {
  for (const value of ['javascript:alert(1)', 'https://user:password@example.test/api',
    'https://example.test/api?token=secret', 'https://example.test/api#secret']) {
    assert.throws(() => normalizeApiBase(value))
  }
})

test('authorized requests cannot select arbitrary external URLs', () => {
  for (const path of ['https://other.example.test', '//other.example.test/api', '/other']) {
    assert.throws(() => apiEndpoint(path, { baseUrl: 'https://api.example.test/api' }), /API paths/)
  }
})
