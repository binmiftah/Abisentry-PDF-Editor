import { createHash } from 'node:crypto'
import { readFileSync, readdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// The imported reference engine uses PDF.js CMaps, standard fonts and WASM decoders.
// Keep these resources on the same origin instead of relying on a CDN.
function pdfjsResources() {
  const virtualId = 'virtual:pdfjs-resources'
  const resolvedId = `\0${virtualId}`
  const packageDir = path.resolve(path.dirname(createRequire(import.meta.url).resolve('pdfjs-dist')), '..')
  const dirs = ['wasm', 'cmaps', 'iccs', 'standard_fonts']
  const files = dirs.flatMap((dir) =>
    readdirSync(path.join(packageDir, dir), { withFileTypes: true })
      .filter((entry) => entry.isFile() && !entry.name.startsWith('quickjs-'))
      .map((entry) => `${dir}/${entry.name}`)
      .sort(),
  )
  const hash = createHash('sha256')
  for (const file of files) hash.update(file).update(readFileSync(path.join(packageDir, file)))
  const digest = hash.digest('hex').slice(0, 8)
  let folder = ''

  return {
    name: 'abysentry-pdfjs-resources',
    configResolved(config) {
      folder = `${config.build.assetsDir.replace(/\/+$/, '')}/pdfjs-${digest}/`
    },
    resolveId(id) {
      return id === virtualId ? resolvedId : undefined
    },
    load(id) {
      if (id !== resolvedId) return undefined
      if (!folder) throw new Error('PDF.js resource path was not initialized')
      return `export const PDFJS_RESOURCES = ${JSON.stringify(folder)};`
    },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const [pathname = ''] = (request.url ?? '').split('?')
        const file = pathname.startsWith(`/${folder}`) ? pathname.slice(folder.length + 1) : ''
        if (!files.includes(file)) return next()
        const extension = path.extname(file)
        const types = {
          '.wasm': 'application/wasm',
          '.js': 'text/javascript',
          '.bcmap': 'application/octet-stream',
          '.icc': 'application/vnd.iccprofile',
          '.pfb': 'application/x-font-type1',
          '.ttf': 'font/ttf',
        }
        response.setHeader('Content-Type', types[extension] ?? 'application/octet-stream')
        response.end(readFileSync(path.join(packageDir, file)))
      })
    },
    generateBundle() {
      for (const file of files) {
        this.emitFile({
          type: 'asset',
          fileName: `${folder}${file}`,
          source: readFileSync(path.join(packageDir, file)),
        })
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), pdfjsResources()],
  resolve: {
    alias: {
      '@/components/ui': fileURLToPath(new URL('./src/integrations/editmypdf/components/ui', import.meta.url)),
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
