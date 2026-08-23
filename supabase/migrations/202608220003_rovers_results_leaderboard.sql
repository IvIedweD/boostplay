create table if not exists public.rovers_results (
  id bigint generated always as identity primary key,
  session_id text not null,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  score integer not null check (score >= 0),
  highest_level smallint not null check (highest_level between 1 and 8),
  merges integer not null check (merges >= 0),
  legendary_count integer not null default 0 check (legendary_count >= 0),
  duration_seconds integer not null check (duration_seconds between 0 and 14400),
  difficulty text not null default 'standard' check (difficulty = 'standard'),
  client_completed_at timestamptz not null,
  received_at timestamptz not null default now(),
  status text not null default 'accepted' check (status in ('accepted', 'review', 'rejected')),
  unique (user_id, session_id)
);

create index if not exists rovers_results_leaderboard_idx
  on public.rovers_results (score desc, received_at asc)
  where status = 'accepted';

alter table public.rovers_results enable row level security;

drop policy if exists accepted_rovers_results_are_public on public.rovers_results;
create policy accepted_rovers_results_are_public
on public.rovers_results for select
to anon, authenticated
using (status = 'accepted');

revoke all on public.rovers_results from anon, authenticated;

create or replace function public.submit_rovers_result(
  submitted_session_id text,
  submitted_score integer,
  submitted_highest_level integer,
  submitted_merges integer,
  submitted_legendary_count integer,
  submitted_duration_seconds integer,
  submitted_difficulty text,
  submitted_completed_at timestamptz
)
returns table (accepted boolean, duplicate boolean, best_score integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  existing_result public.rovers_results%rowtype;
begin
  if current_user_id is null then
    raise exception using errcode = '42501', message = 'authentication_required';
  end if;

  if not exists (
    select 1 from public.profiles
    where user_id = current_user_id and status = 'active'
  ) then
    raise exception using errcode = '42501', message = 'active_profile_required';
  end if;

  select * into existing_result
  from public.rovers_results
  where user_id = current_user_id and session_id = submitted_session_id;

  if found then
    return query
      select true, true, max(score)
      from public.rovers_results
      where user_id = current_user_id and status = 'accepted';
    return;
  end if;

  if submitted_session_id !~ '^rovers-session-[A-Za-z0-9_-]{8,128}$'
    or submitted_score < 0
    or submitted_highest_level not between 1 and 8
    or submitted_merges < 0
    or submitted_merges > 20000
    or submitted_legendary_count < 0
    or submitted_legendary_count > submitted_merges
    or submitted_duration_seconds not between 0 and 14400
    or submitted_difficulty <> 'standard'
    or submitted_completed_at > now() + interval '5 minutes'
    or submitted_completed_at < now() - interval '1 day'
    or (submitted_merges = 0 and submitted_score <> 0)
    or submitted_score > submitted_merges * 900
    or (submitted_legendary_count > 0 and submitted_highest_level <> 8)
  then
    raise exception using errcode = '22023', message = 'implausible_rovers_result';
  end if;

  insert into public.rovers_results (
    session_id,
    user_id,
    score,
    highest_level,
    merges,
    legendary_count,
    duration_seconds,
    difficulty,
    client_completed_at
  ) values (
    submitted_session_id,
    current_user_id,
    submitted_score,
    submitted_highest_level,
    submitted_merges,
    submitted_legendary_count,
    submitted_duration_seconds,
    submitted_difficulty,
    submitted_completed_at
  );

  return query
    select true, false, max(score)
    from public.rovers_results
    where user_id = current_user_id and status = 'accepted';
end;
$$;

create or replace function public.get_rovers_leaderboard(requested_limit integer default 50)
returns table (
  rank bigint,
  player_id uuid,
  display_name text,
  score integer,
  avatar_id text
)
language sql
stable
security definer
set search_path = ''
as $$
  with player_bests as (
    select distinct on (result.user_id)
      result.user_id,
      result.score as best_score,
      result.received_at as first_reached_at
    from public.rovers_results result
    where result.status = 'accepted'
    order by result.user_id, result.score desc, result.received_at asc
  ), ranked as (
    select
      row_number() over (
        order by best.best_score desc, best.first_reached_at asc, best.user_id asc
      ) as rank,
      best.user_id as player_id,
      profile.display_name,
      best.best_score as score,
      profile.avatar_id
    from player_bests best
    join public.profiles profile on profile.user_id = best.user_id
    where profile.status = 'active'
  )
  select ranked.rank, ranked.player_id, ranked.display_name, ranked.score, ranked.avatar_id
  from ranked
  order by ranked.rank
  limit least(100, greatest(3, coalesce(requested_limit, 50)));
$$;

revoke all on function public.submit_rovers_result(text, integer, integer, integer, integer, integer, text, timestamptz) from public, anon;
grant execute on function public.submit_rovers_result(text, integer, integer, integer, integer, integer, text, timestamptz) to authenticated;

revoke all on function public.get_rovers_leaderboard(integer) from public;
grant execute on function public.get_rovers_leaderboard(integer) to anon, authenticated;

comment on table public.rovers_results is
  'Server-owned Rovers results. Clients submit through submit_rovers_result; direct writes are revoked.';
comment on function public.submit_rovers_result is
  'Idempotent authenticated result ingestion with basic plausibility validation. Full anti-cheat requires authoritative server simulation.';
comment on function public.get_rovers_leaderboard is
  'Public leaderboard exposing only active profile display names and accepted best scores.';
