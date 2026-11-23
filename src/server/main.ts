import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { loadConfig } from './config.ts'
import { createGitLabClient } from './gitlab/client.ts'
import { createGitLabProvider } from './gitlab/provider.ts'
import { buildDashboard } from './dashboard.ts'
import { createRefreshingCache } from './cache.ts'

const config = loadConfig()
const provider = createGitLabProvider(createGitLabClient(config.gitlabHost, config.gitlabToken))
const dashboard = createRefreshingCache(() => buildDashboard(provider), config.refreshMinutes * 60_000)

const distDir = join(import.meta.dirname, '../../dist')
const contentTypes: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { 'content-type': 'application/json' })
  res.end(JSON.stringify(body))
}

async function serveStatic(url: string, res: ServerResponse) {
  const path = normalize(url === '/' ? '/index.html' : url)
  try {
    const file = await readFile(join(distDir, path))
    res.writeHead(200, { 'content-type': contentTypes[extname(path)] ?? 'application/octet-stream' })
    res.end(file)
  } catch {
    res.writeHead(404).end('Not found. Run "npm run build" or use "npm run dev".')
  }
}

async function handle(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? '/', 'http://localhost').pathname
  try {
    if (req.method === 'GET' && url === '/api/dashboard') return sendJson(res, 200, await dashboard.get())
    if (req.method === 'POST' && url === '/api/refresh') return sendJson(res, 200, await dashboard.refresh())
    if (url.startsWith('/api/')) return sendJson(res, 404, { error: 'not found' })
    return serveStatic(url, res)
  } catch (e) {
    console.error(e)
    return sendJson(res, 502, { error: e instanceof Error ? e.message : String(e) })
  }
}

createServer(handle).listen(config.port, '127.0.0.1', () => {
  console.log(`mr-hub (${provider.name}: ${config.gitlabHost}) on http://127.0.0.1:${config.port}`)
})
