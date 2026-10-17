import { Chip } from '@duatf/core-ui'
import { STATUS, type StatusKinds } from './status'

/** A record's state as a badge: <Status kind="action" value={row.status} />. */
export const Status = <K extends keyof StatusKinds>({
  kind,
  value,
}: {
  kind: K
  value: StatusKinds[K]
}) => {
  const entry = STATUS[kind][value]
  return (
    <Chip tone={entry.tone} icon={entry.icon}>
      {entry.label}
    </Chip>
  )
}
