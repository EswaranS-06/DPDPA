import { Chip, type ChipTone } from '@duatf/core-ui'
import { ratingFor, type Band } from '@duatf/feature-compliance-api'
import type { FindingStatus, GapType, RiskStatus } from '@duatf/platform-db'
import styles from './RiskBits.module.css'

const TONES: readonly ChipTone[] = ['neutral', 'live', 'pending', 'severe', 'accent']
const toneOf = (tone: string): ChipTone => TONES.find((item) => item === tone) ?? 'neutral'

export const BandChip = ({ band, score }: { band: Band; score?: number }) => (
  <Chip tone={toneOf(band.tone)}>
    {band.name}
    {score === undefined ? '' : ` · ${score}`}
  </Chip>
)

export const GapChip = ({ gapType }: { gapType: GapType }) =>
  gapType === 'gap' ? <Chip tone="severe">Gap</Chip> : <Chip tone="pending">Potential gap</Chip>

export const FindingStatusChip = ({ status }: { status: FindingStatus }) =>
  status === 'open' ? <Chip tone="accent">Open</Chip> : <Chip>Closed</Chip>

const RISK_STATUS: Record<RiskStatus, { label: string; tone: ChipTone }> = {
  open: { label: 'Open', tone: 'accent' },
  treated: { label: 'Treated', tone: 'live' },
  accepted: { label: 'Accepted by client', tone: 'pending' },
  closed: { label: 'Closed', tone: 'neutral' },
}

export const RiskStatusChip = ({ status }: { status: RiskStatus }) => (
  <Chip tone={RISK_STATUS[status].tone}>{RISK_STATUS[status].label}</Chip>
)

const CELL_CLASS: Record<string, string | undefined> = {
  live: styles.live,
  pending: styles.pending,
  severe: styles.severe,
  accent: styles.accent,
  neutral: styles.neutral,
}

/** 5 x 5 grid of open risks: likelihood down the side (5 at the top), impact along the bottom. */
export const Heatmap = ({ grid, bands }: { grid: number[][]; bands: Band[] }) => (
  <figure className={styles.figure}>
    <table className={styles.heatmap}>
      <caption className="visually-hidden">Open risks by likelihood and impact</caption>
      <tbody>
        {grid.map((row, rowIndex) => {
          const likelihood = 5 - rowIndex
          return (
            <tr key={likelihood}>
              <th scope="row">{likelihood}</th>
              {row.map((count, column) => {
                const impact = column + 1
                const band = ratingFor(likelihood * impact, bands)
                return (
                  <td
                    key={impact}
                    className={`${styles.cell} ${CELL_CLASS[band.tone] ?? ''}`}
                    title={`Likelihood ${likelihood} x impact ${impact} = ${likelihood * impact} (${band.name}): ${count} open`}
                  >
                    {count > 0 ? count : ''}
                  </td>
                )
              })}
            </tr>
          )
        })}
        <tr>
          <th scope="row" aria-hidden="true" />
          {[1, 2, 3, 4, 5].map((impact) => (
            <th key={impact} scope="col">
              {impact}
            </th>
          ))}
        </tr>
      </tbody>
    </table>
    <figcaption className={styles.caption}>
      Likelihood (rows) by impact (columns); numbers are open risks.
    </figcaption>
  </figure>
)
