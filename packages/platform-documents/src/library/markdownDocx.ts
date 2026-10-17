import {
  BorderStyle,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx'
import { marked, type Token, type Tokens } from 'marked'
import { heading, type Block } from '../docxKit'

// A rendered library document as Word (ADR-0010 decision 7): the Markdown the template grammar
// produced, turned into headings, paragraphs, lists and tables. The words are the template's; only
// the format changes.

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
}

/** HTML entities as characters: "&lt;" as "<", "&#124;" as "|". */
export const decodeEntities = (text: string) =>
  text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, code: string) => {
    if (code.startsWith('#x') || code.startsWith('#X'))
      return String.fromCodePoint(parseInt(code.slice(2), 16))
    if (code.startsWith('#')) return String.fromCodePoint(Number(code.slice(1)))
    return ENTITIES[code.toLowerCase()] ?? whole
  })

type Mark = { bold?: boolean; italics?: boolean; code?: boolean }

/** Inline tokens as runs of text with their emphasis; a <br> in a table cell is a line break. */
const runs = (tokens: readonly Token[] | undefined, mark: Mark = {}): TextRun[] =>
  (tokens ?? []).flatMap((token): TextRun[] => {
    switch (token.type) {
      case 'strong':
        return runs((token as Tokens.Strong).tokens, { ...mark, bold: true })
      case 'em':
        return runs((token as Tokens.Em).tokens, { ...mark, italics: true })
      case 'del':
        return runs((token as Tokens.Del).tokens, mark)
      case 'codespan':
        return [
          new TextRun({
            text: decodeEntities((token as Tokens.Codespan).text),
            font: 'Consolas',
            ...mark,
          }),
        ]
      case 'br':
        return [new TextRun({ break: 1 })]
      case 'link': {
        const link = token as Tokens.Link
        const label = runs(link.tokens, mark)
        const text = decodeEntities(link.text)
        return link.href && link.href !== text
          ? [...label, new TextRun({ text: ` (${link.href})`, ...mark })]
          : label
      }
      case 'html': {
        const html = (token as Tokens.HTML).text
        if (/^<br\s*\/?>$/i.test(html.trim())) return [new TextRun({ break: 1 })]
        const text = decodeEntities(html.replace(/<[^>]+>/g, ''))
        return text ? [new TextRun({ text, ...mark })] : []
      }
      case 'text':
      case 'escape': {
        const text = token as Tokens.Text
        if ('tokens' in text && text.tokens?.length) return runs(text.tokens, mark)
        return [
          new TextRun({ text: decodeEntities(text.text), bold: mark.bold, italics: mark.italics }),
        ]
      }
      default:
        return 'text' in token && typeof token.text === 'string'
          ? [new TextRun({ text: decodeEntities(token.text), ...mark })]
          : []
    }
  })

/** The plain text of inline tokens, for headings. */
const plain = (tokens: readonly Token[] | undefined): string =>
  (tokens ?? [])
    .map((token) => {
      if ('tokens' in token && Array.isArray(token.tokens) && token.tokens.length)
        return plain(token.tokens)
      if (token.type === 'br') return ' '
      return 'text' in token && typeof token.text === 'string'
        ? decodeEntities(token.text.replace(/<[^>]+>/g, ''))
        : ''
    })
    .join('')

const rule = { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' }
const borders = { top: rule, bottom: rule, left: rule, right: rule }

const cell = (tokens: readonly Token[], header: boolean) =>
  new TableCell({
    children: [new Paragraph({ children: runs(tokens, header ? { bold: true } : {}) })],
    borders,
    shading: header ? { type: ShadingType.CLEAR, fill: 'F1F5F9', color: 'auto' } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
  })

const listBlocks = (list: Tokens.List, level: number): Block[] =>
  list.items.flatMap((item, index) => {
    const first: Token[] = []
    const rest: Block[] = []
    for (const token of item.tokens) {
      if (token.type === 'list') rest.push(...listBlocks(token as Tokens.List, level + 1))
      else if (token.type === 'text' || token.type === 'paragraph') {
        const inline = 'tokens' in token && Array.isArray(token.tokens) ? token.tokens : [token]
        first.push(...(first.length ? [{ type: 'br', raw: '\n' } as Tokens.Br] : []), ...inline)
      } else rest.push(...blocks([token]))
    }
    const number = typeof list.start === 'number' ? list.start + index : index + 1
    const check = item.task ? (item.checked ? '☑ ' : '☐ ') : ''
    const prefix = list.ordered ? `${number}. ${check}` : check
    return [
      new Paragraph({
        children: [...(prefix ? [new TextRun(prefix)] : []), ...runs(first)],
        ...(list.ordered
          ? { indent: { left: 360 * (level + 1), hanging: 360 } }
          : { bullet: { level } }),
        spacing: { after: 60 },
      }),
      ...rest,
    ]
  })

/** Block tokens as Word blocks. */
const blocks = (tokens: readonly Token[]): Block[] =>
  tokens.flatMap((token): Block[] => {
    switch (token.type) {
      case 'heading': {
        const head = token as Tokens.Heading
        return [heading(plain(head.tokens), Math.min(head.depth, 3) as 1 | 2 | 3)]
      }
      case 'paragraph':
        return [
          new Paragraph({
            children: runs((token as Tokens.Paragraph).tokens),
            spacing: { after: 120 },
          }),
        ]
      case 'list':
        return listBlocks(token as Tokens.List, 0)
      case 'table': {
        const table = token as Tokens.Table
        return [
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                tableHeader: true,
                children: table.header.map((head) => cell(head.tokens, true)),
              }),
              ...table.rows.map(
                (row) => new TableRow({ children: row.map((item) => cell(item.tokens, false)) }),
              ),
            ],
          }),
          new Paragraph({ children: [] }),
        ]
      }
      case 'blockquote':
        return blocks((token as Tokens.Blockquote).tokens)
      case 'hr':
        return [new Paragraph({ children: [], border: { bottom: rule }, spacing: { after: 120 } })]
      case 'code':
        return (token as Tokens.Code).text.split('\n').map(
          (line) =>
            new Paragraph({
              children: [new TextRun({ text: line, font: 'Consolas', size: 18 })],
            }),
        )
      case 'html': {
        const text = decodeEntities((token as Tokens.HTML).text.replace(/<[^>]+>/g, '')).trim()
        return text ? [new Paragraph({ children: [new TextRun(text)] })] : []
      }
      case 'text':
        return [new Paragraph({ children: runs([token]), spacing: { after: 120 } })]
      default:
        return []
    }
  })

/** Rendered Markdown as Word blocks. */
export const markdownBlocks = (markdown: string): Block[] =>
  blocks(marked.lexer(markdown, { gfm: true }))

/** Rendered Markdown as HTML, the way the library's Studio shows and exports it. */
export const markdownHtml = (markdown: string): string =>
  marked.parser(marked.lexer(markdown, { gfm: true }), { gfm: true })
