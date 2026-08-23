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

  select activation.* into existing_activation
  from public.rovers_booster_activations as activation
  where activation.user_id = current_user_id
    and activation.request_id = purchase_request_id;
  if found then
    select profile.activity_points into current_balance
    from public.profiles as profile
    where profile.user_id = current_user_id;
    return query
      select existing_activation.id, current_balance, existing_activation.cost;
    return;
  end if;

  select profile.activity_points into current_balance
  from public.profiles as profile
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
    purchase_request_id,
    current_user_id,
    requested_double_score,
    requested_stabilizer,
    calculated_cost
  ) returning id into created_activation_id;

  insert into public.activity_point_ledger (user_id, amount, reason, reference_id)
  values (current_user_id, -calculated_cost, 'booster_purchase', created_activation_id);

  return query select created_activation_id, current_balance, calculated_cost;
end;
$$;

revoke all on function public.purchase_rovers_boosters(uuid, boolean, boolean)
  from public, anon;
grant execute on function public.purchase_rovers_boosters(uuid, boolean, boolean)
  to authenticated;
