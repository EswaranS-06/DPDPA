import ExcelJS from 'exceljs'

/** A short document for a piece of demo evidence. Table rows use " | " between cells. */
export type DocumentSpec = {
  fileName: string
  heading: string
  lines: string[]
}

export const DEMO_FOOTER =
  'DEMO DOCUMENT - fictitious content for the DUATF demo clients. Not a real record.'

// PDF text uses the standard Helvetica font, so keep to printable ASCII.
const ascii = (text: string) =>
  text
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/₹/g, 'Rs ')
    .replace(/[^\x20-\x7e]/g, '')

const escapePdf = (text: string) => ascii(text).replace(/[\\()]/g, (char) => `\\${char}`)

const wrap = (line: string, width: number): string[] => {
  const words = line.split(' ')
  const out: string[] = []
  let current = ''
  for (const word of words) {
    if (current && `${current} ${word}`.length > width) {
      out.push(current)
      current = word
    } else current = current ? `${current} ${word}` : word
  }
  out.push(current)
  return out
}

/** A one-page PDF with a heading, the lines and the demo footer. */
export const pdfDocument = (heading: string, lines: string[]): Buffer => {
  const body: string[] = [`BT /F2 15 Tf 56 780 Td (${escapePdf(heading)}) Tj ET`]
  let y = 750
  for (const line of lines.flatMap((text) => [...wrap(text, 92), ''])) {
    if (y < 90) break
    if (line) body.push(`BT /F1 10.5 Tf 56 ${y} Td (${escapePdf(line)}) Tj ET`)
    y -= line ? 15 : 7
  }
  body.push(`BT /F1 8 Tf 56 40 Td (${escapePdf(DEMO_FOOTER)}) Tj ET`)
  const stream = body.join('\n')
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
    `<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream`,
  ]
  let out = '%PDF-1.4\n'
  const offsets: number[] = []
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(out, 'latin1'))
    out += `${index + 1} 0 obj\n${object}\nendobj\n`
  })
  const xref = Buffer.byteLength(out, 'latin1')
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  out += offsets.map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`
  return Buffer.from(out, 'latin1')
}

const cells = (line: string) => line.split(' | ')

const csvCell = (value: string) => (/[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value)

/** The document's table as CSV. */
export const csvDocument = (lines: string[]): Buffer =>
  Buffer.from(
    `${[...lines, `${DEMO_FOOTER}`].map((line) => cells(line).map(csvCell).join(',')).join('\n')}\n`,
  )

/** The document's table as an Excel workbook. */
export const xlsxDocument = async (heading: string, lines: string[]): Promise<Buffer> => {
  const book = new ExcelJS.Workbook()
  book.creator = 'DUATF demo'
  const sheet = book.addWorksheet(heading.slice(0, 31).replace(/[\\/?*[\]:]/g, ' '))
  for (const line of lines) sheet.addRow(cells(line))
  sheet.addRow([])
  sheet.addRow([DEMO_FOOTER])
  sheet.getRow(1).font = { bold: true }
  sheet.columns.forEach((column) => {
    column.width = 24
  })
  return Buffer.from(await book.xlsx.writeBuffer())
}

/** The document's lines as plain text. */
export const textDocument = (heading: string, lines: string[]): Buffer =>
  Buffer.from(`${heading}\n\n${lines.join('\n')}\n\n${DEMO_FOOTER}\n`)

/** Builds the file for a document from its extension. */
export const renderDocument = async (
  spec: DocumentSpec,
): Promise<{ name: string; bytes: Buffer }> => {
  const extension = spec.fileName.split('.').pop()
  const bytes =
    extension === 'pdf'
      ? pdfDocument(spec.heading, spec.lines)
      : extension === 'csv'
        ? csvDocument(spec.lines)
        : extension === 'xlsx'
          ? await xlsxDocument(spec.heading, spec.lines)
          : textDocument(spec.heading, spec.lines)
  return { name: spec.fileName, bytes }
}
