-- InterviewX schema (design.md decision 2). Every row belongs to one auth user; deleting the user cascades.

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  name text,
  program text,
  target_roles text[] not null default '{}',
  resume_path text,
  resume_text text,
  resume_analysis jsonb,
  theme text not null default 'light' check (theme in ('light', 'dark')),
  onboarded boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  company text not null,
  role text not null,
  source_url text,
  posting_text text,
  brief jsonb not null default '{}',
  status text not null default 'preparing' check (status in ('preparing', 'offer', 'rejected', 'withdrawn')),
  created_at timestamptz not null default now()
);

create table public.skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  job_id uuid not null references public.jobs on delete cascade,
  name text not null,
  reason text,
  score int not null default 50 check (score between 0 and 100),
  last_practiced_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.rounds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  job_id uuid not null references public.jobs on delete cascade,
  position int not null,
  name text not null,
  format text,
  length_minutes int,
  interviewer_type text,
  asks jsonb not null default '[]',
  expects jsonb not null default '[]',
  skill_ids uuid[] not null default '{}',
  date date,
  interviewer_notes text,
  outcome text check (outcome in ('waiting', 'advanced', 'offer', 'rejected', 'withdrew')),
  went_well text,
  went_wrong text,
  asked_questions text[] not null default '{}',
  snapshot jsonb,
  created_at timestamptz not null default now()
);

create table public.plan_days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  round_id uuid not null references public.rounds on delete cascade,
  day date not null,
  skill_id uuid references public.skills on delete set null,
  tool text not null check (tool in ('single', 'call', 'full')),
  minutes int not null check (minutes between 10 and 45),
  done boolean not null default false,
  unique (round_id, day)
);

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  job_id uuid not null references public.jobs on delete cascade,
  round_id uuid not null references public.rounds on delete cascade,
  tool text not null check (tool in ('single', 'call', 'full')),
  length_minutes int,
  status text not null default 'active' check (status in ('active', 'complete', 'incomplete')),
  script jsonb,  -- persona intro and the main questions, generated once at start
  review jsonb,  -- verdict, swot, round_fit, delivery, readiness before/after
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

create table public.answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  job_id uuid not null references public.jobs on delete cascade,
  session_id uuid not null references public.sessions on delete cascade,
  skill_id uuid references public.skills on delete set null,
  question text not null,
  question_type text,
  parent_answer_id uuid references public.answers on delete cascade,
  text text not null,
  seconds int,
  word_count int,
  overall numeric(3, 1),  -- null until scored
  structure numeric(3, 1),
  relevance numeric(3, 1),
  impact numeric(3, 1),
  delivery numeric(3, 1),
  feedback jsonb,
  created_at timestamptz not null default now()
);

create table public.skill_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  skill_id uuid not null references public.skills on delete cascade,
  answer_id uuid references public.answers on delete cascade,
  score int not null,
  created_at timestamptz not null default now()
);

create table public.threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  kind text not null check (kind in ('single', 'chat')),
  round_id uuid references public.rounds on delete cascade,
  title text,
  created_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  thread_id uuid not null references public.threads on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null default '',
  card jsonb,
  answer_id uuid references public.answers on delete set null,
  created_at timestamptz not null default now()
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  school text not null,
  email text not null,
  created_at timestamptz not null default now()
);

create index on public.jobs (user_id);
create index on public.rounds (job_id);
create index on public.skills (job_id);
create index on public.plan_days (round_id);
create index on public.sessions (round_id);
create index on public.answers (job_id, created_at desc);
create index on public.answers (session_id);
create index on public.skill_scores (skill_id, created_at);
create index on public.messages (thread_id, created_at);
