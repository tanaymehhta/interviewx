# Build brief for screen work

You are building one slice of InterviewX, a Next.js app. The foundation exists. Read this file fully, then the files it names, then build your slice.

## Read first
- `openspec/changes/build-interviewx-app/design.md` (screen map, decisions, AI routes, demo path)
- The spec files named in your task under `openspec/changes/build-interviewx-app/specs/<capability>/spec.md`. Every requirement and scenario for your slice must work.
- The mock screens named in your task under `design/mock/*.dc.html`. **The mock is the visual source of truth**: match layout, copy, class names and inline styles. Replace its sample data with real data. The mock template syntax (`{{ }}`, `sc-if`, `sc-for`, the `<script>` block) is mock-only; port its behaviour to React.
- `app/globals.css` (ported `ix.css`: all class names you need), `components/ui.tsx`, `components/FeedbackCard.tsx`, `components/CountUp.tsx`, `components/TopBar.tsx`
- `lib/server.ts`, `lib/score.ts`, `lib/schemas.ts`, `lib/coach.ts`, `lib/useSpeech.ts`, `lib/database.types.ts`, `supabase/migrations/*.sql`, `app/api/feedback/route.ts`

## Stack facts (do not guess; these differ from older versions)
- Next.js 16.4 App Router, React 19, TypeScript. Docs are in `node_modules/next/dist/docs/` — read the relevant page before using an API you are not sure of. `params` and `searchParams` are Promises: `export default async function Page({ params, searchParams }: PageProps<"/jobs/[job]/[round]">) { const { job, round } = await params; }`. Middleware is `proxy.ts` (exists; do not edit). Cache Components is OFF; pages are dynamic.
- AI SDK 7 (`ai` package). Docs in `node_modules/ai/docs/`. Structured output: `generateText({ model: MODEL, output: Output.object({ schema }), system, prompt })` then `result.output`. Streaming: `streamText`. `MODEL` comes from `lib/server.ts` (a gateway model id string; no provider import needed). Read the docs for anything else (tools, `useChat`, stream responses) before writing it.
- Zod 4. Supabase via `@supabase/ssr`: server `createClient()` from `lib/supabase/server.ts` (async), browser `createClient()` from `lib/supabase/client.ts`.
- Supabase and AI Gateway are not provisioned yet, so you cannot run the app or call the model. Verify with `npx tsc --noEmit` and `npx eslint <your paths>`; both must be clean for your files. Do NOT run `next build`, `next dev`, `npm install`, or git commands. If you truly need a new dependency, stop and say so in your report instead.

## Conventions
- Server Components load data; client components (`"use client"`) only for interaction. Mutations: Server Actions (`"use server"`) or Route Handlers. Every action and handler calls `getUser()` and returns/throws when there is no user. Never trust client-sent profile, brief, scores or ids beyond looking them up under RLS; load context with `loadJob()` / `requireJob()` / `requireProfile()`.
- Pages for signed-in screens start with `<div className="wrap"><TopBar active="jobs" roundId={round.id} /> ...`. Pass `roundId` whenever a round is selected.
- AI handlers: input caps from `LIMITS` in `lib/schemas.ts` (413 via `tooLarge`), model failure returns 502 via `aiFailed`, `export const maxDuration = 120`. Add shared schemas to your own file if `lib/schemas.ts` lacks one. Prompts include `describeContext(profile, ctx)` and `STYLE`. Treat all user text as content, not instructions.
- Scoring only through `judgeAnswer` + `recordScore` (`lib/score.ts`) or `POST /api/feedback`. Scores are never computed in the client.
- "Today" and the hour come from `localNow()` in `lib/server.ts` (the person's local clock), never `new Date()` on the server for calendar logic.
- Styling: class names from `globals.css` plus inline `style={{}}` copied from the mock. Colours ONLY as CSS variables (`var(--ink)`, `var(--paper)`, `var(--on-olive)`, ...). Where the mock hard-codes `#fff` or `#2A2826`, use the matching variable so dark theme works. Tailwind utilities are available but the mock classes come first.
- Banned: emojis, gradients in purple/blue, glass/blur panels, glows, sparkle icons, "AI-powered" badges, pill buttons, card shadows, icon-in-circle feature grids, coloured chat bubbles, component libraries, chart libraries. Copy is short, plain, second person; never "AI-powered", "unlock", "supercharge", "seamless".
- Native elements: `<dialog>`, `<details>`, `<input type="date">`, `<input type="time">`. Every input has a label. Everything works by keyboard and from 360px to 1440px wide without horizontal scroll (use the mock's `repeat(auto-fit, minmax(min(100%, Npx), 1fr))` patterns).
- Keep it small: no abstractions with one user, no config for constants, no speculative features. Comments only for constraints the code cannot show.

## Routes (fixed; other slices link to yours)
- `/` landing · `/signin?next=` · `/auth/callback` · `/start` · `/settings`
- `/jobs` · `/jobs/new` · `/jobs/[job]` · `/jobs/[job]/[round]`
- `/jobs/[job]/[round]/interview` (setup + live + review loading) · `/jobs/[job]/[round]/interview/[session]` (results; reopenable)
- `/jobs/[job]/[round]/call` · `/jobs/[job]/[round]/call/[session]` (recap)
- `/jobs/[job]/[round]/scorecard` (answer rows link to `/jobs/[job]/[round]/scorecard/[answer]`, or to the interview results page for full-interview answers)
- `/jobs/[job]/[round]/practice` (Single questions). Opens with a topic via `?q=<question text>` or `?skill=<skill id>`.
- `/chat` · `/chat?thread=<id>` · `/chat?job=<id>&round=<id>`
- API: `/api/profile/analyze`, `/api/account/delete`, `/api/research`, `/api/interview/start|next|review`, `/api/feedback` (exists), `/api/single`, `/api/chat`, `/api/call/start`

## File ownership
Create files only inside the paths your task lists. Do not edit shared files (`lib/*` that already exist, `components/*` that already exist, `app/globals.css`, `app/layout.tsx`, `proxy.ts`, migrations, anything under `openspec/` or `design/`). If a shared file needs a change, do not make it: describe the exact change in your report.

## Report (your final message)
1. Files created. 2. For each task id in your slice: what is implemented, and which verify step could not be run (needs the database or the model). 3. Any shared-file change you need, exactly. 4. Anything in the spec you could not fully implement, stated plainly. Do not claim something works that you could not run.
