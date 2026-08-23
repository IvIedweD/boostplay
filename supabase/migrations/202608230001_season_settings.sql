create table if not exists public.boostplay_season_settings (
  id text primary key default 'current' check (id = 'current'),
  title text not null check (char_length(title) between 3 and 80),
  label text not null check (char_length(label) between 3 and 100),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null check (status in ('upcoming', 'active', 'finished')),
  leaderboard_refresh_minutes integer not null default 30 check (leaderboard_refresh_minutes between 5 and 1440),
  updated_by uuid references public.profiles(user_id) on delete set null,
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

insert into public.boostplay_season_settings (
  id, title, label, starts_at, ends_at, status, leaderboard_refresh_minutes
) values (
  'current', 'Первые шаги', 'Сезон «Первые шаги» · Август 2026',
  '2026-08-01T00:00:00+03:00', '2026-08-30T00:00:00+03:00', 'active', 30
)
on conflict (id) do nothing;

alter table public.boostplay_season_settings enable row level security;
revoke all on table public.boostplay_season_settings from anon, authenticated;
grant select, update on table public.boostplay_season_settings to service_role;

create or replace function public.get_boostplay_season()
returns table (
  title text,
  label text,
  starts_at timestamptz,
  ends_at timestamptz,
  status text,
  leaderboard_refresh_minutes integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select season.title, season.label, season.starts_at, season.ends_at,
    season.status, season.leaderboard_refresh_minutes
  from public.boostplay_season_settings season
  where season.id = 'current';
$$;

revoke all on function public.get_boostplay_season() from public;
grant execute on function public.get_boostplay_season() to anon, authenticated;

alter table public.admin_audit_log drop constraint if exists admin_audit_log_action_check;
alter table public.admin_audit_log add constraint admin_audit_log_action_check
  check (action in ('activity_points_adjusted', 'profile_status_changed', 'profile_role_changed', 'season_settings_changed'));

create or replace function public.admin_update_boostplay_season(
  season_title text,
  season_label text,
  season_starts_at timestamptz,
  season_ends_at timestamptz,
  season_status text,
  refresh_minutes integer,
  actor_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  previous_settings jsonb;
begin
  if not exists (
    select 1 from public.profiles profile
    where profile.user_id = actor_user_id and profile.role = 'admin' and profile.status = 'active'
  ) then
    raise exception using errcode = '42501', message = 'admin_role_required';
  end if;
  if char_length(trim(season_title)) < 3 or char_length(trim(season_title)) > 80
    or char_length(trim(season_label)) < 3 or char_length(trim(season_label)) > 100 then
    raise exception using errcode = '22023', message = 'invalid_season_text';
  end if;
  if season_status not in ('upcoming', 'active', 'finished') then
    raise exception using errcode = '22023', message = 'invalid_season_status';
  end if;
  if season_ends_at <= season_starts_at then
    raise exception using errcode = '22023', message = 'invalid_season_dates';
  end if;
  if refresh_minutes < 5 or refresh_minutes > 1440 then
    raise exception using errcode = '22023', message = 'invalid_refresh_interval';
  end if;

  select to_jsonb(season) - 'updated_by' into previous_settings
  from public.boostplay_season_settings season where season.id = 'current';

  insert into public.boostplay_season_settings (
    id, title, label, starts_at, ends_at, status, leaderboard_refresh_minutes, updated_by, updated_at
  ) values (
    'current', trim(season_title), trim(season_label), season_starts_at, season_ends_at,
    season_status, refresh_minutes, actor_user_id, now()
  ) on conflict (id) do update set
    title = excluded.title,
    label = excluded.label,
    starts_at = excluded.starts_at,
    ends_at = excluded.ends_at,
    status = excluded.status,
    leaderboard_refresh_minutes = excluded.leaderboard_refresh_minutes,
    updated_by = excluded.updated_by,
    updated_at = excluded.updated_at;

  insert into public.admin_audit_log (actor_user_id, target_user_id, action, details)
  values (actor_user_id, null, 'season_settings_changed', jsonb_build_object(
    'before', previous_settings,
    'after', jsonb_build_object('title', trim(season_title), 'label', trim(season_label),
      'starts_at', season_starts_at, 'ends_at', season_ends_at,
      'status', season_status, 'leaderboard_refresh_minutes', refresh_minutes)
  ));
end;
$$;

revoke all on function public.admin_update_boostplay_season(text, text, timestamptz, timestamptz, text, integer, uuid)
  from public, anon, authenticated;
grant execute on function public.admin_update_boostplay_season(text, text, timestamptz, timestamptz, text, integer, uuid)
  to service_role;
