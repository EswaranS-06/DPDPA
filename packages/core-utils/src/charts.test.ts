import { describe, expect, it } from 'vitest'
import {
  barLengths,
  pointOnCircle,
  polygonPath,
  radarAxes,
  radarPoints,
  ringArc,
  treemap,
} from './charts'

const centre = { x: 100, y: 100 }

describe('chart geometry', () => {
  it('TC-C24.2-01 radar points, ring arcs and bar lengths equal the worked figures', () => {
    // A circle of radius 100 round (100, 100): 12, 3, 6 and 9 o'clock.
    expect([0, 0.25, 0.5, 0.75].map((fraction) => pointOnCircle(fraction, 100, centre))).toEqual([
      { x: 100, y: 0 },
      { x: 200, y: 100 },
      { x: 100, y: 200 },
      { x: 0, y: 100 },
    ])
    // Four domains at levels 4, 2, 0 and not assessed, on a scale of 4.
    const points = radarPoints([4, 2, 0, null], 4, 100, centre)
    expect(points).toEqual([
      { x: 100, y: 0 },
      { x: 150, y: 100 },
      { x: 100, y: 100 },
      { x: 100, y: 100 },
    ])
    // Values outside the scale stay on it.
    expect(radarPoints([9, -3], 4, 100, centre)).toEqual([
      { x: 100, y: 0 },
      { x: 100, y: 100 },
    ])
    expect(polygonPath(points)).toBe('M100 0 L150 100 L100 100 L100 100 Z')
    expect(polygonPath([])).toBe('')
    expect(
      radarAxes(4, 100, centre, 10).map((axis) => [axis.end, axis.label, axis.anchor]),
    ).toEqual([
      [{ x: 100, y: 0 }, { x: 100, y: -10 }, 'middle'],
      [{ x: 200, y: 100 }, { x: 210, y: 100 }, 'start'],
      [{ x: 100, y: 200 }, { x: 100, y: 210 }, 'middle'],
      [{ x: 0, y: 100 }, { x: -10, y: 100 }, 'end'],
    ])

    const middle = { x: 60, y: 60 }
    expect(ringArc(0, 50, middle)).toBe('')
    expect(ringArc(0.25, 50, middle)).toBe('M60 10 A50 50 0 0 1 110 60')
    expect(ringArc(0.75, 50, middle)).toBe('M60 10 A50 50 0 1 1 10 60')
    expect(ringArc(1, 50, middle)).toBe('M60 10 A50 50 0 1 1 60 110 A50 50 0 1 1 60 10')
    expect(ringArc(1.4, 50, middle)).toBe(ringArc(1, 50, middle))

    // The Schedule maximums of Rs 250, 200 and 50 crore on a 300 px track.
    expect(barLengths([250, 200, 50], 300)).toEqual([300, 240, 60])
    expect(barLengths([1, 2], 100, 4)).toEqual([25, 50])
    expect(barLengths([0, 0], 100)).toEqual([0, 0])
    expect(barLengths([-5, 10], 100)).toEqual([0, 100])
  })

  it('TC-C24.2-02 treemap rectangles fill the frame in proportion to their values without overlapping', () => {
    // The worked example of the squarified layout: areas 6, 6, 4, 3, 2, 2, 1 in a 6 by 4 frame.
    const worked = treemap(
      [6, 6, 4, 3, 2, 2, 1].map((value, index) => ({ key: index, value })),
      6,
      4,
    )
    expect(worked.map((cell) => [cell.x, cell.y, cell.width, cell.height])).toEqual([
      [0, 0, 3, 2],
      [0, 2, 3, 2],
      [3, 0, 1.71, 2.33],
      [4.71, 0, 1.29, 2.33],
      [3, 2.33, 1.2, 1.67],
      [4.2, 2.33, 1.2, 1.67],
      [5.4, 2.33, 0.6, 1.67],
    ])
    expect(treemap([{ key: 'a', value: 0 }], 10, 10)).toEqual([])
    expect(treemap([{ key: 'a', value: 5 }], 0, 10)).toEqual([])
    expect(treemap([{ key: 'only', value: 7 }], 300, 200)).toEqual([
      { key: 'only', value: 7, x: 0, y: 0, width: 300, height: 200 },
    ])

    // For any values and frame: areas in proportion, inside the frame, no overlap.
    let seed = 20261013
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
      return seed / 2 ** 32
    }
    for (let run = 0; run < 300; run += 1) {
      const width = 120 + Math.floor(random() * 800)
      const height = 80 + Math.floor(random() * 500)
      const items = Array.from({ length: 1 + Math.floor(random() * 14) }, (_, index) => ({
        key: index,
        value: random() < 0.15 ? 0 : 1 + Math.floor(random() * 400),
      }))
      const total = items.reduce((sum, item) => sum + item.value, 0)
      const cells = treemap(items, width, height)
      expect(cells).toHaveLength(items.filter((item) => item.value > 0).length)
      if (total === 0) continue
      const scale = (width * height) / total
      for (const cell of cells) {
        expect(cell.x).toBeGreaterThanOrEqual(-0.02)
        expect(cell.y).toBeGreaterThanOrEqual(-0.02)
        expect(cell.x + cell.width).toBeLessThanOrEqual(width + 0.02)
        expect(cell.y + cell.height).toBeLessThanOrEqual(height + 0.02)
        // Rounding to two decimals moves an edge by at most 0.005.
        const tolerance = 0.011 * (cell.width + cell.height) + 0.01
        expect(Math.abs(cell.width * cell.height - cell.value * scale)).toBeLessThanOrEqual(
          tolerance,
        )
      }
      for (const [index, a] of cells.entries()) {
        for (const b of cells.slice(index + 1)) {
          const overlapX = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)
          const overlapY = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y)
          expect(overlapX <= 0.02 || overlapY <= 0.02).toBe(true)
        }
      }
    }
  })
})
