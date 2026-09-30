import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { AccessDeniedError, type Principal, type Role } from '@duatf/core-access'
import { parseEnv, storageEnvSchema, testDatabaseEnvSchema } from '@duatf/core-config'
import {
  createDatabase,
  eq,
  evidence,
  inArray,
  tenant,
  withTenants,
  type DatabaseHandle,
} from '@duatf/platform-db'
import { createObjectStore } from '@duatf/platform-storage'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createAssessment, listItems } from './assessments'
import { createClient } from './clients'
import type { ServiceContext } from './context'
import { ValidationError, RuleError } from './errors'
import {
  checkEvidenceFile,
  evidenceDownloadUrl,
  listEvidence,
  listItemEvidence,
  reviewEvidence,
  uploadEvidence,
} from './evidence'
import { objectEvidenceStorage } from './provisioner'

const env = parseEnv(testDatabaseEnvSchema)
const storageEnv = parseEnv(storageEnvSchema)
const store = createObjectStore(storageEnv, storageEnv.S3_BUCKET_EVIDENCE)
const storage = objectEvidenceStorage(store)

let app: DatabaseHandle
let owner: DatabaseHandle
const codes: string[] = []
const keys: string[] = []
const provisioner = {
  provision: () => Promise.resolve('none'),
  setEnabled: () => Promise.resolve(),
}

const principal = (role: Role, clientId: string | null = null): Principal => ({
  userId: randomUUID(),
  email: `${role}@example.test`,
  displayName: role,
  assignments: [{ role, clientId, departmentId: null }],
})
const as = (who: Principal): ServiceContext => ({
  db: app.db,
  principal: who,
  provisioner,
  storage,
})
const lead = principal('lead_auditor')
const auditorA = principal('auditor')
const auditorB = principal('auditor')

const pdf = (text: string) => Buffer.from(`%PDF-1.4\n% ${text}\n%%EOF\n`)

const setup = async () => {
  const tag = randomBytes(3).toString('hex').toUpperCase()
  const client = await createClient(as(lead), {
    name: `V${tag} Evidence`,
    legalName: `V${tag} Evidence Pvt Ltd`,
    industry: 'Retail',
    organisationType: 'private_limited',
    primaryContactName: 'Kiran',
    primaryContactEmail: 'kiran@example.test',
  })
  codes.push(client.code)
  const cycle = await createAssessment(as(lead), client.id, { title: 'Evidence cycle' })
  const items = await listItems(as(lead), client.id, cycle.id)
  return { client, items }
}

beforeAll(() => {
  app = createDatabase(env.TEST_APP_DATABASE_URL, { max: 4 })
  owner = createDatabase(env.TEST_DATABASE_URL, { max: 2 })
})
afterAll(async () => {
  for (const key of keys) await store.remove(key).catch(() => undefined)
  if (codes.length) {
    await withTenants(owner.db, 'all', (tx) => tx.delete(tenant).where(inArray(tenant.code, codes)))
  }
  await Promise.all([app.close(), owner.close()])
})

const storedKey = async (id: string) => {
  const [row] = await withTenants(owner.db, 'all', (tx) =>
    tx
      .select({ key: evidence.storageKey, sha256: evidence.sha256 })
      .from(evidence)
      .where(eq(evidence.id, id)),
  )
  keys.push(row?.key ?? '')
  return row
}

describe('evidence files', () => {
  it('TC-C7.1-01 stores the SHA-256 and gives short-lived download links only to authorised users', async () => {
    const { client, items } = await setup()
    const content = pdf(`policy ${randomUUID()}`)
    const uploaded = await uploadEvidence(
      as(auditorA),
      client.id,
      { title: 'Privacy policy v3', itemIds: items[0]?.id },
      { name: 'privacy-policy.pdf', bytes: content },
    )
    const expected = createHash('sha256').update(content).digest('hex')
    expect(uploaded.sha256).toBe(expected)
    expect((await storedKey(uploaded.id))?.sha256).toBe(expected)

    const url = await evidenceDownloadUrl(as(auditorB), client.id, uploaded.id)
    expect(new URL(url).searchParams.get('X-Amz-Expires')).toBe('300')
    const downloaded = Buffer.from(await (await fetch(url)).arrayBuffer())
    expect(createHash('sha256').update(downloaded).digest('hex')).toBe(expected)

    const outsider = as(principal('auditor', randomUUID()))
    await expect(evidenceDownloadUrl(outsider, client.id, uploaded.id)).rejects.toBeInstanceOf(
      AccessDeniedError,
    )
    const viewer = as(principal('client_viewer', client.id))
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
      as(auditorA),
      client.id,
      { title: 'Board-approved DPDP charter', itemIds: chosen.join(',') },
      { name: 'charter.pdf', bytes: pdf('charter') },
    )
    await storedKey(uploaded.id)
    for (const itemId of chosen) {
      const linked = await listItemEvidence(as(lead), client.id, itemId)
      expect(linked.map((row) => row.code)).toEqual([uploaded.code])
      expect(linked[0]?.linkCount).toBe(3)
    }
    expect(await listItemEvidence(as(lead), client.id, items[3]?.id ?? '')).toEqual([])
  })
})

describe('evidence review', () => {
  it('TC-C7.3-01 needs a reviewer other than the uploader', async () => {
    const { client, items } = await setup()
    const uploaded = await uploadEvidence(
      as(auditorA),
      client.id,
      { title: 'Breach register', itemIds: items[0]?.id },
      {
        name: 'register.xlsx',
        bytes: Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), randomBytes(64)]),
      },
    )
    await storedKey(uploaded.id)
    await expect(
      reviewEvidence(as(auditorA), client.id, uploaded.id, { decision: 'accepted' }),
    ).rejects.toBeInstanceOf(RuleError)
    const noNote = await reviewEvidence(as(auditorB), client.id, uploaded.id, {
      decision: 'rejected',
    }).catch((error: unknown) => error)
    expect(Object.keys((noNote as ValidationError).fieldErrors)).toEqual(['note'])
    await reviewEvidence(as(auditorB), client.id, uploaded.id, { decision: 'accepted' })
    const [row] = await listItemEvidence(as(lead), client.id, items[0]?.id ?? '')
    expect(row?.status).toBe('accepted')
  })
})

describe('evidence repository', () => {
  it('TC-C7.4-01 filters by status and flags evidence past its valid-until date', async () => {
    const { client } = await setup()
    const old = await uploadEvidence(
      as(auditorA),
      client.id,
      { title: 'VAPT report 2024', validUntil: '2025-03-31' },
      { name: 'vapt.pdf', bytes: pdf('vapt') },
    )
    const current = await uploadEvidence(
      as(auditorA),
      client.id,
      { title: 'VAPT report 2026', validUntil: '2099-03-31' },
      { name: 'vapt-2026.pdf', bytes: pdf('vapt 2026') },
    )
    await storedKey(old.id)
    await storedKey(current.id)
    await reviewEvidence(as(auditorB), client.id, current.id, { decision: 'accepted' })

    const all = await listEvidence(as(lead), client.id)
    expect(all.map((row) => [row.code, row.expired])).toEqual([
      [current.code, false],
      [old.code, true],
    ])
    const accepted = await listEvidence(as(lead), client.id, { status: 'accepted' })
    expect(accepted.map((row) => row.code)).toEqual([current.code])
    const found = await listEvidence(as(lead), client.id, { text: '2024' })
    expect(found.map((row) => row.code)).toEqual([old.code])
  })
})
