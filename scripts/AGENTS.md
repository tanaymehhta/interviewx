# scripts/: helper and check scripts

Read the root `AGENTS.md` first. These run with plain Node 24, which runs TypeScript files directly. Most need `.env.local`.

| Script | Run it with | What it does | Cost or side effect |
|---|---|---|---|
| `contrast.ts` | `node scripts/contrast.ts` | Checks text contrast for both themes from the tokens in `app/globals.css` | None |
| `dev-login.ts` | `node --env-file=.env.local scripts/dev-login.ts [email] [origin]` | Prints a one-time sign-in link, so local testing does not wait for an email. The origin defaults to `http://localhost:3000`. | Creates the account in the live database if it does not exist |
| `rls-check.ts` | `node --env-file=.env.local scripts/rls-check.ts` | Creates two throwaway accounts, checks that neither can read the other's rows, then deletes them | Writes to and cleans up the live database |
| `model-check.ts` | `node --env-file=.env.local scripts/model-check.ts [model-id]` | One AI call with web search through OpenRouter | Spends a little OpenRouter credit |

## Rules

- Scripts that use `SUPABASE_SERVICE_ROLE_KEY` bypass all data protection. Keep them small and read them before you run them.
- Use an `@example.com` address for test accounts, so no real email is sent. Delete test accounts when you finish (sign in as the account, then Settings → Delete account).
- Never print a secret value. Print names and lengths only.
- A new script starts with a comment that says what it does and how to run it.
