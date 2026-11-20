import { test } from 'node:test';
import assert from 'node:assert/strict';
import { workdayJson, jsonLdPosting } from './posting.ts';

test('Workday link maps to its JSON endpoint, without locale or query', () => {
  assert.equal(
    workdayJson('https://salesforce.wd12.myworkdayjobs.com/en-US/External_Career_Site/job/Senior-PMM_JR363987?utm_source=x'),
    'https://salesforce.wd12.myworkdayjobs.com/wday/cxs/salesforce/External_Career_Site/job/Senior-PMM_JR363987',
  );
  assert.equal(workdayJson('https://example.com/job/1'), null);
});

test('JobPosting data is read from the page, also inside @graph', () => {
  const page = (d: unknown) => `<html><script type="application/ld+json">${JSON.stringify(d)}</script></html>`;
  const job = { '@type': 'JobPosting', title: 'SDR', hiringOrganization: { name: 'Acme' }, description: '<p>Call &amp; qualify leads</p>' };
  assert.equal(jsonLdPosting(page(job)), 'SDR. Acme. Call & qualify leads');
  assert.equal(jsonLdPosting(page({ '@graph': [{ '@type': 'Organization' }, job] })), 'SDR. Acme. Call & qualify leads');
  assert.equal(jsonLdPosting('<html><script type="application/ld+json">{bad</script></html>'), null);
});
