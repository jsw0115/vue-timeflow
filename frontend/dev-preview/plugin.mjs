import { readFile } from 'node:fs/promises'
export function devicePreviewPlugin() {
  return {
    name: 'timeflow-device-preview',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url?.split('?')[0] !== '/__preview') return next()
        if (req.method !== 'GET' && req.method !== 'HEAD') {
          res.statusCode = 405
          res.setHeader('Allow', 'GET, HEAD')
          return res.end()
        }
        try {
          const source = await readFile(new URL('./index.html', import.meta.url), 'utf8')
          const html = await server.transformIndexHtml('/__preview', source)
          res.setHeader('Content-Type', 'text/html; charset=utf-8')
          res.setHeader('Cache-Control', 'no-store')
          res.setHeader('X-Content-Type-Options', 'nosniff')
          res.setHeader('Content-Security-Policy', "frame-src 'self'; object-src 'none'; base-uri 'self'")
          res.end(req.method === 'HEAD' ? undefined : html)
        } catch (error) { next(error) }
      })
    },
  }
}
