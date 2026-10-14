import { AccessDeniedError } from '@duatf/core-access'
import { addCalendarDays, addHours, isoDate } from '@duatf/core-utils'
import {
  dpia,
  eq,
  processingActivity,
  processingActivityElement,
  withTenants,
} from '@duatf/platform-db'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { attentionFor } from './attention'
import {
  breachClocks,
  breachNotices,
  closeBreach,
  getBreach,
  listBreaches,
  nextDeadline,
  recordBreach,
  recordBreachStep,
  reopenBreach,
  updateBreach,
} from './breaches'
import { createDepartment } from './departments'
import { dpiaReasons, DPIA_REVIEW_DAYS, getDpia, listDpias, saveDpia, startDpia } from './dpia'
import { RuleError, ValidationError } from './errors'
import {
  addProcessorsFromRopa,
  contractState,
  createProcessor,
  listProcessors,
  removeProcessor,
  updateProcessor,
} from './processors'
import {
  dueDateFor,
  getRightsRequest,
  listRightsRequests,
  moveRightsRequest,
  recordRightsRequest,
  setRightsResponseDays,
  updateRightsRequest,
} from './rights'
import { listBands, ratingFor } from './risks'
import { as, closeWorld, newClient, openWorld, principalWith, type World } from './testing'

let world: World
beforeAll(() => {
  world = openWorld()
})
afterAll(() => closeWorld(world))

type Element = [title: string, level: 'L1' | 'L2' | 'L3' | 'L4']

/** A client with HR and IT and a small RoPA, written straight to the database. */
const withRopa = async (
  label: string,
  activities: {
    department: 'HR' | 'IT'
    name: string
    processors?: string[]
    principals?: string[]
    transfersAbroad?: 'yes' | 'no' | 'unknown'
    purpose?: string
    elements?: Element[]
  }[],
) => {
  const client = await newClient(world, label)
  const departments = {
    HR: (await createDepartment(world.ctx, client.id, { code: 'HR', name: 'Human Resources' })).id,
    IT: (await createDepartment(world.ctx, client.id, { code: 'IT', name: 'IT' })).id,
  }
  await withTenants(world.owner.db, 'all', async (tx) => {
    for (const [index, activity] of activities.entries()) {
      const [row] = await tx
        .insert(processingActivity)
        .values({
          tenantId: client.id,
          departmentId: departments[activity.department],
          ref: index + 1,
          name: activity.name,
          purpose: activity.purpose ?? null,
          processors: activity.processors ?? [],
          principals: activity.principals ?? [],
          transfersAbroad: activity.transfersAbroad ?? 'no',
        })
        .returning({ id: processingActivity.id })
      for (const [seq, [title, level]] of (activity.elements ?? []).entries()) {
        await tx.insert(processingActivityElement).values({
          tenantId: client.id,
          activityId: row?.id ?? '',
          title,
          category: 'identity',
          level,
          seq,
        })
      }
    }
  })
  return { client, departments }
}

const attention = async (clientId: string) =>
  Object.fromEntries(
    (await attentionFor(world.ctx, [clientId])).map((row) => [row.kind, row] as const),
  )

const baseProcessor = { kind: 'processor', location: 'india', contract: 'unknown' }

describe('processor register', () => {
  it('TC-C23.1-01 processors named in the RoPA become register entries once, and each shows the activities and personal data it receives', async () => {
    const { client } = await withRopa('Processors', [
      {
        department: 'HR',
        name: 'Payroll',
        processors: ['Zing HR', 'Bank'],
        elements: [
          ['Name', 'L1'],
          ['PAN', 'L3'],
          ['Bank account', 'L3'],
        ],
      },
      {
        department: 'IT',
        name: 'Helpdesk',
        processors: ['zing  hr ', 'Freshdesk'],
        elements: [
          ['Name', 'L2'],
          ['Health record', 'L4'],
        ],
      },
      { department: 'IT', name: 'Asset register' },
    ])
    const empty = await listProcessors(world.ctx, client.id)
    expect(empty.entries).toEqual([])
    expect(empty.unregistered).toEqual(['Bank', 'Freshdesk', 'Zing HR'])

    expect(await addProcessorsFromRopa(world.ctx, client.id)).toEqual([
      'Bank',
      'Freshdesk',
      'Zing HR',
    ])
    expect(await addProcessorsFromRopa(world.ctx, client.id)).toEqual([])
    const list = await listProcessors(world.ctx, client.id)
    expect(list.unregistered).toEqual([])
    expect(list.entries.map((row) => [row.code, row.name, row.state])).toEqual([
      [`TP-${client.code}-001`, 'Bank', 'unknown'],
      [`TP-${client.code}-002`, 'Freshdesk', 'unknown'],
      [`TP-${client.code}-003`, 'Zing HR', 'unknown'],
    ])
    const zing = list.entries.find((row) => row.name === 'Zing HR')
    expect(zing?.activities.map((row) => `${row.refLabel} ${row.name}`)).toEqual([
      'PA-001 Payroll',
      'PA-002 Helpdesk',
    ])
    // "Name" is in both activities: listed once, at its higher level.
    expect(zing?.elements.map((row) => `${row.title} ${row.level}`).sort()).toEqual([
      'Bank account L3',
      'Health record L4',
      'Name L2',
      'PAN L3',
    ])
    expect(zing?.highestLevel).toBe('L4')
    expect(list.entries.find((row) => row.name === 'Bank')?.highestLevel).toBe('L3')

    // Renamed to its legal name, the entry still answers to the RoPA's spelling.
    const fresh = list.entries.find((row) => row.name === 'Freshdesk')
    await updateProcessor(world.ctx, client.id, fresh?.id ?? '', {
      ...baseProcessor,
      name: 'Freshworks Technologies',
      aliases: 'Freshdesk; FD',
    })
    const renamed = await listProcessors(world.ctx, client.id)
    expect(renamed.unregistered).toEqual([])
    expect(
      renamed.entries
        .find((row) => row.name === 'Freshworks Technologies')
        ?.activities.map((row) => row.refLabel),
    ).toEqual(['PA-002'])
    const taken = await createProcessor(world.ctx, client.id, {
      ...baseProcessor,
      name: 'bank',
    }).catch((error: unknown) => error)
    expect((taken as ValidationError).fieldErrors.name).toMatch(/already listed/)
  })

  it('TC-C23.1-02 the contract state follows its dates: none, in force, ending soon, ended', async () => {
    const today = '2026-10-13'
    const state = (contract: 'yes' | 'no' | 'unknown', start: number | null, end: number | null) =>
      contractState(
        {
          contract,
          contractStart: start === null ? null : addCalendarDays(today, start),
          contractEnd: end === null ? null : addCalendarDays(today, end),
        },
        today,
      )
    expect([
      state('no', null, null),
      state('unknown', -10, 10),
      state('yes', null, null),
      state('yes', -400, -1),
      state('yes', -400, 0),
      state('yes', -400, 60),
      state('yes', -400, 61),
      state('yes', 1, 400),
      state('yes', 0, null),
    ]).toEqual([
      'none',
      'unknown',
      'in_force',
      'ended',
      'ending_soon',
      'ending_soon',
      'in_force',
      'not_started',
      'in_force',
    ])

    const { client } = await withRopa('Contracts', [])
    const now = isoDate(new Date())
    const add = (name: string, more: Record<string, string>) =>
      createProcessor(world.ctx, client.id, { ...baseProcessor, name, ...more })
    await add('No contract', { contract: 'no', contractEnd: addCalendarDays(now, 30) })
    await add('Ended', {
      contract: 'yes',
      contractStart: addCalendarDays(now, -400),
      contractEnd: addCalendarDays(now, -5),
    })
    await add('Ending', {
      contract: 'yes',
      contractEnd: addCalendarDays(now, 10),
      terms: 'safeguards',
    })
    await add('In force', { contract: 'yes', contractEnd: addCalendarDays(now, 300) })
    await add('Not checked', {})
    const left = await add('Left', { contract: 'no', active: 'false' })
    const backwards = await add('Backwards', {
      contract: 'yes',
      contractStart: addCalendarDays(now, 10),
      contractEnd: now,
    }).catch((error: unknown) => error)
    expect((backwards as ValidationError).fieldErrors.contractEnd).toBeTruthy()
    const unknownTerm = await add('Terms', { contract: 'yes', terms: 'indemnity' }).catch(
      (error: unknown) => error,
    )
    expect((unknownTerm as ValidationError).fieldErrors.terms).toBeTruthy()

    const list = await listProcessors(world.ctx, client.id)
    expect(Object.fromEntries(list.entries.map((row) => [row.name, row.state]))).toEqual({
      'No contract': 'none',
      Ended: 'ended',
      Ending: 'ending_soon',
      'In force': 'in_force',
      'Not checked': 'unknown',
      Left: 'none',
    })
    // With no contract, dates and terms are not kept.
    expect(list.entries.find((row) => row.name === 'No contract')?.contractEnd).toBeNull()
    expect(list.entries.find((row) => row.name === 'Ending')?.terms).toEqual(['safeguards'])
    const seen = await attention(client.id)
    expect(seen.processor_contracts_missing?.count).toBe(2)
    expect(seen.processor_contracts_ending).toMatchObject({
      count: 1,
      earliestDue: addCalendarDays(now, 10),
    })
    await removeProcessor(world.ctx, client.id, left.id)
    expect((await listProcessors(world.ctx, client.id)).entries).toHaveLength(5)
  })

  it('TC-C23.1-03 only the audit team changes the register, and each client sees only its own', async () => {
    const { client } = await withRopa('Mine', [])
    const { client: other } = await withRopa('Theirs', [])
    const created = await createProcessor(world.ctx, client.id, {
      ...baseProcessor,
      name: 'Vendor',
    })
    for (const role of ['client_dpo', 'department_owner', 'client_viewer', 'firm_admin'] as const) {
      const person = principalWith({ role, clientId: role === 'firm_admin' ? null : client.id })
      await expect(
        createProcessor(as(world, person), client.id, { ...baseProcessor, name: `By ${role}` }),
      ).rejects.toBeInstanceOf(AccessDeniedError)
      await expect(
        removeProcessor(as(world, person), client.id, created.id),
      ).rejects.toBeInstanceOf(AccessDeniedError)
    }
    const dpo = principalWith({ role: 'client_dpo', clientId: client.id })
    expect((await listProcessors(as(world, dpo), client.id)).entries).toHaveLength(1)
    expect((await listProcessors(as(world, dpo), client.id)).canEdit).toBe(false)
    await expect(listProcessors(as(world, dpo), other.id)).rejects.toBeInstanceOf(AccessDeniedError)
    expect((await listProcessors(world.ctx, other.id)).entries).toEqual([])
    // An id of another client's entry changes nothing.
    await expect(
      updateProcessor(world.ctx, other.id, created.id, { ...baseProcessor, name: 'Taken over' }),
    ).rejects.toThrow(/not found/)
  })
})

describe('breach register', () => {
  const aware = new Date('2026-10-10T04:30:00Z')
  const at = (hours: number) => addHours(aware, hours)
  const breachAt = (more: Record<string, unknown> = {}) => ({
    awareAt: aware,
    cyberIncident: true,
    boardFirstAt: null,
    boardDetailedAt: null,
    boardExtendedTo: null,
    principalsAt: null,
    certInAt: null,
    ...more,
  })
  const states = (row: ReturnType<typeof breachAt>, now: Date) =>
    Object.fromEntries(
      breachClocks(row, now).map((clock) => [clock.key, [clock.state, clock.hoursLeft]]),
    )

  it('TC-C23.2-01 the clocks run from awareness: 72 hours for the detailed report to the Board (or the longer period allowed) and 6 hours for CERT-In on a cyber incident', () => {
    expect(states(breachAt(), at(5))).toEqual({
      board_first: ['running', null],
      principals: ['running', null],
      board_detailed: ['running', 67],
      cert_in: ['running', 1],
    })
    expect(states(breachAt(), at(7)).cert_in).toEqual(['overdue', -1])
    expect(states(breachAt({ certInAt: at(5) }), at(7)).cert_in).toEqual(['done', null])
    expect(states(breachAt({ certInAt: at(6.5) }), at(7)).cert_in).toEqual(['done_late', null])
    expect(states(breachAt({ cyberIncident: false }), at(7)).cert_in).toEqual(['not_needed', null])
    expect(states(breachAt({ boardDetailedAt: at(71) }), at(80)).board_detailed).toEqual([
      'done',
      null,
    ])
    expect(states(breachAt({ boardDetailedAt: at(73) }), at(80)).board_detailed).toEqual([
      'done_late',
      null,
    ])
    expect(states(breachAt(), at(80)).board_detailed).toEqual(['overdue', -8])
    // The Board allowed a longer period: the clock runs to that time instead.
    const extended = breachAt({ boardExtendedTo: at(120) })
    expect(states(extended, at(80)).board_detailed).toEqual(['running', 40])
    expect(
      breachClocks(extended, at(80)).find((clock) => clock.key === 'board_detailed')?.basis,
    ).toMatch(/longer period/)
    // "Without delay" has no hour: the intimations show how long they took.
    const first = breachClocks(breachAt({ boardFirstAt: at(2) }), at(9)).find(
      (clock) => clock.key === 'board_first',
    )
    expect([first?.deadline, first?.state, first?.hoursTaken]).toEqual([null, 'done', 2])
    expect(nextDeadline(breachClocks(breachAt(), at(1)))).toEqual(at(6))
    expect(nextDeadline(breachClocks(breachAt({ certInAt: at(3) }), at(4)))).toEqual(at(72))
    expect(
      nextDeadline(breachClocks(breachAt({ certInAt: at(3), boardDetailedAt: at(50) }), at(60))),
    ).toBeNull()
  })

  const record = (hoursAgo: number, more: Record<string, string> = {}) => ({
    title: 'Lab reports sent to the wrong patients',
    description: 'A mail merge error attached 40 lab reports to the wrong email addresses.',
    awareAt: new Date(Date.now() - hoursAgo * 3_600_000).toISOString(),
    severity: 'high',
    natures: 'accidental_disclosure',
    ...more,
  })

  it('TC-C23.2-02 recording each intimation writes the timeline, and a breach closes only with its intimations or a recorded reason', async () => {
    const { client } = await withRopa('Breach', [{ department: 'IT', name: 'Report delivery' }])
    const viewer = principalWith({ role: 'client_viewer', clientId: client.id })
    await expect(recordBreach(as(world, viewer), client.id, record(30))).rejects.toBeInstanceOf(
      AccessDeniedError,
    )
    const future = await recordBreach(world.ctx, client.id, record(-2)).catch(
      (error: unknown) => error,
    )
    expect((future as ValidationError).fieldErrors.awareAt).toBeTruthy()
    const dpo = principalWith({ role: 'client_dpo', clientId: client.id })
    const created = await recordBreach(as(world, dpo), client.id, {
      ...record(30),
      activityRefs: 'PA-001',
    })
    expect(created.code).toBe(`BRE-${client.code}-001`)
    const awareAt = (await getBreach(world.ctx, client.id, created.code)).awareAt
    const step = (name: string, hours: number | null, more: Record<string, string> = {}) =>
      recordBreachStep(world.ctx, client.id, created.id, {
        step: name,
        at: hours === null ? '' : addHours(awareAt, hours).toISOString(),
        ...more,
      })
    await expect(step('cert_in', 1)).rejects.toBeInstanceOf(RuleError)
    const early = await step('board_first', -1).catch((error: unknown) => error)
    expect((early as ValidationError).fieldErrors.at).toMatch(/before/)
    const ahead = await step('board_first', 40).catch((error: unknown) => error)
    expect((ahead as ValidationError).fieldErrors.at).toMatch(/future/)
    const short = await step('extension', 48).catch((error: unknown) => error)
    expect((short as ValidationError).fieldErrors.at).toMatch(/72 hours/)

    await step('board_first', 1, { reference: 'DPB/2026/118' })
    await step('principals', 2, { note: 'email to each registered address' })
    await step('contained', 3)
    const open = await getBreach(world.ctx, client.id, created.code)
    expect(open.status).toBe('contained')
    expect(open.contact).toBe('Anita Rao, anita@example.test')
    expect(open.activities.map((row) => row.refLabel)).toEqual(['PA-001'])
    expect(open.outstanding).toEqual(['Detailed report to the Board'])
    expect((await attention(client.id)).breach_clocks).toMatchObject({ count: 1 })

    const refused = await closeBreach(world.ctx, client.id, created.id, {}).catch(
      (error: unknown) => error,
    )
    expect((refused as ValidationError).fieldErrors.reason).toMatch(/Detailed report to the Board/)
    await step('board_detailed', 20)
    await closeBreach(world.ctx, client.id, created.id, {})
    const closed = await getBreach(world.ctx, client.id, created.code)
    expect([closed.status, closed.outstanding, closed.boardReference]).toEqual([
      'closed',
      [],
      'DPB/2026/118',
    ])
    expect(closed.events.map((event) => event.kind)).toEqual([
      'recorded',
      'board_first',
      'principals',
      'contained',
      'board_detailed',
      'closed',
    ])
    expect((await attention(client.id)).breach_clocks).toBeUndefined()
    await expect(updateBreach(world.ctx, client.id, created.id, record(30))).rejects.toBeInstanceOf(
      RuleError,
    )
    await reopenBreach(world.ctx, client.id, created.id)
    expect((await getBreach(world.ctx, client.id, created.code)).status).toBe('contained')

    // Closed without its intimations only with the reason on record.
    const second = await recordBreach(world.ctx, client.id, record(100, { title: 'Lost laptop' }))
    await closeBreach(world.ctx, client.id, second.id, {
      reason: 'The disk was encrypted and wiped remotely; no personal data was exposed.',
    })
    const rows = (await listBreaches(world.ctx, client.id)).breaches
    expect(rows.map((row) => [row.code, row.status, row.overdue])).toEqual([
      [created.code, 'contained', false],
      [second.code, 'closed', false],
    ])
  })

  it('TC-C23.2-03 the draft notices carry every item Rule 7 lists, filled from the record', () => {
    const full = {
      code: 'BRE-X-001',
      title: 'Lab reports sent to the wrong patients',
      description: 'A mail merge error attached lab reports to the wrong email addresses.',
      awareAt: aware,
      occurredAt: at(-20),
      place: 'Report delivery system, Chennai',
      natures: ['accidental_disclosure'],
      affectedPrincipals: 40,
      dataAffected: 'names and lab results',
      likelyImpact: 'Health information seen by another patient.',
      measures: 'Recipients asked to delete; the merge is now checked by two people.',
      safetySteps: 'Tell us if you are contacted about your results.',
      contact: 'Anita Rao, anita@example.test',
      cause: 'A spreadsheet was sorted on one column only.',
      personResponsible: 'An operator error; no intent found.',
      remedial: 'Reports now go out from the lab system, not by mail merge.',
      principalsAt: at(2),
      principalsHow: 'email',
    }
    const drafts = breachNotices(full, 'Mallard Healthcare Private Limited')
    const rules = (key: string) =>
      drafts.find((draft) => draft.key === key)?.items.map((item) => item.rule)
    expect(rules('principals')).toEqual([
      'R7(1)(a)',
      'R7(1)(b)',
      'R7(1)(c)',
      'R7(1)(d)',
      'R7(1)(e)',
    ])
    expect(rules('board_first')).toEqual(['R7(2)(a)', 'R7(2)(a)'])
    expect(rules('board_detailed')).toEqual([
      'R7(2)(b)(i)',
      'R7(2)(b)(ii)',
      'R7(2)(b)(iii)',
      'R7(2)(b)(iv)',
      'R7(2)(b)(v)',
      'R7(2)(b)(vi)',
    ])
    expect(drafts.flatMap((draft) => draft.items).every((item) => item.text)).toBe(true)
    const description = drafts[0]?.items[0]?.text ?? ''
    for (const part of [
      'mail merge error',
      'accidental disclosure',
      'names and lab results',
      'About 40 Data Principals',
      'Mallard Healthcare Private Limited became aware',
      'Location: Report delivery system, Chennai',
    ]) {
      expect(description).toContain(part)
    }
    expect(drafts[2]?.items[5]?.text).toMatch(/intimated on .* by email/)

    // What the record does not hold yet is left empty, not invented.
    const sparse = breachNotices(
      { ...full, likelyImpact: null, cause: null, principalsAt: null, contact: null },
      'Mallard',
    )
    const empty = sparse.flatMap((draft) =>
      draft.items.filter((item) => item.text === null).map((item) => item.rule),
    )
    expect(empty).toEqual(['R7(1)(b)', 'R7(1)(e)', 'R7(2)(a)', 'R7(2)(b)(ii)', 'R7(2)(b)(vi)'])
  })
})

describe('rights and grievance register', () => {
  const today = isoDate(new Date())
  const request = (more: Record<string, string> = {}) => ({
    kind: 'access',
    receivedOn: today,
    requesterRef: 'TKT-1042',
    channel: 'Email',
    ...more,
  })

  it('TC-C23.3-01 a request’s due date comes from the client’s response period, a grievance never beyond 90 days, and it is overdue after that date', async () => {
    expect([
      dueDateFor('access', '2026-10-01', 30),
      dueDateFor('grievance', '2026-10-01', 30),
      dueDateFor('grievance', '2026-10-01', 120),
      dueDateFor('erasure', '2026-10-01', 120),
    ]).toEqual(['2026-10-31', '2026-10-31', '2026-12-30', '2027-01-29'])

    const { client } = await withRopa('Rights', [])
    const first = await recordRightsRequest(world.ctx, client.id, request())
    expect([first.code, first.dueOn]).toEqual([
      `DPR-${client.code}-001`,
      addCalendarDays(today, 90),
    ])
    for (const days of ['0', '91', 'soon']) {
      const refused = await setRightsResponseDays(world.ctx, client.id, {
        responseDays: days,
      }).catch((error: unknown) => error)
      expect((refused as ValidationError).fieldErrors.responseDays).toBeTruthy()
    }
    await setRightsResponseDays(world.ctx, client.id, { responseDays: '30' })
    const late = await recordRightsRequest(
      world.ctx,
      client.id,
      request({ kind: 'grievance', receivedOn: addCalendarDays(today, -40), requesterRef: 'G-7' }),
    )
    expect(late.dueOn).toBe(addCalendarDays(today, -10))
    const tooLong = await recordRightsRequest(
      world.ctx,
      client.id,
      request({ kind: 'grievance', dueOn: addCalendarDays(today, 91) }),
    ).catch((error: unknown) => error)
    expect((tooLong as ValidationError).fieldErrors.dueOn).toMatch(/90 days/)
    const agreed = await recordRightsRequest(
      world.ctx,
      client.id,
      request({ kind: 'erasure', dueOn: addCalendarDays(today, 120), requesterRef: 'TKT-9' }),
    )
    expect(agreed.dueOn).toBe(addCalendarDays(today, 120))
    const future = await recordRightsRequest(
      world.ctx,
      client.id,
      request({ receivedOn: addCalendarDays(today, 1) }),
    ).catch((error: unknown) => error)
    expect((future as ValidationError).fieldErrors.receivedOn).toBeTruthy()

    const list = await listRightsRequests(world.ctx, client.id)
    expect(list.responseDays).toBe(30)
    expect(list.counts).toEqual({ open: 3, overdue: 1, closed: 0 })
    // Most urgent first.
    expect(list.requests.map((row) => [row.code, row.overdue, row.daysLeft])).toEqual([
      [late.code, true, -10],
      [first.code, false, 90],
      [agreed.code, false, 120],
    ])
    expect((await attention(client.id)).rights_overdue).toMatchObject({
      count: 1,
      earliestDue: addCalendarDays(today, -10),
    })
  })

  it('TC-C23.3-02 a request moves from received to fulfilled, refused with a reason or withdrawn, and a closed request stays closed', async () => {
    const { client } = await withRopa('Requests', [])
    const { client: other } = await withRopa('Elsewhere', [])
    const make = async (ref: string) =>
      (await recordRightsRequest(world.ctx, client.id, request({ requesterRef: ref }))).id
    const move = (id: string, to: string, more: Record<string, string> = {}) =>
      moveRightsRequest(world.ctx, client.id, id, { to, ...more })
    const refusedId = await make('A')
    await move(refusedId, 'in_progress')
    await expect(move(refusedId, 'in_progress')).rejects.toBeInstanceOf(RuleError)
    const bare = await move(refusedId, 'refused').catch((error: unknown) => error)
    expect((bare as ValidationError).fieldErrors.outcome).toMatch(/why/)
    await move(refusedId, 'refused', {
      outcome: 'The records are needed for a tax assessment (s.12(3)).',
    })
    await expect(move(refusedId, 'fulfilled')).rejects.toThrow(/stays closed/)
    await expect(
      updateRightsRequest(world.ctx, client.id, refusedId, request({ requesterRef: 'A2' })),
    ).rejects.toBeInstanceOf(RuleError)

    const fulfilledId = await make('B')
    const early = await move(fulfilledId, 'fulfilled', {
      closedOn: addCalendarDays(today, -1),
    }).catch((error: unknown) => error)
    expect((early as ValidationError).fieldErrors.closedOn).toBeTruthy()
    await move(fulfilledId, 'fulfilled', { outcome: 'Summary sent by email.' })
    const withdrawnId = await make('C')
    await move(withdrawnId, 'withdrawn')

    const list = await listRightsRequests(world.ctx, client.id)
    expect(
      Object.fromEntries(
        list.requests.map((row) => [row.requesterRef, [row.status, row.closedOn]]),
      ),
    ).toEqual({
      A: ['refused', today],
      B: ['fulfilled', today],
      C: ['withdrawn', today],
    })
    expect(list.counts).toEqual({ open: 0, overdue: 0, closed: 3 })
    const detail = await getRightsRequest(world.ctx, client.id, `DPR-${client.code}-001`)
    expect([detail.moves, detail.daysTaken]).toEqual([[], 0])

    // The client's DPO records requests; a viewer cannot; another client sees none of them.
    const dpo = principalWith({ role: 'client_dpo', clientId: client.id })
    await recordRightsRequest(as(world, dpo), client.id, request({ requesterRef: 'D' }))
    const viewer = principalWith({ role: 'client_viewer', clientId: client.id })
    await expect(
      recordRightsRequest(as(world, viewer), client.id, request()),
    ).rejects.toBeInstanceOf(AccessDeniedError)
    expect((await listRightsRequests(world.ctx, other.id)).requests).toEqual([])
    await expect(move(refusedId, 'withdrawn')).rejects.toBeInstanceOf(RuleError)
    await expect(
      moveRightsRequest(world.ctx, other.id, fulfilledId, { to: 'withdrawn' }),
    ).rejects.toThrow(/not found/)
  })
})

describe('DPIA', () => {
  const ropa = [
    {
      department: 'HR' as const,
      name: 'Health screening',
      purpose: 'Pre-employment medical fitness',
      principals: ['Employee', 'Job applicant'],
      processors: ['Clinic'],
      elements: [
        ['Name', 'L1'],
        ['Medical report', 'L4'],
      ] as Element[],
    },
    {
      department: 'IT' as const,
      name: 'School portal',
      principals: ['Student (child)'],
      transfersAbroad: 'yes' as const,
      elements: [['Email', 'L2']] as Element[],
    },
    { department: 'IT' as const, name: 'Asset register', elements: [['Name', 'L1']] as Element[] },
  ]

  it('TC-C23.4-01 a DPIA belongs to one activity, starts from its RoPA answers and rates risk before and after its measures', async () => {
    const { client } = await withRopa('Dpia', ropa)
    const started = await startDpia(world.ctx, client.id, 1)
    expect(started.code).toBe(`DPIA-${client.code}-001`)
    await expect(startDpia(world.ctx, client.id, 1)).rejects.toThrow(/already has a DPIA/)
    await expect(startDpia(world.ctx, client.id, 9)).rejects.toThrow(/not found/)
    const draft = await getDpia(world.ctx, client.id, started.code)
    expect(draft.status).toBe('draft')
    expect(draft.purpose).toBe('Pre-employment medical fitness')
    for (const part of [
      'Health screening (PA-001), Human Resources.',
      'Data Principals: Employee, Job applicant.',
      'Personal data: Name, Medical report.',
      'Processors: Clinic.',
    ]) {
      expect(draft.description).toContain(part)
    }

    const risk = {
      risk: 'A medical report reaches a line manager.',
      likelihood: '4',
      impact: '4',
      measures: 'Reports go only to the occupational health nurse.',
      residualLikelihood: '2',
      residualImpact: '2',
    }
    const worse = await saveDpia(world.ctx, client.id, started.id, {
      risks: [{ ...risk, residualImpact: '5', residualLikelihood: '4' }],
    }).catch((error: unknown) => error)
    expect(worse).toBeInstanceOf(ValidationError)
    const incomplete = await saveDpia(
      world.ctx,
      client.id,
      started.id,
      { purpose: draft.purpose ?? '', risks: [risk] },
      { complete: true },
    ).catch((error: unknown) => error)
    expect(Object.keys((incomplete as ValidationError).fieldErrors).sort()).toEqual([
      'outcome',
      'rightsAffected',
    ])
    await saveDpia(
      world.ctx,
      client.id,
      started.id,
      {
        description: draft.description ?? '',
        purpose: draft.purpose ?? '',
        rightsAffected: 'Applicants’ rights to notice, correction and erasure of their reports.',
        necessity: 'Only the fitness outcome is needed by HR; the report itself is not.',
        outcome: 'proceed_with_measures',
        risks: [risk],
      },
      { complete: true },
    )
    const bands = await listBands(world.ctx.db)
    const done = await getDpia(world.ctx, client.id, started.code)
    const today = isoDate(new Date())
    expect([done.status, done.completedOn, done.nextReviewOn, done.reviewDue]).toEqual([
      'completed',
      today,
      addCalendarDays(today, DPIA_REVIEW_DAYS),
      false,
    ])
    expect(
      done.risks.map((row) => [row.score, row.band.name, row.residualScore, row.residualBand.name]),
    ).toEqual([[16, ratingFor(16, bands).name, 4, ratingFor(4, bands).name]])
    const dpo = principalWith({ role: 'client_dpo', clientId: client.id })
    await expect(startDpia(as(world, dpo), client.id, 2)).rejects.toBeInstanceOf(AccessDeniedError)
    expect((await getDpia(as(world, dpo), client.id, started.code)).canEdit).toBe(false)
  })

  it('TC-C23.4-02 activities with the most sensitive data, children’s data or transfers abroad are suggested for a DPIA, and a review date is reported when due', async () => {
    expect(
      dpiaReasons({ principals: ['Employee'], transfersAbroad: 'no', highestLevel: 'L3' }),
    ).toEqual([])
    expect(
      dpiaReasons({
        principals: ['Minor patient', 'Person with disability'],
        transfersAbroad: 'yes',
        highestLevel: 'L4',
      }),
    ).toHaveLength(4)

    const { client } = await withRopa('Suggest', ropa)
    const list = await listDpias(world.ctx, client.id)
    expect(list.activities.map((row) => [row.refLabel, row.reasons.length, row.dpia])).toEqual([
      ['PA-001', 1, null],
      ['PA-002', 2, null],
      ['PA-003', 0, null],
    ])
    expect(list.activities[0]?.reasons[0]).toMatch(/L4/)
    expect(list.activities[1]?.reasons.join(' ')).toMatch(/children.*outside India/)

    const started = await startDpia(world.ctx, client.id, 2)
    await saveDpia(
      world.ctx,
      client.id,
      started.id,
      {
        purpose: 'Homework and attendance for students.',
        rightsAffected: 'Children’s data needs verifiable parental consent (s.9).',
        outcome: 'proceed',
        risks: [
          {
            risk: 'Tracking of a child’s activity.',
            likelihood: '2',
            impact: '5',
            residualLikelihood: '1',
            residualImpact: '5',
          },
        ],
      },
      { complete: true },
    )
    expect((await attention(client.id)).dpia_reviews_due).toBeUndefined()
    const today = isoDate(new Date())
    await withTenants(world.owner.db, 'all', (tx) =>
      tx.update(dpia).set({ nextReviewOn: today }).where(eq(dpia.id, started.id)),
    )
    const due = (await listDpias(world.ctx, client.id)).activities[1]?.dpia
    expect([due?.status, due?.reviewDue]).toEqual(['completed', true])
    expect((await attention(client.id)).dpia_reviews_due).toMatchObject({
      count: 1,
      earliestDue: today,
    })
  })
})
