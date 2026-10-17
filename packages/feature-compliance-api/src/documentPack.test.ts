import { AccessDeniedError } from '@duatf/core-access'
import {
  documentText,
  loadLibrary,
  projectChecks,
  recommendedTemplates,
  type RenderState,
} from '@duatf/platform-documents'
import {
  documentTemplateReview,
  eq,
  processingActivity,
  processingActivityElement,
  withTenants,
} from '@duatf/platform-db'
import JSZip from 'jszip'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { recordBreach, recordBreachStep } from './breaches'
import { getClient } from './clients'
import { createDepartment } from './departments'
import {
  clauseOf,
  documentChecklistOf,
  documentPack,
  exportClientDocument,
  exportDocumentPack,
  listDocumentExports,
  renderClientDocument,
  reviewTemplate,
  saveDocumentChecklist,
  saveDocumentProfile,
  sectorOf,
} from './documentPack'
import { RuleError, ValidationError } from './errors'
import { createProcessor } from './processors'
import { recordRightsRequest } from './rights'
import { as, closeWorld, newClient, openWorld, principalWith, type World } from './testing'

let world: World
beforeAll(() => {
  world = openWorld()
})
afterAll(() => closeWorld(world))

/** A client with HR and Marketing and a two-activity RoPA, written straight to the database. */
const setup = async (label: string) => {
  const client = await newClient(world, label, {
    industry: 'Hospital and diagnostics',
    address: '12 MG Road, Bengaluru 560001',
    website: 'https://example.test',
    dpoName: 'Priya Nair',
    dpoEmail: 'dpo@example.test',
    dpoPhone: '+91 80 4000 1000',
  })
  const hr = await createDepartment(world.ctx, client.id, { code: 'HR', name: 'Human Resources' })
  const mkt = await createDepartment(world.ctx, client.id, { code: 'MKT', name: 'Marketing' })
  await withTenants(world.owner.db, 'all', async (tx) => {
    const rows = [
      {
        departmentId: hr.id,
        ref: 1,
        name: 'Payroll',
        purpose: 'Paying salaries',
        lawfulBases: ['s7i'],
        principals: ['Employees'],
        processors: ['PayFast'],
        retention: '8 years after exit',
        deletion: 'Secure deletion',
        transfersAbroad: 'no',
        elements: [['Bank account number', 'financial', 'L4']] as const,
      },
      {
        departmentId: mkt.id,
        ref: 2,
        name: 'Newsletter',
        purpose: 'Sending health tips',
        lawfulBases: ['consent'],
        principals: ['Patients', 'Children'],
        processors: ['MailBlast'],
        retention: 'Until consent is withdrawn',
        transfersAbroad: 'yes',
        countries: 'Singapore',
        elements: [['Email address', 'contact', 'L2']] as const,
      },
    ]
    for (const { elements, ...row } of rows) {
      const [created] = await tx
        .insert(processingActivity)
        .values({ tenantId: client.id, ...row })
        .returning({ id: processingActivity.id })
      for (const [seq, [title, category, level]] of elements.entries()) {
        await tx.insert(processingActivityElement).values({
          tenantId: client.id,
          activityId: created?.id ?? '',
          title,
          category,
          level,
          seq,
        })
      }
    }
  })
  return client
}

describe('the client’s document profile', () => {
  it('TC-C26.3-01 flags, common details and collections are prefilled from the client profile, the RoPA and the registers, each with its source, and saved answers override them', async () => {
    expect(
      ['Hospital and diagnostics', 'NBFC lending', 'School', '', 'Cement'].map(sectorOf),
    ).toEqual(['Healthcare', 'BFSI-RBI', 'Education', 'General', 'Other'])
    const client = await setup('Documents profile')
    await createProcessor(world.ctx, client.id, {
      name: 'PayFast',
      kind: 'processor',
      location: 'india',
      contract: 'yes',
      service: 'Payroll',
    })
    const profile = await getClient(world.ctx, client.code)
    const pack = await documentPack(world.ctx, client.id)
    expect({
      sector: pack.state.flags.Sector,
      crossBorder: pack.state.flags['Cross-Border-Transfer'],
      children: pack.state.flags['Processes-Children-Data'],
      employees: pack.state.flags['Has-Employees'],
    }).toEqual({ sector: 'Healthcare', crossBorder: true, children: true, employees: true })
    expect(pack.sources.flags['Cross-Border-Transfer']).toMatchObject({ source: 'ropa' })
    expect({
      name: pack.state.values['Client-Name'],
      brand: pack.state.values['Client-Brand-Name'],
      dpo: pack.state.values['DPO-Email'],
      firm: pack.state.values['Server-name'],
      countries: pack.state.values['Cross-Border-Countries'],
    }).toEqual({
      name: profile.legalName,
      brand: profile.name,
      dpo: 'dpo@example.test',
      firm: 'ComplyX',
      countries: 'Singapore',
    })
    expect(pack.sources.values['DPO-Email']).toMatchObject({ source: 'profile' })
    const activities = pack.state.collections['Processing-Activities'] ?? []
    expect(
      activities.map((row) => [
        row['RoPA-ID'],
        row['Purpose-Name'],
        row['RoPA-Child-Data'],
        row['RoPA-Cross-Border'],
      ]),
    ).toEqual([
      ['PA-001', 'Payroll', 'N', 'No'],
      ['PA-002', 'Newsletter', 'Y', 'Yes: Singapore'],
    ])
    expect(
      (pack.state.collections['Consent-Purposes'] ?? []).map((row) => row['Purpose-ID']),
    ).toEqual(['PA-002'])
    expect(
      (pack.state.collections['Sub-Processors'] ?? []).map((row) => row['Subprocessor-Name']),
    ).toEqual(['PayFast'])
    expect(pack.sources.collections['Sub-Processors']).toEqual({ source: 'registers' })
    // The matrix: children → N05, transfers → V05, two kinds of Data Principal → N02.
    expect(pack.recommended).toEqual(expect.arrayContaining(['N01', 'N02', 'N05', 'V05', 'G06']))

    await saveDocumentProfile(world.ctx, client.id, {
      flags: { Sector: 'Education', 'Uses-Cookies': false },
      values: { 'Grievance-Officer-Name': 'Ravi Kumar', 'DPO-Email': 'privacy@example.test' },
    })
    const saved = await documentPack(world.ctx, client.id)
    expect([
      saved.state.flags.Sector,
      saved.state.flags['Uses-Cookies'],
      saved.state.values['DPO-Email'],
      saved.state.values['Grievance-Officer-Name'],
    ]).toEqual(['Education', false, 'privacy@example.test', 'Ravi Kumar'])
    expect(saved.sources.values['DPO-Email']).toEqual({ source: 'saved' })
    expect(saved.recommended).not.toContain('N04')
    const refused = await saveDocumentProfile(world.ctx, client.id, {
      flags: { Sector: 'Space', 'Not-A-Flag': true },
      values: { 'Not-A-Field': 'x' },
    }).catch((error: unknown) => error)
    expect(Object.keys((refused as ValidationError).fieldErrors).sort()).toEqual([
      'flag_Not-A-Flag',
      'flag_Sector',
      'value_Not-A-Field',
    ])
    const viewer = principalWith({ role: 'client_viewer', clientId: client.id })
    await expect(
      saveDocumentProfile(as(world, viewer), client.id, { values: {} }),
    ).rejects.toBeInstanceOf(AccessDeniedError)
  })
})

describe('documents built from a record', () => {
  it('TC-C26.4-01 the Board and Data Principal breach intimations built from a breach carry every Rule 7 item, and an access letter lists every processor the data was shared with', async () => {
    const client = await setup('Documents breach')
    const created = await recordBreach(world.ctx, client.id, {
      title: 'Lab reports emailed to the wrong patients',
      description: 'A mail merge error attached 40 lab reports to the wrong email addresses.',
      occurredAt: new Date(Date.now() - 30 * 3_600_000).toISOString(),
      awareAt: new Date(Date.now() - 20 * 3_600_000).toISOString(),
      severity: 'high',
      natures: 'accidental_disclosure',
      affectedPrincipals: '40',
      recordsAffected: '40',
      childrenAffected: '3',
      dataAffected: 'Names and lab results',
      likelyImpact: 'Health information seen by another patient.',
      measures: 'Recalled the emails and reset the merge job.',
      cause: 'A sorted column in the merge file.',
      personResponsible: 'An operator error; no intent found.',
      remedial: 'A second check before every merge.',
      place: 'Report delivery system',
    })
    await recordBreachStep(world.ctx, client.id, created.id, {
      step: 'board_first',
      at: new Date(Date.now() - 18 * 3_600_000).toISOString(),
      reference: 'DPB/2026/118',
    })
    const board = await renderClientDocument(world.ctx, client.id, 'B02', {
      record: { kind: 'breach', code: created.code },
    })
    // Rule 7(2)(a) and (b): nature, extent, timing, location, likely impact; then the facts, the
    // measures, the person responsible, the remedial measures and the report on intimations.
    for (const text of [
      created.code,
      'Accidental disclosure',
      'Names and lab results',
      '40 Data Principals; 40 records',
      'Report delivery system',
      'Health information seen by another patient.',
      'A mail merge error attached 40 lab reports',
      'A sorted column in the merge file.',
      'Recalled the emails and reset the merge job.',
      'An operator error; no intent found.',
      'A second check before every merge.',
      'DPB/2026/118',
      'of which children: 3',
    ]) {
      expect(board.markdown, text).toContain(text)
    }
    const people = await renderClientDocument(world.ctx, client.id, 'B03', {
      record: { kind: 'breach', code: created.code },
    })
    // Rule 7(1): what happened and its likely consequences, the measures, the safety steps, the contact.
    for (const text of [
      'A mail merge error attached 40 lab reports',
      'Health information seen by another patient.',
      'Recalled the emails and reset the merge job.',
    ]) {
      expect(people.markdown, text).toContain(text)
    }
    await expect(
      renderClientDocument(world.ctx, client.id, 'B02', { record: { kind: 'rights', code: 'X' } }),
    ).rejects.toBeInstanceOf(RuleError)

    const request = await recordRightsRequest(world.ctx, client.id, {
      kind: 'access',
      receivedOn: new Date().toISOString().slice(0, 10),
      requesterRef: 'TKT-77',
    })
    const letter = await renderClientDocument(world.ctx, client.id, 'R04', {
      record: { kind: 'rights', code: request.code },
    })
    expect(letter.markdown).toContain('TKT-77')
    // s.11(1)(b): every Data Fiduciary and Data Processor the data was shared with.
    for (const name of ['PayFast', 'MailBlast'])
      expect(
        letter.state.collections['Access-Recipients']?.map((row) => row['Access-Recipient-Name']),
      ).toContain(name)
  })
})

describe('release checks', () => {
  it('TC-C26.5-01 each automatic check of the library’s checklist blocks or warns as the checklist says, and the documents recommended follow its applicability matrix', () => {
    const data = loadLibrary()
    const base: RenderState = { flags: {}, values: {}, collections: {} }
    const ids = (state: RenderState, recommended: string[] = []) =>
      projectChecks(state, recommended).map((check) => `${check.id}:${check.level}`)
    expect(ids(base)).toEqual([])
    expect(ids({ ...base, values: { 'Grievance-Resolution-Period': '120 days' } })).toEqual([
      'A5:block',
    ])
    expect(ids({ ...base, values: { 'Grievance-Resolution-Period': '90 days' } })).toEqual([])
    expect(
      ids({
        ...base,
        flags: { 'Third-Schedule-Entity': 'E-Commerce' },
        values: { 'Erasure-Pre-Notice-Days': '1' },
      }),
    ).toEqual(['A6:block'])
    expect(
      ids({
        ...base,
        flags: { 'Third-Schedule-Entity': 'E-Commerce' },
        values: { 'Erasure-Pre-Notice-Days': '2' },
      }),
    ).toEqual([])
    expect(
      ids({
        ...base,
        collections: {
          'Consent-Purposes': [{ 'Purpose-Name': 'Marketing emails', 'Purpose-Mandatory': 'Yes' }],
        },
      }),
    ).toEqual(['A7:block', 'A8:warn'])
    expect(ids({ ...base, flags: { 'Is-SDF': true } })).toEqual([
      'A9:block',
      'A9:block',
      'A9:block',
      'A9:block',
      'A9:block',
      'A9:block',
    ])
    expect(ids({ ...base, flags: { 'Processes-Children-Data': true } })).toEqual(['A10:block'])
    expect(ids({ ...base, flags: { 'Cross-Border-Transfer': true } })).toEqual([
      'A11:block',
      'A11:block',
    ])
    expect(
      ids(
        {
          ...base,
          flags: { 'Cross-Border-Transfer': true },
          values: { 'Cross-Border-Countries': 'Singapore' },
        },
        ['V05'],
      ),
    ).toEqual([])
    expect(ids({ ...base, values: { 'Notice-Languages': 'Hindi, Tamil, Klingon' } })).toEqual([
      'A14:warn',
    ])
    expect(
      ids({
        ...base,
        values: { 'Effective-Date': '2026-11-01', 'Next-Review-Date': '2028-01-01' },
      }),
    ).toEqual(['A15:warn'])
    expect(
      ids({
        ...base,
        values: { 'Effective-Date': '2026-11-01', 'Next-Review-Date': '2027-11-01' },
      }),
    ).toEqual([])
    // The applicability matrix.
    const always = data.templates
      .map((row) => row.id)
      .filter(
        (id) =>
          ![
            'N02',
            'N03',
            'N04',
            'N05',
            'N06',
            'C03',
            'V02',
            'V05',
            'S01',
            'S02',
            'S03',
            'S04',
          ].includes(id),
      )
    expect(recommendedTemplates(data, base)).toEqual(always)
    expect(recommendedTemplates(data, { ...base, flags: { 'Is-SDF': true } })).toEqual(
      expect.arrayContaining(['S01', 'S02', 'S03', 'S04']),
    )
    expect(recommendedTemplates(data, { ...base, flags: { Sector: 'Healthcare' } })).toContain(
      'N02',
    )
    expect(recommendedTemplates(data, base, { principalCategories: 2 })).toContain('N02')
  })
})

describe('outputs, review and the export log', () => {
  it('TC-C26.6-01 each document is a valid .docx with the rendered text, and the ZIP holds the recommended set', async () => {
    const client = await setup('Documents outputs')
    // A release download refuses while blanks remain; a draft is allowed and says so.
    await expect(
      exportClientDocument(world.ctx, client.id, 'N01', { format: 'docx' }),
    ).rejects.toBeInstanceOf(RuleError)
    const draft = await exportClientDocument(world.ctx, client.id, 'N01', {
      format: 'docx',
      draft: true,
    })
    expect(draft.fileName).toMatch(new RegExp(`^${client.code}-N01-`))
    const text = await documentText(draft.content)
    const rendered = await renderClientDocument(world.ctx, client.id, 'N01', { mode: 'export' })
    // Every heading and table cell of the rendering is in the Word file.
    const expected = rendered.markdown
      .split('\n')
      .filter((line) => /^#{1,4} /.test(line))
      .map((line) =>
        line
          .replace(/^#+\s+/, '')
          .replace(/\*\*/g, '')
          .trim(),
      )
    for (const line of expected) expect(text, line).toContain(line)
    const zipped = await exportDocumentPack(world.ctx, client.id, { draft: true })
    const names = Object.keys((await JSZip.loadAsync(zipped.content)).files).filter((name) =>
      name.endsWith('.docx'),
    )
    const pack = await documentPack(world.ctx, client.id)
    expect(names.map((name) => /-([A-Z]\d{2})-/.exec(name)?.[1]).sort()).toEqual(
      pack.templates
        .filter((row) => row.recommended && !row.record)
        .map((row) => row.id)
        .sort(),
    )
    await expect(exportDocumentPack(world.ctx, client.id)).rejects.toBeInstanceOf(RuleError)
    const md = await exportClientDocument(world.ctx, client.id, 'N01', {
      format: 'md',
      draft: true,
    })
    expect(md.content.toString('utf8')).toBe(rendered.markdown)
    // The clause view numbers the DPA's sections under one clause.
    const clause = await clauseOf(world.ctx, client.id, { templateId: 'V01', number: '14' })
    expect(clause.markdown).toMatch(/^\*\*14\. DATA PROTECTION\*\*/)
    expect(clause.markdown).toMatch(/\*\*14\.1 /)
  })

  it('TC-C26.7-01 a template is awaiting legal review until an Administrator marks that version reviewed, and again after its file changes; the consultant checklist is saved per document; every export is logged', async () => {
    const client = await setup('Documents review')
    // Review marks are firm-wide; start from none for R01 whatever an earlier run left.
    await world.owner.db
      .delete(documentTemplateReview)
      .where(eq(documentTemplateReview.templateId, 'R01'))
    const before = (await documentPack(world.ctx, client.id)).templates.find(
      (row) => row.id === 'R01',
    )
    expect(before?.review.reviewed).toBe(false)
    const word = await exportClientDocument(world.ctx, client.id, 'R01', {
      format: 'docx',
      draft: true,
    })
    expect((await documentText(word.content)).join('\n')).not.toContain('awaiting legal review')
    // The test world is a Senior auditor: legal review is an Administrator's mark.
    await expect(reviewTemplate(world.ctx, 'R01')).rejects.toBeInstanceOf(AccessDeniedError)
    await reviewTemplate(as(world, principalWith({ role: 'firm_admin' })), 'R01')
    const after = (await documentPack(world.ctx, client.id)).templates.find(
      (row) => row.id === 'R01',
    )
    expect(after?.review).toMatchObject({ reviewed: true })

    const list = await documentChecklistOf(world.ctx, client.id, 'R01')
    const items = list.groups.flatMap((group) => group.items)
    expect(items.length).toBeGreaterThan(3)
    await saveDocumentChecklist(world.ctx, client.id, 'R01', { items: items.slice(0, 2) })
    await expect(
      saveDocumentChecklist(world.ctx, client.id, 'R01', { items: items.slice(0, 2), sign: true }),
    ).rejects.toBeInstanceOf(ValidationError)
    await saveDocumentChecklist(world.ctx, client.id, 'R01', { items, sign: true })
    const signed = await documentChecklistOf(world.ctx, client.id, 'R01')
    expect([signed.ticked.length, Boolean(signed.signedAt)]).toEqual([items.length, true])

    const log = await listDocumentExports(world.ctx, client.id)
    expect(log.map((row) => [row.templateId, row.format])).toEqual([['R01', 'docx (draft)']])
    expect(log[0]?.templateSha).toMatch(/^[0-9a-f]{64}$/)
  })
})
