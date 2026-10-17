import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  ImageRun,
  Packer,
  PageBreak,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx'

// The pieces DUATF's Word files are made of (ADR-0009, ADR-0010): headings, paragraphs, lists,
// tables, key facts and pictures, in one quiet house style that consultants can edit further.

export type Block = Paragraph | Table
/** A piece of text with its emphasis. */
export type Run = { text: string; bold?: boolean; italics?: boolean }

const FONT = 'Calibri'
const INK = '0F172A'
const MUTED = '5F6E84'
const RULE = 'CBD5E1'
const HEAD_FILL = 'F1F5F9'

const runsOf = (content: string | readonly Run[], extra: { color?: string; size?: number } = {}) =>
  (typeof content === 'string' ? [{ text: content }] : content).map(
    (run) =>
      new TextRun({
        text: run.text,
        bold: run.bold,
        italics: run.italics,
        color: extra.color,
        size: extra.size,
      }),
  )

const HEADINGS = {
  1: HeadingLevel.HEADING_1,
  2: HeadingLevel.HEADING_2,
  3: HeadingLevel.HEADING_3,
} as const

export const heading = (text: string, level: 1 | 2 | 3 = 1): Paragraph =>
  new Paragraph({ heading: HEADINGS[level], children: [new TextRun(text)], keepNext: true })

export const para = (
  content: string | readonly Run[],
  options: { muted?: boolean; size?: number; centred?: boolean } = {},
): Paragraph =>
  new Paragraph({
    children: runsOf(content, {
      color: options.muted ? MUTED : undefined,
      size: options.size,
    }),
    alignment: options.centred ? AlignmentType.CENTER : undefined,
    spacing: { after: 120 },
  })

export const bullets = (items: readonly (string | readonly Run[])[]): Paragraph[] =>
  items.map(
    (item) =>
      new Paragraph({ children: runsOf(item), bullet: { level: 0 }, spacing: { after: 60 } }),
  )

export const pageBreak = (): Paragraph => new Paragraph({ children: [new PageBreak()] })

const border = { style: BorderStyle.SINGLE, size: 4, color: RULE }
const borders = { top: border, bottom: border, left: border, right: border }

const cell = (value: string | number | null, header: boolean, width?: number) =>
  new TableCell({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: value === null || value === '' ? '—' : String(value),
            bold: header,
            size: 18,
          }),
        ],
      }),
    ],
    borders,
    shading: header ? { type: ShadingType.CLEAR, fill: HEAD_FILL, color: 'auto' } : undefined,
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
  })

/** A table with a header row repeated on every page; widths are percentages of the page. */
export const table = (
  headers: readonly string[],
  rows: readonly (readonly (string | number | null)[])[],
  widths?: readonly number[],
): Table =>
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map((text, index) => cell(text, true, widths?.[index])),
      }),
      ...rows.map(
        (row) =>
          new TableRow({
            cantSplit: true,
            children: row.map((value, index) => cell(value, false, widths?.[index])),
          }),
      ),
    ],
  })

/** Key facts as a two-column table: the label on the left, the value on the right. */
export const facts = (rows: readonly (readonly [string, string | number | null])[]): Table =>
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(
      ([label, value]) =>
        new TableRow({
          cantSplit: true,
          children: [cell(label, true, 32), cell(value, false, 68)],
        }),
    ),
  })

/** A picture, sized in pixels at 96 dpi, with its alternative text. */
export const picture = (
  png: Buffer,
  size: { width: number; height: number },
  alt: { title: string; description: string },
): Paragraph =>
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new ImageRun({
        type: 'png',
        data: png,
        transformation: size,
        altText: { name: alt.title, title: alt.title, description: alt.description },
      }),
    ],
    spacing: { after: 160 },
  })

type DocumentInput = {
  title: string
  subject?: string
  /** Text on the left of every page header, such as the client and the document's name. */
  header: string
  /** A label on the right of the header, such as "Draft: awaiting legal review". */
  headerLabel?: string
  /** Text on the left of every page footer, such as who prepared it. */
  footer: string
  children: readonly Block[]
}

/** Packs the blocks into a Word file with a header, a footer and page numbers. */
export const buildDocument = async (input: DocumentInput): Promise<Buffer> => {
  const doc = new Document({
    creator: 'DUATF',
    title: input.title,
    subject: input.subject,
    styles: {
      default: {
        document: { run: { font: FONT, size: 21, color: INK } },
        heading1: { run: { font: FONT, size: 30, bold: true, color: INK } },
        heading2: { run: { font: FONT, size: 25, bold: true, color: INK } },
        heading3: { run: { font: FONT, size: 22, bold: true, color: INK } },
      },
    },
    features: { updateFields: false },
    sections: [
      {
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: input.header, color: MUTED, size: 16 }),
                  ...(input.headerLabel
                    ? [
                        new TextRun({
                          text: `\t${input.headerLabel}`,
                          color: 'B42318',
                          size: 16,
                          bold: true,
                        }),
                      ]
                    : []),
                ],
                tabStops: [{ type: 'right', position: 9026 }],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                tabStops: [{ type: 'right', position: 9026 }],
                children: [
                  new TextRun({ text: input.footer, color: MUTED, size: 16 }),
                  new TextRun({
                    children: ['\tPage ', PageNumber.CURRENT, ' of ', PageNumber.TOTAL_PAGES],
                    color: MUTED,
                    size: 16,
                  }),
                ],
              }),
            ],
          }),
        },
        children: [...input.children],
      },
    ],
  })
  return Packer.toBuffer(doc)
}
