import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { AccessDeniedError } from '@duatf/core-access'
import { eq, evidence, withTenants } from '@duatf/platform-db'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { ValidationError } from './errors'
import {
  checkEvidenceFile,
  evidenceDownloadUrl,
  listEvidence,
  listItemEvidence,
  reviewEvidence,
  uploadEvidence,
} from './evidence'
import {
  as,
  closeWorld,
  newClient,
  newDepartment,
  newPerson,
  openWorld,
  pdf,
  principalWith,
  type World,
} from './testing'

let world: World
beforeAll(() => {
  world = openWorld()
})
afterAll(() => closeWorld(world))

const setup = async () => {
  const client = await newClient(world, 'Evidence')
  const hr = await newDepartment(world, client.id, 'HR', ['A1.1', 'A1.3', 'A2.1', 'A3.1'])
  return { client, hr, items: hr.items }
}

const storedKey = async (id: string) => {
  const [row] = await withTenants(world.owner.db, 'all', (tx) =>
    tx
      .select({ key: evidence.storageKey, sha256: evidence.sha256 })
      .from(evidence)
      .where(eq(evidence.id, id)),
  )
  world.keys.push(row?.key ?? '')
  return row
}

describe('evidence files', () => {
  it('TC-C7.1-01 stores the SHA-256 and gives short-lived download links only to authorised users', async () => {
    const { client, items } = await setup()
    const content = pdf(`policy ${randomUUID()}`)
    const uploaded = await uploadEvidence(
      world.ctx,
      client.id,
      { title: 'Privacy policy v3', itemIds: items[0]?.id },
      { name: 'privacy-policy.pdf', bytes: content },
    )
    const expected = createHash('sha256').update(content).digest('hex')
    expect(uploaded.sha256).toBe(expected)
    expect((await storedKey(uploaded.id))?.sha256).toBe(expected)

    const url = await evidenceDownloadUrl(world.ctx, client.id, uploaded.id)
    expect(new URL(url).searchParams.get('X-Amz-Expires')).toBe('300')
    const downloaded = Buffer.from(await (await fetch(url)).arrayBuffer())
    expect(createHash('sha256').update(downloaded).digest('hex')).toBe(expected)

    const outsider = as(world, principalWith({ role: 'client_dpo', clientId: randomUUID() }))
    await expect(evidenceDownloadUrl(outsider, client.id, uploaded.id)).rejects.toBeInstanceOf(
      AccessDeniedError,
    )
    const viewer = as(world, principalWith({ role: 'client_viewer', clientId: client.id }))
    await expect(
      uploadEvidence(viewer, client.id, { title: 'Nope' }, { name: 'a.pdf', bytes: pdf('x') }),
    ).rejects.toBeInstanceOf(AccessDeniedError)
  })

  it('refuses files that are not what they claim to be', () => {
    expect(() => checkEvidenceFile('tool.exe', Buffer.from('MZ'))).toThrow(ValidationError)
    expect(() => checkEvidenceFile('fake.pdf', Buffer.from('<html>'))).toThrow(ValidationError)
    expect(() => checkEvidenceFile('register.csv', Buffer.from([0x61, 0x00, 0x62]))).toThrow(
      ValidationError,
    )
    expect(checkEvidenceFile('../../etc/Consent log.csv', Buffer.from('a,b\n1,2\n'))).toEqual({
      fileName: '.._.._etc_Consent log.csv',
      contentType: 'text/csv',
    })
  })
})

describe('evidence links', () => {
  it('TC-C7.2-01 shows one piece of evidence on every question it is linked to', async () => {
    const { client, items } = await setup()
    const chosen = items.slice(0, 3).map((item) => item.id)
    const uploaded = await uploadEvidence(
      world.ctx,
      client.id,
      { title: 'Board-approved DPDP charter', itemIds: chosen.join(',') },
      { name: 'charter.pdf', bytes: pdf('charter') },
    )
    await storedKey(uploaded.id)
    for (const itemId of chosen) {
      const linked = await listItemEvidence(world.ctx, client.id, itemId)
      expect(linked.map((row) => row.code)).toEqual([uploaded.code])
      expect(linked[0]?.linkCount).toBe(3)
    }
    expect(await listItemEvidence(world.ctx, client.id, items[3]?.id ?? '')).toEqual([])
  })
})

describe('evidence review', () => {
  it('TC-C7.3-01 accepts the audit team’s files at once and holds files from the client for review', async () => {
    const { client, hr, items } = await setup()
    const own = await uploadEvidence(
      world.ctx,
      client.id,
      { title: 'Breach register', itemIds: items[0]?.id },
      {
        name: 'register.xlsx',
        bytes: Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), randomBytes(64)]),
      },
    )
    await storedKey(own.id)
    const head = await newPerson(world, 'department_owner', {
      clientId: client.id,
      departmentId: hr.id,
    })
    const theirs = await uploadEvidence(
      as(world, head),
      client.id,
      { title: 'Signed policy', itemIds: items[1]?.id },
      { name: 'policy.pdf', bytes: pdf('policy') },
    )
    await storedKey(theirs.id)
    const status = async (itemId: string | undefined) =>
      (await listItemEvidence(world.ctx, client.id, itemId ?? ''))[0]?.status
    expect([await status(items[0]?.id), await status(items[1]?.id)]).toEqual([
      'accepted',
      'pending_review',
    ])
    // People at the client do not review evidence.
    await expect(
      reviewEvidence(as(world, head), client.id, theirs.id, { decision: 'accepted' }),
    ).rejects.toBeInstanceOf(AccessDeniedError)
    const noNote = await reviewEvidence(world.ctx, client.id, theirs.id, {
      decision: 'rejected',
    }).catch((error: unknown) => error)
    expect(Object.keys((noNote as ValidationError).fieldErrors)).toEqual(['note'])
    await reviewEvidence(world.ctx, client.id, theirs.id, { decision: 'accepted' })
    expect(await status(items[1]?.id)).toBe('accepted')
  })
})

describe('evidence repository', () => {
  it('TC-C7.4-01 filters by status and flags evidence past its valid-until date', async () => {
    const { client } = await setup()
    const old = await uploadEvidence(
      world.ctx,
      client.id,
      { title: 'VAPT report 2024', validUntil: '2025-03-31' },
      { name: 'vapt.pdf', bytes: pdf('vapt') },
    )
    const current = await uploadEvidence(
      world.ctx,
      client.id,
      { title: 'VAPT report 2026', validUntil: '2099-03-31' },
      { name: 'vapt-2026.pdf', bytes: pdf('vapt 2026') },
    )
    await storedKey(old.id)
    await storedKey(current.id)
    await reviewEvidence(world.ctx, client.id, old.id, {
      decision: 'rejected',
      note: 'Expired; send the 2026 report.',
    })

    const all = await listEvidence(world.ctx, client.id)
    expect(all.map((row) => [row.code, row.expired])).toEqual([
      [current.code, false],
      [old.code, true],
    ])
    const accepted = await listEvidence(world.ctx, client.id, { status: 'accepted' })
    expect(accepted.map((row) => row.code)).toEqual([current.code])
    const found = await listEvidence(world.ctx, client.id, { text: '2024' })
    expect(found.map((row) => row.code)).toEqual([old.code])
  })
})
