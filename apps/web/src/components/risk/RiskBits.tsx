import { Chip } from '@duatf/core-ui'
import { ratingFor, type Band } from '@duatf/feature-compliance-api'
import type { FindingStatus, GapType, RiskStatus } from '@duatf/platform-db'
import { bandTone, Status } from '@/components/status'
import styles from './RiskBits.module.css'

/** A risk band with its score: "High 16". The band name carries the meaning, the tone backs it. */
export const BandChip = ({ band, score }: { band: Band; score?: number }) => (
  <Chip tone={bandTone(band.tone)}>
    {band.name}
    {score === undefined ? '' : ` ${score}`}
  </Chip>
)

export const GapChip = ({ gapType }: { gapType: GapType }) => <Status kind="gap" value={gapType} />

export const FindingStatusChip = ({ status }: { status: FindingStatus }) => (
  <Status kind="finding" value={status} />
)

export const RiskStatusChip = ({ status }: { status: RiskStatus }) => (
  <Status kind="risk" value={status} />
)

const CELL_CLASS: Record<string, string | undefined> = {
  live: styles.success,
  pending: styles.warning,
  severe: styles.danger,
  accent: styles.brand,
  neutral: styles.neutral,
}

/**
 * The risk matrix: open risks by likelihood (rows, 5 at the top) and impact (columns).
 * Cells are tinted by band; counts are written in ink and every cell has a full description.
 */
export const Heatmap = ({ grid, bands }: { grid: number[][]; bands: Band[] }) => {
  const total = grid.flat().reduce((sum, count) => sum + count, 0)
  return (
    <figure className={styles.figure}>
      <div className={styles.frame}>
        <span className={styles.yLabel} aria-hidden="true">
          Likelihood
        </span>
        <table className={styles.heatmap}>
          <caption className="visually-hidden">
            Open risks by likelihood (rows) and impact (columns), {total} in all
          </caption>
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
                        className={`${styles.cell} ${CELL_CLASS[band.tone] ?? ''} ${count > 0 ? styles.filled : ''}`}
                        title={`Likelihood ${likelihood} by impact ${impact} scores ${likelihood * impact} (${band.name}): ${count} open`}
                      >
                        {count > 0 ? count : <span className="visually-hidden">0</span>}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
            <tr>
              <td aria-hidden="true" />
              {[1, 2, 3, 4, 5].map((impact) => (
                <th key={impact} scope="col">
                  {impact}
                </th>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <figcaption className={styles.caption}>
        <span className={styles.xLabel}>Impact</span>
        <span className={styles.bands}>
          {bands.map((band) => (
            <span key={band.name} className={styles.bandKey}>
              <span
                className={`${styles.swatch} ${CELL_CLASS[band.tone] ?? ''}`}
                aria-hidden="true"
              />
              {band.name} {band.minScore}–{band.maxScore}
            </span>
          ))}
        </span>
      </figcaption>
    </figure>
  )
}
