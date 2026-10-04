const buildEnvironment = import.meta.env || {}

export function normalizeApiBase(value = '') {
  if (!value.trim()) return ''
  const url = new URL(value.trim())
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new Error('API address must be an HTTP(S) URL without credentials, query or fragment.')
  }
  const path = url.pathname.replace(/\/+$/, '')
  url.pathname = path.endsWith('/api') ? path : path + '/api'
  return url.toString().replace(/\/+$/, '')
}

export function apiEndpoint(path, options = {}) {
  if (typeof path !== 'string' || (path !== '/api' && !path.startsWith('/api/'))) {
    throw new Error('Only application API paths are allowed.')
  }
  const base = normalizeApiBase(options.baseUrl ?? buildEnvironment.VITE_API_BASE_URL ?? '')
  const target = options.target ?? buildEnvironment.VITE_DEPLOY_TARGET
  if (!base && target === 'pages') {
    throw new Error('서버 연결이 준비되지 않았습니다. 잠시 후 다시 시도해주세요.')
  }
  return base ? base + path.slice('/api'.length) : path
}
