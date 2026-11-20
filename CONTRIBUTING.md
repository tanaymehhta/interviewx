# Contributing to InterviewX

The full guide is [`AGENTS.md`](AGENTS.md). It is written for AI coding agents and for people who are new to code. This page is the short version.

## Suggest a change (no code needed)

Open an issue: https://github.com/tanaymehhta/interviewx/issues/new

Say what you saw, what you expected, and why it matters. Add a screenshot if you can. Never include a password, a key, or someone's private details.

## Make a change

1. Get the newest code and make a branch: `git checkout main && git pull && git checkout -b short-name`.
2. Make the smallest change that does the job.
3. Run `npm run check`. It must pass.
4. Look at the result in the browser (`npm run dev`), at phone width and in the dark theme if the look changed.
5. Push the branch and open a pull request: `git push -u origin short-name && gh pr create --fill`.
6. Send the pull request link to Tanay. Only Tanay merges.

## Rules that protect the live site

- **Never push to `main`.** It updates the live site within about a minute.
- **Never commit `.env.local`** or paste a key anywhere. `.env.example` lists the names only.
- **Do not change the live database.** Put database changes in a new file under `supabase/migrations/`; Tanay applies them.
- **AI calls cost money.** Do not run them in a loop.

## Before you report a problem

Check the **Open items** and **Known limits** in [`README.md`](README.md). If the problem is listed there (for example, the sign-in email did not arrive, or the brief says "Source check did not finish"), it is already known.
