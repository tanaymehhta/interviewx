// Checks the model and web search through OpenRouter.
// Run: node --env-file=.env.local scripts/model-check.ts
import { generateText, isStepCount } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

const openrouter = createOpenRouter();
const r = await generateText({
  model: openrouter(process.argv[2] ?? 'anthropic/claude-sonnet-5.5'),
  prompt: 'Search the web: how many interview rounds does Salesforce use for account executives? One sentence, cite one URL.',
  stopWhen: isStepCount(5),
  tools: { web_search: openrouter.tools.webSearch({ maxResults: 3 }) },
});
console.log(r.text);
console.log('sources:', r.sources.length);
if (!r.sources.length) process.exit(1);
