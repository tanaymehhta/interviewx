// Checks that Claude's server-side web search works through AI Gateway.
// Run: node --env-file=.env.local scripts/gateway-check.ts
import { generateText, isStepCount } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

const model = process.argv[2] ?? 'anthropic/claude-sonnet-5.5';
const r = await generateText({
  model,
  prompt: 'Search the web: how many interview rounds does Salesforce use for account executives? One sentence, cite one URL.',
  stopWhen: isStepCount(5),
  tools: { web_search: anthropic.tools.webSearch_20250305({ maxUses: 2 }) },
});
console.log(r.text);
console.log('sources:', r.sources.length);
if (!r.sources.length) process.exit(1);
