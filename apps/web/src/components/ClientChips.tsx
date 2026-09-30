import { Chip, type ChipTone } from '@duatf/core-ui'
import { APPLICABILITY_LABEL, CLIENT_STATUS_LABEL } from '@duatf/feature-compliance-api'
import type { ApplicabilityState, ClientStatus } from '@duatf/platform-db'

const STATUS_TONE: Record<ClientStatus, ChipTone> = {
  prospect: 'neutral',
  onboarding: 'accent',
  active: 'live',
  on_hold: 'pending',
  closed: 'neutral',
}

const APPLICABILITY_TONE: Record<ApplicabilityState, ChipTone> = {
  applicable: 'accent',
  not_applicable: 'neutral',
  under_review: 'pending',
}

export const ClientStatusChip = ({ status }: { status: ClientStatus }) => (
  <Chip tone={STATUS_TONE[status]}>{CLIENT_STATUS_LABEL[status]}</Chip>
)

export const ApplicabilityChip = ({ applicability }: { applicability: ApplicabilityState }) => (
  <Chip tone={APPLICABILITY_TONE[applicability]}>{APPLICABILITY_LABEL[applicability]}</Chip>
)
