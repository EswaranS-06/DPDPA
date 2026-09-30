import { z } from 'zod'

/** Input that failed validation; fieldErrors maps each form field to its message. */
export class ValidationError extends Error {
  readonly fieldErrors: Record<string, string>

  constructor(
    fieldErrors: Record<string, string>,
    message = 'Please correct the highlighted fields.',
  ) {
    super(message)
    this.name = 'ValidationError'
    this.fieldErrors = fieldErrors
  }
}

/** The record does not exist, or the user may not know that it exists. */
export class NotFoundError extends Error {
  constructor(what: string) {
    super(`${what} was not found.`)
    this.name = 'NotFoundError'
  }
}

/** A rule of the workflow blocks the action (for example removing the last administrator). */
export class RuleError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RuleError'
  }
}

/** Parses input with a schema, turning problems into one message per field. */
export const parseInput = <Schema extends z.ZodType>(
  schema: Schema,
  input: unknown,
): z.infer<Schema> => {
  const result = schema.safeParse(input)
  if (result.success) return result.data
  const fieldErrors: Record<string, string> = {}
  for (const issue of result.error.issues) {
    const field = issue.path.map(String).join('.') || 'form'
    fieldErrors[field] ??= issue.message
  }
  throw new ValidationError(fieldErrors)
}

/** Postgres unique violation (23505), possibly wrapped by the query builder. */
export const isUniqueViolation = (error: unknown): boolean => {
  const codeOf = (value: unknown) =>
    typeof value === 'object' && value !== null && 'code' in value
      ? (value as { code?: unknown }).code
      : undefined
  const cause =
    typeof error === 'object' && error !== null && 'cause' in error
      ? (error as { cause?: unknown }).cause
      : undefined
  return codeOf(error) === '23505' || codeOf(cause) === '23505'
}

// Form fields arrive as strings; empty means "not given".
const blankToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value

export const requiredText = (label: string, max = 200) =>
  z
    .string({ error: `${label} is required.` })
    .trim()
    .min(1, `${label} is required.`)
    .max(max, `${label} is too long.`)

export const optionalText = (max = 500) =>
  z.preprocess(blankToUndefined, z.string().trim().max(max, 'Too long.').optional())

export const optionalEmail = () =>
  z.preprocess(blankToUndefined, z.email('Enter a valid email address.').max(200).optional())

export const requiredEmail = (label: string) =>
  z.preprocess(
    blankToUndefined,
    z
      .email({ error: `Enter a valid email address for ${label.toLowerCase()}.` })
      .max(200)
      .transform((value) => value.toLowerCase()),
  )

export const optionalCount = () =>
  z.preprocess(
    blankToUndefined,
    z.coerce
      .number({ error: 'Enter a whole number.' })
      .int('Enter a whole number.')
      .min(0, 'Cannot be negative.')
      .max(2_000_000_000, 'Too large.')
      .optional(),
  )

export const optionalDate = () =>
  z.preprocess(
    blankToUndefined,
    z.iso.date({ error: 'Use the date picker (YYYY-MM-DD).' }).optional(),
  )

export const optionalUrl = () =>
  z.preprocess((value) => {
    const text = blankToUndefined(value)
    return typeof text === 'string' && !/^https?:\/\//i.test(text.trim())
      ? `https://${text.trim()}`
      : text
  }, z.url('Enter a web address such as www.example.in.').max(300).optional())
