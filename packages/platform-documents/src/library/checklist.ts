import { join } from 'node:path'
import { libraryRoot, readLibraryText } from './library'

// Parts B and C of the library's validation checklist (00-common/validation-checklist.md): the
// consultant's statutory checklist for each kind of document, and the points counsel re-confirms.

export type ChecklistGroup = { title: string; templates: string[]; items: string[] }
export type CounselPoint = { id: string; item: string; why: string }

/** "N01, N02, N05" and "C01–C04" as template IDs. */
const idsOf = (heading: string) =>
  [...heading.matchAll(/([A-Z])(\d{2})(?:\s*[–-]\s*[A-Z]?(\d{2}))?/g)].flatMap((match) => {
    const letter = match[1] ?? ''
    const from = Number(match[2])
    const to = match[3] ? Number(match[3]) : from
    return Array.from(
      { length: to - from + 1 },
      (_, index) => `${letter}${String(from + index).padStart(2, '0')}`,
    )
  })

export const loadChecklist = (root = libraryRoot()) => {
  const text = readLibraryText(join(root, '00-common', 'validation-checklist.md'))
  const partB = text.slice(text.indexOf('## PART B'), text.indexOf('## PART C'))
  const partC = text.slice(text.indexOf('## PART C'))
  const groups: ChecklistGroup[] = []
  let current: ChecklistGroup | null = null
  for (const line of partB.split(/\r?\n/)) {
    const head = /^###\s+(.+)$/.exec(line)
    if (head) {
      // Only the IDs in the heading's brackets name the templates ("also C01 §4.1" is a note).
      const inBrackets = /\(([^)]*)\)/.exec(head[1] ?? '')?.[1] ?? ''
      current = {
        title: head[1] ?? '',
        templates: idsOf(inBrackets.split(';')[0] ?? ''),
        items: [],
      }
      groups.push(current)
      continue
    }
    const item = /^- \[ \] (.+)$/.exec(line)
    if (item && current) current.items.push(item[1] ?? '')
  }
  const counsel: CounselPoint[] = [
    ...partC.matchAll(/^\|\s*(C\d+)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*$/gm),
  ].map((match) => ({ id: match[1] ?? '', item: match[2] ?? '', why: match[3] ?? '' }))
  return { groups, counsel }
}

/** The statutory checklist items for one template, from the group that names it. */
export const checklistFor = (templateId: string, root?: string) =>
  loadChecklist(root).groups.filter((group) => group.templates.includes(templateId))
