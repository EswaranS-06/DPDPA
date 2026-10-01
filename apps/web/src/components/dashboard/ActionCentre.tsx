import { formatDay } from '@duatf/core-utils'
import { buttonClass, Disclosure, EmptyState } from '@duatf/core-ui'
import type { AttentionItem, AttentionKind } from '@duatf/feature-compliance-api'
import {
  BadgeCheck,
  CircleCheck,
  CircleDashed,
  ClockAlert,
  Eye,
  FileSearch,
  ListTodo,
  TriangleAlert,
  Undo2,
  UserCheck,
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
  overdue_actions: {
    icon: ClockAlert,
    tone: 'danger',
    says: (n) => `${n} remediation ${plural(n, 'action is', 'actions are')} overdue`,
    cta: 'Open overdue actions',
    href: (item) => `/clients/${item.clientCode}/actions?show=overdue`,
  },
  returned_answers: {
    icon: Undo2,
    tone: 'danger',
    says: (n) => `${n} ${plural(n, 'answer was', 'answers were')} sent back for correction`,
    cta: 'Fix answers',
    href: (item) => assessmentHref(item, 'review=returned'),
  },
  answers_to_review: {
    icon: Eye,
    tone: 'pending',
    says: (n) => `${n} ${plural(n, 'answer is', 'answers are')} waiting for review`,
    cta: 'Review answers',
    href: (item) => assessmentHref(item, 'review=awaiting&department='),
  },
  evidence_to_review: {
    icon: FileSearch,
    tone: 'pending',
    says: (n) => `${n} evidence ${plural(n, 'file is', 'files are')} waiting for review`,
    cta: 'Review evidence',
    href: (item) => `/clients/${item.clientCode}/evidence?status=pending_review`,
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
  my_actions: {
    icon: UserCheck,
    tone: 'info',
    says: (n) => `${n} remediation ${plural(n, 'action is', 'actions are')} assigned to you`,
    cta: 'Open my actions',
    href: (item) => `/clients/${item.clientCode}/actions?show=mine`,
  },
}

const SHOWN = 6

const Row = ({ item, showClient }: { item: AttentionItem; showClient: boolean }) => {
  const look = ATTENTION[item.kind]
  const Icon = look.icon
  const context = [
    showClient ? item.clientName : null,
    item.assessmentCode,
    item.earliestDue
      ? `${item.kind === 'overdue_actions' ? 'oldest due' : 'due'} ${formatDay(item.earliestDue)}`
      : null,
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
        No overdue actions, answers sent back or reviews waiting on you.
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
