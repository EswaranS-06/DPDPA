// Chart geometry (ADR-0009): pure functions that turn figures into shapes. The pages draw the
// shapes as SVG and the Word report as pictures, so both show the same chart.

export type Point = { x: number; y: number }
export type Rect = { x: number; y: number; width: number; height: number }

const round = (value: number) => Math.round(value * 100) / 100

/** The point at a fraction of the way round a circle, starting at 12 o'clock and going clockwise. */
export const pointOnCircle = (fraction: number, radius: number, centre: Point): Point => {
  const angle = fraction * 2 * Math.PI
  return {
    x: round(centre.x + radius * Math.sin(angle)),
    y: round(centre.y - radius * Math.cos(angle)),
  }
}

/**
 * The corners of a radar polygon: one value per axis, the first axis at 12 o'clock, clockwise.
 * A value is clamped to 0..max; a missing value (null) sits at the centre.
 */
export const radarPoints = (
  values: readonly (number | null)[],
  max: number,
  radius: number,
  centre: Point,
): Point[] =>
  values.map((value, index) =>
    pointOnCircle(
      index / values.length,
      (Math.min(Math.max(value ?? 0, 0), max) / max) * radius,
      centre,
    ),
  )

export type TextAnchor = 'start' | 'middle' | 'end'

/** The end of each axis of a radar with this many axes, and where its label goes. */
export const radarAxes = (count: number, radius: number, centre: Point, labelGap = 14) =>
  Array.from({ length: count }, (_, index) => {
    const fraction = index / count
    const end = pointOnCircle(fraction, radius, centre)
    const label = pointOnCircle(fraction, radius + labelGap, centre)
    // Labels on the right half start at the point, on the left half end at it.
    const side = Math.sin(fraction * 2 * Math.PI)
    const anchor: TextAnchor = Math.abs(side) < 0.01 ? 'middle' : side > 0 ? 'start' : 'end'
    return { end, label, anchor }
  })

/** An SVG path through the points, closed. */
export const polygonPath = (points: readonly Point[]): string =>
  points.length === 0
    ? ''
    : `${points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x} ${point.y}`).join(' ')} Z`

/**
 * An SVG path for the part of a ring that a fraction (0..1) fills, from 12 o'clock clockwise.
 * A full ring is drawn as two half arcs, because one arc cannot start and end at the same point.
 */
export const ringArc = (fraction: number, radius: number, centre: Point): string => {
  const share = Math.min(Math.max(fraction, 0), 1)
  if (share === 0) return ''
  const start = pointOnCircle(0, radius, centre)
  if (share === 1) {
    const half = pointOnCircle(0.5, radius, centre)
    return `M${start.x} ${start.y} A${radius} ${radius} 0 1 1 ${half.x} ${half.y} A${radius} ${radius} 0 1 1 ${start.x} ${start.y}`
  }
  const end = pointOnCircle(share, radius, centre)
  return `M${start.x} ${start.y} A${radius} ${radius} 0 ${share > 0.5 ? 1 : 0} 1 ${end.x} ${end.y}`
}

/** The length of each bar when the largest value (or `max`) fills the width. */
export const barLengths = (values: readonly number[], width: number, max?: number): number[] => {
  const top = max ?? Math.max(0, ...values)
  return values.map((value) => (top > 0 ? round((Math.max(value, 0) / top) * width) : 0))
}

export type TreemapItem<Key> = { key: Key; value: number }
export type TreemapCell<Key> = Rect & { key: Key; value: number }

/**
 * A squarified treemap: rectangles that fill the frame, each with an area in proportion to its
 * value, kept as close to square as the values allow. Items with no value get no rectangle.
 */
export const treemap = <Key>(
  items: readonly TreemapItem<Key>[],
  width: number,
  height: number,
): TreemapCell<Key>[] => {
  const shown = items.filter((item) => item.value > 0).sort((a, b) => b.value - a.value)
  const total = shown.reduce((sum, item) => sum + item.value, 0)
  if (total === 0 || width <= 0 || height <= 0) return []
  const scale = (width * height) / total
  const cells: TreemapCell<Key>[] = []
  let frame: Rect = { x: 0, y: 0, width, height }
  let rest = shown.map((item) => ({ ...item, area: item.value * scale }))

  // The worst aspect ratio in a row laid along a side of this length.
  const worst = (row: { area: number }[], side: number) => {
    const sum = row.reduce((total, item) => total + item.area, 0)
    const largest = Math.max(...row.map((item) => item.area))
    const smallest = Math.min(...row.map((item) => item.area))
    return Math.max((side * side * largest) / (sum * sum), (sum * sum) / (side * side * smallest))
  }

  while (rest.length) {
    const side = Math.min(frame.width, frame.height)
    let row = [rest[0] as (typeof rest)[number]]
    let next = 1
    while (
      next < rest.length &&
      worst([...row, rest[next] as (typeof rest)[number]], side) <= worst(row, side)
    ) {
      row = [...row, rest[next] as (typeof rest)[number]]
      next += 1
    }
    rest = rest.slice(next)
    const rowArea = row.reduce((sum, item) => sum + item.area, 0)
    const last = rest.length === 0
    // The row fills a strip along the frame's shorter side; the final row takes what is left.
    const along = frame.width >= frame.height
    const thickness = last ? (along ? frame.width : frame.height) : rowArea / side
    let offset = 0
    for (const [index, item] of row.entries()) {
      const length = index === row.length - 1 ? side - offset : (item.area / rowArea) * side
      cells.push(
        along
          ? {
              key: item.key,
              value: item.value,
              x: frame.x,
              y: frame.y + offset,
              width: thickness,
              height: length,
            }
          : {
              key: item.key,
              value: item.value,
              x: frame.x + offset,
              y: frame.y,
              width: length,
              height: thickness,
            },
      )
      offset += length
    }
    frame = along
      ? { x: frame.x + thickness, y: frame.y, width: frame.width - thickness, height: frame.height }
      : { x: frame.x, y: frame.y + thickness, width: frame.width, height: frame.height - thickness }
  }
  return cells.map((cell) => ({
    ...cell,
    x: round(cell.x),
    y: round(cell.y),
    width: round(cell.width),
    height: round(cell.height),
  }))
}
