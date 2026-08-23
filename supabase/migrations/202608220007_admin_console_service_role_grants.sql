-- Edge Functions use the service_role database role for privileged admin work.
-- Grant only the table capabilities required by admin-console.
grant select on table public.profiles to service_role;
grant select on table public.rovers_results to service_role;
grant select on table public.activity_point_ledger to service_role;
grant select, insert, update on table public.admin_access_guards to service_role;
