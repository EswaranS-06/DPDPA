import { AccessDeniedError } from '@duatf/core-access'
import {
  createSession,
  findSessionUser,
  LoginError,
  signInWithPassword,
} from '@duatf/platform-identity'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createAction } from './actions'
import { answerItem, getItem, listItems } from './assessments'
import {
  assignItem,
  listClientControls,
  listEvidenceRequests,
  myWork,
  requestEvidence,
  setControlOwner,
} from './assignments'
import type { ValidationError } from './errors'
import { reviewEvidence, uploadEvidence } from './evidence'
import { listFindings } from './findings'
import {
  assignablePeople,
  createClientPerson,
  issueClientLogin,
  listClientPeople,
  revokeClientLogin,
} from './people'
import {
  as,
  closeWorld,
  newClient,
  newDepartment,
  newPerson,
  openWorld,
  pdf,
  type World,
} from './testing'

let world: World
beforeAll(() => {
  world = openWorld()
})
afterAll(() => closeWorld(world))

describe('people at a client', () => {
  it('TC-C19.7-01 a person is added without a login, can be given work, and signs in only once a login is issued', async () => {
    const client = await newClient(world, 'People')
    const tech = await newDepartment(world, client.id, 'IT', ['A8.2'])
    const created = await createClientPerson(world.ctx, client.id, {
      displayName: 'IT Head',
      jobTitle: 'Head of IT',
      role: 'department_owner',
      departmentId: tech.id,
    })
    world.userIds.push(created.userId)
    expect(created.login).toBeNull()
    expect((await assignablePeople(world.ctx, client.id)).map((row) => row.value)).toContain(
      created.userId,
    )
    await assignItem(world.ctx, client.id, tech.item('A8.2').id, {
      assigneeUserId: created.userId,
    })
    await expect(
      signInWithPassword(world.app.db, { username: 'it-head', password: 'anything at all' }),
    ).rejects.toBeInstanceOf(LoginError)

    // Only the administrator and the senior auditor manage people.
    const auditor = await newPerson(world, 'auditor')
    await expect(
      issueClientLogin(as(world, auditor), client.id, created.userId, { username: 'x-it-head' }),
    ).rejects.toBeInstanceOf(AccessDeniedError)

    const username = `it-head-${created.userId.slice(0, 6)}`
    const login = await issueClientLogin(world.ctx, client.id, created.userId, { username })
    expect(login.username).toBe(username)
    expect(login.oneTimePassword).toMatch(/^[A-Za-z0-9]{20}$/)
    const signedIn = await signInWithPassword(world.app.db, {
      username: username.toUpperCase(),
      password: login.oneTimePassword,
    })
    expect([signedIn.userId, signedIn.mustChangePassword]).toEqual([created.userId, true])
    const session = await createSession(world.app.db, { userId: created.userId, ttlHours: 1 })
    expect((await findSessionUser(world.app.db, session.token))?.username).toBe(username)

    const people = await listClientPeople(world.ctx, client.id)
    expect(people.find((row) => row.userId === created.userId)).toMatchObject({
      displayName: 'IT Head',
      loginEnabled: true,
      roles: [{ role: 'department_owner', departmentName: 'IT department' }],
    })

    await revokeClientLogin(world.ctx, client.id, created.userId)
    expect(await findSessionUser(world.app.db, session.token)).toBeNull()
    await expect(
      signInWithPassword(world.app.db, { username, password: login.oneTimePassword }),
    ).rejects.toBeInstanceOf(LoginError)
  })
})

describe('assignments and evidence requests', () => {
  it('TC-C19.8-01 the person given a question sees it and uploads for it, and evidence requests go from requested to accepted', async () => {
    const client = await newClient(world, 'Requests')
    const hr = await newDepartment(world, client.id, 'HR', ['A1.1', 'A1.3'])
    const itDept = await newDepartment(world, client.id, 'IT', ['A8.2'])
    const itHead = await newPerson(world, 'department_owner', {
      clientId: client.id,
      departmentId: itDept.id,
    })
    // IT Head is given one HR question (not their department).
    await assignItem(world.ctx, client.id, hr.item('A1.1').id, { assigneeUserId: itHead.userId })
    const requested = await requestEvidence(world.ctx, client.id, hr.item('A1.1').id, {
      titles: ['Website contact page', 'Board resolution naming the DPO'],
      assigneeUserId: itHead.userId,
      dueDate: '2026-12-31',
    })
    expect(requested).toBe(2)
    const [first, second] = await listEvidenceRequests(world.ctx, client.id, {
      itemId: hr.item('A1.1').id,
    })
    expect([first?.status, second?.status, first?.assigneeUserId]).toEqual([
      'requested',
      'requested',
      itHead.userId,
    ])

    // The assignee uploads against the request; the audit team reviews the file.
    const ctx = as(world, itHead)
    const file = await uploadEvidence(
      ctx,
      client.id,
      { title: 'Contact page', itemIds: hr.item('A1.1').id, requestIds: first?.id },
      { name: 'contact.pdf', bytes: pdf('contact') },
    )
    const statusOf = async (id: string | undefined) =>
      (await listEvidenceRequests(world.ctx, client.id)).find((row) => row.id === id)?.status
    expect(await statusOf(first?.id)).toBe('received')
    await reviewEvidence(world.ctx, client.id, file.id, {
      decision: 'rejected',
      note: 'The page does not name the contact person.',
    })
    expect(await statusOf(first?.id)).toBe('requested')
    const again = await uploadEvidence(
      ctx,
      client.id,
      { title: 'Contact page v2', itemIds: hr.item('A1.1').id, requestIds: first?.id },
      { name: 'contact-2.pdf', bytes: pdf('contact 2') },
    )
    await reviewEvidence(world.ctx, client.id, again.id, { decision: 'accepted' })
    expect(await statusOf(first?.id)).toBe('accepted')

    // Not for a question of another department that is not given to them, and never answering.
    await expect(
      uploadEvidence(
        ctx,
        client.id,
        { title: 'Wrong place', itemIds: hr.item('A1.3').id },
        { name: 'x.pdf', bytes: pdf('x') },
      ),
    ).rejects.toBeInstanceOf(AccessDeniedError)
    await expect(
      answerItem(ctx, client.id, hr.item('A1.1').id, { answer: 'yes' }),
    ).rejects.toBeInstanceOf(AccessDeniedError)

    // What they see when they sign in.
    const work = await myWork(ctx, client.id)
    expect(work.items.map((row) => row.questionCode)).toEqual(['A1.1'])
    expect(work.requests.map((row) => row.title)).toEqual(['Board resolution naming the DPO'])
  })

  it('TC-C19.8-02 controls get owners, and actions and controls show under the owner’s work', async () => {
    const client = await newClient(world, 'Controls')
    const hr = await newDepartment(world, client.id, 'HR', ['A1.1', 'A8.2'])
    const head = await newPerson(world, 'department_owner', {
      clientId: client.id,
      departmentId: hr.id,
    })
    const controls = await listClientControls(world.ctx, client.id)
    expect(controls.map((row) => row.code)).toEqual(['CTL-GOV-03', 'CTL-SEC-04', 'CTL-SEC-05'])
    await setControlOwner(world.ctx, client.id, { controlCode: 'CTL-SEC-04', userId: head.userId })
    await answerItem(world.ctx, client.id, hr.item('A8.2').id, { answer: '1' })
    const [gap] = await listFindings(world.ctx, client.id)
    await createAction(world.ctx, client.id, gap?.id ?? '', {
      title: 'Enforce MFA',
      ownerUserId: head.userId,
    })
    const after = await listClientControls(world.ctx, client.id)
    expect(after.find((row) => row.code === 'CTL-SEC-04')).toMatchObject({
      ownerUserId: head.userId,
      questions: 1,
      answered: 1,
      gaps: 1,
    })
    const work = await myWork(as(world, head), client.id)
    expect([work.controls.map((row) => row.code), work.actions.map((row) => row.title)]).toEqual([
      ['CTL-SEC-04'],
      ['Enforce MFA'],
    ])
    await setControlOwner(world.ctx, client.id, { controlCode: 'CTL-SEC-04' })
    expect((await myWork(as(world, head), client.id)).controls).toEqual([])
  })
})

describe('self-reconciliation of Not applicable', () => {
  it('TC-C19.6-01 a gate answer marks the questions it rules out Not applicable, across departments, and undoes it when it changes', async () => {
    const client = await newClient(world, 'Gates')
    const mgmt = await newDepartment(world, client.id, 'MGT', ['A1.4', 'A2.5'])
    const legal = await newDepartment(world, client.id, 'LEG', ['A12.1', 'A12.2', 'A4.1', 'A4.4'])
    const state = async () =>
      Object.fromEntries(
        (
          await listItems(world.ctx, client.id, legal.cycle?.id ?? '', { department: legal.id })
        ).map((row) => [
          row.questionCode,
          `${row.answer}${row.autoNaFrom ? `<${row.autoNaFrom}` : ''}`,
        ]),
      )

    // Not an SDF: the SDF questions become Not applicable with the reason.
    await answerItem(world.ctx, client.id, mgmt.item('A1.4').id, { answer: 'No' })
    expect(await state()).toMatchObject({
      'A12.1': 'not_applicable<A1.4',
      'A12.2': 'not_applicable<A1.4',
      'A4.1': 'not_assessed',
    })
    const sdf = await getItem(world.ctx, client.id, legal.cycle?.code ?? '', 'LEG', 'A12.1')
    expect(sdf.item.naReason).toBe(
      'The organisation is not a Significant Data Fiduciary (A1.4). Marked automatically.',
    )
    // They cannot be answered while A1.4 rules them out.
    const refused = (await answerItem(world.ctx, client.id, legal.item('A12.2').id, {
      answer: 'yes',
    }).catch((error: unknown) => error)) as ValidationError
    expect(refused.fieldErrors.answer).toMatch(/does not apply/)

    // Children's data only: the children questions apply and cannot be Not applicable; the
    // guardian question is ruled out.
    await answerItem(world.ctx, client.id, mgmt.item('A2.5').id, { answer: "Children's data" })
    expect(await state()).toMatchObject({ 'A4.4': 'not_applicable<A2.5', 'A4.1': 'not_assessed' })
    const notPossible = (await answerItem(world.ctx, client.id, legal.item('A4.1').id, {
      answer: 'not_applicable',
      naReason: 'We do not think this applies to us.',
    }).catch((error: unknown) => error)) as ValidationError
    expect(notPossible.fieldErrors.answer).toMatch(/applies and cannot be Not applicable/)

    // The organisation turns out to be an SDF: the SDF questions need answers again.
    await answerItem(world.ctx, client.id, mgmt.item('A1.4').id, { answer: 'Yes - SDF' })
    expect(await state()).toMatchObject({ 'A12.1': 'not_assessed', 'A12.2': 'not_assessed' })

    // A department given an SDF question later picks up the current gate at once.
    await answerItem(world.ctx, client.id, mgmt.item('A1.4').id, { answer: 'No' })
    const ops = await newDepartment(world, client.id, 'OPS', ['A12.3'])
    const added = await listItems(world.ctx, client.id, ops.cycle?.id ?? '', { department: ops.id })
    expect(added.map((row) => [row.questionCode, row.answer])).toEqual([
      ['A12.3', 'not_applicable'],
    ])
  })
})
