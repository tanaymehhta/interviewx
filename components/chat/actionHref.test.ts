import { test } from 'node:test';
import assert from 'node:assert/strict';
import { actionHref } from './actionHref.ts';

const rounds = { r1: 'j1', r2: 'j2' };

test('action buttons open the matching tool', () => {
  assert.equal(actionHref({ type: 'single', topic: '30-60-90 day plan?' }, rounds, 'r1'), '/jobs/j1/r1/practice?q=30-60-90%20day%20plan%3F');
  assert.equal(actionHref({ type: 'single', topic: null }, rounds, 'r1'), '/jobs/j1/r1/practice');
  assert.equal(actionHref({ type: 'full', round_id: 'r2' }, rounds, 'r1'), '/jobs/j2/r2/interview');
  assert.equal(actionHref({ type: 'scorecard', round_id: 'made-up' }, rounds, 'r1'), '/jobs/j1/r1/scorecard');
  assert.equal(actionHref({ type: 'scorecard' }, rounds, null), null);
});
