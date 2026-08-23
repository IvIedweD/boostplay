alter table public.activity_point_ledger
  add column if not exists actor_user_id uuid references public.profiles(user_id) on delete set null,
  add column if not exists note text;

alter table public.activity_point_ledger
  drop constraint if exists activity_point_ledger_reason_check;
alter table public.activity_point_ledger
  add constraint activity_point_ledger_reason_check
  check (reason in ('booster_purchase', 'admin_grant', 'admin_adjustment', 'activity_reward', 'refund'));

create table if not exists public.admin_audit_log (
  id bigint generated always as identity primary key,
  actor_user_id uuid not null references public.profiles(user_id) on delete restrict,
  target_user_id uuid references public.profiles(user_id) on delete set null,
  action text not null check (action in ('activity_points_adjusted', 'profile_status_changed')),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_access_guards (
  user_id uuid primary key references public.profiles(user_id) on delete cascade,
  failed_attempts integer not null default 0 check (failed_attempts >= 0),
  window_started_at timestamptz not null default now(),
  blocked_until timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists activity_point_ledger_user_created_idx
  on public.activity_point_ledger (user_id, created_at desc);
create index if not exists admin_audit_log_created_idx
  on public.admin_audit_log (created_at desc);

alter table public.admin_audit_log enable row level security;
alter table public.admin_access_guards enable row level security;
revoke all on public.admin_audit_log from public, anon, authenticated;
revoke all on public.admin_access_guards from public, anon, authenticated;

create or replace function public.admin_adjust_activity_points(
  target_user_id uuid,
  adjustment integer,
  adjustment_note text,
  actor_user_id uuid
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_balance integer;
  next_balance integer;
  clean_note text := trim(coalesce(adjustment_note, ''));
begin
  if adjustment = 0 or abs(adjustment) > 100000 then
    raise exception using errcode = '22023', message = 'invalid_activity_point_adjustment';
  end if;
  if char_length(clean_note) < 3 or char_length(clean_note) > 240 then
    raise exception using errcode = '22023', message = 'admin_note_required';
  end if;
  if not exists (
    select 1 from public.profiles profile
    where profile.user_id = actor_user_id
      and profile.role = 'admin'
      and profile.status = 'active'
  ) then
    raise exception using errcode = '42501', message = 'admin_role_required';
  end if;

  select profile.activity_points into current_balance
  from public.profiles profile
  where profile.user_id = target_user_id
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'target_profile_not_found';
  end if;

  next_balance := current_balance + adjustment;
  if next_balance < 0 then
    raise exception using errcode = '22023', message = 'negative_activity_point_balance';
  end if;

  update public.profiles profile
  set activity_points = next_balance
  where profile.user_id = target_user_id;

  insert into public.activity_point_ledger (
    user_id, amount, reason, actor_user_id, note
  ) values (
    target_user_id, adjustment, 'admin_adjustment', actor_user_id, clean_note
  );

  insert into public.admin_audit_log (
    actor_user_id, target_user_id, action, details
  ) values (
    actor_user_id,
    target_user_id,
    'activity_points_adjusted',
    jsonb_build_object('amount', adjustment, 'balance_before', current_balance, 'balance_after', next_balance, 'note', clean_note)
  );

  return next_balance;
end;
$$;

create or replace function public.admin_set_profile_status(
  target_user_id uuid,
  next_status text,
  status_note text,
  actor_user_id uuid
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  previous_status text;
  clean_note text := trim(coalesce(status_note, ''));
begin
  if next_status not in ('active', 'suspended') then
    raise exception using errcode = '22023', message = 'invalid_profile_status';
  end if;
  if char_length(clean_note) < 3 or char_length(clean_note) > 240 then
    raise exception using errcode = '22023', message = 'admin_note_required';
  end if;
  if not exists (
    select 1 from public.profiles profile
    where profile.user_id = actor_user_id
      and profile.role = 'admin'
      and profile.status = 'active'
  ) then
    raise exception using errcode = '42501', message = 'admin_role_required';
  end if;
  if target_user_id = actor_user_id and next_status <> 'active' then
    raise exception using errcode = '22023', message = 'cannot_suspend_current_admin';
  end if;

  select profile.status into previous_status
  from public.profiles profile
  where profile.user_id = target_user_id
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'target_profile_not_found';
  end if;

  update public.profiles profile
  set status = next_status
  where profile.user_id = target_user_id;

  insert into public.admin_audit_log (
    actor_user_id, target_user_id, action, details
  ) values (
    actor_user_id,
    target_user_id,
    'profile_status_changed',
    jsonb_build_object('status_before', previous_status, 'status_after', next_status, 'note', clean_note)
  );

  return next_status;
end;
$$;

revoke all on function public.admin_adjust_activity_points(uuid, integer, text, uuid) from public, anon, authenticated;
revoke all on function public.admin_set_profile_status(uuid, text, text, uuid) from public, anon, authenticated;
grant execute on function public.admin_adjust_activity_points(uuid, integer, text, uuid) to service_role;
grant execute on function public.admin_set_profile_status(uuid, text, text, uuid) to service_role;

comment on table public.admin_audit_log is 'Immutable audit trail for privileged BOOSTPLAY profile operations.';
comment on table public.admin_access_guards is 'Server-only failed secondary-password counters for the admin console.';
