# Proposal

## Why

Good candidates lose interviews because they cannot present what they know under pressure, and generic AI tools only grade one answer at a time. InterviewX researches the actual job and its rounds, plans practice up to each round, runs realistic spoken interviews, and keeps a scorecard of what is improving. The class deliverable (55% prototype, 20% market-facing asset) needs one working website that shows this loop in an 8-minute demo, replacing the two disconnected Lovable pages.

Sources: Granola note "Interview prep app prototype and feature planning" (2026-11-18), team doc "AI interview X.docx", the 98-second pitch video, the Prototype 2 brief, and review sessions with the team lead on 2026-11-19.

## What Changes

- New website (desktop and mobile browser; no native app): landing page, sign in, onboarding, My Jobs, job research, rounds, and five practice tools per round.
- Accounts and data in Supabase (Postgres, Auth with email magic link, private Storage for resumes).
- Job research: from a job link or a company + role, the system finds the number of rounds, what each round asks, what each round expects, and what the company wants, with a source tag on every fact.
- Five tools on every round: **Full interview**, **Call**, **Feedback** (scorecard), **Single questions**, **Chat**.
- Live voice: questions appear on screen and are spoken aloud; the candidate's words are transcribed on screen as they speak.
- Day-by-day plan per round with calendar reminders; after each round, "How did it go?" records the outcome.
- Visual identity from aabhushanjewels.com: light by default (white and ivory, deep olive, garnet and gold accents, light display serif), dark mode optional.

Out of scope: demo/anonymous mode, real phone-number calling, human coach review, community forum, messaging, networking, Claude connector, payments, native mobile apps.

## Capabilities

### New Capabilities
- `account-access`: sign up and sign in by email link, sign out, delete account, per-user data isolation, settings.
- `candidate-profile`: onboarding about the candidate (name, program, target roles, resume) and resume analysis.
- `job-research`: add a job by link or company + role; research rounds, round content and expectations, and company wants; source-tagged brief; confirm rounds; My Jobs and job pages.
- `practice-plan`: day-by-day plan per round with today's task and reminders.
- `full-interview`: timed spoken mock interview for a round with live transcript, follow-ups, a review loading screen, and results.
- `voice-call`: quick hands-free spoken practice for on-the-go use.
- `single-questions`: chat-style thread to practice individual answers or analyze a story; answers are scored.
- `answer-feedback`: shared per-answer scoring, keep/cut marks, upgraded answer, round-fit check, and session SWOT.
- `scorecard`: overall and per-job skill scores, readiness per round, trends, and a log of every scored answer.
- `assistant-chat`: open chat grounded in the candidate's data; never scored; can suggest practice actions.
- `round-outcomes`: interview-day state, post-round check-in, outcomes, reflections, and readiness snapshots.
- `landing-page`: public market-facing page leading to sign up.
- `visual-identity`: shared visual, theme, and accessibility rules.

### Modified Capabilities
- None (greenfield).

## Impact

- New Next.js app in this repo, deployed to Vercel.
- External services: Supabase (via Vercel Marketplace), an LLM via Vercel AI Gateway, and a web search/fetch capability for job research.
- Browser APIs: Web Speech (recognition and synthesis). Voice works in Chrome, Edge, and Safari; other browsers fall back to typing.
