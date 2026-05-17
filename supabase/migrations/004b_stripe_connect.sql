alter table public.profiles
add column if not exists stripe_connect_account_id text,
add column if not exists stripe_connect_charges_enabled boolean not null default false;

create index if not exists profiles_stripe_connect_account_id_idx
on public.profiles(stripe_connect_account_id);
