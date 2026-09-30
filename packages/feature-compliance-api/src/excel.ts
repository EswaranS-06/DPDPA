import type ExcelJS from 'exceljs'
import type { Progress } from './progress'
import { ratingFor, type Band } from './risks'

// Colours of the DUATF design tokens, as Excel ARGB values.
export const XL = {
  accent: 'FF4F2E9C',
  accentSoft: 'FFEEE9F8',
  live: 'FF2D7A4C',
  liveSoft: 'FFE3F1E8',
  pending: 'FF9A5A00',
  pendingSoft: 'FFFBF0DD',
  severe: 'FFA8261B',
  severeSoft: 'FFFBE7E5',
  folio: 'FFF4F5F2',
  rule: 'FFD9DDE1',
  ink: 'FF1B2230',
  pencil: 'FF5A6273',
  white: 'FFFFFFFF',
} as const

const TONE_SOFT: Record<string, string> = {
  live: XL.liveSoft,
  pending: XL.pendingSoft,
  severe: XL.severeSoft,
  accent: XL.accentSoft,
  neutral: XL.folio,
}
const TONE_STRONG: Record<string, string> = {
  live: XL.live,
  pending: XL.pending,
  severe: XL.severe,
  accent: XL.accent,
  neutral: XL.pencil,
}

/** A band's fill and text colour; the higher of two bands with the same tone is drawn solid. */
export const bandColours = (band: Band, bands: readonly Band[]) => {
  const index = bands.findIndex((item) => item.name === band.name)
  const solid = bands.slice(0, index).some((item) => item.tone === band.tone)
  return solid
    ? { fill: TONE_STRONG[band.tone] ?? XL.pencil, font: XL.white }
    : { fill: TONE_SOFT[band.tone] ?? XL.folio, font: XL.ink }
}

const solidFill = (argb: string): ExcelJS.Fill => ({
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb },
})

/** Ten blocks showing a percentage, readable in any spreadsheet program. */
export const textBar = (pct: number | null): string => {
  if (pct === null) return ''
  const filled = Math.max(0, Math.min(10, Math.round(pct / 10)))
  return `${'█'.repeat(filled)}${'░'.repeat(10 - filled)}`
}

/** A percentage (0-100, one decimal) as an Excel fraction, so it formats and sums correctly. */
export const fraction = (pct: number | null): number | null =>
  pct === null ? null : Math.round(pct * 10) / 1000

/** A plain data sheet: bold header, frozen first row, filters and wrapped text. */
export const addTableSheet = (
  workbook: ExcelJS.Workbook,
  name: string,
  columns: readonly string[],
  rows: (string | number | null)[][],
  widths: number[],
): ExcelJS.Worksheet => {
  const sheet = workbook.addWorksheet(name, { views: [{ state: 'frozen', ySplit: 1 }] })
  sheet.columns = columns.map((header, index) => ({ header, width: widths[index] ?? 18 }))
  for (const row of rows) sheet.addRow(row)
  const header = sheet.getRow(1)
  header.font = { bold: true, color: { argb: XL.white } }
  header.fill = solidFill(XL.accent)
  header.alignment = { vertical: 'middle', wrapText: true }
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } }
  sheet.eachRow((row, index) => {
    if (index > 1) row.alignment = { vertical: 'top', wrapText: true }
  })
  return sheet
}

/** Percentage columns of a data sheet: number format and a red-amber-green colour scale. */
export const percentColumns = (sheet: ExcelJS.Worksheet, columns: number[], rowCount: number) => {
  for (const column of columns) {
    sheet.getColumn(column).numFmt = '0.0%'
    if (rowCount > 0) colourScale(sheet, column, 2, rowCount + 1)
  }
}

const colourScale = (sheet: ExcelJS.Worksheet, column: number, from: number, to: number) => {
  const letter = sheet.getColumn(column).letter
  sheet.addConditionalFormatting({
    ref: `${letter}${from}:${letter}${to}`,
    rules: [
      {
        type: 'colorScale',
        priority: 1,
        cfvo: [
          { type: 'num', value: 0 },
          { type: 'num', value: 0.5 },
          { type: 'num', value: 1 },
        ],
        color: [{ argb: 'FFF4B6AF' }, { argb: 'FFF9DFA8' }, { argb: 'FFB9DFC6' }],
      },
    ],
  })
}

export type Tile = { label: string; value: string | number | null; note?: string; alarm?: boolean }

export type DashColumn = {
  header: string
  kind?: 'text' | 'number' | 'percent' | 'bar'
}
/** A dashboard table cell: a value, or a risk band drawn in its colours. */
export type DashCell = string | number | null | { band: Band; text?: string | number }

const TILES_PER_ROW = 4

/**
 * Writes a dashboard sheet from top to bottom: a title, headline tiles, tables, a heatmap.
 * Column A is wide for names; the other columns hold figures.
 */
export const dashboardSheet = (workbook: ExcelJS.Workbook, name: string, columns = 12) => {
  const sheet = workbook.addWorksheet(name, {
    properties: { tabColor: { argb: XL.accent } },
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    views: [{ showGridLines: false }],
  })
  sheet.getColumn(1).width = 38
  for (let column = 2; column <= columns; column += 1) sheet.getColumn(column).width = 14
  let row = 1
  let bands: readonly Band[] = []

  const cell = (r: number, c: number) => sheet.getCell(r, c)

  return {
    sheet,
    /** Bands used to colour band cells and the heatmap. */
    useBands: (value: readonly Band[]) => {
      bands = value
    },
    title: (text: string, lines: string[]) => {
      const head = cell(row, 1)
      head.value = text
      head.font = { bold: true, size: 18, color: { argb: XL.accent } }
      sheet.getRow(row).height = 28
      row += 1
      for (const line of lines) {
        cell(row, 1).value = line
        cell(row, 1).font = { size: 10, color: { argb: XL.pencil } }
        row += 1
      }
      row += 1
    },
    heading: (text: string) => {
      row += 1
      const head = cell(row, 1)
      head.value = text
      head.font = { bold: true, size: 12, color: { argb: XL.ink } }
      for (let column = 1; column <= columns; column += 1) {
        cell(row, column).border = { bottom: { style: 'medium', color: { argb: XL.accent } } }
      }
      row += 2
    },
    note: (text: string) => {
      cell(row, 1).value = text
      cell(row, 1).font = { italic: true, size: 9, color: { argb: XL.pencil } }
      row += 1
    },
    /** Headline figures as tiles, four to a row: column A, then three columns each. */
    tiles: (items: Tile[]) => {
      for (let start = 0; start < items.length; start += TILES_PER_ROW) {
        items.slice(start, start + TILES_PER_ROW).forEach((tile, index) => {
          const left = index === 0 ? 1 : index * 3 - 1
          const right = index === 0 ? 1 : left + 2
          for (const [offset, value, font] of [
            [0, tile.label, { size: 9, bold: true, color: { argb: XL.pencil } }],
            [
              1,
              tile.value ?? '—',
              { size: 20, bold: true, color: { argb: tile.alarm ? XL.severe : XL.ink } },
            ],
            [2, tile.note ?? '', { size: 9, color: { argb: XL.pencil } }],
          ] as const) {
            if (right > left) sheet.mergeCells(row + offset, left, row + offset, right)
            const target = cell(row + offset, left)
            target.value = value
            target.font = font
            target.fill = solidFill(XL.folio)
            target.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true, indent: 1 }
            target.border = { left: { style: 'thick', color: { argb: XL.white } } }
          }
        })
        sheet.getRow(row + 1).height = 30
        sheet.getRow(row + 2).height = 26
        row += 4
      }
    },
    /** A formatted table; percent columns get a colour scale and bar columns a text bar. */
    table: (heads: DashColumn[], rows: DashCell[][]) => {
      heads.forEach((head, index) => {
        const target = cell(row, index + 1)
        target.value = head.header
        target.font = { bold: true, color: { argb: XL.white } }
        target.fill = solidFill(XL.accent)
        target.alignment = { vertical: 'middle', wrapText: true }
      })
      const first = row + 1
      rows.forEach((values, offset) => {
        values.forEach((value, index) => {
          const target = cell(first + offset, index + 1)
          const kind = heads[index]?.kind ?? 'text'
          if (value !== null && typeof value === 'object') {
            const colours = bandColours(value.band, bands)
            target.value = value.text ?? value.band.name
            target.fill = solidFill(colours.fill)
            target.font = { bold: true, color: { argb: colours.font } }
          } else {
            target.value = value
            if (kind === 'percent') target.numFmt = '0.0%'
            if (kind === 'bar') target.font = { color: { argb: XL.accent } }
          }
          target.alignment = {
            vertical: 'top',
            wrapText: kind === 'text',
            horizontal: kind === 'text' || kind === 'bar' ? 'left' : 'right',
          }
          target.border = { bottom: { style: 'thin', color: { argb: XL.rule } } }
        })
      })
      heads.forEach((head, index) => {
        if (head.kind === 'percent' && rows.length > 0) {
          colourScale(sheet, index + 1, first, first + rows.length - 1)
        }
      })
      if (rows.length === 0) {
        cell(first, 1).value = 'Nothing to show yet.'
        cell(first, 1).font = { italic: true, color: { argb: XL.pencil } }
        row = first + 1
      } else row = first + rows.length
      row += 1
    },
    /** Open risks by likelihood (rows, 5 at the top) and impact (columns), in band colours. */
    heatmap: (grid: number[][]) => {
      cell(row, 1).value = 'Likelihood ↓   Impact →'
      cell(row, 1).font = { size: 9, color: { argb: XL.pencil } }
      row += 1
      grid.forEach((counts, index) => {
        const likelihood = 5 - index
        cell(row, 1).value = likelihood
        cell(row, 1).alignment = { horizontal: 'right' }
        cell(row, 1).font = { bold: true, color: { argb: XL.pencil } }
        counts.forEach((n, column) => {
          const impact = column + 1
          const band = ratingFor(likelihood * impact, bands)
          const colours = bandColours(band, bands)
          const target = cell(row, column + 2)
          target.value = n > 0 ? n : null
          target.fill = solidFill(colours.fill)
          target.font = { bold: true, size: 12, color: { argb: colours.font } }
          target.alignment = { horizontal: 'center', vertical: 'middle' }
          target.border = {
            top: { style: 'thin', color: { argb: XL.white } },
            left: { style: 'thin', color: { argb: XL.white } },
            bottom: { style: 'thin', color: { argb: XL.white } },
            right: { style: 'thin', color: { argb: XL.white } },
          }
        })
        sheet.getRow(row).height = 24
        row += 1
      })
      for (let impact = 1; impact <= 5; impact += 1) {
        cell(row, impact + 1).value = impact
        cell(row, impact + 1).alignment = { horizontal: 'center' }
        cell(row, impact + 1).font = { bold: true, color: { argb: XL.pencil } }
      }
      row += 1
      cell(row, 1).value = 'Numbers are open risks; colours are the rating bands.'
      cell(row, 1).font = { italic: true, size: 9, color: { argb: XL.pencil } }
      row += 2
    },
  }
}

/** The standard compliance columns for a progress figure. */
export const progressCells = (progress: Progress): DashCell[] => [
  `${progress.answered}/${progress.total}`,
  progress.compliant,
  progress.potentialGap,
  progress.gap,
  progress.excluded,
  fraction(progress.compliancePct),
  textBar(progress.compliancePct),
]

export const PROGRESS_COLUMNS: DashColumn[] = [
  { header: 'Answered', kind: 'number' },
  { header: 'Yes', kind: 'number' },
  { header: 'Partial', kind: 'number' },
  { header: 'No', kind: 'number' },
  { header: 'N/A', kind: 'number' },
  { header: 'Compliance', kind: 'percent' },
  { header: '', kind: 'bar' },
]
