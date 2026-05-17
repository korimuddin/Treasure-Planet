create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'buyer' check (role in ('buyer', 'seller', 'admin')),
  full_name text,
  email text,
  country text,
  company text,
  primary_platform text,
  kyc_status text not null default 'pending' check (kyc_status in ('pending', 'submitted', 'verified', 'failed')),
  kyc_session_id text,
  verified_budget_min integer,
  verified_budget_max integer,
  deal_count integer not null default 0,
  avatar_initials text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create or replace function public.is_admin(user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = user_id
      and role = 'admin'
  );
$$;

create policy "Users can view their own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Admins can view all profiles"
on public.profiles
for select
to authenticated
using (public.is_admin(auth.uid()));

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create or replace function public.initials_from_name(full_name text, email text)
returns text
language plpgsql
immutable
as $$
declare
  name_parts text[];
  first_initial text;
  second_initial text;
begin
  name_parts := regexp_split_to_array(trim(coalesce(full_name, '')), '\s+');
  first_initial := upper(left(coalesce(name_parts[1], split_part(coalesce(email, ''), '@', 1), 'U'), 1));
  second_initial := upper(left(coalesce(name_parts[2], ''), 1));

  if second_initial = '' then
    return first_initial;
  end if;

  return first_initial || second_initial;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  metadata jsonb;
  requested_role text;
  requested_name text;
  requested_country text;
  requested_platform text;
begin
  metadata := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  requested_role := coalesce(metadata ->> 'role', 'buyer');
  requested_name := metadata ->> 'full_name';
  requested_country := metadata ->> 'country';
  requested_platform := metadata ->> 'primary_platform';

  if requested_role not in ('buyer', 'seller', 'admin') then
    requested_role := 'buyer';
  end if;

  insert into public.profiles (
    id,
    role,
    full_name,
    email,
    country,
    primary_platform,
    avatar_initials
  )
  values (
    new.id,
    requested_role,
    requested_name,
    new.email,
    requested_country,
    requested_platform,
    public.initials_from_name(requested_name, new.email)
  );

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();
