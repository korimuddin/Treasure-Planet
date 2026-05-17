create table if not exists public.nda_requests (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  deal_type text not null default 'undecided' check (deal_type in ('acquire', 'cofound', 'merge', 'undecided')),
  budget_min_gbp integer,
  budget_max_gbp integer,
  message text,
  pandadoc_doc_id text,
  pandadoc_status text not null default 'pending',
  pandadoc_signed_at timestamptz,
  buyer_copy_url text,
  seller_copy_url text,
  status text not null default 'pending_nda' check (
    status in ('pending_nda', 'pending_review', 'approved', 'declined', 'expired')
  ),
  auto_approved boolean not null default false,
  seller_decided_at timestamptz,
  decline_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (listing_id, buyer_id)
);

alter table public.nda_requests enable row level security;

create policy "Buyers can manage their own requests"
on public.nda_requests
for all
to authenticated
using (auth.uid() = buyer_id)
with check (auth.uid() = buyer_id);

create policy "Sellers can view requests for their listings"
on public.nda_requests
for select
to authenticated
using (auth.uid() = seller_id);

create policy "Sellers can update requests for their listings"
on public.nda_requests
for update
to authenticated
using (auth.uid() = seller_id)
with check (auth.uid() = seller_id);

create policy "Admins can manage all nda requests"
on public.nda_requests
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create index if not exists nda_requests_listing_id_idx on public.nda_requests(listing_id);
create index if not exists nda_requests_buyer_id_idx on public.nda_requests(buyer_id);
create index if not exists nda_requests_seller_id_idx on public.nda_requests(seller_id);
create index if not exists nda_requests_status_idx on public.nda_requests(status);
create index if not exists nda_requests_pandadoc_doc_id_idx on public.nda_requests(pandadoc_doc_id);

create trigger set_nda_requests_updated_at
before update on public.nda_requests
for each row
execute function public.set_updated_at();

create table if not exists public.seller_settings (
  seller_id uuid primary key references public.profiles(id) on delete cascade,
  auto_approve boolean not null default false,
  auto_approve_min_budget integer not null default 0,
  auto_approve_deal_types text[] not null default '{}',
  response_message text not null default 'Thank you — you now have full data room access.',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.seller_settings enable row level security;

create policy "Sellers manage own settings"
on public.seller_settings
for all
to authenticated
using (auth.uid() = seller_id)
with check (auth.uid() = seller_id);

create policy "Admins manage seller settings"
on public.seller_settings
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create trigger set_seller_settings_updated_at
before update on public.seller_settings
for each row
execute function public.set_updated_at();
