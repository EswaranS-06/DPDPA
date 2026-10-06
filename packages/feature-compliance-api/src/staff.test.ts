import { AccessDeniedError, can, ROLES, type Principal, type Role } from '@duatf/core-access'
import { and, eq, isNull, roleAssignment } from '@duatf/platform-db'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { ValidationError } from './errors'
import { createStaff, setStaffRole } from './people'
import { as, closeWorld, newClient, openWorld, principalWith, type World } from './testing'

let world: World

const isRole = (value: string): value is Role => (ROLES as readonly string[]).includes(value)

beforeAll(() => {
  world = openWorld()
})
afterAll(async () => {
  await closeWorld(world)
})

describe('team roles', () => {
  it('TC-C20.9-01 an administrator makes an auditor a senior auditor, who can then add people at a client', async () => {
    const admin = principalWith({ role: 'firm_admin' })
    const client = await newClient(world, 'Roles')
    const tag = Math.random().toString(36).slice(2, 8)
    const created = await createStaff(as(world, admin), {
      displayName: 'Junior Auditor',
      role: 'auditor',
      username: `jr-${tag}`,
    })
    world.userIds.push(created.userId)
    const firmRoles = async () =>
      (
        await world.owner.db
          .select({ role: roleAssignment.role })
          .from(roleAssignment)
          .where(and(eq(roleAssignment.userId, created.userId), isNull(roleAssignment.tenantId)))
      ).map((row) => row.role)
    const principalOf = async (): Promise<Principal> => ({
      userId: created.userId,
      email: 'jr',
      displayName: 'Junior Auditor',
      assignments: (await firmRoles())
        .filter(isRole)
        .map((role) => ({ role, clientId: null, departmentId: null })),
    })

    expect(can(await principalOf(), 'user.invite', { clientId: client.id })).toBe(false)
    // Only an administrator changes roles, and only to a team role.
    await expect(
      setStaffRole(world.ctx, created.userId, { role: 'lead_auditor' }),
    ).rejects.toBeInstanceOf(AccessDeniedError)
    await expect(
      setStaffRole(as(world, admin), created.userId, { role: 'client_dpo' }),
    ).rejects.toBeInstanceOf(ValidationError)

    await setStaffRole(as(world, admin), created.userId, { role: 'lead_auditor' })
    expect(await firmRoles()).toEqual(['lead_auditor'])
    expect(can(await principalOf(), 'user.invite', { clientId: client.id })).toBe(true)
  })
})
