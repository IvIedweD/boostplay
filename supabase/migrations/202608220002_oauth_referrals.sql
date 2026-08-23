create or replace function public.claim_referral_attribution(requested_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_code text := upper(trim(coalesce(requested_code, '')));
begin
  if auth.uid() is null then
    raise exception using errcode = '42501', message = 'authentication_required';
  end if;

  if normalized_code !~ '^[A-Z0-9_-]{4,32}$' then
    raise exception using errcode = '22023', message = 'invalid_referral_code';
  end if;

  insert into public.referral_attributions (user_id, referral_code, source)
  values (auth.uid(), normalized_code, 'oauth')
  on conflict (user_id) do nothing;
end;
$$;

revoke all on function public.claim_referral_attribution(text) from public, anon;
grant execute on function public.claim_referral_attribution(text) to authenticated;

comment on function public.claim_referral_attribution(text) is
  'Stores an authenticated user referral once after an external OAuth redirect.';
