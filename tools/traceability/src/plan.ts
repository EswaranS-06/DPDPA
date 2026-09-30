import { z } from 'zod'

/** TC-C<phase>[.<sub>]-<nn>, e.g. TC-C2.2-01, TC-C8.E2E-01, TC-C9-01. */
export const TEST_ID_PATTERN = /\bTC-C\d+(?:\.[A-Z0-9]+)?-\d+\b/g

const testId = z.string().regex(/^TC-C\d+(?:\.[A-Z0-9]+)?-\d+$/)

const planTestSchema = z.object({
  id: testId,
  title: z.string(),
  expected: z.coerce.string(),
  source: z.enum(['literal', 'golden', 'oracle', 'sme', 'manual']),
  kind: z.enum(['automated', 'manual']).default('automated'),
  mandatory: z.boolean().default(true),
  deferredTo: z.string().optional(),
})

const subphaseSchema = z.object({
  id: z.string(),
  title: z.string(),
  state: z.enum(['planned', 'active', 'done']),
  tests: z.array(planTestSchema).default([]),
})

const phaseSchema = z.object({
  id: z.string(),
  title: z.string(),
  release: z.enum(['R0', 'R1', 'R2', 'R3']),
  reviews: z.array(z.string()).default([]),
  subphases: z.array(subphaseSchema),
})

export const planSchema = z.object({
  version: z.literal(1),
  phases: z.array(phaseSchema),
})

export type Plan = z.infer<typeof planSchema>
export type PlanTest = z.infer<typeof planTestSchema>
