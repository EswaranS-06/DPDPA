import { formatDay } from '@duatf/core-utils'
import { buttonClass, Disclosure, EmptyState } from '@duatf/core-ui'
import type { AttentionItem, AttentionKind } from '@duatf/feature-compliance-api'
import {
  BadgeCheck,
  CalendarClock,
  CalendarX,
  CircleCheck,
  CircleDashed,
  ClockAlert,
  Eye,
  FileClock,
  FileSearch,
  FileUp,
  FileX,
  Inbox,
  ListTodo,
  ShieldAlert,
  Scale,
  Stamp,
  TriangleAlert,
  UserCheck,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'
import styles from './ActionCentre.module.css'

type Tone = 'danger' | 'pending' | 'warning' | 'info'

type Presentation = {
  icon: LucideIcon
  tone: Tone
  /** The sentence, from the count. */
  says: (count: number) => string
  /** What the button does. */
  cta: string
  href: (item: AttentionItem) => string
}

const plural = (count: number, one: string, many: string) => (count === 1 ? one : many)

const assessmentHref = (item: AttentionItem, query: string) =>
  item.assessmentCode
    ? `/clients/${item.clientCode}/assessments/${item.assessmentCode}?${query}`
    : `/clients/${item.clientCode}/assessments`

/** How each kind of work reads, what its button says and where it goes. */
export const ATTENTION: Record<AttentionKind, Presentation> = {
  breach_clocks: {
    icon: ShieldAlert,
    tone: 'danger',
    says: (n) => `${n} ${plural(n, 'breach has', 'breaches have')} an intimation still to make`,
    cta: 'Open breaches',
    href: (item) => `/clients/${item.clientCode}/breaches`,
  },
  rights_overdue: {
    icon: Inbox,
    tone: 'danger',
    says: (n) => `${n} rights ${plural(n, 'request is', 'requests are')} overdue`,
    cta: 'Open overdue requests',
    href: (item) => `/clients/${item.clientCode}/rights?show=overdue`,
  },
  processor_contracts_missing: {
    icon: FileX,
    tone: 'warning',
    says: (n) => `${n} ${plural(n, 'processor has', 'processors have')} no contract in force`,
    cta: 'Open processors',
    href: (item) => `/clients/${item.clientCode}/processors`,
  },
  processor_contracts_ending: {
    icon: CalendarClock,
    tone: 'info',
    says: (n) => `${n} processor ${plural(n, 'contract ends', 'contracts end')} within 60 days`,
    cta: 'Open processors',
    href: (item) => `/clients/${item.clientCode}/processors`,
  },
  dpia_reviews_due: {
    icon: FileSearch,
    tone: 'info',
    says: (n) => `${n} ${plural(n, 'DPIA is', 'DPIAs are')} due for review`,
    cta: 'Open DPIAs',
    href: (item) => `/clients/${item.clientCode}/dpia`,
  },
  signoffs_to_decide: {
    icon: Stamp,
    tone: 'pending',
    says: (n) => `${n} ${plural(n, 'assessment is', 'assessments are')} waiting for your sign-off`,
    cta: 'Open the assessment',
    href: (item) =>
      item.assessmentCode
        ? `/clients/${item.clientCode}/assessments/${item.assessmentCode}#signoff-title`
        : `/clients/${item.clientCode}/assessments`,
  },
  acceptances_lapsed: {
    icon: Scale,
    tone: 'danger',
    says: (n) => `${n} risk ${plural(n, 'acceptance has', 'acceptances have')} lapsed`,
    cta: 'Renew or reopen',
    href: (item) => `/clients/${item.clientCode}/risks?status=accepted`,
  },
  evidence_expired: {
    icon: CalendarX,
    tone: 'danger',
    says: (n) => `${n} evidence ${plural(n, 'file has', 'files have')} expired`,
    cta: 'See expired evidence',
    href: (item) => `/clients/${item.clientCode}/evidence?freshness=expired`,
  },
  evidence_expiring: {
    icon: CalendarClock,
    tone: 'warning',
    says: (n) => `${n} evidence ${plural(n, 'file expires', 'files expire')} within 30 days`,
    cta: 'See expiring evidence',
    href: (item) => `/clients/${item.clientCode}/evidence?freshness=expiring`,
  },
  overdue_actions: {
    icon: ClockAlert,
    tone: 'danger',
    says: (n) => `${n} remediation ${plural(n, 'action is', 'actions are')} overdue`,
    cta: 'Open overdue actions',
    href: (item) => `/clients/${item.clientCode}/actions?show=overdue`,
  },
  answers_to_check: {
    icon: Eye,
    tone: 'pending',
    says: (n) => `${n} ${plural(n, 'answer is', 'answers are')} not ticked as checked yet`,
    cta: 'Check answers',
    href: (item) => assessmentHref(item, 'check=unchecked'),
  },
  evidence_to_review: {
    icon: FileSearch,
    tone: 'pending',
    says: (n) => `${n} evidence ${plural(n, 'file is', 'files are')} waiting for review`,
    cta: 'Review evidence',
    href: (item) => `/clients/${item.clientCode}/evidence?status=pending_review`,
  },
  evidence_requested: {
    icon: FileClock,
    tone: 'info',
    says: (n) => `${n} requested evidence ${plural(n, 'file has', 'files have')} not come in yet`,
    cta: 'See requests',
    href: (item) => `/clients/${item.clientCode}/evidence#requests`,
  },
  actions_to_verify: {
    icon: BadgeCheck,
    tone: 'pending',
    says: (n) => `${n} ${plural(n, 'action is', 'actions are')} ready to verify or close`,
    cta: 'Verify actions',
    href: (item) => `/clients/${item.clientCode}/actions?show=verify`,
  },
  serious_risks: {
    icon: TriangleAlert,
    tone: 'warning',
    says: (n) => `${n} high-rated ${plural(n, 'risk is', 'risks are')} open`,
    cta: 'Open the risk register',
    href: (item) => `/clients/${item.clientCode}/risks`,
  },
  findings_without_actions: {
    icon: ListTodo,
    tone: 'warning',
    says: (n) => `${n} open ${plural(n, 'finding has', 'findings have')} no remediation action yet`,
    cta: 'Plan remediation',
    href: (item) => `/clients/${item.clientCode}/findings?status=open&plan=none`,
  },
  unanswered: {
    icon: CircleDashed,
    tone: 'info',
    says: (n) => `${n} ${plural(n, 'question is', 'questions are')} not answered yet`,
    cta: 'Answer questions',
    href: (item) => assessmentHref(item, 'state=pending'),
  },
  actions_under_way: {
    icon: Wrench,
    tone: 'info',
    says: (n) => `${n} remediation ${plural(n, 'action is', 'actions are')} under way`,
    cta: 'Track actions',
    href: (item) => `/clients/${item.clientCode}/actions?show=underway`,
  },
  my_actions: {
    icon: UserCheck,
    tone: 'info',
    says: (n) => `${n} remediation ${plural(n, 'action is', 'actions are')} assigned to you`,
    cta: 'Open my actions',
    href: (item) => `/clients/${item.clientCode}/actions?show=mine`,
  },
  my_requests: {
    icon: FileUp,
    tone: 'info',
    says: (n) => `${n} evidence ${plural(n, 'file is', 'files are')} asked of you`,
    cta: 'See your work',
    href: (item) => `/clients/${item.clientCode}#your-work-title`,
  },
}

const SHOWN = 6

/** How the earliest date of a kind reads, where "due" would be wrong. */
const DUE_WORD: Partial<Record<AttentionKind, string>> = {
  overdue_actions: 'oldest due',
  acceptances_lapsed: 'earliest ended',
  evidence_expired: 'earliest ended',
  evidence_expiring: 'first on',
  signoffs_to_decide: 'decide by',
  breach_clocks: 'next deadline',
  rights_overdue: 'oldest due',
  processor_contracts_ending: 'first on',
  dpia_reviews_due: 'first on',
}

const Row = ({ item, showClient }: { item: AttentionItem; showClient: boolean }) => {
  const look = ATTENTION[item.kind]
  const Icon = look.icon
  const context = [
    showClient ? item.clientName : null,
    item.assessmentCode,
    item.earliestDue ? `${DUE_WORD[item.kind] ?? 'due'} ${formatDay(item.earliestDue)}` : null,
  ].filter(Boolean)
  return (
    <li className={styles.row}>
      <span className={`${styles.icon} ${styles[look.tone]}`} aria-hidden="true">
        <Icon size={16} strokeWidth={2} />
      </span>
      <span className={styles.text}>
        <span className={styles.says}>{look.says(item.count)}</span>
        {context.length ? <span className={styles.context}>{context.join(', ')}</span> : null}
      </span>
      <Link href={look.href(item)} className={`${buttonClass('secondary', 'sm')} ${styles.cta}`}>
        {look.cta}
        {showClient ? <span className="visually-hidden">, {item.clientName}</span> : null}
      </Link>
    </li>
  )
}

/** "Needs your attention": the user's actionable work, most urgent first, each with its next step. */
export const ActionCentre = ({
  items,
  showClient,
}: {
  items: AttentionItem[]
  showClient: boolean
}) => {
  if (items.length === 0) {
    return (
      <EmptyState icon={CircleCheck} title="Nothing needs your attention" size="quiet">
        No overdue actions, unchecked answers or actions waiting to be verified.
      </EmptyState>
    )
  }
  const first = items.slice(0, SHOWN)
  const rest = items.slice(SHOWN)
  const key = (item: AttentionItem) => `${item.kind}-${item.clientId}-${item.assessmentCode ?? ''}`
  return (
    <div className={styles.centre}>
      <ul className={styles.list}>
        {first.map((item) => (
          <Row key={key(item)} item={item} showClient={showClient} />
        ))}
      </ul>
      {rest.length ? (
        <Disclosure summary={`${rest.length} more`}>
          <ul className={styles.list}>
            {rest.map((item) => (
              <Row key={key(item)} item={item} showClient={showClient} />
            ))}
          </ul>
        </Disclosure>
      ) : null}
    </div>
  )
}
