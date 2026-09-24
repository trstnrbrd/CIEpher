// Class load test with accounts made in advance (seed-accounts.mjs), so it
// works on staging and production where registering needs the robot check.
//
// Every student starts at the same moment: log in, read their profile and
// progress, then play the prologue - one wrong answer first, then the right
// one, three missions - and check chapter 1 opened. One extra student types
// the wrong password five times, to prove the lock still only hits them.
//
// Usage:
//   $env:API = "https://<project-ref>.supabase.co/functions/v1/api"
//   node loadtest.mjs [students]     (default: all in accounts.json)
import { readFileSync, writeFileSync } from 'node:fs'

const API = process.env.API ?? 'http://127.0.0.1:54321/functions/v1/api'
const saved = JSON.parse(
  readFileSync(new URL('./accounts.json', import.meta.url), 'utf8'),
)
const N = Number(process.argv[2] ?? saved.accounts.length)
const students = saved.accounts.slice(0, N)
const PASSWORD = saved.password
const TIMEOUT_MS = 30000

const calls = []

async function call(who, step, method, path, body, token) {
  const started = performance.now()
  let status = 0
  let data = null
  let error = null
  try {
    const res = await fetch(API + path, {
      method,
      headers: {
        'content-type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    status = res.status
    data = await res.json().catch(() => null)
  } catch (e) {
    error = String(e)
  }
  calls.push({ who, step, status, ms: performance.now() - started, error })
  return { status, data, error }
}

// The prologue's three missions, in order, with their real answers.
const PROLOGUE = [
  { mission: 1, answer: 'OpenDoor();' },
  { mission: 2, answer: 'GoToTerminal();' },
  { mission: 3, answer: 'RideJeep();' },
]

async function student(account) {
  const login = await call(account.username, 'login', 'POST', '/auth/login', {
    username: account.username,
    password: PASSWORD,
  })
  const token = login.data?.session?.accessToken
  if (!token) return { finished: false, why: `login ${login.status}` }

  await call(account.username, 'me', 'GET', '/me', undefined, token)
  await call(account.username, 'character', 'PUT', '/me/character', { character: 'boy' }, token)
  await call(account.username, 'progress', 'GET', '/progress', undefined, token)

  for (const [i, m] of PROLOGUE.entries()) {
    if (i === 0) {
      // One wrong answer first, like a real student.
      await call(account.username, 'submit (wrong)', 'POST', '/missions/submit', {
        chapter: 0, mission: m.mission, answer: 'OpenDoor:',
      }, token)
    }
    const right = await call(account.username, 'submit (right)', 'POST', '/missions/submit', {
      chapter: 0, mission: m.mission, answer: m.answer,
    }, token)
    if (right.data?.correct !== true) {
      return { finished: false, why: `mission ${m.mission}: ${JSON.stringify(right.data)}` }
    }
  }

  const after = await call(account.username, 'progress', 'GET', '/progress', undefined, token)
  const chapter1 = after.data?.chapters?.find((c) => c.id === 1)
  return { finished: chapter1?.unlocked === true, why: chapter1?.unlocked ? '' : 'chapter 1 did not open' }
}

// Someone guessing one student's password must not affect anyone else.
async function lockTest(account) {
  const codes = []
  for (let i = 0; i < 5; i++) {
    const r = await call('locktest', 'login (wrong password)', 'POST', '/auth/login', {
      username: account.username, password: 'definitely-not-it-1',
    })
    codes.push(r.status)
  }
  const r = await call('locktest', 'login (right password, locked)', 'POST', '/auth/login', {
    username: account.username, password: PASSWORD,
  })
  codes.push(r.status)
  return codes
}

const health = await call('warm-up', 'health', 'GET', '/health')
console.log(`health: ${health.status}; ${students.length} students, all at once, on ${API}`)

const startedAt = performance.now()
const [results, lockCodes] = await Promise.all([
  Promise.all(students.slice(0, -1).map(student)),
  lockTest(students[students.length - 1]),
])
const seconds = ((performance.now() - startedAt) / 1000).toFixed(1)

const done = results.filter((r) => r.finished).length
console.log(`\nstudents who finished the whole prologue: ${done}/${results.length} (in ${seconds} s)\n`)

const steps = [...new Set(calls.map((c) => c.step))]
console.log('step'.padEnd(32) + 'calls  bad   typical  slowest-5%  slowest')
for (const step of steps) {
  const mine = calls.filter((c) => c.step === step)
  const times = mine.map((c) => c.ms).sort((a, b) => a - b)
  const at = (p) => Math.round(times[Math.min(times.length - 1, Math.floor(times.length * p))])
  const bad = mine.filter((c) => c.error || c.status >= 500).length
  console.log(
    step.padEnd(32) +
    String(mine.length).padStart(5) +
    String(bad).padStart(5) +
    `${at(0.5)} ms`.padStart(10) +
    `${at(0.95)} ms`.padStart(12) +
    `${at(1)} ms`.padStart(9),
  )
}

const bad = calls.filter((c) => c.error || c.status >= 500)
console.log(`\nserver errors and timeouts: ${bad.length}`)
for (const [why, count] of Object.entries(
  bad.reduce((acc, c) => ({ ...acc, [`${c.step}: ${c.error ?? c.status}`]: (acc[`${c.step}: ${c.error ?? c.status}`] ?? 0) + 1 }), {}),
)) console.log(`  ${count} x ${why}`)

const notFinished = results.filter((r) => !r.finished)
if (notFinished.length) {
  console.log('\nstudents who did not finish:')
  for (const r of notFinished.slice(0, 10)) console.log(`  ${r.why}`)
}

console.log(`\nlock test (5 wrong passwords, then the right one): ${JSON.stringify(lockCodes)}`)
console.log(
  lockCodes[0] === 429
    ? '  -> this account was still locked from an earlier run (the lock lasts 15 minutes)'
    : lockCodes.includes(429)
      ? '  -> locked, as it should be'
      : '  -> NOT locked, look into this',
)
console.log(`total requests: ${calls.length}`)

writeFileSync(
  new URL('./last-run.json', import.meta.url),
  JSON.stringify({ api: API, students: students.length, seconds, done, calls }, null, 2),
)
