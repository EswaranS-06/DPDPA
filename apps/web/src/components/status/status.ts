import type { ChipTone } from '@duatf/core-ui'
import {
  ACTION_STATUS_LABEL,
  ANSWER_LABEL,
  APPLICABILITY_LABEL,
  ASSESSMENT_STATUS_LABEL,
  CLIENT_STATUS_LABEL,
  COMPLIANCE_LABEL,
  REVIEW_LABEL,
} from '@duatf/feature-compliance-api'
import type {
  ActionStatus,
  Answer,
  ApplicabilityState,
  AssessmentStatus,
  ClientStatus,
  ComplianceState,
  EvidenceStatus,
  FindingStatus,
  GapType,
  ReviewState,
  RiskStatus,
  UserStatus,
} from '@duatf/platform-db'
import {
  Archive,
  Ban,
  BadgeCheck,
  CircleAlert,
  CircleCheck,
  CircleDashed,
  CircleDot,
  CirclePause,
  CircleQuestionMark,
  CircleX,
  Eye,
  Hourglass,
  Info,
  Landmark,
  Mail,
  Minus,
  Scale,
  ShieldCheck,
  Undo2,
  UserCheck,
  type LucideIcon,
} from 'lucide-react'

/** One state in the status language: a label, a tone and an icon, never colour alone. */
export type StatusEntry = { label: string; tone: ChipTone; icon: LucideIcon }

/** Every kind of state a record can be in, with the values it can take. */
export type StatusKinds = {
  answer: Answer
  compliance: ComplianceState
  review: ReviewState
  assessment: AssessmentStatus
  action: ActionStatus
  finding: FindingStatus
  gap: GapType
  risk: RiskStatus
  evidence: EvidenceStatus
  client: ClientStatus
  applicability: ApplicabilityState
  user: UserStatus
}

const entry = (label: string, tone: ChipTone, icon: LucideIcon): StatusEntry => ({
  label,
  tone,
  icon,
})

/**
 * The status language. Green means met or done, amber needs attention, red is a gap or a
 * refusal, blue is work under way, violet is waiting on someone else's review, grey is not
 * started or not applicable. TC-C16.1-02 checks that every database value has an entry.
 */
export const STATUS: { [K in keyof StatusKinds]: Record<StatusKinds[K], StatusEntry> } = {
  answer: {
    yes: entry(ANSWER_LABEL.yes, 'success', CircleCheck),
    partial: entry(ANSWER_LABEL.partial, 'warning', CircleAlert),
    no: entry(ANSWER_LABEL.no, 'danger', CircleX),
    not_applicable: entry(ANSWER_LABEL.not_applicable, 'neutral', Minus),
    not_assessed: entry(ANSWER_LABEL.not_assessed, 'neutral', CircleDashed),
    recorded: entry(ANSWER_LABEL.recorded, 'neutral', Info),
  },
  compliance: {
    compliant: entry(COMPLIANCE_LABEL.compliant, 'success', CircleCheck),
    potential_gap: entry(COMPLIANCE_LABEL.potential_gap, 'warning', CircleAlert),
    gap: entry(COMPLIANCE_LABEL.gap, 'danger', CircleX),
    excluded: entry(COMPLIANCE_LABEL.excluded, 'neutral', Minus),
    pending: entry(COMPLIANCE_LABEL.pending, 'neutral', CircleDashed),
    informational: entry(COMPLIANCE_LABEL.informational, 'neutral', Info),
  },
  review: {
    not_reviewed: entry(REVIEW_LABEL.not_reviewed, 'neutral', CircleDashed),
    accepted: entry(REVIEW_LABEL.accepted, 'success', BadgeCheck),
    returned: entry(REVIEW_LABEL.returned, 'danger', Undo2),
  },
  assessment: {
    draft: entry(ASSESSMENT_STATUS_LABEL.draft, 'neutral', CircleDashed),
    in_progress: entry(ASSESSMENT_STATUS_LABEL.in_progress, 'info', CircleDot),
    in_review: entry(ASSESSMENT_STATUS_LABEL.in_review, 'pending', Eye),
    completed: entry(ASSESSMENT_STATUS_LABEL.completed, 'success', CircleCheck),
  },
  action: {
    open: entry(ACTION_STATUS_LABEL.open, 'neutral', CircleDashed),
    assigned: entry(ACTION_STATUS_LABEL.assigned, 'info', UserCheck),
    in_progress: entry(ACTION_STATUS_LABEL.in_progress, 'info', CircleDot),
    pending_evidence: entry(ACTION_STATUS_LABEL.pending_evidence, 'warning', Hourglass),
    under_review: entry(ACTION_STATUS_LABEL.under_review, 'pending', Eye),
    rejected: entry(ACTION_STATUS_LABEL.rejected, 'danger', CircleX),
    remediated: entry(ACTION_STATUS_LABEL.remediated, 'success', BadgeCheck),
    closed: entry(ACTION_STATUS_LABEL.closed, 'success', CircleCheck),
    accepted_risk: entry(ACTION_STATUS_LABEL.accepted_risk, 'neutral', Scale),
  },
  finding: {
    open: entry('Open', 'info', CircleDot),
    closed: entry('Closed', 'neutral', CircleCheck),
  },
  gap: {
    gap: entry('Gap', 'danger', CircleX),
    potential_gap: entry('Potential gap', 'warning', CircleAlert),
  },
  risk: {
    open: entry('Open', 'warning', CircleAlert),
    treated: entry('Treated', 'success', ShieldCheck),
    accepted: entry('Accepted by client', 'neutral', Scale),
    closed: entry('Closed', 'neutral', CircleCheck),
  },
  evidence: {
    pending_review: entry('Awaiting review', 'pending', Hourglass),
    accepted: entry('Accepted', 'success', BadgeCheck),
    rejected: entry('Rejected', 'danger', CircleX),
  },
  client: {
    prospect: entry(CLIENT_STATUS_LABEL.prospect, 'neutral', CircleDashed),
    onboarding: entry(CLIENT_STATUS_LABEL.onboarding, 'info', CircleDot),
    active: entry(CLIENT_STATUS_LABEL.active, 'success', CircleCheck),
    on_hold: entry(CLIENT_STATUS_LABEL.on_hold, 'warning', CirclePause),
    closed: entry(CLIENT_STATUS_LABEL.closed, 'neutral', Archive),
  },
  applicability: {
    applicable: entry(APPLICABILITY_LABEL.applicable, 'brand', Landmark),
    not_applicable: entry(APPLICABILITY_LABEL.not_applicable, 'neutral', Minus),
    under_review: entry(APPLICABILITY_LABEL.under_review, 'warning', CircleQuestionMark),
  },
  user: {
    invited: entry('Invited', 'pending', Mail),
    active: entry('Active', 'success', CircleCheck),
    disabled: entry('Disabled', 'neutral', Ban),
  },
}

const BAND_TONE: Record<string, ChipTone> = {
  live: 'success',
  pending: 'warning',
  severe: 'danger',
  accent: 'brand',
}

/** Risk bands are configured in the database with a tone name; this maps it to a badge tone. */
export const bandTone = (tone: string): ChipTone => BAND_TONE[tone] ?? 'neutral'
