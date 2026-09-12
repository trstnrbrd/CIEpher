const API_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:54321/functions/v1/api'

const TOKEN_KEY = 'ciepher.access_token'
const REFRESH_KEY = 'ciepher.refresh_token'

export type Session = {
  accessToken: string
  refreshToken: string
  user: { id: string; email: string }
}

export type Profile = {
  id: string
  username: string
  email?: string
  gender?: string
  year_level?: string
  character: string | null
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status = 500,
    readonly code = 'UNKNOWN',
  ) {
    super(message)
  }
}

export function isUnauthorized(err: unknown): boolean {
  return err instanceof ApiError && err.status === 401
}

export function saveSession(session: Session): void {
  localStorage.setItem(TOKEN_KEY, session.accessToken)
  localStorage.setItem(REFRESH_KEY, session.refreshToken)
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, init)
  } catch {
    throw new ApiError('Could not reach the server. Please try again later.')
  }
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    const error = body?.error
    throw new ApiError(
      error?.message ?? 'Something went wrong. Please try again.',
      res.status,
      error?.code ?? 'UNKNOWN',
    )
  }
  return body as T
}

function authHeaders(): Record<string, string> {
  const token = getAccessToken()
  if (!token) throw new ApiError('Please log in first.', 401, 'UNAUTHORIZED')
  return { authorization: `Bearer ${token}` }
}

export async function signIn(username: string, password: string): Promise<Session> {
  return request<Session>('/api/auth/sign-in', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
}

export async function getMe(): Promise<Profile> {
  const { profile } = await request<{ profile: Profile }>('/api/auth/me', {
    headers: authHeaders(),
  })
  return profile
}

export async function setCharacter(character: 'boy' | 'girl'): Promise<Profile> {
  const { profile } = await request<{ profile: Profile }>('/api/auth/character', {
    method: 'PUT',
    headers: { ...authHeaders(), 'content-type': 'application/json' },
    body: JSON.stringify({ character }),
  })
  return profile
}