import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

function programsApiPlugin(): Plugin {
  const programsPath = path.resolve(__dirname, '.midnight-programs.json')
  const appsPath = path.resolve(__dirname, '.midnight-applications.json')

  const readJson = (file: string, fallback: any = []) => {
    try {
      if (fs.existsSync(file)) {
        const raw = fs.readFileSync(file, 'utf-8')
        return JSON.parse(raw)
      }
    } catch (e) {
      console.error(`[GrantShield API] Error reading ${file}:`, e)
    }
    return fallback
  }

  const writeJson = (file: string, data: any) => {
    try {
      fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8')
      return true
    } catch (e) {
      console.error(`[GrantShield API] Error writing ${file}:`, e)
      return false
    }
  }

  const handleMiddleware = (req: any, res: any, next: any) => {
    const url = req.url ? req.url.split('?')[0] : ''

    if (url === '/api/programs') {
      if (req.method === 'GET') {
        const data = readJson(programsPath, [])
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
        res.statusCode = 200
        res.end(JSON.stringify(data))
        return
      }

      if (req.method === 'POST') {
        let body = ''
        req.on('data', (chunk: Buffer) => {
          body += chunk.toString()
        })
        req.on('end', () => {
          try {
            const parsed = JSON.parse(body)
            if (Array.isArray(parsed)) {
              writeJson(programsPath, parsed)
              res.setHeader('Content-Type', 'application/json')
              res.statusCode = 200
              res.end(JSON.stringify({ success: true, count: parsed.length }))
              return
            }
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'Body must be an array of programs' }))
          } catch (e: any) {
            res.statusCode = 500
            res.end(JSON.stringify({ error: e.message }))
          }
        })
        return
      }
    }

    if (url === '/api/applications') {
      if (req.method === 'GET') {
        const data = readJson(appsPath, [])
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
        res.statusCode = 200
        res.end(JSON.stringify(data))
        return
      }

      if (req.method === 'POST') {
        let body = ''
        req.on('data', (chunk: Buffer) => {
          body += chunk.toString()
        })
        req.on('end', () => {
          try {
            const parsed = JSON.parse(body)
            if (Array.isArray(parsed)) {
              writeJson(appsPath, parsed)
              res.setHeader('Content-Type', 'application/json')
              res.statusCode = 200
              res.end(JSON.stringify({ success: true, count: parsed.length }))
              return
            }
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'Body must be an array of applications' }))
          } catch (e: any) {
            res.statusCode = 500
            res.end(JSON.stringify({ error: e.message }))
          }
        })
        return
      }
    }

    next()
  }

  return {
    name: 'grantshield-programs-api',
    configureServer(server) {
      server.middlewares.use(handleMiddleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(handleMiddleware)
    },
  }
}

export default defineConfig({
  plugins: [react(), programsApiPlugin()],
})
