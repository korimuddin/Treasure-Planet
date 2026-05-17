create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  platform text not null check (
    platform in (
      'ios',
      'android',
      'macos',
      'windows',
      'ios-gaming',
      'android-gaming',
      'pc-gaming'
    )
  ),
  category_label text not null,
  completion_pct integer not null check (completion_pct >= 0 and completion_pct <= 100),
  asking_price_gbp integer not null check (asking_price_gbp >= 0),
  deal_types text[] not null default '{}',
  tech_stack text[] not null default '{}',
  public_summary text not null,
  status text not null default 'draft' check (
    status in ('draft', 'live', 'under_offer', 'sold', 'withdrawn')
  ),
  is_anonymous boolean not null default true,
  views_count integer not null default 0,
  dev_background text,
  screenshots_urls text[] not null default '{}',
  demo_video_url text,
  tech_stack_detail text,
  git_stats jsonb not null default '{}'::jsonb,
  dev_timeline text,
  project_name text,
  source_code_url text,
  architecture_doc text,
  revenue_data jsonb not null default '{}'::jsonb,
  roadmap text,
  seller_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  listed_at timestamptz,
  sold_at timestamptz
);

alter table public.listings enable row level security;

create policy "Public can view live listings"
on public.listings
for select
using (status = 'live');

create policy "Sellers can manage own listings"
on public.listings
for all
to authenticated
using (auth.uid() = seller_id)
with check (auth.uid() = seller_id);

create policy "Admins can manage all listings"
on public.listings
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create index if not exists listings_platform_idx on public.listings(platform);
create index if not exists listings_status_idx on public.listings(status);
create index if not exists listings_seller_id_idx on public.listings(seller_id);
create index if not exists listings_asking_price_gbp_idx on public.listings(asking_price_gbp);

create trigger set_listings_updated_at
before update on public.listings
for each row
execute function public.set_updated_at();

create table if not exists public.listing_nda_access (
  listing_id uuid not null references public.listings(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'requested' check (status in ('requested', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (listing_id, user_id)
);

alter table public.listing_nda_access enable row level security;

create policy "Users can view own listing access"
on public.listing_nda_access
for select
to authenticated
using (auth.uid() = user_id);

create policy "Sellers can view access for own listings"
on public.listing_nda_access
for select
to authenticated
using (
  exists (
    select 1
    from public.listings
    where listings.id = listing_nda_access.listing_id
      and listings.seller_id = auth.uid()
  )
);

create policy "Admins can manage listing access"
on public.listing_nda_access
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create index if not exists listing_nda_access_user_id_idx on public.listing_nda_access(user_id);
create index if not exists listing_nda_access_status_idx on public.listing_nda_access(status);

create trigger set_listing_nda_access_updated_at
before update on public.listing_nda_access
for each row
execute function public.set_updated_at();

create or replace function public.increment_listing_views(listing_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.listings
  set views_count = views_count + 1
  where id = listing_id
    and status = 'live';
end;
$$;
