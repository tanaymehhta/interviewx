# supabase/: the database

Read the root `AGENTS.md` first. **There is one database and it is the live one.** A mistake here affects real accounts.

## What you may do

- **Write** a new migration file in `migrations/`, named `YYYYMMDDHHMMSS_short_name.sql` with a timestamp later than every existing file.
- Mirror the change in `lib/database.types.ts` in the same pull request, so the code type-checks.
- Describe the change, and why, in the pull request.

## What you may not do

- **Do not apply a migration.** Do not run `supabase db push`, `supabase db reset`, or SQL against the database. Tanay applies migrations after review.
- Do not edit a migration that is already applied. Add a new one.
- Do not delete or rewrite rows to "clean up".

## Tables

All are in the `public` schema. Each row belongs to one user (`user_id`, or `id` for `profiles`), except `leads`, which has no owner.

| Table | Holds |
|---|---|
| `profiles` | Name, program, target roles, theme, resume text and path, resume analysis, `onboarded` |
| `jobs` | Company, role, posting link and text, `brief` (JSON: summary, company wants, requirements, missing, researched date), status |
| `skills` | The job's key skills, each with a score from 0 to 100 |
| `rounds` | One interview round: name, format, length, `asks`, `expects`, `scorecard` (JSON), date, notes, outcome |
| `plan_days` | The day-by-day practice plan for a round |
| `sessions` | One practice session (Full interview, Call, Single questions): script, review, status |
| `answers` | One answer: question, text, seconds, scores, feedback JSON |
| `skill_scores` | The history of each skill's score |
| `threads`, `messages` | The coach chat and the Single questions thread |
| `leads` | Emails from the landing page form. Insert only; nobody can read them through the app. |

Resume PDFs are in the private storage bucket `resumes`, under a folder named with the user's id.

## Rules for a new table or column

- Turn on row-level security and add a policy so a person reaches only their own rows. Copy the pattern in `migrations/20261119000002_rls.sql`.
- `user_id uuid not null default auth.uid() references auth.users on delete cascade`, so deleting an account removes the rows.
- Give a new `not null` column a default, so existing rows stay valid.
- JSON columns have their shape in `lib/schemas.ts`. Add the shape there.
- After Tanay applies the migration, `node --env-file=.env.local scripts/rls-check.ts` must still pass.
