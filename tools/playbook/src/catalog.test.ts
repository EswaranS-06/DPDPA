import { CAPABILITIES, ROLE_LABEL } from '@duatf/core-access'
import { describe, expect, it } from 'vitest'
import { GROUPS, TOURS, WHO } from './catalog.ts'
import { searchTours } from './search.ts'

describe('playbook catalogue', () => {
  it('TC-C18.1-01 lists who can do each task exactly as the permission matrix allows, with well-formed steps', () => {
    // Oracle: the roles of every capability, read from core-access.
    const matrix = Object.fromEntries(
      Object.entries(CAPABILITIES).map(([name, definition]) => [
        name,
        definition.roles.map((role) => ROLE_LABEL[role]),
      ]),
    )
    expect(WHO).toEqual(matrix)
    const problems: string[] = []
    const ids = new Set<string>()
    const groups = new Set(GROUPS.map((group) => group.id))
    for (const tour of TOURS) {
      if (ids.has(tour.id)) problems.push(`${tour.id}: duplicate id`)
      ids.add(tour.id)
      if (!/^[a-z][a-z0-9-]+$/.test(tour.id)) problems.push(`${tour.id}: id format`)
      if (!groups.has(tour.group)) problems.push(`${tour.id}: unknown group`)
      if (tour.steps.length < 2) problems.push(`${tour.id}: fewer than two steps`)
      if (JSON.stringify(tour.who) !== JSON.stringify(matrix[tour.capability])) {
        problems.push(`${tour.id}: who differs from ${tour.capability}`)
      }
      if (tour.capability === 'risk.accept' && tour.persona !== 'dpo') {
        problems.push(`${tour.id}: only a client DPO can accept risks`)
      }
      tour.steps.forEach((step, index) => {
        const where = `${tour.id} step ${index + 1}`
        if (!step.title || !step.say) problems.push(`${where}: title and text needed`)
        if (step.say.length > 320) problems.push(`${where}: text too long for the card`)
        if (step.at && !step.at.startsWith('/')) problems.push(`${where}: "at" must be a path`)
        if (step.action && !step.target) problems.push(`${where}: an action needs a target`)
        if (step.you && index !== tour.steps.length - 1) {
          problems.push(`${where}: the hands-on step must be the last`)
        }
        if (step.you && step.action)
          problems.push(`${where}: the guide never acts on a hands-on step`)
      })
    }
    for (const group of GROUPS) {
      if (!TOURS.some((tour) => tour.group === group.id)) problems.push(`${group.id}: empty group`)
    }
    expect(problems).toEqual([])
    expect(TOURS.length).toBeGreaterThanOrEqual(40)
  })

  it('TC-C18.1-02 search finds tasks by title, keyword and word start', () => {
    const ids = (query: string) => searchTours(query, TOURS).map((tour) => tour.id)
    expect(ids('')).toEqual(TOURS.map((tour) => tour.id))
    expect(ids('onboard')[0]).toBe('onboard-client')
    expect(ids('upload')[0]).toBe('upload-evidence')
    expect(ids('evid')).toEqual(
      expect.arrayContaining(['upload-evidence', 'review-evidence', 'evidence-library']),
    )
    expect(ids('review evidence')[0]).toBe('review-evidence')
    expect(ids('risk')).toEqual(
      expect.arrayContaining(['rate-risk', 'accept-risk', 'risk-register', 'risk-bands']),
    )
    expect(ids('excel')).toEqual(['workbooks'])
    expect(ids('dark mode')).toEqual(['display-settings'])
    expect(ids('xyzzy')).toEqual([])
    // Every task can be found by its own title.
    for (const tour of TOURS) expect(ids(tour.title)[0], tour.id).toBe(tour.id)
  })
})
