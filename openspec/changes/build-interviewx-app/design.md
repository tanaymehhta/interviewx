# Design

## Context

Greenfield repo. See proposal.md for why. Constraints that shape the approach:

- Class prototype for an 8-minute live demo, but with real accounts and real data (team decision 2026-11-19). No demo mode: the presenter signs in to a prepared account before going on stage.
- Website only. It must work in a desktop browser and a phone browser.
- Real AI is part of the grade. Anything that does not need judgment is plain code.
- Design reference: aabhushanjewels.com. Measured from the live site: display serif IvyPresto Display at weight 300 (h1 57px, line-height 1.05), body Open Sans 300 at 16px / 28.8px, text #696866 and #2A2826, primary button #383E28 with white serif label, 0 radius, padding 17px 57px; hairline cards; gold #E9D58A; garnet headline accent. Light theme.

## Goals / Non-Goals

**Goals:**
- One Next.js app on Vercel, with Supabase and AI Gateway as the only required services.
- Voice that feels live: question text and speech together, words on screen as you speak.
- AI calls return typed JSON, so the UI never parses prose.

**Non-Goals:**
- Demo/anonymous mode, real telephony, human coach, native apps.
- Storing audio. Only transcripts are stored.
- Production abuse controls beyond input size caps and per-user data isolation.

## Screen map

```
 /  landing ──"Get started"──▶ /signin (email link) ──▶ /auth/callback
                                                         │ first time        │ returning
                                                         ▼                   │
                                              /start onboarding (about you)  │
                                                         ▼                   ▼
 /jobs  MY JOBS ── cards (company · role · next round · readiness) · [+ Add a job] · Past jobs
   │ click job                        │ + Add a job
   │                                  ▼
   │                /jobs/new: link | posting text | company + role
   │                  → research (live steps) → brief (source-tagged)
   │                  → confirm rounds (dates, interviewer notes) → creates job
   ▼
 /jobs/:job  JOB: brief (company wants, skills) + rounds list with status
   ▼ click round
 /jobs/:job/:round  ROUND: details, expectations, today's task, plan strip, Add to calendar
   ├─ Full interview   /jobs/:job/:round/interview   setup → live → review loading → results
   ├─ Call             /jobs/:job/:round/call        call view → recap
   ├─ Feedback         /jobs/:job/:round/scorecard   overall + job skills, readiness, answer log
   ├─ Single questions /jobs/:job/:round/practice    scored practice thread
   └─ Chat             /chat?job=&round=             grounded open chat (not scored)
 /settings  profile + resume · theme (Light / Dark) · sign out · delete account

 Top bar (signed in): wordmark · [Salesforce · Final ▾] switcher · Chat · Settings
 End of a round: date → "Today is your Final round" → next day "How did it go?"
   → outcome + reflections + asked questions → snapshot → Advanced: next round active
   / Offer, Rejected, Withdrew: job moves to Past jobs
```

## Live interview screens

Setup:
```
 SALESFORCE · SALES MANAGER · FINAL ROUND
 Your final round, rehearsed.                 (serif, garnet italic on "rehearsed")
 What this round expects: 30-60-90 plan · executive presence · deal strategy
 Length   ( ) 15 min  (•) 30 min  ( ) 45 min
 Answer   (•) Voice   ( ) Typing
 Microphone check  ──────╱╲──╱╲─────  "We can hear you."
 Tip: use headphones so the interviewer's voice is not picked up.
 [ Begin interview ]
```

Live (light ivory page):
```
 Salesforce · Final round                          12:41 / 30:00        End interview
 ─────────────────────────────────────────────────────────────────────────────────────
 QUESTION 3 OF 6 · BEHAVIORAL                                    ○ ○ ● ○ ○ ○

 Tell me about a deal you lost.
 What did you change afterwards?                      (serif, 36-44px, ink)

 ● Listening                                           Answer 1:42 / 2:00
 ─────────────────────────────────────────────────────────────────────────────────────
 YOUR ANSWER
 In my second year at Northwind I ran a mid-market pipeline and we lost a
 $400k renewal to a competitor because we [settling words in lighter stone]

 [ Pause ]     [ Type instead ]                            [ Done  ·  Space ]
 ▸ Transcript (questions 1–2)
```
States of the status line: "Interviewer speaking" (mic off, question text fades in as speech starts), "Listening" (olive dot), "Paused". A follow-up keeps the number and adds a "FOLLOW-UP" label above the new text.

Review loading:
```
 Reviewing your interview
 ✓ Reading 6 answers
 ✓ Scoring structure and impact
 · Comparing with what Salesforce expects in the final round
 · Writing your upgraded answers
 ━━━━━━━━━━━━━━━━━━━━━━━━━━──────────
```

Results:
```
 7.2 / 10          Final round readiness  54 → 61
 "Strong stories; results come too late and without numbers."
 ROUND FIT          ✓ Deal strategy   ◐ Executive presence   ✗ 30-60-90 plan
 SWOT               2×2 grid
 DELIVERY           talk time 18:20 · 142 wpm · 23 filler words · longest answer 3:40
 QUESTIONS          1 Why Salesforce?  7.5  ▸   2 Biggest quota miss  6.0  ▸ …
                    (expands: your answer with keep/cut marks, strengths, improvements,
                     upgraded answer, follow-up)
 NEXT               [ Practice the 30-60-90 plan in Single questions ]  [ Back to round ]
```

Call (phone): job and round on top, large timer, question in large serif, live transcript below, one large garnet End call button at the bottom. No other controls.

## Decisions

### 1. Stack: Next.js (App Router) + Tailwind CSS, on Vercel
Server Components for data pages, client components for voice and threads, Route Handlers (Node runtime) for AI. Tailwind v4 holds both themes as CSS variables.
No component library: their defaults drive the "AI-made" look. Native elements styled with tokens: `<dialog>`, `<details>`, `<input type="date">`, `<input type="time">`.

### 2. Data and auth: Supabase via Vercel Marketplace
Provision with `vercel integration add supabase` (confirm the slug with `vercel integration discover` at build time), then `vercel env pull`. Client: `@supabase/ssr` with cookie sessions; `proxy.ts` refreshes the session and redirects signed-out requests on protected paths to `/signin?next=…`.
Auth: email magic link (`signInWithOtp`), `/auth/callback` exchanges the code, then routes to `/start` or `/jobs` based on `profiles.onboarded`.
Alternative: localStorage (rejected by the team: needs real accounts and data).

Tables (all with `user_id uuid references auth.users on delete cascade`, RLS on, policy `user_id = auth.uid()` for all operations):

| Table | Key columns |
|---|---|
| `profiles` | id (= auth uid), name, program, target_roles text[], resume_path, resume_text, resume_analysis jsonb, theme ('light' default), onboarded bool |
| `jobs` | company, role, source_url, posting_text, brief jsonb (company wants, skills, sources, tags), status ('preparing','offer','rejected','withdrawn') |
| `rounds` | job_id, position, name, format, length_minutes, interviewer_type, asks jsonb, expects jsonb, skill_ids uuid[], date, interviewer_notes, outcome, went_well, went_wrong, asked_questions text[], snapshot jsonb |
| `skills` | job_id, name, reason, score int default 50, last_practiced_at |
| `skill_scores` | skill_id, answer_id, score, created_at (history for trends) |
| `plan_days` | round_id, day date, skill_id, tool ('single','call','full'), minutes, done |
| `sessions` | job_id, round_id, tool, length_minutes, status ('active','complete','incomplete'), review jsonb (verdict, swot, round_fit, delivery), started_at, ended_at |
| `answers` | session_id, skill_id, question, question_type, parent_answer_id (follow-ups), text, seconds, word_count, overall, structure, relevance, impact, delivery, feedback jsonb |
| `threads` | kind ('single','chat'), round_id (single only), title |
| `messages` | thread_id, role ('user','assistant'), content, card jsonb (question / feedback / swot / actions), answer_id |
| `leads` | name, school, email; no user_id; `anon` may insert only, nobody may select through the API |

Storage: private bucket `resumes`, object path `{uid}/resume.pdf`, policy restricts to the owner's folder.
Delete account: `POST /api/account/delete` uses the service-role key server-side to delete the storage object and the auth user; cascades remove all rows.

### 3. AI: AI SDK through Vercel AI Gateway, Claude Sonnet 5.5
Model `anthropic/claude-sonnet-5-5`. Structured output with Zod schemas for every non-chat call; check `node_modules/ai/docs/` for the AI SDK 7 API before writing calls. Every handler verifies the Supabase session, loads context server-side (never trusts client-sent profile or brief), caps input sizes (posting 15k chars, answer 6k chars, PDF 3 MB), and returns 502 with a message on model failure.

| Route | Purpose |
|---|---|
| `POST /api/profile/analyze` | resume (PDF file part or text) → strengths, gaps, named stories |
| `POST /api/research` | job input → streamed progress events, then brief (company wants, skills, rounds with asks/expects, sources, tags) |
| `POST /api/interview/start` | round + length → persona intro + ordered main questions (generated once, up front) |
| `POST /api/interview/next` | last answer → follow-up text or "none" (small, fast call) |
| `POST /api/interview/review` | session → per-answer feedback (parallel calls) + verdict, SWOT, round fit |
| `POST /api/feedback` | one answer → shared feedback schema (used by Call and Single questions) |
| `POST /api/single` | thread turn → question card, SWOT card, or plain reply |
| `POST /api/chat` | streaming chat with the person's data as context and an action-button tool |

Generating main questions up front keeps the live interview responsive: only the follow-up decision happens between answers.
Upgraded answers: the prompt forbids new facts and requires `[placeholder]` for missing numbers; the schema returns a `placeholders` array the UI highlights.

### 4. Job research: Claude's web tools first, Firecrawl + Exa as fallback
Default: Claude's server-side web search and web fetch tools through the gateway, so one key covers reading the link and searching interview reports. Task 1.3 verifies the gateway supports them; if not, use Firecrawl (read the posting URL) and Exa (search interview reports, company values), adding `FIRECRAWL_API_KEY` and `EXA_API_KEY`. The spec does not change either way.
Research runs as one route that streams step events ("Reading the job post", "Searching interview reports", …) so the UI shows live progress; hard stop at 90 s with a partial brief. Every brief item carries `source: 'job_post' | 'web' | 'resume' | 'general'` and `url` for web items. Login-walled links (LinkedIn) are detected from the fetch result and the UI asks for pasted text.

### 5. Deterministic logic stays in code
Pure functions in `lib/coach.ts`, unit-tested:
- Job skill update `round(0.7·old + 0.3·overall·10)`; overall skills as the mean of the last 10 sub-scores × 10.
- Round readiness: rounded mean of the round's skills; "Early estimate" under 5 scored answers for the job.
- Weakest skill with the least-recently-practiced tie rule; difficulty band (<50 foundational, 50-74 standard, 75+ pressure).
- Plan builder and re-planner per round; `.ics` text.
- Delivery sub-score from words per minute against the target and filler count (um, uh, like, you know, basically, actually); overrides the model's value.
- Session delivery numbers (talk time, wpm, filler total, longest answer).
- Round progression on outcome (Advanced → next round active; Offer/Rejected/Withdrew → close job).

### 6. Voice: browser Web Speech API in one hook
`useSpeech` wraps `SpeechRecognition` (`webkitSpeechRecognition` fallback) with `continuous` and `interimResults`, and `speechSynthesis` with the best available English voice. Rules:
- Recognition stops while the interviewer speaks (prevents transcribing its own voice) and restarts on the utterance `end` event.
- Interim words render in `stone`, final words in `ink`.
- Chrome ends recognition after silence or about a minute; the hook restarts it automatically while an answer is open and joins the text.
- Full interview: the answer ends only on Done or Space. Call: 3 s silence after 15+ words ends it.
- Feature-detect on mount; unsupported browsers get typing (Full interview, Single questions) or a redirect suggestion (Call).
Alternative: gateway speech-to-text and text-to-speech models (better voices, Firefox support). Not for v1: needs audio streaming and adds latency. Upgrade path if browser voices sound too robotic in rehearsal.

### 7. Visual system
**Visual source of truth: `design/mock/`** (approved by the team lead 2026-11-19; live canvas https://claude.ai/artifact/QbF7yg4LwkTV94qTEhbqYi). One `.dc.html` per screen plus `ix.css`, which holds the exact tokens, components and motion (press scale 0.96 / 150ms, 100ms entrance stagger with 4px blur + 12px rise / 300ms ease-out, `cubic-bezier(0.2,0,0,1)`, reduced-motion gate). Port `ix.css` into the app's global styles and match each screen's layout and copy; the `.dc.html` template syntax (`{{ }}`, `sc-if`, `sc-for`) is mock-only.

Light is the default and does not follow the OS setting; `profiles.theme` sets `data-theme` on `<html>` from the server, so no flash.

| Token | Light (default) | Dark (optional) | Use |
|---|---|---|---|
| `paper` | #FFFFFF | #1C1B19 | page background |
| `ivory` | #F8F5EE | #252320 | alternate sections, card fill |
| `ink` | #2A2826 | #F3EFE6 | headings, questions, numbers, settled transcript |
| `stone` | #696866 | #B3AEA4 | body text, interim transcript |
| `olive` | #383E28 | #A9B08A | primary buttons, bars, focus, listening dot |
| `on-olive` | #FFFFFF | #1C1B19 | text on olive |
| `garnet` | #7B2B24 | #D9897D | accent word, over-time, cut marks, End call |
| `gold` | #E9D58A | #C9B66C | highlight fill only (keep marks, weak-spot day) |
| `hairline` | #E5E2DA | #3A3733 | borders, rules |

Type: IvyPresto Display is a paid Adobe font, so the display serif is **Cormorant Garamond** (300/400, italic for accent words) and body is **Open Sans** (300/400), both via `next/font`. Eyebrow labels: Open Sans 12px, uppercase, letter-spacing 0.18em, `stone`.
Layout: max width 1200px; 24px gutter (16px on phone); landing sections 96-128px apart. Buttons: square, olive fill, Cormorant 17px label, min height 56px; secondary is a 1px ink border. Cards: hairline border or ivory fill, ≤2px radius, no shadow. The round page shows the five tools as a row of five tall hairline tiles (number, serif name, one-line description) that stack on phones.
Scores: Cormorant numerals at 56-72px with a 2px olive bar; trends as 1px inline SVG lines; no chart library.
Threads: transcript style per the visual-identity spec.
Motion: 200 ms fades; readiness counts from old to new value; all off under reduced motion.
Copy: short, plain, second person. Never "AI-powered", "unlock", "supercharge", "seamless".

### 8. Testing
- `lib/coach.test.ts` via `node --test` (Node 24 strips TS types): all functions in decision 5.
- `scripts/rls-check.ts`: create two users, insert a job as user A, confirm user B cannot read or update it and anon cannot read `leads`.
- `scripts/smoke.ts`: call each AI route as a test user, validate output against the Zod schemas, check 413 on oversize input.
- End-to-end walk in Chrome desktop and Safari on iPhone along the demo path below.

### 9. Demo path (about 4 of the 8 minutes)
Presenter is already signed in with a Salesforce job prepared the day before.
1. Landing: hero and problem line (15 s), then My Jobs.
2. Add a job live with a public posting link; show research steps and the source-tagged brief; confirm rounds.
3. Open the Salesforce Final round: expectations, today's task, the five tools.
4. Full interview (15 min setting, answer 1–2 questions live): question appears and is spoken, words appear as spoken, one follow-up; End interview → loading → results with round fit and SWOT.
5. Feedback: readiness 54 → 61, weakest skill moved.
6. Call on a phone (mirrored): one question, one spoken tip.
7. Chat: "What should I fix before Thursday?"

## Risks / Trade-offs

- [Supabase's built-in email sender has a low hourly limit and can land in spam] → configure custom SMTP before the demo (any transactional email provider), and sign the presenter in ahead of time.
- [Claude web tools not available through AI Gateway] → Firecrawl + Exa fallback (decision 4).
- [Research invents round structures] → source tags, "not verified" labels, and the confirm-rounds step.
- [Model latency on stage] → questions generated up front; review runs answers in parallel; staged loading screen; rehearse on the venue network.
- [Speech recognition quirks, especially Safari on iPhone] → auto-restart in the hook; typing always available in Full interview; record a backup video of the voice flow.
- [Interviewer voice picked up by the mic] → recognition off while speaking; headphones tip.
- [Font substitution] → Cormorant 300 with tight leading; swap in one place if the team has Adobe Fonts.

## Migration Plan

1. `vercel link`; add Supabase and enable AI Gateway; `vercel env pull`.
2. Apply SQL migrations (tables, RLS, bucket policy) with the Supabase CLI.
3. Deploy preview, run smoke and RLS scripts, walk the demo path, promote to production.
4. Rollback: promote the previous deployment; migrations are additive.

## Open Questions

- Final wordmark: "InterviewX" in Cormorant with the X in garnet, unless the team has a logo.
- Which transactional email provider to use for Supabase SMTP (any works; affects only setup).
