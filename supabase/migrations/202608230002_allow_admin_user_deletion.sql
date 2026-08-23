alter table public.admin_audit_log
  drop constraint if exists admin_audit_log_actor_user_id_fkey;

comment on column public.admin_audit_log.actor_user_id is
  'Immutable administrator UUID. Intentionally retained after the account is deleted.';
