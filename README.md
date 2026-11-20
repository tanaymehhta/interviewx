# InterviewX

Interview practice built around one job and each of its interview rounds. A class prototype.

- **Live site:** https://interviewx-sigma.vercel.app
- **Working with an AI coding agent, or new to code?** Read [`AGENTS.md`](AGENTS.md). It explains the project, the setup, and the rules in plain words. Agents read it automatically.
- **Want to suggest or make a change?** See [`CONTRIBUTING.md`](CONTRIBUTING.md).

## What it does

1. You sign in with an email link and upload a resume. The app lists your strengths, gaps, and stories.
2. You add a job by link, by company and role, or by pasting the posting.
3. The app researches the job (about a minute) and builds a brief: what the company wants, the requirements checked against your resume, the skills, and each interview round with what is asked, what is expected, and a scorecard. Every fact shows its source: the job post, a named website with a link, your resume, or "Inferred · not verified".
4. You practise for a round: a Full interview by voice or typing, a short Call, Single questions, and a coach Chat. Answers are scored and your skill scores, readiness, and day-by-day plan update.
5. You log how each real round went.

## Services

| Service | Used for |
|---|---|
| [Vercel](https://vercel.com) | Hosting. Deploys the `main` branch automatically. |
| [Supabase](https://supabase.com) (through the Vercel Marketplace) | Postgres database with row-level security, email-link sign-in, private storage for resumes |
| [OpenRouter](https://openrouter.ai) | Every AI text call and the web search used in research |
| [Fish Audio](https://fish.audio) | The interviewer's voice (the browser's voice is the fallback) |
| Browser speech recognition | Turns your speech into text; nothing to configure |

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, AI SDK 7 with `@openrouter/ai-sdk-provider`, Zod 4, `@supabase/ssr`.

**AI model.** The default in code is `anthropic/claude-haiku-5.5` (`MODEL` in `lib/server.ts`). Two optional settings change it without a code change: `AI_MODEL` (an OpenRouter model id) and `AI_PROVIDER` (OpenRouter routing as JSON). The live site currently sets `AI_MODEL=deepseek/deepseek-v4.1-flash` and `AI_PROVIDER={"zdr":true,"only":["fireworks","together"]}`, which keeps requests on two zero-data-retention providers.

## Settings

`.env.example` lists every setting by name. The real values are in `.env.local` (never committed) and in the Vercel project.

| Name | Needed? | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase project address and public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Master database key, for server code and scripts only |
| `OPENROUTER_API_KEY` | Yes | AI calls and web search |
| `AI_MODEL`, `AI_PROVIDER` | No | Model and provider routing |
| `FISH_API_KEY`, `FISH_MODEL`, `FISH_VOICE_ID` | No | Interviewer voice |
| `POSTGRES_URL_NON_POOLING` | Owner only | Applying database migrations |

## Run it

Needs Node 24 or newer.

```bash
npm install
# Owner: vercel link && vercel env pull     (writes .env.local)
# Teammates: ask Tanay for .env.local privately and put it in this folder
npm run dev                                 # http://localhost:3000
```

The app on your computer uses the same database as the live site. To sign in locally without waiting for an email:

```bash
node --env-file=.env.local scripts/dev-login.ts someone-test@example.com
```

## Checks

```bash
npm run check          # tests, type check, lint, production build
```

Run one at a time: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`. Extra checks for specific changes:

```bash
node scripts/contrast.ts                               # colour contrast, both themes
node --env-file=.env.local scripts/rls-check.ts        # one account cannot read another's data
node --env-file=.env.local scripts/model-check.ts      # model and web search through OpenRouter
```

To test date-dependent screens (interview day, "How did it go?", the 6 PM reminder), set `localStorage.ix_now` to an ISO time such as `2026-11-26T19:00` in the browser console and reload. Remove the key to return to the real clock.

## Where things are

| Path | Holds |
|---|---|
| `app/` | Pages and server routes. API routes are in `app/api/` ([guide](app/api/AGENTS.md)). |
| `components/` | Screen pieces by feature ([guide](components/AGENTS.md)) |
| `lib/` | Logic: AI model setup, schemas, research, scoring, plan rules ([guide](lib/AGENTS.md)) |
| `supabase/migrations/` | Database structure ([guide](supabase/AGENTS.md)) |
| `scripts/` | Helper and check scripts ([guide](scripts/AGENTS.md)) |
| `design/mock/` | The approved visual design; `ix.css` is ported into `app/globals.css` |
| `openspec/changes/build-interviewx-app/` | The plan: proposal, design decisions, tasks, and one spec per feature |
| `proxy.ts` | Runs before each request: refreshes sign-in and guards private pages |

Database changes are new SQL files in `supabase/migrations/`. The owner applies them with `supabase db push` and regenerates `lib/database.types.ts`.

## Deploying

Pushing to `main` deploys to production. Changes go through a branch and a pull request; the owner merges. A change to a Vercel setting needs a redeploy to take effect.

## Open items (status on 20 November 2026)

Most urgent first. These are the owner's to resolve.

1. **Sign-in email limit.** Supabase's built-in sender allows about 2 sign-in emails per hour for the whole project. Until a custom email sender (SMTP) or another sign-in method is set up, only about 2 people per hour can get in. Delivery to Gmail is also unconfirmed; the email may land in spam.
2. **Research source check.** On the live model (DeepSeek) the last research step usually runs out of time, so web-tagged facts are not double-checked and the brief says "Source check did not finish". Decide: move research back to Claude Haiku, or raise the 90-second limit.
3. **OpenRouter credit.** About $9 was left. When it runs out, every AI feature fails. Top up before many people use the site.
4. **Rotate two keys.** The OpenRouter and Fish Audio keys were shared in a chat. Replace both, then update them in Vercel (and redeploy) and in each teammate's `.env.local`.
5. **Collaborators.** `manseerattt` and `Rdlevine01` are invited with write access and must accept the invitation. `main` is not protected on GitHub, so nothing technical stops a push to it.
6. **Voice practice is untested** on a real microphone and on iPhone Safari (Full interview in Voice mode, and Call). The calendar file import is also untested.

Also open: 19 of 43 boxes in `tasks.md` are ticked, and no AI call has an output limit, so a model that loops can run up cost.

## Known limits

- Many round details are "Inferred · not verified", because few public pages describe a company's rounds. Reddit pages rarely appear in research; the search tool cannot be limited to one site.
- LinkedIn and some other job pages cannot be read; the app asks for the posting text instead.
- Round scorecards cannot be edited by hand; re-running research replaces them.
- Jobs created before 20 November 2026 have no requirements or scorecard until research is re-run.

## Visual rules

Light is the default and does not follow the operating system. Dark is a choice in Settings, saved on the account and applied by the server (`data-theme` on `<html>`), so there is no flash. `/tokens` shows every token and primitive in both themes.

Contrast (WCAG AA needs 4.5:1 for body text), from `scripts/contrast.ts`:

| Pair | Light | Dark |
|---|---|---|
| stone on paper | 5.57 | 7.79 |
| stone on ivory | 5.11 | 7.10 |
| ink on paper | 14.69 | 15.00 |
| ink on ivory | 13.49 | 13.66 |
| on-olive on olive | 11.12 | 7.59 |
| olive on paper | 11.12 | 7.59 |
| garnet on paper | 9.49 | 6.41 |
| ink on gold-soft | 12.49 | 10.67 |
| stone on gold-soft | 4.74 | 5.54 |

All pairs pass. Gold is a fill only. In the dark theme the keep mark uses gold-soft with a gold rule, because light text on solid gold is 1.76:1.

Never used: emojis, purple or blue-violet gradients, glass or blurred panels, glowing borders, sparkle icons, "AI-powered" badges, pill buttons, card shadows, icon-in-a-circle feature grids, coloured chat bubbles.
