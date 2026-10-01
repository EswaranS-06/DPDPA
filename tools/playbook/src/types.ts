// The shape of a guided tour. Tours are data: the runner reads them, the site lists them, and the
// check script walks them against a running DUATF to prove every step still finds its target.

/** ARIA roles the tours point at, as Playwright's getByRole understands them. */
export type TargetRole =
  | 'link'
  | 'button'
  | 'heading'
  | 'textbox'
  | 'combobox'
  | 'checkbox'
  | 'radio'
  | 'navigation'
  | 'region'
  | 'group'
  | 'dialog'
  | 'tab'
  | 'searchbox'
  | 'table'

/** How to find an element on a DUATF page. */
export type Target =
  | { role: TargetRole; name?: string; exact?: boolean; nth?: number; within?: Target }
  | { label: string; exact?: boolean; nth?: number }
  | { text: string; exact?: boolean; nth?: number; within?: Target }
  | { css: string; nth?: number }

/** What the guide does on a step when it shows rather than waits. */
export type StepAction =
  | { click: true }
  | { fill: string }
  | { select: string }
  | { selectFirst: true }
  | { check: true }
  | { press: string }
  /** Opens a fold-out (details) section without closing it when it is already open. */
  | { open: true }
  | { attach: { name: string; text: string } }

/** A step the person must do themselves, because it saves or sends something. */
export type HandsOn = {
  /** What to do, e.g. "Press Onboard client to save it, or Skip to leave without saving." */
  instruction: string
  /** The step is done when the address no longer starts with this path. */
  leaves?: string
}

export type Step = {
  title: string
  /** One to three sentences shown in the guide card. */
  say: string
  /** The page the step happens on; {client} is the practice client's code. */
  at?: string
  target?: Target
  /** Skip the step quietly when its target is not on the page (data-dependent extras). */
  optional?: boolean
  action?: StepAction
  you?: HandsOn
}

export type Tour = {
  id: string
  group: GroupId
  title: string
  /** One line: what the task achieves. */
  summary: string
  /** The capability the task needs (core-access), checked against the permission matrix. */
  capability: string
  /** Who can do it, as role labels; must equal the capability's roles (TC-C18.1-01). */
  who: string[]
  /** Extra words people may search for. */
  keywords: string[]
  /** Account the automated check signs in as: a ComplyX admin and lead auditor, or a client user. */
  persona: 'staff' | 'dpo' | 'owner'
  steps: Step[]
}

export type GroupId =
  | 'start'
  | 'clients'
  | 'organisation'
  | 'assessments'
  | 'evidence'
  | 'findings'
  | 'remediation'
  | 'reporting'
  | 'knowledge'
  | 'admin'

export type Group = { id: GroupId; title: string; purpose: string }
