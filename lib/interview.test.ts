import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoresForRound } from './interview.ts';

test('scorecard scores follow the round criteria; skipped ones score 0', () => {
  const out = scoresForRound(['Discovery', 'Objection handling'], [{ criterion: ' discovery ', score: 7.6, note: 'Good questions' }]);
  assert.deepEqual(out, [
    { criterion: 'Discovery', score: 8, note: 'Good questions' },
    { criterion: 'Objection handling', score: 0, note: 'Not covered' },
  ]);
});
