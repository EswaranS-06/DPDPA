// The DUATF Playbook site: http://localhost:53001 on the person's own computer. It lists every
// task, and each button drives a visible Chrome window through the task in DUATF, reusing the
// guide window's tab when one is open. Start it with "npm start" (or Start playbook.cmd).
import { readFile } from 'node:fs/promises'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { homedir } from 'node:os'
import { extname, join, normalize, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Page } from 'playwright-core'
import { GuideBrowser } from './browser.ts'
import { GROUPS, TOURS, tourById } from './catalog.ts'
import { isControl } from './controls.ts'
import { TourRun, type Mode, type RunState } from './runner.ts'
import { searchTours } from './search.ts'

const BASE = (process.env.DUATF_URL ?? 'http://192.168.0.110:53000').replace(/\/$/, '')
const PORT = Number(process.env.PLAYBOOK_PORT ?? 53001)
const HOST = process.env.PLAYBOOK_HOST ?? '127.0.0.1'
const PROFILE =
  process.env.PLAYBOOK_PROFILE ??
  join(
    process.env.LOCALAPPDATA ?? join(homedir(), '.local', 'share'),
    'DUATF-Playbook',
    'browser-profile',
  )
const SITE = fileURLToPath(new URL('./site/', import.meta.url))

type Client = { code: string; name: string }

type State = {
  base: string
  browser: 'closed' | 'opening' | 'open'
  tab: 'reused' | 'new' | null
  user: { name: string; roles: string } | null
  practice: string | null
  clients: Client[]
  run: RunState | null
  error: string | null
}

const state: State = {
  base: BASE,
  browser: 'closed',
  tab: null,
  user: null,
  practice: null,
  clients: [],
  run: null,
  error: null,
}

const listeners = new Set<ServerResponse>()
const broadcast = () => {
  const data = `data: ${JSON.stringify(state)}\n\n`
  for (const response of listeners) response.write(data)
}

let current: TourRun | null = null
let currentPage: Page | null = null

const guide = new GuideBrowser({
  base: BASE,
  profileDir: PROFILE,
  ...(process.env.PLAYBOOK_BROWSER ? { channel: process.env.PLAYBOOK_BROWSER } : {}),
  onMessage: (message) => {
    if (typeof message !== 'object' || message === null) return
    const { type, action } = message as { type?: unknown; action?: unknown }
    if (type === 'targetClicked') current?.controls.push('targetClicked')
    if (type !== 'control' || !isControl(action)) return
    const finished = !state.run || ['done', 'stopped', 'error'].includes(state.run.status)
    if (action === 'close' || (action === 'stop' && finished)) {
      void currentPage?.evaluate(() => window.__duatfGuide?.hide()).catch(() => undefined)
      return
    }
    if (action === 'stop') current?.stop()
    else current?.controls.push(action)
  },
  onClosed: () => {
    current?.stop()
    current = null
    currentPage = null
    Object.assign(state, {
      browser: 'closed',
      tab: null,
      run: state.run && {
        ...state.run,
        status: 'stopped',
        message: 'The guide window was closed.',
      },
    })
    broadcast()
  },
})

/** The clients the signed-in account can open, read from DUATF in the guide tab. */
const readClients = async (page: Page): Promise<Client[]> => {
  if (!page.url().startsWith(BASE)) return []
  return page.evaluate(async () => {
    const response = await fetch('/clients', { credentials: 'same-origin' })
    const html = new DOMParser().parseFromString(await response.text(), 'text/html')
    const found = new Map<string, string>()
    for (const anchor of html.querySelectorAll<HTMLAnchorElement>('main a[href^="/clients/"]')) {
      const code = /^\/clients\/([^/?#]+)$/.exec(anchor.getAttribute('href') ?? '')?.[1]
      if (code && code !== 'new' && !found.has(code))
        found.set(code, anchor.textContent?.trim() || code)
    }
    return [...found].map(([code, name]) => ({ code: decodeURIComponent(code), name }))
  })
}

const startTour = async (tourId: string, mode: Mode) => {
  const tour = tourById(tourId)
  if (!tour) return
  current?.stop()
  state.error = null
  state.browser = guide.isOpen ? 'open' : 'opening'
  broadcast()
  try {
    const { page, reused } = await guide.tab()
    currentPage = page
    state.browser = 'open'
    state.tab = reused ? 'reused' : 'new'
    const run: TourRun = new TourRun(page, tour, {
      base: BASE,
      mode,
      ...(state.practice ? { client: state.practice } : {}),
      emit: (next) => {
        if (current !== run) return
        state.run = next
        broadcast()
      },
      onUser: (user) => {
        state.user = user
        broadcast()
      },
    })
    current = run
    state.run = run.current
    broadcast()
    const outcome = await run.run()
    if (outcome.outcome !== 'failed' && state.clients.length === 0) {
      state.clients = await readClients(page).catch(() => [])
      broadcast()
    }
  } catch (error) {
    state.browser = guide.isOpen ? 'open' : 'closed'
    state.error =
      error instanceof Error
        ? `The guide window could not start: ${error.message.split('\n')[0] ?? ''}. Is Google Chrome or Microsoft Edge installed?`
        : 'The guide window could not start.'
    broadcast()
  }
}

// --- HTTP ------------------------------------------------------------------------------------

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
}

const ALLOWED_HOSTS = new Set([`localhost:${PORT}`, `127.0.0.1:${PORT}`])

const send = (response: ServerResponse, status: number, body: unknown) => {
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  })
  response.end(JSON.stringify(body))
}

const readJson = async (request: IncomingMessage): Promise<Record<string, unknown>> => {
  let raw = ''
  for await (const chunk of request) {
    raw += String(chunk)
    if (raw.length > 10_000) throw new Error('Too large')
  }
  const parsed: unknown = JSON.parse(raw || '{}')
  return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : {}
}

/**
 * Only this page may drive the guide browser: the Host must be this server (no DNS rebinding),
 * and a POST must come from this origin as JSON (another site cannot send JSON without a CORS
 * preflight, which is never answered).
 */
const trusted = (request: IncomingMessage) => {
  if (!ALLOWED_HOSTS.has(request.headers.host ?? '')) return false
  if (request.method !== 'POST') return true
  const origin = request.headers.origin
  const fromHere = !origin || [...ALLOWED_HOSTS].some((host) => origin === `http://${host}`)
  return fromHere && (request.headers['content-type'] ?? '').startsWith('application/json')
}

const catalog = {
  groups: GROUPS,
  tours: TOURS.map((tour) => ({
    id: tour.id,
    group: tour.group,
    title: tour.title,
    summary: tour.summary,
    who: tour.who,
    steps: tour.steps.map((step) => ({ title: step.title, yours: Boolean(step.you) })),
  })),
}

const serveStatic = async (pathname: string, response: ServerResponse) => {
  const relative = pathname === '/' ? 'index.html' : pathname.slice(1)
  const file = normalize(join(SITE, relative))
  if (!file.startsWith(SITE.endsWith(sep) ? SITE : SITE + sep))
    return send(response, 404, { error: 'Not found' })
  try {
    const body = await readFile(file)
    response.writeHead(200, {
      'content-type': TYPES[extname(file)] ?? 'application/octet-stream',
      'cache-control': 'no-cache',
      'x-content-type-options': 'nosniff',
    })
    response.end(body)
  } catch {
    send(response, 404, { error: 'Not found' })
  }
}

const server = createServer((request, response) => {
  void (async () => {
    if (!trusted(request)) return send(response, 403, { error: 'Forbidden' })
    const url = new URL(request.url ?? '/', `http://${request.headers.host}`)
    const route = `${request.method} ${url.pathname}`
    try {
      switch (route) {
        case 'GET /api/catalog':
          return send(response, 200, catalog)
        case 'GET /api/search':
          return send(response, 200, {
            ids: searchTours(url.searchParams.get('q') ?? '', TOURS).map((tour) => tour.id),
          })
        case 'GET /api/state':
          return send(response, 200, state)
        case 'GET /api/events': {
          response.writeHead(200, {
            'content-type': 'text/event-stream',
            'cache-control': 'no-store',
            connection: 'keep-alive',
          })
          response.write(`data: ${JSON.stringify(state)}\n\n`)
          listeners.add(response)
          const ping = setInterval(() => response.write(': ping\n\n'), 20_000)
          request.on('close', () => {
            clearInterval(ping)
            listeners.delete(response)
          })
          return
        }
        case 'POST /api/run': {
          const body = await readJson(request)
          const mode = body.mode === 'guide' ? 'guide' : 'show'
          if (typeof body.tour !== 'string' || !tourById(body.tour)) {
            return send(response, 404, { error: 'Unknown task' })
          }
          void startTour(body.tour, mode)
          return send(response, 202, { ok: true })
        }
        case 'POST /api/control': {
          const body = await readJson(request)
          if (!isControl(body.action)) return send(response, 400, { error: 'Unknown control' })
          if (body.action === 'stop') current?.stop()
          else current?.controls.push(body.action)
          return send(response, 200, { ok: true })
        }
        case 'POST /api/practice': {
          const body = await readJson(request)
          state.practice = typeof body.client === 'string' && body.client ? body.client : null
          broadcast()
          return send(response, 200, { ok: true })
        }
        case 'POST /api/clients': {
          if (currentPage) state.clients = await readClients(currentPage).catch(() => state.clients)
          broadcast()
          return send(response, 200, { clients: state.clients })
        }
        default:
          if (request.method === 'GET') return serveStatic(url.pathname, response)
          return send(response, 404, { error: 'Not found' })
      }
    } catch {
      return send(response, 400, { error: 'Bad request' })
    }
  })()
})

server.listen(PORT, HOST, () => {
  console.log(`DUATF Playbook: http://localhost:${PORT}  (guiding ${BASE})`)
})

const shutdown = () => {
  void guide.close().finally(() => process.exit(0))
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
