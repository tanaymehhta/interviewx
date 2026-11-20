# components/: screen pieces

Read the root `AGENTS.md` first.

| Folder or file | What it holds |
|---|---|
| `ui.tsx` | Shared small pieces: `Button`, `TextLink`, `SourceTag`, `Bar`, `Steps`, `RoundFitList`, `ScoreList`, `SwotGrid`, date helpers. Look here before writing a new piece. |
| `TopBar.tsx`, `Switcher.tsx` | The top navigation and the job and round switcher |
| `Clock.tsx` | Keeps the `today` and `hour` cookies current so the server knows the person's local date |
| `FeedbackCard.tsx`, `CountUp.tsx` | The scored-answer card and the animated number |
| `account/` | Sign-in form, onboarding, settings, resume upload |
| `landing/` | Landing page pieces and the lead form |
| `jobs/` | `bits.tsx` (fact rows, requirement rows, scorecard rows, labels) and `useResearch.ts` (follows the research stream) |
| `interview/` | Full interview: setup, live screen, finishing the review |
| `call/` | The Call screen |
| `practice/` | The Single questions thread |
| `chat/` | The coach chat thread |
| `scorecard/` | Shared scorecard helpers |

## Rules

- **Server or client.** A file is a client component only if it starts with `"use client"`. Keep hooks, state, and browser APIs in client components. Files without hooks (such as `jobs/bits.tsx`) must stay usable from both.
- **`actions.ts` files are server actions** (`"use server"`). They check the signed-in user, validate input with Zod, and return `{ error }` instead of throwing.
- **Style with the tokens** in `app/globals.css` (`var(--ink)`, `var(--olive)`, `var(--garnet)`, `var(--stone)`, `var(--hair)`, and the classes `card`, `tag`, `eyebrow`, `serif`, `ital`, `inp`, `field`, `tlink`). Do not add colours. The approved look is in `design/mock/`.
- **Every fact from research shows its source** through `SourceTag`. Do not show a researched fact without one.
- **Accessibility basics stay:** a label for every input, `role="alert"` on error text, real buttons and links, visible focus.
- **Check at 360 px wide and in the dark theme** (Settings) after a visual change. The page must not scroll sideways.
- **Never use:** emojis, gradients in purple or blue-violet, glass or blur, glow, sparkle icons, "AI-powered" badges, pill buttons, card shadows, coloured chat bubbles.
