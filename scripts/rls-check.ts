// Checks row level security on the linked Supabase project.
// Run: node --env-file=.env.local scripts/rls-check.ts
// Creates two throwaway users with the service-role key, checks isolation, then deletes them.
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

async function makeUser(tag: string) {
  const email = `rls-${tag}-${Date.now()}@example.com`;
  const password = crypto.randomUUID();
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  assert.ifError(error);
  const client = createClient(url, anon, { auth: { persistSession: false } });
  assert.ifError((await client.auth.signInWithPassword({ email, password })).error);
  return { id: data.user!.id, client };
}

const a = await makeUser('a');
const b = await makeUser('b');
try {
  const { data: job, error } = await a.client.from('jobs').insert({ company: 'Acme', role: 'Tester' }).select().single();
  assert.ifError(error);
  assert.equal(job.user_id, a.id, 'user_id defaults to the signed-in user');

  const read = await b.client.from('jobs').select().eq('id', job.id);
  assert.equal(read.data?.length, 0, 'user B cannot read A\'s job');
  const upd = await b.client.from('jobs').update({ company: 'Hacked' }).eq('id', job.id).select();
  assert.equal(upd.data?.length ?? 0, 0, 'user B cannot update A\'s job');
  const del = await b.client.from('jobs').delete().eq('id', job.id).select();
  assert.equal(del.data?.length ?? 0, 0, 'user B cannot delete A\'s job');
  const forge = await b.client.from('jobs').insert({ company: 'X', role: 'Y', user_id: a.id });
  assert.ok(forge.error, 'user B cannot insert a row owned by A');
  assert.equal((await a.client.from('jobs').select().eq('id', job.id)).data?.[0]?.company, 'Acme', 'A\'s job is unchanged');

  const anonClient = createClient(url, anon, { auth: { persistSession: false } });
  assert.equal((await anonClient.from('jobs').select()).data?.length ?? 0, 0, 'anon cannot read jobs');
  const lead = await anonClient.from('leads').insert({ name: 'RLS check', school: 'Test', email: 'rls@example.com' });
  assert.ifError(lead.error);
  const leads = await anonClient.from('leads').select();
  assert.ok(leads.error || leads.data?.length === 0, 'anon cannot read leads');
  const leadsB = await b.client.from('leads').select();
  assert.ok(leadsB.error || leadsB.data?.length === 0, 'signed-in users cannot read leads');

  const path = `${a.id}/resume.pdf`;
  const pdf = new Blob(['%PDF-1.4 test'], { type: 'application/pdf' });
  assert.ifError((await a.client.storage.from('resumes').upload(path, pdf, { upsert: true })).error);
  assert.ok((await b.client.storage.from('resumes').download(path)).error, 'user B cannot download A\'s resume');
  assert.ok((await b.client.storage.from('resumes').upload(path, pdf, { upsert: true })).error, 'user B cannot overwrite A\'s resume');
  console.log('RLS check passed');
} finally {
  await admin.storage.from('resumes').remove([`${a.id}/resume.pdf`]);
  await admin.from('leads').delete().eq('email', 'rls@example.com');
  await admin.auth.admin.deleteUser(a.id);
  await admin.auth.admin.deleteUser(b.id);
}
