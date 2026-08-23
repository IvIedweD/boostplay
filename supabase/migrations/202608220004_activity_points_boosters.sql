create table if not exists public.rovers_booster_activations (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  double_score boolean not null default false,
  stabilizer boolean not null default false,
  cost integer not null check (cost > 0),
  status text not null default 'purchased' check (status in ('purchased', 'consumed', 'expired', 'cancelled')),
  created_at timestamptz not null default now(),
  consumed_at timestamptz,
  unique (user_id, request_id)
);

create table if not exists public.activity_point_ledger (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  amount integer not null check (amount <> 0),
  reason text not null check (reason in ('booster_purchase', 'admin_grant', 'activity_reward', 'refund')),
  reference_id uuid,
  created_at timestamptz not null default now()
);

alter table public.rovers_booster_activations enable row level security;
alter table public.activity_point_ledger enable row level security;
revoke all on public.rovers_booster_activations from anon, authenticated;
revoke all on public.activity_point_ledger from anon, authenticated;

create or replace function public.purchase_rovers_boosters(
  purchase_request_id uuid,
  requested_double_score boolean,
  requested_stabilizer boolean
)
returns table (activation_id uuid, activity_points integer, cost integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  calculated_cost integer :=
    case when requested_double_score then 120 else 0 end
    + case when requested_stabilizer then 180 else 0 end;
  current_balance integer;
  existing_activation public.rovers_booster_activations%rowtype;
  created_activation_id uuid;
begin
  if current_user_id is null then
    raise exception using errcode = '42501', message = 'authentication_required';
  end if;
  if purchase_request_id is null or calculated_cost <= 0 then
    raise exception using errcode = '22023', message = 'booster_selection_required';
  end if;

  select * into existing_activation
  from public.rovers_booster_activations
  where user_id = current_user_id and request_id = purchase_request_id;
  if found then
    select profile.activity_points into current_balance
    from public.profiles profile where profile.user_id = current_user_id;
    return query select existing_activation.id, current_balance, existing_activation.cost;
    return;
  end if;

  select profile.activity_points into current_balance
  from public.profiles profile
  where profile.user_id = current_user_id and profile.status = 'active'
  for update;
  if not found then
    raise exception using errcode = '42501', message = 'active_profile_required';
  end if;
  if current_balance < calculated_cost then
    raise exception using errcode = '22023', message = 'insufficient_activity_points';
  end if;

  update public.profiles as profile
  set activity_points = profile.activity_points - calculated_cost
  where profile.user_id = current_user_id
  returning profile.activity_points into current_balance;

  insert into public.rovers_booster_activations (
    request_id, user_id, double_score, stabilizer, cost
  ) values (
    purchase_request_id, current_user_id, requested_double_score, requested_stabilizer, calculated_cost
  ) returning id into created_activation_id;

  insert into public.activity_point_ledger (user_id, amount, reason, reference_id)
  values (current_user_id, -calculated_cost, 'booster_purchase', created_activation_id);

  return query select created_activation_id, current_balance, calculated_cost;
end;
$$;

alter table public.rovers_results
  add column if not exists booster_activation_id uuid
  references public.rovers_booster_activations(id);

create unique index if not exists rovers_results_booster_activation_idx
  on public.rovers_results (booster_activation_id)
  where booster_activation_id is not null;

drop function if exists public.submit_rovers_result(text, integer, integer, integer, integer, integer, text, timestamptz);

create or replace function public.submit_rovers_result(
  submitted_session_id text,
  submitted_score integer,
  submitted_highest_level integer,
  submitted_merges integer,
  submitted_legendary_count integer,
  submitted_duration_seconds integer,
  submitted_difficulty text,
  submitted_completed_at timestamptz,
  submitted_booster_activation_id uuid
)
returns table (accepted boolean, duplicate boolean, best_score integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  existing_result public.rovers_results%rowtype;
  booster_activation public.rovers_booster_activations%rowtype;
  score_multiplier integer := 1;
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
      select true, true, max(result.score)
      from public.rovers_results result
      where result.user_id = current_user_id and result.status = 'accepted';
    return;
  end if;

  if submitted_booster_activation_id is not null then
    select * into booster_activation
    from public.rovers_booster_activations activation
    where activation.id = submitted_booster_activation_id
      and activation.user_id = current_user_id
    for update;
    if not found or booster_activation.status <> 'purchased' then
      raise exception using errcode = '22023', message = 'invalid_booster_activation';
    end if;
    if booster_activation.created_at < now() - interval '4 hours' then
      raise exception using errcode = '22023', message = 'expired_booster_activation';
    end if;
    if booster_activation.double_score then score_multiplier := 2; end if;
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
    or submitted_score > submitted_merges * 900 * score_multiplier
    or (submitted_legendary_count > 0 and submitted_highest_level <> 8)
  then
    raise exception using errcode = '22023', message = 'implausible_rovers_result';
  end if;

  insert into public.rovers_results (
    session_id, user_id, score, highest_level, merges, legendary_count,
    duration_seconds, difficulty, client_completed_at, booster_activation_id
  ) values (
    submitted_session_id, current_user_id, submitted_score, submitted_highest_level,
    submitted_merges, submitted_legendary_count, submitted_duration_seconds,
    submitted_difficulty, submitted_completed_at, submitted_booster_activation_id
  );

  if submitted_booster_activation_id is not null then
    update public.rovers_booster_activations
    set status = 'consumed', consumed_at = now()
    where id = submitted_booster_activation_id;
  end if;

  return query
    select true, false, max(result.score)
    from public.rovers_results result
    where result.user_id = current_user_id and result.status = 'accepted';
end;
$$;

revoke all on function public.purchase_rovers_boosters(uuid, boolean, boolean) from public, anon;
grant execute on function public.purchase_rovers_boosters(uuid, boolean, boolean) to authenticated;
revoke all on function public.submit_rovers_result(text, integer, integer, integer, integer, integer, text, timestamptz, uuid) from public, anon;
grant execute on function public.submit_rovers_result(text, integer, integer, integer, integer, integer, text, timestamptz, uuid) to authenticated;

comment on function public.purchase_rovers_boosters is
  'Atomically deducts activity points and creates an idempotent one-session Rovers booster activation.';
