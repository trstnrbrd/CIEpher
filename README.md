# CIEpher

CIEpher is a web-based, story-driven educational game for learning the abstract execution flow of C# control structures. Players move through coding challenges, type the required syntax, receive immediate feedback, and follow a visual explanation of how the code executes.

The project is being developed as a supplementary learning tool for College of Industrial Education students in Programming 1.

## Project Status

The repository contains an active frontend and backend foundation, including:

- Account registration, login, logout, and password recovery
- Character selection and player profiles
- Progress tracking and mission answer checking
- Prologue game content and chapter unlocking
- Supabase database migrations, row-level security, and automated tests
- Staging deployment configuration for the API and frontend

## Technology

- **Frontend:** React, TypeScript, Vite, and Supabase Auth
- **Backend:** Hono on Supabase Edge Functions with Deno
- **Database:** PostgreSQL managed by Supabase
- **Hosting:** Cloudflare Workers with static assets for the frontend
- **Quality tools:** TypeScript, Oxlint, Deno checks and linting, Vitest-style API tests, and pgTAP database tests

## Repository Layout

```text
backend/                 Supabase project, API, migrations, and tests
	supabase/functions/api Hono API and API tests
	supabase/migrations    Database schema and game data migrations
	supabase/tests         PostgreSQL and row-level security tests
frontend/                React/Vite game client
	src/api                Frontend API and Supabase client code
	src/components         Game screens and reusable UI components
Documents/               API contract and project documentation
backups/                 Backup and restore documentation and configuration
```

## Prerequisites

- Node.js and npm
- Docker Desktop, for the local Supabase stack
- Supabase CLI (installed through the backend development dependencies)
- Deno (installed through the backend development dependencies)

## Local Development

### 1. Install dependencies

From the repository root:

```powershell
cd backend
npm install

cd ..\frontend
npm install
```

### 2. Start the backend

Make sure Docker Desktop is running, then from `backend/`:

```powershell
npx supabase stop
npx supabase start
```

Copy the local Supabase values into `frontend/.env.local`:

```dotenv
VITE_API_URL=http://127.0.0.1:54321/functions/v1/api
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_PUBLISHABLE_KEY=your-local-publishable-key
```

The local Supabase Studio is available at <http://127.0.0.1:54323>.

### 3. Start the frontend

From `frontend/`:

```powershell
npm run dev
```

Open <http://localhost:5173> in a browser.

The staging environment can be used without Docker by placing its values in `frontend/.env.staging.local` and running:

```powershell
npm run dev -- --mode staging
```

Use test accounts only in staging. Never put secrets in frontend environment files that are committed to Git.

## Useful Commands

Run these backend commands from `backend/`:

```powershell
npm run check       # Type-check the API and tests
npm test            # Run API tests
npm run lint        # Lint the API
npm run db:reset    # Rebuild the local database
npm run db:test     # Run database and RLS tests
```

Run these frontend commands from `frontend/`:

```powershell
npm run build       # Create a production build
npm run lint        # Run Oxlint
npm run preview     # Serve the production build locally
```

## API Documentation

The frontend/backend contract, endpoint details, request and response examples, and error conventions are documented in [Documents/api-contract.md](Documents/api-contract.md).

The API uses the local base URL below during development:

```text
http://127.0.0.1:54321/functions/v1/api
```

## Development Notes

- The frontend does not write directly to the database. Game reads and writes go through the API.
- Mission answer keys stay on the server.
- Player progress and unlock rules are enforced by the backend.
- Database migrations should be added as new files; do not edit migrations that have already been applied.
- Do not commit passwords, service-role keys, database URLs, or other secrets.
