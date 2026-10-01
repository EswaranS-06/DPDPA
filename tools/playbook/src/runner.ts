import type { Locator, Page } from 'playwright-core'
import { ControlQueue, type Control } from './controls.ts'
import { describeTarget, fillVars, locatorFor, type Vars } from './locate.ts'
import { TARGET_ATTRIBUTE, type CardView } from './overlay.ts'
import type { Step, StepAction, Tour } from './types.ts'

export type Mode = 'show' | 'guide' | 'check'

export type RunStatus =
  | 'starting'
  | 'playing'
  | 'paused'
  | 'waiting'
  | 'your-turn'
  | 'sign-in'
  | 'blocked'
  | 'done'
  | 'stopped'
  | 'error'

/** What the playbook site shows about the tour in progress. */
export type RunState = {
  tourId: string
  title: string
  mode: Mode
  step: number
  total: number
  stepTitles: string[]
  status: RunStatus
  message: string
  client: string | null
}

/** How far a check run got: to the end, to its hands-on step, or not. */
export type CheckOutcome = {
  tourId: string
  reached: number
  total: number
  outcome: 'complete' | 'hands-on' | 'failed'
  failure?: string
  /** Optional steps whose target was not on the page (data-dependent extras). */
  skipped?: string[]
}

type Options = {
  base: string
  mode: Mode
  /** The client to practise on; otherwise the one open in the tab, or the first listed. */
  client?: string
  emit?: (state: RunState) => void
  /** The signed-in account's name and roles, read from the user menu. */
  onUser?: (user: { name: string; roles: string }) => void
}

declare global {
  // Adding to the DOM's Window type needs an interface (declaration merging).
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Window {
    __duatfGuide?: { show: (view: CardView) => void; hide: () => void }
  }
}

const needsClient = (tour: Tour) =>
  tour.steps.some(
    (step) =>
      step.at?.includes('{client}') ||
      (step.target && 'css' in step.target && step.target.css.includes('{client}')),
  )

const actionLabel = (action: StepAction | undefined): string | null => {
  if (!action) return null
  if ('click' in action || 'open' in action || 'press' in action) return 'Select it'
  if ('fill' in action) return 'Type it'
  if ('attach' in action) return 'Attach it'
  return 'Choose it'
}

const readTime = (step: Step) => Math.min(11_000, Math.max(3_800, 1_600 + step.say.length * 42))

class Stopped extends Error {}

/** Walks one tour in one DUATF tab, showing, guiding or checking each step. */
export class TourRun {
  readonly controls = new ControlQueue()
  private stopped = false
  private paused = false
  private lastView: CardView | null = null
  private vars: Vars = {}
  private skipped: string[] = []
  private state: RunState
  private readonly origin: string
  private readonly page: Page
  private readonly tour: Tour
  private readonly options: Options

  constructor(page: Page, tour: Tour, options: Options) {
    this.page = page
    this.tour = tour
    this.options = options
    this.origin = new URL(options.base).origin
    this.state = {
      tourId: tour.id,
      title: tour.title,
      mode: options.mode,
      step: 0,
      total: tour.steps.length,
      stepTitles: tour.steps.map((step) => step.title),
      status: 'starting',
      message: '',
      client: null,
    }
    page.on('load', () => {
      if (this.lastView && !this.stopped) void this.card(this.lastView)
    })
  }

  get current(): RunState {
    return this.state
  }

  stop(): void {
    this.stopped = true
    this.controls.push('stop')
  }

  private emit(patch: Partial<RunState>) {
    this.state = { ...this.state, ...patch }
    this.options.emit?.(this.state)
  }

  private async card(view: CardView | null) {
    if (this.options.mode === 'check') return
    this.lastView = view
    try {
      await this.page.evaluate((next) => {
        if (next) window.__duatfGuide?.show(next)
        else window.__duatfGuide?.hide()
      }, view)
    } catch {
      // The page is between documents; the load handler shows the card again.
    }
  }

  private url(): URL {
    return new URL(this.page.url())
  }

  private onSignIn(): boolean {
    const url = this.url()
    if (url.protocol === 'about:') return false
    return url.origin !== this.origin || /^\/(login|auth)(\/|$)/.test(url.pathname)
  }

  private async waitForSignIn() {
    if (!this.onSignIn()) return
    if (this.options.mode === 'check') throw new Error('Not signed in.')
    this.emit({
      status: 'sign-in',
      message:
        'Sign in with your own DUATF account in the guide window. The tour carries on by itself.',
    })
    await this.card({ kind: 'signin', tour: this.tour.title })
    while (this.onSignIn()) {
      const control = await this.controls.next(1_000)
      if (control === 'stop') throw new Stopped()
    }
    await this.page.waitForLoadState('domcontentloaded').catch(() => undefined)
  }

  private async readUser() {
    if (!this.options.onUser) return
    const button = this.page.locator('[popovertarget="user-menu"]').first()
    const text = await button.innerText({ timeout: 4_000 }).catch(() => '')
    const [name = '', roles = ''] = text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
    if (name) this.options.onUser({ name, roles })
  }

  private async resolveClient(): Promise<string> {
    const inPath = /^\/clients\/([^/?#]+)/.exec(this.url().pathname)?.[1]
    if (inPath && inPath !== 'new') return decodeURIComponent(inPath)
    if (this.options.client) return this.options.client
    await this.page.goto(`${this.options.base}/`, { waitUntil: 'domcontentloaded' })
    await this.waitForSignIn()
    const redirected = /^\/clients\/([^/?#]+)/.exec(this.url().pathname)?.[1]
    if (redirected) return decodeURIComponent(redirected)
    await this.page.goto(`${this.options.base}/clients`, { waitUntil: 'domcontentloaded' })
    const href = await this.page
      .locator('main a[href^="/clients/"]:not([href="/clients/new"])')
      .first()
      .getAttribute('href', { timeout: 8_000 })
    const code = /^\/clients\/([^/?#]+)/.exec(href ?? '')?.[1]
    if (!code) throw new Error('No client to practise on. Onboard a client first.')
    return decodeURIComponent(code)
  }

  private async goTo(at: string) {
    const want = new URL(fillVars(at, this.vars), this.options.base)
    const here = this.url()
    const sameQuery = [...want.searchParams].every(
      ([key, value]) => here.searchParams.get(key) === value,
    )
    if (here.origin === want.origin && here.pathname === want.pathname && sameQuery) return
    await this.page.goto(want.href, { waitUntil: 'domcontentloaded' })
    await this.waitForSignIn()
  }

  private async find(step: Step): Promise<Locator | null> {
    if (!step.target) return null
    const locator = locatorFor(this.page, step.target, this.vars)
    const timeout = step.optional ? 2_500 : this.options.mode === 'check' ? 8_000 : 10_000
    try {
      await locator.waitFor({ state: 'attached', timeout })
      if (!(await locator.isVisible())) {
        // Fold-out content and file inputs may be hidden; open the fold first.
        await locator
          .evaluate((element) => {
            const details = element.closest('details')
            if (details) details.open = true
          })
          .catch(() => undefined)
      }
      await locator.scrollIntoViewIfNeeded({ timeout: 3_000 }).catch(() => undefined)
      return locator
    } catch {
      return null
    }
  }

  private async mark(locator: Locator | null) {
    await this.page
      .evaluate((attribute) => {
        for (const element of document.querySelectorAll(`[${attribute}]`)) {
          element.removeAttribute(attribute)
        }
      }, TARGET_ATTRIBUTE)
      .catch(() => undefined)
    if (locator) {
      await locator
        .evaluate((element, attribute) => element.setAttribute(attribute, ''), TARGET_ATTRIBUTE)
        .catch(() => undefined)
    }
  }

  private async settleAfterClick(before: string) {
    await this.page
      .waitForURL((url) => url.href !== before, { timeout: 1_500 })
      .catch(() => undefined)
    await this.page.waitForLoadState('domcontentloaded', { timeout: 10_000 }).catch(() => undefined)
    if (this.page.url() !== before) {
      await this.page.waitForLoadState('networkidle', { timeout: 6_000 }).catch(() => undefined)
    }
  }

  private async perform(action: StepAction, locator: Locator) {
    const typing = this.options.mode === 'show'
    if ('click' in action) {
      const before = this.page.url()
      await locator.click()
      await this.settleAfterClick(before)
    } else if ('open' in action) {
      await locator.evaluate((element) => {
        const details = element.closest('details')
        if (details) details.open = true
      })
    } else if ('fill' in action) {
      await locator.fill('')
      if (typing) await locator.pressSequentially(action.fill, { delay: 35 })
      else await locator.fill(action.fill)
    } else if ('select' in action) {
      await locator.selectOption({ label: action.select })
    } else if ('selectFirst' in action) {
      const value = await locator.evaluate((element) =>
        element instanceof HTMLSelectElement
          ? ([...element.options].find((option) => option.value)?.value ?? '')
          : '',
      )
      if (value) await locator.selectOption(value)
    } else if ('check' in action) {
      await locator.check()
    } else if ('press' in action) {
      await locator.press(action.press)
    } else if ('attach' in action) {
      await locator.setInputFiles({
        name: action.attach.name,
        mimeType: 'text/plain',
        buffer: Buffer.from(action.attach.text, 'utf8'),
      })
    }
  }

  private stepView(step: Step, index: number, hasTarget: boolean): CardView {
    return {
      kind: 'step',
      index,
      total: this.tour.steps.length,
      tour: this.tour.title,
      title: step.title,
      say: step.say,
      mode: this.options.mode === 'guide' ? 'guide' : 'show',
      readMs: this.paused ? 0 : readTime(step),
      paused: this.paused,
      action: actionLabel(step.action),
      hasTarget,
    }
  }

  /** Shows a step and waits for the reader; returns what moves the tour on. */
  private async present(step: Step, index: number, locator: Locator | null): Promise<Control> {
    for (;;) {
      await this.card(this.stepView(step, index, Boolean(locator)))
      this.emit({
        status: this.paused ? 'paused' : this.options.mode === 'guide' ? 'waiting' : 'playing',
      })
      const control = await this.controls.next(
        this.options.mode === 'show' && !this.paused ? readTime(step) : undefined,
      )
      if (control === 'timeout') return 'next'
      if (control === 'pause') this.paused = true
      else if (control === 'resume') this.paused = false
      else if (control === 'targetClicked') {
        if (step.action && 'click' in step.action) return 'targetClicked'
      } else if (['next', 'back', 'stop', 'doit'].includes(control)) return control
    }
  }

  private async handsOn(step: Step, index: number): Promise<'done' | 'skip' | 'back'> {
    const you = step.you
    if (!you) return 'done'
    this.emit({ status: 'your-turn', message: you.instruction })
    await this.card({
      kind: 'you',
      index,
      total: this.tour.steps.length,
      tour: this.tour.title,
      title: step.title,
      say: step.say,
      instruction: you.instruction,
    })
    const leaves = you.leaves ? fillVars(you.leaves, this.vars) : null
    for (;;) {
      const control = await this.controls.next(600)
      if (control === 'stop') throw new Stopped()
      if (control === 'done' || control === 'skip' || control === 'back') return control
      // A save that moves the page on (onboarding opens the new client) finishes the step.
      if (control === 'timeout' && leaves && !this.url().pathname.includes(leaves)) return 'done'
    }
  }

  private async blocked(step: Step, index: number): Promise<'next' | 'back'> {
    const what = step.target ? describeTarget(step.target) : 'this step'
    this.emit({
      status: 'blocked',
      message: `${what} is not on this page for your account. Who can do it: ${this.tour.who.join(', ')}.`,
    })
    await this.card({
      kind: 'blocked',
      index,
      total: this.tour.steps.length,
      tour: this.tour.title,
      title: step.title,
      say: step.say,
      who: this.tour.who.join(', '),
    })
    for (;;) {
      const control = await this.controls.next()
      if (control === 'stop') throw new Stopped()
      if (control === 'next' || control === 'back') return control
    }
  }

  /** Runs the tour. In check mode it returns how far it got instead of waiting for anyone. */
  async run(): Promise<CheckOutcome> {
    const check = this.options.mode === 'check'
    const total = this.tour.steps.length
    let index = 0
    try {
      if (this.url().protocol === 'about:' || this.onSignIn()) {
        await this.page.goto(`${this.options.base}/`, { waitUntil: 'domcontentloaded' })
      }
      await this.waitForSignIn()
      await this.readUser()
      if (needsClient(this.tour)) {
        this.vars.client = await this.resolveClient()
        this.emit({ client: this.vars.client })
      }
      while (index < total) {
        if (this.stopped) throw new Stopped()
        const step = this.tour.steps[index]
        if (!step) break
        this.emit({ step: index, message: '' })
        await this.waitForSignIn()
        if (step.at) await this.goTo(step.at)
        const locator = await this.find(step)
        if (step.target && !locator) {
          if (step.optional) {
            this.skipped.push(step.title)
            index += 1
            continue
          }
          if (check) {
            return {
              tourId: this.tour.id,
              reached: index,
              total,
              outcome: 'failed',
              failure: `Step ${index + 1} "${step.title}": ${describeTarget(step.target)} not found on ${this.url().pathname}${this.url().search}`,
            }
          }
          const choice = await this.blocked(step, index)
          index = choice === 'back' ? Math.max(0, index - 1) : index + 1
          continue
        }
        await this.mark(locator)
        if (step.you) {
          if (check)
            return {
              tourId: this.tour.id,
              reached: index + 1,
              total,
              outcome: 'hands-on',
              skipped: this.skipped,
            }
          const result = await this.handsOn(step, index)
          if (result === 'back') {
            index = Math.max(0, index - 1)
            continue
          }
          await this.mark(null)
          this.finish(
            result === 'skip'
              ? 'Nothing was saved. Pick another task on the playbook page.'
              : `That is the whole task: ${this.tour.title}.`,
          )
          await this.card({ kind: 'done', tour: this.tour.title, text: this.state.message })
          return {
            tourId: this.tour.id,
            reached: total,
            total,
            outcome: 'complete',
            skipped: this.skipped,
          }
        }
        const control = check ? 'next' : await this.present(step, index, locator)
        if (control === 'stop') throw new Stopped()
        if (control === 'back') {
          index = Math.max(0, index - 1)
          continue
        }
        if (control === 'targetClicked') {
          await this.settleAfterClick('')
        } else if (step.action && locator) {
          const guideSkips =
            this.options.mode === 'guide' &&
            control === 'next' &&
            !('click' in step.action || 'open' in step.action)
          if (!guideSkips) await this.perform(step.action, locator)
        }
        index += 1
      }
      await this.mark(null)
      this.finish(`That is the whole task: ${this.tour.title}.`)
      await this.card({ kind: 'done', tour: this.tour.title, text: this.state.message })
      return {
        tourId: this.tour.id,
        reached: total,
        total,
        outcome: 'complete',
        skipped: this.skipped,
      }
    } catch (error) {
      await this.mark(null).catch(() => undefined)
      if (error instanceof Stopped) {
        this.emit({ status: 'stopped', message: 'Stopped.' })
        await this.card(null)
        return {
          tourId: this.tour.id,
          reached: index,
          total,
          outcome: 'failed',
          failure: 'stopped',
        }
      }
      const message =
        error instanceof Error ? (error.message.split('\n')[0] ?? 'Error') : 'Unexpected error'
      this.emit({ status: 'error', message })
      return { tourId: this.tour.id, reached: index, total, outcome: 'failed', failure: message }
    }
  }

  private finish(message: string) {
    this.emit({ status: 'done', step: this.tour.steps.length, message })
  }
}
