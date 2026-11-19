import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pendingQuestion, suggestions } from './thread.ts';

const q = (text: string) => ({ card: { type: 'question' as const, question: { text, type: 'Behavioral', difficulty: 'standard' as const, why: '', skill: '' } } });
const feedback = { card: { type: 'feedback' as const, feedback: null } };
const plain = { card: null };

test('a question stays open through hints and short answers, and closes on feedback', () => {
  assert.equal(pendingQuestion([]), null);
  assert.equal(pendingQuestion([q('A'), plain, plain])?.text, 'A');
  assert.equal(pendingQuestion([q('A'), plain, feedback]), null);
  assert.equal(pendingQuestion([q('A'), feedback, q('B')])?.text, 'B');
});

test('suggestions: at most four, weakest skill first, a real-round question included', () => {
  const fact = (text: string) => ({ text, source: 'web' as const, url: null });
  const s = suggestions('Storytelling', [fact('a'), fact('b'), fact('c')], ['real one', 'real two']);
  assert.deepEqual(s.map((x) => x.label), ['A question on Storytelling', 'a', 'b', 'Asked in your real round: “real one”']);
  assert.deepEqual(suggestions(null, [], []), []);
});
