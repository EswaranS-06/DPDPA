import { Chip, type ChipTone } from '@duatf/core-ui'

const tone = (weight: number): ChipTone =>
  weight >= 5 ? 'severe' : weight >= 4 ? 'pending' : 'neutral'

/** Impact weight 1-5, taken from the heaviest penalty tier of the linked obligations. */
export const ImpactChip = ({ weight }: { weight: number }) => (
  <Chip tone={tone(weight)} title="Impact weight, from the penalty tier of the linked obligations">
    Impact {weight}/5
  </Chip>
)
