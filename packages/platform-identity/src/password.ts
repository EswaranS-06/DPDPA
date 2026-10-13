import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
  type ScryptOptions,
} from 'node:crypto'

// Passwords are stored as scrypt$N$r$p$salt$hash (salt and hash in base64url), so the cost can be
// raised later without breaking existing hashes.

const scrypt = (password: string, salt: Buffer, length: number, options: ScryptOptions) =>
  new Promise<Buffer>((resolve, reject) => {
    scryptCallback(password, salt, length, options, (error, key) =>
      error ? reject(error) : resolve(key),
    )
  })

const COST = { N: 2 ** 15, r: 8, p: 1 } as const
const KEY_LENGTH = 64
const MAX_MEMORY = 64 * 1024 * 1024

export const MIN_PASSWORD_LENGTH = 12

// The hash walks 32 MB of memory, so it is the first thing to go wrong on a machine with faulty
// memory or an unstable processor: the same password then gives a different key now and again.
// A wrong key stored at a password change would lock the person out, and a wrong key at sign-in
// refuses the right password. So a key is stored only once two runs agree, and a mismatch at
// sign-in is checked again, after a pause, before it counts. Wrong results come in short bursts,
// which is why the checks are spaced out.
const AGREE_ATTEMPTS = 8
const AGREE_PAUSE_MS = 150
/** Pauses before the second and third check of a mismatch, in milliseconds. */
const VERIFY_PAUSES = [200, 600] as const

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const sameKey = (a: Buffer, b: Buffer) => a.length === b.length && timingSafeEqual(a, b)

/**
 * Runs the derivation until two runs give the same key, and returns that key. After a
 * disagreement the next run waits a little longer each time, to let a burst of faults pass.
 */
export const agreedKey = async (
  derive: () => Promise<Buffer>,
  pauseMs: number = AGREE_PAUSE_MS,
): Promise<Buffer> => {
  const seen: Buffer[] = []
  for (let attempt = 0; attempt < AGREE_ATTEMPTS; attempt += 1) {
    if (attempt > 1) await pause(pauseMs * (attempt - 1))
    const next = await derive()
    if (seen.some((earlier) => sameKey(earlier, next))) return next
    seen.push(next)
  }
  throw new Error('Password hashing gave inconsistent results on this machine.')
}

/**
 * True when a derivation gives the expected key. A mismatch is derived again, twice at most, so
 * a miscomputed key does not refuse the right password; a wrong password always costs the same
 * three derivations and pauses.
 */
export const matchesKey = async (
  derive: () => Promise<Buffer>,
  expected: Buffer,
  pauses: readonly number[] = VERIFY_PAUSES,
): Promise<boolean> => {
  if (sameKey(await derive(), expected)) return true
  for (const ms of pauses) {
    await pause(ms)
    if (sameKey(await derive(), expected)) return true
  }
  return false
}

/** Hashes a password with a fresh random salt. */
export const hashPassword = async (password: string): Promise<string> => {
  const salt = randomBytes(16)
  const key = await agreedKey(() =>
    scrypt(password, salt, KEY_LENGTH, { ...COST, maxmem: MAX_MEMORY }),
  )
  return ['scrypt', COST.N, COST.r, COST.p, salt.toString('base64url'), key.toString('base64url')]
    .map(String)
    .join('$')
}

/** True when the password matches the stored hash (compared in constant time). */
export const verifyPassword = async (password: string, stored: string): Promise<boolean> => {
  const [scheme, n, r, p, salt, hash] = stored.split('$')
  if (scheme !== 'scrypt' || !n || !r || !p || !salt || !hash) return false
  const expected = Buffer.from(hash, 'base64url')
  const saltBytes = Buffer.from(salt, 'base64url')
  return matchesKey(
    () =>
      scrypt(password, saltBytes, expected.length, {
        N: Number(n),
        r: Number(r),
        p: Number(p),
        maxmem: MAX_MEMORY,
      }),
    expected,
  )
}

let decoy: Promise<string> | undefined

/** A hash of a random password, checked when the username is unknown so timing gives nothing away. */
export const decoyHash = (): Promise<string> =>
  (decoy ??= hashPassword(randomBytes(18).toString('base64url')))

/** Problems with a new password, or null when it is acceptable. */
export const passwordProblem = (password: string, username: string): string | null => {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Use at least ${MIN_PASSWORD_LENGTH} characters.`
  }
  if (password.length > 200) return 'Use at most 200 characters.'
  if (password.toLowerCase().includes(username.toLowerCase())) {
    return 'Do not include your username.'
  }
  if (new Set(password).size < 5) return 'Use a less repetitive password.'
  return null
}

/** A one-time password for first sign-in: 20 characters from an unambiguous alphabet. */
export const generateOneTimePassword = (): string => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  // Bytes at or above the largest multiple of the alphabet size are skipped, so every
  // character is equally likely.
  const limit = 256 - (256 % alphabet.length)
  let result = ''
  while (result.length < 20) {
    for (const byte of randomBytes(32)) {
      if (byte < limit && result.length < 20) result += alphabet[byte % alphabet.length]
    }
  }
  return result
}
