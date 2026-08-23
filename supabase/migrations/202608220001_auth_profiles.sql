create extension if not exists pgcrypto;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 64),
  avatar_id text not null check (avatar_id ~ '^avatar-(0[1-9]|10)$'),
  frame_id text not null check (frame_id ~ '^frame-(0[1-9]|10)$'),
  role text not null default 'player' check (role in ('player', 'moderator', 'admin')),
  status text not null default 'active' check (status in ('active', 'suspended', 'deleted')),
  activity_points integer not null default 0 check (activity_points >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.referral_attributions (
  user_id uuid primary key references public.profiles(user_id) on delete cascade,
  referral_code text not null check (referral_code ~ '^[A-Z0-9_-]{4,32}$'),
  source text not null default 'registration',
  attributed_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_email text := lower(trim(new.email));
  email_login text;
  avatar_number integer := 1 + floor(random() * 10)::integer;
  frame_number integer := 1 + floor(random() * 10)::integer;
  referral_code text := upper(trim(coalesce(new.raw_user_meta_data ->> 'referral_code', '')));
begin
  if normalized_email is null
    or position('@' in normalized_email) <= 1
    or split_part(normalized_email, '@', 2) <> 'yandex-team.ru'
    or normalized_email <> split_part(normalized_email, '@', 1) || '@yandex-team.ru'
  then
    raise exception using
      errcode = 'P0001',
      message = 'registration_email_domain_not_allowed';
  end if;

  email_login := split_part(normalized_email, '@', 1);

  insert into public.profiles (user_id, display_name, avatar_id, frame_id)
  values (
    new.id,
    email_login,
    'avatar-' || lpad(avatar_number::text, 2, '0'),
    'frame-' || lpad(frame_number::text, 2, '0')
  );

  if referral_code ~ '^[A-Z0-9_-]{4,32}$' then
    insert into public.referral_attributions (user_id, referral_code)
    values (new.id, referral_code)
    on conflict (user_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

alter table public.profiles enable row level security;
alter table public.referral_attributions enable row level security;

drop policy if exists profiles_are_publicly_readable on public.profiles;
create policy profiles_are_publicly_readable
on public.profiles for select
to anon, authenticated
using (status = 'active');

grant select on public.profiles to anon, authenticated;
revoke insert, update, delete on public.profiles from anon, authenticated;
revoke all on public.referral_attributions from anon, authenticated;

comment on table public.profiles is 'Server-owned BOOSTPLAY profile. Cosmetic IDs are assigned once by handle_new_auth_user and have no client update policy.';
comment on table public.referral_attributions is 'Private registration attribution. It does not grant rewards by itself.';
