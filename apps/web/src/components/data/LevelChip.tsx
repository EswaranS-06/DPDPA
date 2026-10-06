import { Chip, type ChipTone } from '@duatf/core-ui'
import { LEVEL_INFO, type Level } from '@duatf/feature-compliance-api/personal-data'

const TONE: Record<Level, ChipTone> = { L1: 'neutral', L2: 'info', L3: 'warning', L4: 'danger' }

/** A sensitivity level as a labelled tag, e.g. "L4 Restricted". */
export const LevelChip = ({ level }: { level: Level }) => (
  <Chip tone={TONE[level]} title={LEVEL_INFO[level].meaning}>
    {level} {LEVEL_INFO[level].label}
  </Chip>
)
