// Makes (or deletes) the test accounts a load test needs, the same way the
// API's register does: create the login account, then its profile. It talks
// to Supabase directly with the service key, so the "I'm not a robot" check
// doesn't get in the way - that check is there to stop strangers registering,
// not us.
//
// Set these first, in the same PowerShell window (never paste them in chat):
//   $env:SB_URL = "https://<project-ref>.supabase.co"
//   $env:SB_SERVICE_KEY = "<the service_role key>"
//
// Then:
//   node seed-accounts.mjs 100        make 100 accounts
//   node seed-accounts.mjs delete     delete every account this script made
//
// It writes accounts.json next to itself: the usernames and the one shared
// password, so the load test can log them in. Delete that file afterwards.
import { randomBytes } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs'

const SB_URL = process.env.SB_URL
const KEY = process.env.SB_SERVICE_KEY
if (!SB_URL || !KEY) {
  console.error('Set SB_URL and SB_SERVICE_KEY first (see the top of this file).')
  process.exit(1)
}

const FILE = new URL('./accounts.json', import.meta.url)
const arg = process.argv[2] ?? '100'
const headers = {
  'content-type': 'application/json',
  apikey: KEY,
  authorization: `Bearer ${KEY}`,
}

// ---- delete mode ----
if (arg === 'delete') {
  if (!existsSync(FILE)) {
    console.error('No accounts.json here, so there is nothing to delete.')
    process.exit(1)
  }
  const saved = JSON.parse(readFileSync(FILE, 'utf8'))
  let gone = 0
  for (const a of saved.accounts) {
    const res = await fetch(`${SB_URL}/auth/v1/admin/users/${a.id}`, {
      method: 'DELETE',
      headers,
    })
    if (res.ok) gone++
    else console.error(`  could not delete ${a.username}: ${res.status}`)
  }
  console.log(`deleted ${gone}/${saved.accounts.length} accounts`)
  unlinkSync(FILE)
  console.log('accounts.json removed')
  process.exit(0)
}

// ---- make mode ----
const n = Number(arg)
if (!Number.isInteger(n) || n < 1 || n > 500) {
  console.error('Give a number of accounts between 1 and 500, or "delete".')
  process.exit(1)
}
if (existsSync(FILE)) {
  console.error('accounts.json already exists. Run "node seed-accounts.mjs delete" first.')
  process.exit(1)
}

const run = randomBytes(2).toString('hex')
// Letters and digits, like the real password rule. Kept only in accounts.json.
const password = `Lt${randomBytes(6).toString('hex')}9`
const accounts = []

console.log(`Making ${n} accounts on ${SB_URL} ...`)
for (let i = 1; i <= n; i++) {
  const username = `lt${run}_${String(i).padStart(3, '0')}`
  const email = `loadtest_${run}_${String(i).padStart(3, '0')}@example.com`

  const made = await fetch(`${SB_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email, password, email_confirm: true }),
  })
  const user = await made.json()
  if (!made.ok) {
    console.error(`  ${username}: auth ${made.status} ${JSON.stringify(user)}`)
    continue
  }

  const profile = await fetch(`${SB_URL}/rest/v1/profiles`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'return=minimal' },
    body: JSON.stringify({
      id: user.id,
      username,
      privacy_consent_at: new Date().toISOString(),
    }),
  })
  if (!profile.ok) {
    console.error(`  ${username}: profile ${profile.status} ${await profile.text()}`)
    // Never leave a login account without a profile behind.
    await fetch(`${SB_URL}/auth/v1/admin/users/${user.id}`, {
      method: 'DELETE',
      headers,
    })
    continue
  }

  accounts.push({ id: user.id, username, email })
  if (i % 20 === 0) console.log(`  ${i}/${n}`)
}

writeFileSync(FILE, JSON.stringify({ run, password, accounts }, null, 2))
console.log(`\n${accounts.length} accounts ready (run ${run}).`)
console.log('Saved to accounts.json. Delete them afterwards with:')
console.log('  node seed-accounts.mjs delete')
