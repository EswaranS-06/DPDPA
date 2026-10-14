import { sequenceScope, type CodePrefix } from '@duatf/core-utils'
import { eq, nextCode, tenant, type Transaction } from '@duatf/platform-db'
import { NotFoundError } from './errors'

/** The next code of a client's register, such as TP-MALLARD-004 or BRE-MALLARD-001. */
export const nextRegisterCode = async (
  tx: Transaction,
  clientId: string,
  prefix: CodePrefix,
): Promise<string> => {
  const [client] = await tx
    .select({ code: tenant.code })
    .from(tenant)
    .where(eq(tenant.id, clientId))
  if (!client) throw new NotFoundError('Client')
  return nextCode(tx, clientId, sequenceScope(prefix, client.code))
}

/** Form values that mean "ticked". */
export const ticked = (value: unknown): boolean =>
  value === true || value === 'true' || value === 'yes' || value === 'on'

export const blankToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value

/** A list sent as repeated fields, as one field, or as text with one entry per line or ";". */
export const toList = (value: unknown): string[] => {
  const parts: unknown[] = Array.isArray(value) ? value : value === undefined ? [] : [value]
  return [
    ...new Set(
      parts
        .flatMap((part) => (typeof part === 'string' ? part.split(/[\n;]/) : []))
        .map((part) => part.trim())
        .filter(Boolean),
    ),
  ]
}
