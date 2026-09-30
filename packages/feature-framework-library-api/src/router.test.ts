import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { findRepoRoot, parseEnv, seedEnvSchema, testDatabaseEnvSchema } from '@duatf/core-config'
import { createDatabase, type DatabaseHandle } from '@duatf/platform-db'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createFrameworkLibraryApi, type FrameworkLibraryApi } from './router'

const env = parseEnv(testDatabaseEnvSchema)
const vault = join(findRepoRoot(), parseEnv(seedEnvSchema).SEED_VAULT_PATH)

// Oracle: read the seed notes directly.
const noteDir = (dir: string) =>
  readdirSync(join(vault, dir)).map((name) => readFileSync(join(vault, dir, name), 'utf8'))
const obligationNotes = noteDir('02 Legal KB/Obligations')
const controlNotes = noteDir('10 Control Library/Controls')
const field = (note: string, name: string) =>
  new RegExp(`^${name}:\\s*'?([^'\\n]*)'?\\s*$`, 'm').exec(note)?.[1]?.trim() ?? ''
const linkedCodes = (note: string, listName: string) => {
  const block = new RegExp(`^${listName}:\\n((?:- .*\\n)+)`, 'm').exec(note)?.[1] ?? ''
  return [...block.matchAll(/\[\[([A-Z]+-[A-Z0-9-]+)/g)].map((match) => match[1] ?? '')
}

let handle: DatabaseHandle
let api: FrameworkLibraryApi

beforeAll(() => {
  handle = createDatabase(env.TEST_APP_DATABASE_URL, { max: 3 })
  api = createFrameworkLibraryApi({ db: handle.db })
})
afterAll(() => handle.close())

describe('framework library API (as the app role)', () => {
  it('TC-C2.5-02 returns an obligation with the controls and law recorded in the seed', async () => {
    const code = 'OBL-CON-01'
    const note = obligationNotes.find((text) => field(text, 'obl_id') === code) ?? ''
    const expectedControls = new Set([
      ...linkedCodes(note, 'controls'),
      ...controlNotes
        .filter((text) => linkedCodes(text, 'obligations').includes(code))
        .map((text) => field(text, 'control_id')),
    ])
    const detail = await api.obligation({ code })
    expect(detail.controls.map((row) => row.code).sort()).toEqual([...expectedControls].sort())
    expect(detail.controls.map((row) => row.code)).toEqual(
      expect.arrayContaining(['CTL-LB-02', 'CTL-LB-04', 'CTL-CON-01', 'CTL-CON-06']),
    )
    expect(detail.instruments.map((row) => row.code)).toContain('S06')
    expect(detail.trigger).toEqual({ basis: ['consent'] })
    expect(detail.domain.code).toBe('D06')
    expect(detail.requirement).toMatch(/^Consent free, specific, informed/)
  })

  it('TC-C2.5-04 finds law and obligations by citation', async () => {
    const results = await api.search({ query: 'Rule 7' })
    expect(results.law.map((row) => row.code)).toContain('R07')
    const citingRule7 = obligationNotes
      .filter((text) => /(^|[^0-9A-Za-z])R7([^0-9]|$)/.test(field(text, 'rule_ref')))
      .map((text) => field(text, 'obl_id'))
    expect(citingRule7.length).toBeGreaterThan(0)
    expect(results.obligations.map((row) => row.code)).toEqual(expect.arrayContaining(citingRule7))
    expect(citingRule7.filter((code) => code.startsWith('OBL-BRE-')).length).toBeGreaterThan(0)

    const bySection = await api.search({ query: 's.6' })
    expect(bySection.law.map((row) => row.code)).toContain('S06')
    const byWords = await api.search({ query: 'breach' })
    expect(byWords.obligations.length).toBeGreaterThan(0)
  })

  it('TC-C2.5-05 counts obligations in force on each commencement date', async () => {
    const dates = obligationNotes.map((text) => field(text, 'in_force'))
    const liveOn = (day: string) => dates.filter((date) => date === '' || date <= day).length
    for (const day of ['2026-09-30', '2026-11-13', '2027-05-13']) {
      const summary = await api.summary({ asOf: day })
      expect(summary.inForce, day).toBe(liveOn(day))
    }
  })

  it('reports per-domain, per-control and per-vocabulary counts that add up', async () => {
    const [domains, obligations, controls, vocabularies] = await Promise.all([
      api.domains(),
      api.obligations(),
      api.controls(),
      api.vocabularies(),
    ])
    for (const domain of domains) {
      const expected = obligations.filter((item) => item.domainCode === domain.code).length
      expect(domain.obligationCount, domain.code).toBe(expected)
      expect(domain.controlCount, domain.code).toBe(
        controls.filter((item) => item.domainCode === domain.code).length,
      )
    }
    const links = await Promise.all(controls.map((item) => api.control({ code: item.code })))
    controls.forEach((item, index) =>
      expect(item.obligationCount, item.code).toBe(links[index]?.obligations.length),
    )
    const terms = await Promise.all(vocabularies.map((item) => api.vocabulary({ code: item.code })))
    vocabularies.forEach((item, index) =>
      expect(item.termCount, item.code).toBe(terms[index]?.terms.length),
    )
  })

  it('reports a missing record as not found', async () => {
    await expect(api.obligation({ code: 'OBL-NOPE-99' })).rejects.toMatchObject({
      code: 'NOT_FOUND',
    })
  })

  it('lists every library section', async () => {
    const [law, domains, sectors, processes, elements, vocabularies, playbooks] = await Promise.all(
      [
        api.law(),
        api.domains(),
        api.sectors(),
        api.processes(),
        api.dataElements(),
        api.vocabularies(),
        api.playbooks(),
      ],
    )
    expect(law.instruments.length).toBe(75)
    expect(law.bases.length).toBe(19)
    expect(domains.length).toBe(18)
    expect(sectors.length).toBe(20)
    expect(processes.length).toBe(124)
    expect(elements.length).toBe(91)
    expect(vocabularies.length).toBe(17)
    expect(playbooks.length).toBeGreaterThan(5)
    const hospital = await api.sector({ code: 'HLT' })
    expect(hospital.retention.some((row) => /IMC/.test(row.source))).toBe(true)
  })
})
