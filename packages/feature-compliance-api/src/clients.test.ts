import { randomBytes, randomUUID } from 'node:crypto'
import type { Principal, Role } from '@duatf/core-access'
import { parseEnv, testDatabaseEnvSchema } from '@duatf/core-config'
import {
  createDatabase,
  inArray,
  tenant,
  withTenants,
  type DatabaseHandle,
} from '@duatf/platform-db'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createClient, getClient, listClients, suggestClientCode } from './clients'
import type { ServiceContext } from './context'
import { createDepartment, listDepartments } from './departments'
import { NotFoundError, ValidationError } from './errors'

const env = parseEnv(testDatabaseEnvSchema)
const tag = () => randomBytes(3).toString('hex').toUpperCase()

let app: DatabaseHandle
let owner: DatabaseHandle
const createdCodes: string[] = []

const principal = (role: Role, clientId: string | null = null): Principal => ({
  userId: randomUUID(),
  email: `${role}@example.test`,
  displayName: role,
  assignments: [{ role, clientId, departmentId: null }],
})
const contextFor = (who: Principal): ServiceContext => ({ db: app.db, principal: who })
const firmAdmin = principal('firm_admin')

const validClient = (name: string) => ({
  name,
  legalName: `${name} Private Limited`,
  industry: 'Healthcare',
  organisationType: 'private_limited',
  primaryContactName: 'Asha Rao',
  primaryContactEmail: 'Asha.Rao@Example.test',
  country: '',
  employeeCount: '250',
  assessmentPeriodStart: '2026-10-01',
  assessmentPeriodEnd: '2027-03-31',
})

const onboard = async (name: string) => {
  const created = await createClient(contextFor(firmAdmin), validClient(name))
  createdCodes.push(created.code)
  return created
}

beforeAll(() => {
  app = createDatabase(env.TEST_APP_DATABASE_URL, { max: 4 })
  owner = createDatabase(env.TEST_DATABASE_URL, { max: 2 })
})
afterAll(async () => {
  if (createdCodes.length) {
    await withTenants(owner.db, 'all', (tx) =>
      tx.delete(tenant).where(inArray(tenant.code, createdCodes)),
    )
  }
  await Promise.all([app.close(), owner.close()])
})

describe('client onboarding', () => {
  it('TC-C5.1-01 names each missing or invalid field and gives every client a unique ID', async () => {
    const ctx = contextFor(firmAdmin)
    const missing = await createClient(ctx, {}).catch((error: unknown) => error)
    expect(missing).toBeInstanceOf(ValidationError)
    expect(Object.keys((missing as ValidationError).fieldErrors).sort()).toEqual([
      'industry',
      'legalName',
      'name',
      'organisationType',
      'primaryContactEmail',
      'primaryContactName',
    ])

    const fieldsOf = async (input: object) =>
      Object.keys(
        ((await createClient(ctx, input).catch((error: unknown) => error)) as ValidationError)
          .fieldErrors,
      )
    expect(
      await fieldsOf({ ...validClient('Bad Email'), primaryContactEmail: 'not-an-email' }),
    ).toEqual(['primaryContactEmail'])
    expect(
      await fieldsOf({ ...validClient('Bad Dates'), assessmentPeriodEnd: '2026-01-01' }),
    ).toEqual(['assessmentPeriodEnd'])

    const name = `Q${tag()} Analytics`
    const first = await onboard(name)
    const second = await onboard(name)
    const base = suggestClientCode(name)
    expect([first.code, second.code]).toEqual([base, `${base}2`])

    const duplicate = await createClient(ctx, { ...validClient('Other'), code: first.code }).catch(
      (error: unknown) => error,
    )
    expect((duplicate as ValidationError).fieldErrors).toEqual({
      code: `Client ID ${first.code} is already used.`,
    })

    const detail = await getClient(ctx, first.code)
    expect(detail).toMatchObject({
      name,
      country: 'India',
      employeeCount: 250,
      primaryContactEmail: 'asha.rao@example.test',
      status: 'onboarding',
      applicability: 'under_review',
    })
  })
})

describe('departments', () => {
  it('TC-C5.2-01 refuses a duplicate department code within a client but not across clients', async () => {
    const ctx = contextFor(firmAdmin)
    const clientA = await onboard(`D${tag()} Retail`)
    const clientB = await onboard(`E${tag()} Retail`)
    await createDepartment(ctx, clientA.id, { code: 'hr', name: 'Human Resources' })
    const again = await createDepartment(ctx, clientA.id, { code: 'HR', name: 'People' }).catch(
      (error: unknown) => error,
    )
    expect(again).toBeInstanceOf(ValidationError)
    expect(Object.keys((again as ValidationError).fieldErrors)).toEqual(['code'])
    await expect(
      createDepartment(ctx, clientB.id, { code: 'HR', name: 'Human Resources' }),
    ).resolves.toHaveProperty('id')

    const departments = await listDepartments(ctx, clientA.id)
    expect(departments.map((row) => row.fullCode)).toEqual([`DEP-${clientA.code}-HR`])
  })
})

describe('who sees which clients', () => {
  it('TC-C5.4-01 shows a firm admin every client and an auditor only assigned clients', async () => {
    const clientA = await onboard(`G${tag()} Energy`)
    const clientB = await onboard(`H${tag()} Energy`)
    const ours = (codes: string[]) =>
      codes.filter((code) => [clientA.code, clientB.code].includes(code)).sort()
    const codesFor = async (who: Principal) =>
      ours((await listClients(contextFor(who))).map((row) => row.code))

    expect(await codesFor(firmAdmin)).toEqual([clientA.code, clientB.code].sort())
    expect(await codesFor(principal('auditor', clientA.id))).toEqual([clientA.code])
    expect(await codesFor(principal('client_dpo', clientB.id))).toEqual([clientB.code])
    await expect(
      getClient(contextFor(principal('auditor', clientA.id)), clientB.code),
    ).rejects.toBeInstanceOf(NotFoundError)
  })
})
