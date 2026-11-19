-- Row level security: each person reads and changes only their own rows.

alter table public.profiles enable row level security;
create policy "own profile" on public.profiles for all to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

do $$
declare t text;
begin
  foreach t in array array['jobs', 'skills', 'rounds', 'plan_days', 'sessions', 'answers', 'skill_scores', 'threads', 'messages']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "own rows" on public.%I for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;
grant select, insert, update, delete on public.profiles to authenticated;

-- Leads: anyone may add one; nobody may read them through the API.
alter table public.leads enable row level security;
create policy "anyone can add a lead" on public.leads for insert to anon, authenticated with check (true);
revoke all on public.leads from anon, authenticated;
grant insert on public.leads to anon, authenticated;

-- Resumes: private bucket, one folder per person named by their user id.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('resumes', 'resumes', false, 3145728, array['application/pdf'])
on conflict (id) do nothing;

create policy "own resume folder" on storage.objects for all to authenticated
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'resumes' and (storage.foldername(name))[1] = (select auth.uid())::text);
