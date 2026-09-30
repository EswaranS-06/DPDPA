import { Chip } from '@duatf/core-ui'
import { PENALTY } from '../../consts/labels'

export const PenaltyChip = ({ tier }: { tier: string | null }) => {
  const penalty = tier ? PENALTY[tier] : undefined
  if (!penalty) return null
  return (
    <Chip tone={penalty.tone} title={`Act Schedule, ${penalty.basis}`}>
      {penalty.amount}
    </Chip>
  )
}
