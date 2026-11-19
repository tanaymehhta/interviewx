# InterviewX

Interview practice built around the job and each round. Class prototype.

- Spec: `openspec/changes/build-interviewx-app/` (proposal, design, tasks, one spec per capability)
- Visual source of truth: `design/mock/` (`ix.css` is ported into `app/globals.css`)

## Stack

Next.js 16 (App Router) on Vercel · Supabase (Postgres, magic-link Auth, private Storage) through the Vercel Marketplace · AI SDK 7 through OpenRouter (`anthropic/claude-sonnet-5.5`, key in `OPENROUTER_API_KEY`) · Web Speech API for voice.

## Run it

```bash
npm install
vercel link            # once
vercel env pull        # writes .env.local (Supabase keys and OPENROUTER_API_KEY)
npm run dev
```

Database changes live in `supabase/migrations/`. Apply them with `supabase db push`, then regenerate `lib/database.types.ts` with `supabase gen types typescript`.

## Checks

```bash
node --test lib/coach.test.ts                          # scoring, plan, calendar logic
node scripts/contrast.ts                               # WCAG AA contrast, both themes
node --env-file=.env.local scripts/rls-check.ts        # data isolation on the linked database
node --env-file=.env.local scripts/model-check.ts      # model and web search through OpenRouter
npx tsc --noEmit && npm run lint
```

To test date-dependent screens (interview day, "How did it go?", the 6 PM reminder), set `localStorage.ix_now` to an ISO time such as `2026-11-26T19:00` in the browser console and reload. Remove the key to return to the real clock.

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
