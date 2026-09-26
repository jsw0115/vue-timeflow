import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { devicePreviewPlugin } from './dev-preview/plugin.mjs'

export default defineConfig(({ mode }) => {
  // Server-only value. Client secrets must never use a VITE_ prefix.
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.DEV_API_TARGET || 'http://127.0.0.1:8080'
  if (!/^https?:\/\//.test(apiTarget)) throw new Error('DEV_API_TARGET must be an HTTP(S) URL')
  return {
    plugins: [vue(), devicePreviewPlugin()],
    server: {
      host: '127.0.0.1',
      port: 5173,
      strictPort: true,
      proxy: { '/api': { target: apiTarget, changeOrigin: true } },
    },
    base: './',
  }
})
