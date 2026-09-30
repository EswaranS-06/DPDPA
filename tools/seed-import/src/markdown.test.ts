import { describe, expect, it } from 'vitest'
import { firstParagraph, parseTable, rewriteLinks, section, stripObsidian } from './markdown'

describe('seed markdown helpers', () => {
  const resolve = (target: string) =>
    target === 'OBL-CON-01' ? { kind: 'obligation', code: 'OBL-CON-01' } : undefined

  it('turns resolvable wikilinks into app references and others into text', () => {
    const unresolved: string[] = []
    const out = rewriteLinks(
      'See [[OBL-CON-01]], [[OBL-CON-01|valid consent]] and [[Somewhere Else]]. ![[image.png]]',
      resolve,
      (target) => unresolved.push(target),
    )
    expect(out).toBe(
      'See [OBL-CON-01](ref:obligation/OBL-CON-01), [valid consent](ref:obligation/OBL-CON-01) and Somewhere Else. ',
    )
    expect(unresolved).toEqual(['Somewhere Else'])
  })

  it('removes Dataview blocks', () => {
    expect(stripObsidian('# T\n\n```dataview\nLIST\n```\n\nText')).toBe('# T\n\nText')
  })

  it('reads sections, first paragraphs and tables', () => {
    const md =
      '# Title\n\nIntro line one\nline two.\n\n## Summary\nThe summary.\n\n## Table\n| A | B |\n|---|---|\n| 1 | x \\| y |\n'
    expect(firstParagraph(md)).toBe('Intro line one line two.')
    expect(section(md, 'Summary')).toBe('The summary.')
    expect(parseTable(section(md, 'Table'))).toEqual({
      headers: ['A', 'B'],
      rows: [['1', 'x \\| y']],
    })
  })
})
