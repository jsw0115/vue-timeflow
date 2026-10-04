import { normalizeApiBase } from '../src/features/auth/apiEndpoint.mjs'

export function pagesSettings(environment = {}) {
  const base = environment.PAGES_BASE_PATH || './'
  if (base !== './' && !/^\/(?:[A-Za-z0-9_.-]+\/)*$/.test(base)) {
    throw new Error('PAGES_BASE_PATH must be ./ or a path with leading and trailing slashes.')
  }
  const apiBase = normalizeApiBase(environment.VITE_API_BASE_URL || '')
  if (apiBase && !apiBase.startsWith('https://')) {
    throw new Error('GitLab Pages requires an HTTPS API address.')
  }
  if (!apiBase && environment.PAGES_REQUIRE_API === 'true') {
    throw new Error('Set VITE_API_BASE_URL before publishing with PAGES_REQUIRE_API=true.')
  }
  return { base, apiBase, routerMode: 'hash', target: 'pages' }
}
