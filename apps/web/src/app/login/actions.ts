'use server'

import {
  changePassword,
  createSession,
  LoginError,
  PasswordChangeError,
  safeReturnTo,
  SESSION_COOKIE,
  signInWithPassword,
} from '@duatf/platform-identity'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import type { FormState } from '@/lib/formState'
import { cookieSecure, PASSWORD_PATH, requireSession } from '@/server/auth'
import { database, env } from '@/server/runtime'

const text = (formData: FormData, name: string) => {
  const value = formData.get(name)
  return typeof value === 'string' ? value : ''
}

/** Signs in with the username and password and opens a server-side session. */
export const signInAction = async (_state: FormState, formData: FormData): Promise<FormState> => {
  const username = text(formData, 'username').trim()
  const password = text(formData, 'password')
  const next = safeReturnTo(text(formData, 'next'))
  if (!username || !password) {
    return {
      status: 'error',
      message: 'Enter your username and password.',
      fieldErrors: {
        ...(username ? {} : { username: 'Enter your username.' }),
        ...(password ? {} : { password: 'Enter your password.' }),
      },
      values: { username },
    }
  }
  const db = database().db
  let mustChange: boolean
  try {
    const user = await signInWithPassword(db, { username, password })
    const request = await headers()
    const session = await createSession(db, {
      userId: user.userId,
      ttlHours: env().SESSION_TTL_HOURS,
      ipAddress: request.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      userAgent: request.get('user-agent'),
    })
    ;(await cookies()).set(SESSION_COOKIE, session.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: cookieSecure(),
      path: '/',
      expires: session.expiresAt,
    })
    mustChange = user.mustChangePassword
  } catch (error) {
    if (error instanceof LoginError) {
      return { status: 'error', message: error.message, values: { username } }
    }
    throw error
  }
  redirect(mustChange ? PASSWORD_PATH : next)
}

/** Changes the password; the first change replaces the one-time password. */
export const changePasswordAction = async (
  _state: FormState,
  formData: FormData,
): Promise<FormState> => {
  const session = await requireSession()
  try {
    await changePassword(database().db, {
      userId: session.user.userId,
      sessionId: session.user.sessionId,
      current: text(formData, 'current'),
      next: text(formData, 'next'),
      confirm: text(formData, 'confirm'),
    })
  } catch (error) {
    if (error instanceof PasswordChangeError) {
      return { status: 'error', message: error.message, fieldErrors: error.fieldErrors }
    }
    throw error
  }
  redirect('/?password=changed')
}
