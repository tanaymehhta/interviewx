-- What each round is scored on: [{ criterion, strong, source, url }]. Filled by job research.
alter table public.rounds add column scorecard jsonb not null default '[]';
