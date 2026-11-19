# Tasks

## 1. Setup and services

- [ ] 1.0 `git init`, create a GitHub repo with `gh repo create` (ask the user public or private), push, and add collaborators with `gh api repos/{owner}/{repo}/collaborators/{username} -X PUT` once the user gives usernames; verify `gh api repos/{owner}/{repo}/collaborators` lists them (invites show as pending until accepted)
- [x] 1.1 Scaffold Next.js (App Router, TypeScript, Tailwind, ESLint) non-interactively; verify `npm run dev` serves a page at localhost:3000
- [ ] 1.2 `vercel link`, add Supabase via `vercel integration add` (slug from `vercel integration discover`), enable AI Gateway, `vercel env pull`; verify `.env.local` has the Supabase URL, anon key, service-role key, and gateway credentials (names only, never printed values)
- [ ] 1.3 Install `ai`, `zod`, `@supabase/supabase-js`, `@supabase/ssr`; read `node_modules/ai/docs/` for structured output, streaming, and whether Claude web search/fetch tools work through the gateway; record the result in design.md decision 4 and, if unsupported, add Firecrawl + Exa keys; verify a test call returns a search result
- [ ] 1.4 Copy the pitch video to `public/pitch.mp4` and generate `public/pitch.vtt` with Whisper; verify it plays with captions

## 2. Database

- [ ] 2.1 Write SQL migrations for all tables in design.md decision 2 with foreign keys and `on delete cascade`; verify `supabase db push` (or migration apply) succeeds on the linked project
- [ ] 2.2 Enable RLS with owner policies on every table, insert-only anon policy on `leads`, and the private `resumes` bucket with an owner-folder policy; verify `scripts/rls-check.ts` passes (user B cannot read A's job, anon cannot read leads)
- [ ] 2.3 Generate TypeScript types from the schema into `lib/database.types.ts`; verify the project type-checks

## 3. Visual system

- [ ] 3.1 Define light and dark tokens, Cormorant Garamond and Open Sans via `next/font`, type scale, focus ring, and reduced-motion rule; light is default and `data-theme` comes from the server; verify a token page renders both themes with no flash on load
- [ ] 3.2 Build primitives: Button (primary/secondary/link), Card, Eyebrow, ScoreNumeral with bar, Sparkline, ToolTile, TopBar with job/round switcher, Transcript message; verify on the token page that buttons are square and cards have no shadow
- [ ] 3.3 Check contrast for both themes (stone on paper, on-olive on olive, ink on ivory) and the banned-patterns list; verify all text pairs pass WCAG AA and note results in the README

## 4. Core logic

- [ ] 4.1 Write `lib/coach.ts` (skill update, overall skills, round readiness, weakest skill, difficulty band, delivery sub-score, session delivery numbers, round progression); verify `node --test lib/coach.test.ts` passes, including 58 → 65 and 48 → 61
- [ ] 4.2 Add per-round plan builder, re-planner, and `.ics` builder; verify tests for 1-day and 7-day plans, unchanged completed days, and an .ics that imports into macOS Calendar

## 5. Auth, onboarding, settings

- [ ] 5.1 Add Supabase clients, `proxy.ts` session refresh and protection, `/signin` (email link, sent state, expired-link state), and `/auth/callback` routing; verify sign-up lands on `/start`, return sign-in lands on `/jobs`, and a signed-out visit to a job URL returns there after sign-in
- [ ] 5.2 Build `/start` onboarding (name, program, target roles, resume PDF ≤ 3 MB or text) with resume upload to Storage and resume on return; verify a .docx and a 4 MB PDF are rejected and closing mid-way resumes with fields kept
- [ ] 5.3 Implement `POST /api/profile/analyze` and show strengths, gaps, and editable story names, with retry on failure; verify smoke output for a sample resume has named stories
- [ ] 5.4 Build `/settings` (profile, replace resume, theme, sign out, delete account via `POST /api/account/delete`); verify Dark persists across devices and deletion removes rows and the resume file

## 6. Jobs and research

- [ ] 6.1 Build `/jobs` My Jobs (cards sorted by next round date, empty state, Past jobs); verify with zero, one, and two jobs
- [ ] 6.2 Implement `POST /api/research` with streamed step events, source tags, 90 s cutoff, and login-wall detection; verify smoke runs for a public posting link, a LinkedIn link (asks for text), and company + role only
- [ ] 6.3 Build `/jobs/new`: input options, live research steps, source-tagged brief with "not verified" labels, confirm-rounds editor (add, remove, rename, reorder, date, interviewer notes, done); verify creating a job writes job, rounds, skills, and plans and opens the job page
- [ ] 6.4 Build `/jobs/:job` (brief, rounds with status, edit item, re-run research keeping edits) and `/jobs/:job/:round` (details, expectations, today's task with Begin, plan strip, Add to calendar, five tool tiles), plus the top-bar switcher; verify switching rounds changes the plan and tool links
- [ ] 6.5 Add the after-6 PM reminder banner; verify it appears with the clock mocked to 7 PM and an unfinished task

## 7. Shared voice and feedback

- [ ] 7.1 Build `useSpeech` (recognition with interim/final, auto-restart, pause during speech output, voice choice, support detection); verify in Chrome that interim words show light, final words dark, and the interviewer's voice is not transcribed
- [ ] 7.2 Implement `POST /api/feedback` with sentence marks, placeholders, round-fit items, and code-calculated Delivery; verify smoke output for a vague answer has a placeholder and no invented number
- [ ] 7.3 Build the FeedbackCard (score, sub-scores, keep/cut/tighten marks, strengths, improvements, upgraded answer with highlighted placeholders, retry state) and wire score writes (`answers`, `skill_scores`, `skills`, re-plan); verify an answer scored 9 moves Behavioral storytelling 48 → 61 and the weakest skill changes

## 8. Full interview

- [ ] 8.1 Build setup screen (expectations, length, answer mode, mic level check, headphones tip); verify Begin stays disabled until sound is heard and mic denial switches to Typing
- [ ] 8.2 Implement `POST /api/interview/start` and `POST /api/interview/next`; verify start returns a persona intro and the right number of round-specific questions, and next returns a follow-up for an answer with no outcome
- [ ] 8.3 Build the live screen (question shown as it is spoken, status line, live transcript, answer and total timers, Done/Space, Pause, Type instead, follow-up label, transcript drawer, End interview); verify a 6-second silence does not end an answer and Type instead keeps the transcript
- [ ] 8.4 Implement `POST /api/interview/review` (parallel answer feedback + verdict, SWOT, round fit) and the staged loading screen with 60 s fallback; verify a 3-question session reaches results and an early end after question 2 shows "Incomplete · 2 of 6"
- [ ] 8.5 Build the results screen (score, readiness change, verdict, round fit, SWOT, delivery numbers, expandable questions, next steps) and saved-session reopen; verify every section renders and reopening from the answer log shows the same results

## 9. Call

- [ ] 9.1 Build `/jobs/:job/:round/call` (3 or 5 questions on the weakest skill, phone-first call view, silence turn-taking, spoken tips, End call, unsupported-browser message); verify on Safari iPhone that a spoken answer advances hands-free
- [ ] 9.2 Build the call recap with feedback and score updates; verify ending during question 3 shows two scored answers

## 10. Feedback (scorecard)

- [ ] 10.1 Build `/jobs/:job/:round/scorecard` (overall skills, job skills with trends, round readiness with "Early estimate", weakest skill and reason, 7-day summary, empty state); verify against seeded data and an empty job
- [ ] 10.2 Add the answer log table with tool filter and open-to-feedback; verify filtering to Call lists only call answers

## 11. Single questions and Chat

- [ ] 11.1 Implement `POST /api/single` (question card, SWOT card, reply) and build the practice thread (suggestions, request in own words, spoken or typed answer, feedback card, "not an answer", saved history); verify "Let me practice tell me about yourself" yields a question card and the next answer gets a feedback card
- [ ] 11.2 Implement `POST /api/chat` (streaming, server-loaded context, action-button tool, no scoring) and build `/chat` with history list; verify "What should I fix before Thursday?" names the weakest skills and a pasted answer does not change the scorecard

## 12. Round outcomes

- [ ] 12.1 Add interview-day state and the post-round "How did it go?" check-in on My Jobs and the round page; verify with the clock mocked to the round date and the day after
- [ ] 12.2 Build the outcome form (outcome, went well, went wrong, asked questions with Practice this), readiness snapshot, and job progression; verify Advanced activates the next round and Offer moves the job to Past jobs

## 13. Landing page

- [ ] 13.1 Build `/` sections in spec order with sourced stats, pitch video, and Sign in / My Jobs top-bar link; verify every Get started opens sign-in and every statistic shows its source
- [ ] 13.2 Add the career-center form writing to `leads` with inline email validation; verify a valid submit stores a row and "abc@" is rejected

## 14. Integration and release

- [ ] 14.1 Walk the full demo path in design.md in Chrome desktop (1440px) and Safari iPhone (375px); verify each step and record a backup video of the voice flows
- [ ] 14.2 Review every screen in both themes against the banned list, keyboard navigation, and reduced motion; verify no banned pattern and visible focus everywhere
- [ ] 14.3 Configure Supabase custom SMTP, deploy a Vercel preview, run smoke and RLS scripts against it, then promote to production; verify the production URL completes sign-up and the demo path

## Workflow follow-up

- Archive the change after the team reviews the built app.
