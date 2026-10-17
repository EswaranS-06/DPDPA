import {
  barLengths,
  polygonPath,
  radarAxes,
  radarPoints,
  ringArc,
  treemap,
} from '@duatf/core-utils'
import type { ReactNode } from 'react'
import styles from './Charts.module.css'

// Charts drawn from DUATF's own geometry (ADR-0009). Each one has a text alternative: the
// caller shows the same figures as a table beside or under it. Marks carry a <title>, so
// hovering a point, a bar or a cell names what it is and its value.

export type RadarSeries = {
  key: string
  label: string
  values: (number | null)[]
  /** "area" is the filled shape; "outline" a dashed line, for a target or an earlier cycle. */
  style: 'area' | 'outline'
}

type RadarProps = {
  /** One axis per entry, clockwise from the top. */
  axes: { key: string; label: string; title: string }[]
  series: RadarSeries[]
  max: number
  /** Names of the scale's steps, 0 first, shown in the description for screen readers. */
  describe: string
}

const RADAR = { size: 360, radius: 118, centre: { x: 180, y: 172 } }

/** Levels by domain as a radar: each axis a domain, each ring a level. Needs three axes or more. */
export const Radar = ({ axes, series, max, describe }: RadarProps) => {
  const { radius, centre, size } = RADAR
  const spokes = radarAxes(axes.length, radius, centre, 16)
  const rings = Array.from({ length: max }, (_, index) => index + 1)
  return (
    <figure className={styles.figure}>
      <svg
        viewBox={`0 0 ${size} ${size - 10}`}
        className={styles.radar}
        role="img"
        aria-label={describe}
      >
        {rings.map((ring) => (
          <path
            key={ring}
            className={ring === max ? styles.ringOuter : styles.ring}
            d={polygonPath(
              radarPoints(
                axes.map(() => ring),
                max,
                radius,
                centre,
              ),
            )}
          />
        ))}
        {spokes.map((spoke, index) => (
          <line
            key={axes[index]?.key}
            className={styles.spoke}
            x1={centre.x}
            y1={centre.y}
            x2={spoke.end.x}
            y2={spoke.end.y}
          />
        ))}
        {rings.map((ring) => (
          <text
            key={ring}
            className={styles.ringLabel}
            x={centre.x + 4}
            y={centre.y - (ring / max) * radius + 3}
          >
            {ring}
          </text>
        ))}
        {series.map((item) => {
          const points = radarPoints(item.values, max, radius, centre)
          return (
            <g key={item.key}>
              <path
                className={item.style === 'area' ? styles.area : styles.outline}
                d={polygonPath(points)}
              />
              {item.style === 'area'
                ? points.map((point, index) =>
                    item.values[index] === null ? null : (
                      <circle
                        key={axes[index]?.key}
                        className={styles.marker}
                        cx={point.x}
                        cy={point.y}
                        r={4}
                      >
                        {/* One string: React renders several text nodes in an SVG title differently on the server. */}
                        <title>{`${axes[index]?.title ?? ''}: ${item.label} ${item.values[index] ?? ''}`}</title>
                      </circle>
                    ),
                  )
                : null}
            </g>
          )
        })}
        {spokes.map((spoke, index) => (
          <text
            key={axes[index]?.key}
            className={styles.axisLabel}
            x={spoke.label.x}
            y={spoke.label.y + 4}
            textAnchor={spoke.anchor}
          >
            {axes[index]?.label}
            <title>{axes[index]?.title}</title>
          </text>
        ))}
      </svg>
      <figcaption className={styles.legend}>
        {series.map((item) => (
          <span key={item.key} className={styles.legendItem}>
            <span
              className={item.style === 'area' ? styles.swatchArea : styles.swatchOutline}
              aria-hidden="true"
            />
            {item.label}
          </span>
        ))}
      </figcaption>
    </figure>
  )
}

type RingProps = {
  covered: number
  total: number
  /** What is counted, e.g. "scored answers". */
  label: string
  /** What "covered" means, e.g. "with accepted evidence". */
  covers: string
}

const RING = { size: 132, radius: 52, centre: { x: 66, y: 66 } }

/** A share as a ring, with the count in the middle: 87 of 141, 62%. */
export const Ring = ({ covered, total, label, covers }: RingProps) => {
  const share = total > 0 ? covered / total : 0
  const pct = total > 0 ? Math.round(share * 100) : null
  const text = `${covered} of ${total} ${label} ${covers}${pct === null ? '' : `, ${pct}%`}`
  return (
    <figure className={styles.ringFigure}>
      <svg
        viewBox={`0 0 ${RING.size} ${RING.size}`}
        className={styles.ringChart}
        role="img"
        aria-label={text}
      >
        <title>{text}</title>
        <circle className={styles.track} cx={RING.centre.x} cy={RING.centre.y} r={RING.radius} />
        {share > 0 ? (
          <path className={styles.arc} d={ringArc(share, RING.radius, RING.centre)} />
        ) : null}
        <text
          className={styles.ringValue}
          x={RING.centre.x}
          y={RING.centre.y + 2}
          textAnchor="middle"
        >
          {pct === null ? '—' : `${pct}%`}
        </text>
        <text
          className={styles.ringSub}
          x={RING.centre.x}
          y={RING.centre.y + 20}
          textAnchor="middle"
        >
          {covered} of {total}
        </text>
      </svg>
      <figcaption className={styles.ringCaption}>
        <strong>
          {label.charAt(0).toUpperCase()}
          {label.slice(1)}
        </strong>{' '}
        {covers}
      </figcaption>
    </figure>
  )
}

export type BarRow = {
  key: string
  label: ReactNode
  /** The length the bar stands for, e.g. a maximum of Rs 250 crore. */
  value: number
  /** Shown at the end of the bar: "up to Rs 250 crore". */
  valueText: string
  /** A count shown beside the label, e.g. open gaps under the item. */
  note?: string
  /** A muted bar: the item has nothing under it. */
  quiet?: boolean
  title: string
}

/** Horizontal bars on one scale, the longest first as given. */
export const Bars = ({ rows, label }: { rows: BarRow[]; label: string }) => {
  const lengths = barLengths(
    rows.map((row) => row.value),
    100,
  )
  return (
    <ul className={styles.bars} aria-label={label}>
      {rows.map((row, index) => (
        <li key={row.key} className={row.quiet ? styles.quietRow : undefined} title={row.title}>
          <span className={styles.barLabel}>
            <span>{row.label}</span>
            {row.note ? <span className={styles.barNote}>{row.note}</span> : null}
          </span>
          <span className={styles.barTrack}>
            <span
              className={row.quiet ? styles.barQuiet : styles.bar}
              style={{ width: `${Math.max(lengths[index] ?? 0, 1)}%` }}
            />
          </span>
          <span className={styles.barValue}>{row.valueText}</span>
        </li>
      ))}
    </ul>
  )
}

export type TreemapEntry = {
  key: string
  label: string
  value: number
  /** A sensitivity level, L1 to L4, which picks the cell's tone. */
  level: 'L1' | 'L2' | 'L3' | 'L4'
  title: string
}

// Wide enough that labels stay near their set size when the map fills a desktop page.
const MAP = { width: 960, height: 380 }

/** Areas in proportion to their values, each cell toned by its sensitivity level and labelled. */
export const Treemap = ({ entries, label }: { entries: TreemapEntry[]; label: string }) => {
  const cells = treemap(
    entries.map((entry) => ({ key: entry.key, value: entry.value })),
    MAP.width,
    MAP.height,
  )
  return (
    <svg
      viewBox={`0 0 ${MAP.width} ${MAP.height}`}
      className={styles.treemap}
      role="img"
      aria-label={label}
    >
      {cells.map((cell) => {
        const entry = entries.find((item) => item.key === cell.key)
        if (!entry) return null
        // The 2 px gap between cells is the surface showing through.
        const width = Math.max(cell.width - 2, 0)
        const height = Math.max(cell.height - 2, 0)
        const fits = width > 86 && height > 34
        return (
          <g key={cell.key} transform={`translate(${cell.x + 1} ${cell.y + 1})`}>
            <rect className={styles[`cell${entry.level}`]} width={width} height={height} rx={4}>
              <title>{entry.title}</title>
            </rect>
            {fits ? (
              <>
                <text className={styles.cellLabel} x={8} y={18}>
                  {entry.label.length > Math.floor(width / 7)
                    ? `${entry.label.slice(0, Math.floor(width / 7) - 1)}…`
                    : entry.label}
                </text>
                <text className={styles.cellValue} x={8} y={34}>
                  {entry.value} · {entry.level}
                </text>
              </>
            ) : width > 26 && height > 20 ? (
              <text className={styles.cellValue} x={6} y={16}>
                {entry.value}
              </text>
            ) : null}
          </g>
        )
      })}
    </svg>
  )
}
