alter table public.admin_audit_log
  drop constraint if exists admin_audit_log_actor_user_id_fkey;

alter table public.admin_audit_log
  alter column actor_user_id drop not null;

alter table public.admin_audit_log
  add constraint admin_audit_log_actor_user_id_fkey
  foreign key (actor_user_id)
  references public.profiles(user_id)
  on delete set null;

comment on column public.admin_audit_log.actor_user_id is
  'Administrator who performed the action. Preserved as null when that account is deleted.';
