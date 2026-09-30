import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { type z } from 'zod'

export class EnvError extends Error {
  readonly variables: string[]

  constructor(issues: { variable: string; problem: string }[]) {
    super(
      'Invalid environment configuration:\n' +
        issues.map((issue) => `  ${issue.variable}: ${issue.problem}`).join('\n'),
    )
    this.name = 'EnvError'
    this.variables = issues.map((issue) => issue.variable)
  }
}

/** Validates environment variables against a schema; throws EnvError naming every bad variable. */
export const parseEnv = <Schema extends z.ZodType>(
  schema: Schema,
  source: Record<string, string | undefined> = process.env,
): z.infer<Schema> => {
  const result = schema.safeParse(source)
  if (result.success) return result.data
  throw new EnvError(
    result.error.issues.map((issue) => ({
      variable: issue.path.map(String).join('.') || '(root)',
      problem: issue.message,
    })),
  )
}

export const findRepoRoot = (start: string = process.cwd()): string => {
  let dir = start
  while (!existsSync(join(dir, 'pnpm-workspace.yaml'))) {
    const parent = dirname(dir)
    if (parent === dir) throw new Error(`No pnpm-workspace.yaml found above ${start}`)
    dir = parent
  }
  return dir
}

/** Loads <repo>/.env into process.env without overriding variables that are already set. */
export const loadRootEnvFile = (start?: string): void => {
  const file = join(findRepoRoot(start), '.env')
  if (existsSync(file)) process.loadEnvFile(file)
}
