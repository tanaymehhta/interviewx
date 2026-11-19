import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EMAIL, parseRoles, safeNext } from './shared.ts';

test('safeNext keeps same-site paths only', () => {
  assert.equal(safeNext('/jobs/abc?x=1'), '/jobs/abc?x=1');
  for (const bad of ['//evil.com', '/\\evil.com', 'https://evil.com', 'jobs', '', null, undefined, ['/jobs']]) {
    assert.equal(safeNext(bad), null);
  }
});

test('parseRoles splits, trims, and drops blanks', () => {
  assert.deepEqual(parseRoles(' Sales manager, ,strategy associate\n'), ['Sales manager', 'strategy associate']);
  assert.equal(parseRoles('a,b,c,d,e,f').length, 6);
});

test('EMAIL rejects "abc@"', () => {
  assert.equal(EMAIL.test('abc@'), false);
  assert.equal(EMAIL.test('priya@school.edu'), true);
});
