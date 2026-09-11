import { supabase } from './supabase'

// Talks to the backend API. Every request and response here follows
// Documents/api-contract.md: when the API changes, this file changes with it.

const API_URL = import.meta.env.VITE_API_URL

export type Profile = {
  id: string
  username: string
  character: 'boy' | 'girl' | null
}

export type RegisterInput = {
  username: string
  email: string
  password: string
  privacyConsent: boolean
}

type Session = { accessToken: string; refreshToken: string }
type AuthResult = { session: Session | null; profile: Profile }

// Every error from the API. `message` is always safe to show the player.
// `field` names the input to highlight (validation errors only).
export class ApiError extends Error {
  status: number
  code: string
  field?: string

  constructor(status: number, code: string, message: string, field?: string) {
    super(message)
    this.status = status
    this.code = code
    this.field = field
  }
}

async function request<T>(
  method: 'GET' | 'POST' | 'PUT',
  path: string,
  body?: unknown,
): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(
      0,
      'NETWORK_ERROR',
      "Can't reach the server. Check your connection and try again.",
    )
  }

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const error = data?.error
    throw new ApiError(
      res.status,
      error?.code ?? 'INTERNAL_ERROR',
      error?.message ?? 'Something went wrong. Please try again.',
      error?.field,
    )
  }
  return data as T
}

// Hands the session to supabase-js, which keeps the player logged in.
async function startSession(session: Session | null): Promise<void> {
  if (!session) return
  const { error } = await supabase.auth.setSession({
    access_token: session.accessToken,
    refresh_token: session.refreshToken,
  })
  if (error) {
    throw new ApiError(
      0,
      'SESSION_ERROR',
      'Could not start your session. Please try again.',
    )
  }
}

export async function login(
  username: string,
  password: string,
): Promise<Profile> {
  const result = await request<AuthResult>('POST', '/auth/login', {
    username,
    password,
  })
  await startSession(result.session)
  return result.profile
}

export async function register(input: RegisterInput): Promise<Profile> {
  const result = await request<AuthResult>('POST', '/auth/register', input)
  await startSession(result.session)
  return result.profile
}

// Logs out and forgets the saved session. Lab computers are shared, so the
// next player must never inherit the last player's login.
export async function logout(): Promise<void> {
  await supabase.auth.signOut()
}
