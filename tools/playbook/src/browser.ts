import { chromium, type BrowserContext, type Page } from 'playwright-core'
import { BINDING, overlayScript } from './overlay.ts'

/** The smallest view of a page or context that tab choice needs, so it can be tested with fakes. */
export type TabLike = { url(): string; isClosed(): boolean }
export type TabSource<T extends TabLike> = { pages(): T[]; newPage(): Promise<T> }

/**
 * Picks the tab a tour runs in: the guide window's DUATF tab if one is open, then any other tab
 * it opened (a sign-in page, say), then an empty tab, and only then a new one.
 */
export const pickTab = async <T extends TabLike>(
  source: TabSource<T>,
  base: string,
): Promise<{ page: T; reused: boolean }> => {
  const origin = new URL(base).origin
  const open = source.pages().filter((page) => !page.isClosed())
  const onApp = open.find((page) => page.url().startsWith(origin))
  if (onApp) return { page: onApp, reused: true }
  const elsewhere = open.find((page) => /^https?:/.test(page.url()))
  if (elsewhere) return { page: elsewhere, reused: true }
  const blank = open.find((page) => page.url() === 'about:blank')
  if (blank) return { page: blank, reused: false }
  return { page: await source.newPage(), reused: false }
}

type Options = {
  base: string
  profileDir: string
  /** Installed browser to drive: "chrome" by default, "msedge" as the fallback. */
  channel?: string
  headless?: boolean
  /** Messages from the guide card inside DUATF pages. */
  onMessage: (message: unknown) => void
  onClosed: () => void
}

/**
 * The guide window: a real, visible Chrome with its own profile, so the DUATF sign-in is kept
 * between tours. It is opened on the first tour and reused until the person closes it.
 */
export class GuideBrowser {
  private context: BrowserContext | null = null
  private opening: Promise<BrowserContext> | null = null
  private readonly options: Options

  constructor(options: Options) {
    this.options = options
  }

  get isOpen(): boolean {
    return this.context !== null
  }

  private async launch(): Promise<BrowserContext> {
    const channels = this.options.channel ? [this.options.channel] : ['chrome', 'msedge']
    let lastError: unknown = null
    for (const channel of channels) {
      try {
        const context = await chromium.launchPersistentContext(this.options.profileDir, {
          channel,
          headless: this.options.headless ?? false,
          viewport: null,
          args: ['--start-maximized', '--no-default-browser-check'],
        })
        await context.exposeBinding(BINDING, (_source, message: unknown) => {
          this.options.onMessage(message)
        })
        await context.addInitScript({ content: overlayScript(new URL(this.options.base).origin) })
        context.on('close', () => {
          this.context = null
          this.options.onClosed()
        })
        return context
      } catch (error) {
        lastError = error
      }
    }
    throw lastError instanceof Error ? lastError : new Error('No browser could be started.')
  }

  /** The tab to run in, opening the guide window first if needed. */
  async tab(): Promise<{ page: Page; reused: boolean; launched: boolean }> {
    let launched = false
    if (!this.context) {
      this.opening ??= this.launch()
      try {
        this.context = await this.opening
        launched = true
      } finally {
        this.opening = null
      }
    }
    const choice = await pickTab(this.context, this.options.base)
    await choice.page.bringToFront().catch(() => undefined)
    return { ...choice, launched }
  }

  async close(): Promise<void> {
    await this.context?.close()
    this.context = null
  }
}
