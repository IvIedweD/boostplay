grant select on table public.admin_audit_log to service_role;

alter table public.admin_audit_log
  drop constraint if exists admin_audit_log_action_check;
alter table public.admin_audit_log
  add constraint admin_audit_log_action_check
  check (action in ('activity_points_adjusted', 'profile_status_changed', 'profile_role_changed'));

create or replace function public.get_my_activity_point_history(requested_limit integer default 60)
returns table (
  entry_id bigint,
  amount integer,
  reason text,
  note text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    ledger.id,
    ledger.amount,
    ledger.reason,
    ledger.note,
    ledger.created_at
  from public.activity_point_ledger as ledger
  where ledger.user_id = auth.uid()
  order by ledger.created_at desc
  limit least(greatest(coalesce(requested_limit, 60), 1), 100);
$$;

revoke all on function public.get_my_activity_point_history(integer) from public, anon;
grant execute on function public.get_my_activity_point_history(integer) to authenticated;

create or replace function public.admin_set_profile_role(
  target_user_id uuid,
  next_role text,
  role_note text,
  actor_user_id uuid
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  previous_role text;
  clean_note text := trim(coalesce(role_note, ''));
begin
  if next_role not in ('player', 'moderator', 'admin') then
    raise exception using errcode = '22023', message = 'invalid_profile_role';
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
  if target_user_id = actor_user_id and next_role <> 'admin' then
    raise exception using errcode = '22023', message = 'cannot_demote_current_admin';
  end if;

  select profile.role into previous_role
  from public.profiles profile
  where profile.user_id = target_user_id
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'target_profile_not_found';
  end if;

  update public.profiles profile
  set role = next_role
  where profile.user_id = target_user_id;

  insert into public.admin_audit_log (
    actor_user_id, target_user_id, action, details
  ) values (
    actor_user_id,
    target_user_id,
    'profile_role_changed',
    jsonb_build_object('role_before', previous_role, 'role_after', next_role, 'note', clean_note)
  );

  return next_role;
end;
$$;

revoke all on function public.admin_set_profile_role(uuid, text, text, uuid) from public, anon, authenticated;
grant execute on function public.admin_set_profile_role(uuid, text, text, uuid) to service_role;
