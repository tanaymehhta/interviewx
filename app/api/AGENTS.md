# app/api/: server routes

Read the root `AGENTS.md` first. Each folder here holds one `route.ts`. The comment at the top of each file is the contract: the request body, the answers, and the error codes. Keep that comment true when you change the route.

| Route | What it does | Calls the AI? |
|---|---|---|
| `POST /api/research` | Researches a job; streams progress and the brief as newline-delimited JSON | Yes, several calls plus web search |
| `POST /api/profile/analyze` | Saves the resume and returns strengths, gaps, and stories | Yes |
| `POST /api/interview/start` | Opens a Full interview and writes its questions | Yes |
| `POST /api/interview/next` | Decides on one follow-up question | Yes |
| `POST /api/interview/review` | Scores a finished Full interview, including the round scorecard | Yes, one call per answer plus one summary |
| `POST /api/call/start` | Opens a Call session with short questions | Yes |
| `POST /api/feedback` | Scores one answer (Call and Single questions) | Yes |
| `POST /api/single` | One turn of the Single questions thread | Yes |
| `POST /api/chat` | Streaming coach chat. Never scores an answer. | Yes |
| `POST /api/speak` | Returns MP3 speech from Fish Audio | No (Fish Audio) |
| `POST /api/account/delete` | Deletes the resume files and the account | No |

The sign-in callback is outside this folder: `app/auth/callback/route.ts`.

## Rules every route follows

1. **Check sign-in first.** Start with `const { supabase, user } = await getUser();` and answer `401` when there is no user. `proxy.ts` also guards these paths, but the route must not rely on it.
2. **Validate the body with Zod** and answer `400` on a bad body. Enforce the size limits in `LIMITS` (`lib/schemas.ts`) and answer `413` when one is exceeded.
3. **Use the person's own Supabase client** (`supabase` from `getUser`), so row-level security applies. Load a job with `loadJob`; it returns `null` for a job that belongs to someone else, which becomes `404`.
4. **AI calls use `MODEL` from `lib/server.ts`** and a schema from `lib/schemas.ts` through `Output.object({ schema })`. On failure, log the error and answer with `aiFailed(e)` (a `502` with a plain message). Save the person's input before the AI call where you can, so a failure loses nothing.
5. **Set `export const maxDuration`** on any route that calls the AI (most use 120 seconds).
6. **Never return a secret or another person's data.** Never echo an environment variable.
7. **The Edge runtime is not used.** Do not add `export const runtime = 'edge'`.

Each AI route costs money per call. Do not call these routes in a loop.
