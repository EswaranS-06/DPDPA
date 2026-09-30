import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { createDatabase } from './client'

// Owner-level operations: role setup, migrations, test schema resets. Never used at runtime.

// A plain path join (not new URL(...)) so web bundlers do not try to bundle the SQL folder.
export const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'migrations')
const ROLE_NAME = /^[a-z_][a-z0-9_]*$/

const connectionParts = (url: string) => {
  const parsed = new URL(url)
  return {
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ''),
  }
}

/** Creates or updates the non-owner login role the application connects as. */
export const ensureAppRole = async (ownerUrl: string, appUrl: string): Promise<string> => {
  const { user, password } = connectionParts(appUrl)
  if (!ROLE_NAME.test(user)) throw new Error(`Refusing unsafe role name "${user}"`)
  if (password.length < 16) throw new Error('App database password must be at least 16 characters')
  const sql = postgres(ownerUrl, { max: 1, onnotice: () => undefined })
  try {
    await sql`select set_config('duatf.app_password', ${password}, false)`
    await sql.unsafe(`
      do $$ begin
        if not exists (select 1 from pg_roles where rolname = '${user}') then
          execute format('create role %I login nosuperuser nobypassrls nocreatedb nocreaterole password %L',
            '${user}', current_setting('duatf.app_password'));
        else
          execute format('alter role %I with login nosuperuser nobypassrls password %L',
            '${user}', current_setting('duatf.app_password'));
        end if;
      end $$`)
    return user
  } finally {
    await sql.end({ timeout: 5 })
  }
}

export const runMigrations = async (ownerUrl: string): Promise<void> => {
  const { db, close } = createDatabase(ownerUrl, { max: 1 })
  try {
    await migrate(db, { migrationsFolder: MIGRATIONS_DIR })
  } finally {
    await close()
  }
}

/** Drops and recreates the public schema. Only allowed on test and scratch databases. */
export const recreateSchema = async (ownerUrl: string, appRole: string): Promise<void> => {
  const { database } = connectionParts(ownerUrl)
  if (!/(_test|^duatf_scratch_[a-z0-9]+)$/.test(database)) {
    throw new Error(`Refusing to reset database "${database}" (only *_test or duatf_scratch_*)`)
  }
  if (!ROLE_NAME.test(appRole)) throw new Error(`Refusing unsafe role name "${appRole}"`)
  const sql = postgres(ownerUrl, { max: 1, onnotice: () => undefined })
  try {
    await sql.unsafe('drop schema if exists drizzle cascade')
    await sql.unsafe('drop schema if exists public cascade')
    await sql.unsafe('create schema public')
    await sql.unsafe(`grant usage on schema public to ${appRole}`)
  } finally {
    await sql.end({ timeout: 5 })
  }
}

export const withDatabaseName = (url: string, database: string): string => {
  const parsed = new URL(url)
  parsed.pathname = `/${database}`
  return parsed.toString()
}
