/** What the person can press, on the playbook site or on the guide card. */
export type Control =
  | 'next'
  | 'back'
  | 'pause'
  | 'resume'
  | 'stop'
  | 'doit'
  | 'done'
  | 'skip'
  | 'close'
  | 'targetClicked'

export const CONTROLS: readonly Control[] = [
  'next',
  'back',
  'pause',
  'resume',
  'stop',
  'doit',
  'done',
  'skip',
  'close',
  'targetClicked',
]

export const isControl = (value: unknown): value is Control =>
  typeof value === 'string' && (CONTROLS as readonly string[]).includes(value)

/** A queue of presses that the runner waits on, with an optional time-out. */
export class ControlQueue {
  private queued: Control[] = []
  private waiting: ((control: Control | 'timeout') => void) | null = null

  push(control: Control): void {
    const resolve = this.waiting
    if (resolve) {
      this.waiting = null
      resolve(control)
    } else {
      this.queued.push(control)
    }
  }

  /** The next press, or "timeout" after ms (never when ms is undefined). */
  next(ms?: number): Promise<Control | 'timeout'> {
    const queued = this.queued.shift()
    if (queued) return Promise.resolve(queued)
    return new Promise((resolve) => {
      const timer =
        ms === undefined
          ? undefined
          : setTimeout(() => {
              if (this.waiting === settle) this.waiting = null
              resolve('timeout')
            }, ms)
      const settle = (control: Control | 'timeout') => {
        if (timer) clearTimeout(timer)
        resolve(control)
      }
      this.waiting = settle
    })
  }

  clear(): void {
    this.queued = []
  }
}
