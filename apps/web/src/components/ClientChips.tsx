import type { ApplicabilityState, ClientStatus } from '@duatf/platform-db'
import { Status } from '@/components/status'

export const ClientStatusChip = ({ status }: { status: ClientStatus }) => (
  <Status kind="client" value={status} />
)

export const ApplicabilityChip = ({ applicability }: { applicability: ApplicabilityState }) => (
  <Status kind="applicability" value={applicability} />
)
