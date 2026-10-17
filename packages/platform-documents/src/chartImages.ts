import { barLengths, polygonPath, radarAxes, radarPoints } from '@duatf/core-utils'
import { Resvg } from '@resvg/resvg-js'

// The page's charts as pictures for Word (ADR-0009 decision 11): the same geometry, drawn as SVG
// in the light theme's colours and rasterised, so the report shows what the page shows.

const INK = {
  line: '#4f46e5',
  grid: '#e2e8f0',
  rim: '#cbd5e1',
  outline: '#475569',
  text: '#0f172a',
  secondary: '#475569',
  muted: '#5f6e84',
  track: '#e2e8f0',
  quiet: '#94a3b8',
}
const FONT = 'DejaVu Sans, Liberation Sans, Arial, sans-serif'

const escape = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export type RadarInput = {
  /** One short label per axis, clockwise from the top. */
  axes: readonly string[]
  series: readonly {
    values: readonly (number | null)[]
    style: 'area' | 'outline'
    label: string
  }[]
  max: number
}

/** A radar as SVG: rings for each level, the "now" series filled, the comparison dashed. */
export const radarSvg = ({ axes, series, max }: RadarInput): string => {
  const width = 560
  const height = 520
  const centre = { x: width / 2, y: 236 }
  const radius = 170
  const ring = (level: number) =>
    polygonPath(
      radarPoints(
        axes.map(() => level),
        max,
        radius,
        centre,
      ),
    )
  const spokes = radarAxes(axes.length, radius, centre, 22)
  const parts: string[] = []
  for (let level = 1; level <= max; level += 1) {
    parts.push(
      `<path d="${ring(level)}" fill="none" stroke="${level === max ? INK.rim : INK.grid}" stroke-width="1"/>`,
      `<text x="${centre.x + 5}" y="${centre.y - (level / max) * radius + 4}" font-size="11" fill="${INK.muted}">${level}</text>`,
    )
  }
  for (const spoke of spokes) {
    parts.push(
      `<line x1="${centre.x}" y1="${centre.y}" x2="${spoke.end.x}" y2="${spoke.end.y}" stroke="${INK.grid}" stroke-width="1"/>`,
    )
  }
  for (const item of series) {
    const d = polygonPath(radarPoints(item.values, max, radius, centre))
    parts.push(
      item.style === 'area'
        ? `<path d="${d}" fill="${INK.line}" fill-opacity="0.16" stroke="${INK.line}" stroke-width="2.5" stroke-linejoin="round"/>`
        : `<path d="${d}" fill="none" stroke="${INK.outline}" stroke-width="2" stroke-dasharray="6 5" stroke-linejoin="round"/>`,
    )
  }
  spokes.forEach((spoke, index) => {
    parts.push(
      `<text x="${spoke.label.x}" y="${spoke.label.y + 5}" text-anchor="${spoke.anchor}" font-size="14" font-weight="600" fill="${INK.secondary}">${escape(axes[index] ?? '')}</text>`,
    )
  })
  // The legend under the chart, each item as wide as its label (about 7.5 px a character at 13 px).
  const widths = series.map((item) => 30 + item.label.length * 7.5 + 28)
  let x = centre.x - widths.reduce((sum, value) => sum + value, 0) / 2
  series.forEach((item, index) => {
    parts.push(
      item.style === 'area'
        ? `<rect x="${x}" y="${height - 34}" width="22" height="12" rx="2" fill="${INK.line}" fill-opacity="0.22" stroke="${INK.line}" stroke-width="2"/>`
        : `<line x1="${x}" y1="${height - 28}" x2="${x + 22}" y2="${height - 28}" stroke="${INK.outline}" stroke-width="2" stroke-dasharray="6 5"/>`,
      `<text x="${x + 30}" y="${height - 23}" font-size="13" fill="${INK.secondary}">${escape(item.label)}</text>`,
    )
    x += widths[index] ?? 150
  })
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="${FONT}"><rect width="${width}" height="${height}" fill="#ffffff"/>${parts.join('')}</svg>`
}

export type BarsInput = {
  rows: readonly { label: string; value: number; valueText: string; quiet?: boolean }[]
}

/** Horizontal bars on one scale, each with its label on the left and its value on the right. */
export const barsSvg = ({ rows }: BarsInput): string => {
  const width = 900
  const rowHeight = 36
  const height = rows.length * rowHeight + 16
  const track = { x: 470, width: 300 }
  const lengths = barLengths(
    rows.map((row) => row.value),
    track.width,
  )
  const parts = rows.map((row, index) => {
    const y = 8 + index * rowHeight
    const label = row.label.length > 58 ? `${row.label.slice(0, 57)}…` : row.label
    const length = Math.max(lengths[index] ?? 0, 3)
    return [
      `<text x="0" y="${y + 21}" font-size="14" fill="${row.quiet ? INK.muted : INK.text}">${escape(label)}</text>`,
      `<rect x="${track.x}" y="${y + 10}" width="${track.width}" height="14" rx="4" fill="${INK.track}"/>`,
      `<rect x="${track.x}" y="${y + 10}" width="${length}" height="14" rx="4" fill="${row.quiet ? INK.quiet : INK.line}"/>`,
      `<text x="${track.x + track.width + 14}" y="${y + 21}" font-size="14" fill="${row.quiet ? INK.muted : INK.text}">${escape(row.valueText)}</text>`,
    ].join('')
  })
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="${FONT}"><rect width="${width}" height="${height}" fill="#ffffff"/>${parts.join('')}</svg>`
}

/** Rasterises an SVG at twice its size, for a sharp picture in Word and in print. */
export const svgToPng = (svg: string): { png: Buffer; width: number; height: number } => {
  const width = Number(/width="(\d+)"/.exec(svg)?.[1] ?? 600)
  const rendered = new Resvg(svg, {
    fitTo: { mode: 'width', value: width * 2 },
    font: { loadSystemFonts: true, defaultFontFamily: 'DejaVu Sans' },
  }).render()
  return { png: rendered.asPng(), width: rendered.width / 2, height: rendered.height / 2 }
}
