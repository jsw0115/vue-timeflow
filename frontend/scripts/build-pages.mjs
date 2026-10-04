import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { loadEnv } from 'vite'
import { pagesSettings } from './pages-settings.mjs'

const directory = fileURLToPath(new URL('../', import.meta.url))
const settings = pagesSettings({ ...loadEnv('production', directory, ''), ...process.env })
if (!settings.apiBase) {
  console.warn('Pages preview: API is not configured; login and server chat require VITE_API_BASE_URL.')
}
const result = spawnSync(process.execPath, [
  fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url)),
  'build', '--base', settings.base,
], {
  cwd: directory,
  stdio: 'inherit',
  env: {
    ...process.env,
    VITE_API_BASE_URL: settings.apiBase,
    VITE_ROUTER_MODE: settings.routerMode,
    VITE_DEPLOY_TARGET: settings.target,
  },
})
if (result.error) throw result.error
process.exit(result.status ?? 1)
