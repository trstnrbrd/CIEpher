import type { SupabaseClient } from '@supabase/supabase-js'
import { supabase } from './supabase'

// Talks to the backend API. Every request and response here follows
// Documents/api-contract.md: when the API changes, this file changes with it.

const API_URL = import.meta.env.VITE_API_URL

export type Character = 'boy' | 'girl'

export type Profile = {
  id: string
  username: string
  character: Character | null
}

export type RegisterInput = {
  username: string
  email: string
  password: string
  privacyConsent: boolean
}

// Where the player is in the game. The prologue is chapter 0. The server
// decides what's unlocked; the game never works it out itself.
export type MissionStatus = {
  number: number
  unlocked: boolean
  completed: boolean
}

export type ChapterStatus = {
  id: number
  unlocked: boolean
  completed: boolean
  missions: MissionStatus[]
}

export type Progress = { chapters: ChapterStatus[] }

// The server's verdict on a typed answer. Only the server knows the answers.
export type SubmitResult = { correct: boolean }

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
  accessToken?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  }
  // Logged-in routes need to know who's asking.
  if (accessToken) headers.authorization = `Bearer ${accessToken}`

  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
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

function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new ApiError(
      0,
      'CONFIG_ERROR',
      'Ciepher is not configured. Check the browser console and .env.local.',
    )
  }
  return supabase
}

// Hands the session to supabase-js, which keeps the player logged in.
async function startSession(session: Session | null): Promise<void> {
  if (!session) return
  const { error } = await requireSupabase().auth.setSession({
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

// Registering doesn't log the player in: the client's flow sends them back to
// the login screen to sign in with their new account. Any session the API
// returns is ignored on purpose.
export async function register(input: RegisterInput): Promise<Profile> {
  const result = await request<AuthResult>('POST', '/auth/register', input)
  return result.profile
}

// Logs out and forgets the saved session. Lab computers are shared, so the
// next player must never inherit the last player's login.
export async function logout(): Promise<void> {
  await requireSupabase().auth.signOut()
}

// The logged-in player's access token. supabase-js refreshes it before it
// expires, so this is always the current one.
async function currentAccessToken(): Promise<string> {
  const { data } = await requireSupabase().auth.getSession()
  const token = data.session?.access_token
  if (!token) {
    throw new ApiError(401, 'UNAUTHORIZED', 'Please log in again.')
  }
  return token
}

// The logged-in player's profile, including their chosen character (or null).
export async function getMe(): Promise<Profile> {
  const { profile } = await request<{ profile: Profile }>(
    'GET',
    '/me',
    undefined,
    await currentAccessToken(),
  )
  return profile
}

// Saves the character picked on the Character Select screen.
export async function setCharacter(character: Character): Promise<Profile> {
  const { profile } = await request<{ profile: Profile }>(
    'PUT',
    '/me/character',
    { character },
    await currentAccessToken(),
  )
  return profile
}

// Which chapters and missions are unlocked and completed. Drives resuming,
// the progress checklist, Chapter Select and the Code Journal.
export async function getProgress(): Promise<Progress> {
  return request<Progress>(
    'GET',
    '/progress',
    undefined,
    await currentAccessToken(),
  )
}

// Checks the answer typed into a mission's TYPE HERE box (chapter 0 is the
// prologue). A correct answer is saved on the server right away, so the
// "progress saved" popup can show as soon as this returns correct: true.
export async function submitAnswer(
  chapter: number,
  mission: number,
  answer: string,
): Promise<SubmitResult> {
  return request<SubmitResult>(
    'POST',
    '/missions/submit',
    { chapter, mission, answer },
    await currentAccessToken(),
  )
}
