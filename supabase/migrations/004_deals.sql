create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  nda_request_id uuid references public.nda_requests(id) on delete set null,
  deal_type text not null check (deal_type in ('acquire', 'cofound', 'merge')),
  agreed_price_gbp integer not null check (agreed_price_gbp >= 0),
  stripe_payment_intent_id text,
  stripe_transfer_id text,
  platform_fee_gbp integer,
  status text not null default 'negotiating' check (
    status in (
      'negotiating',
      'loi_sent',
      'loi_accepted',
      'payment_pending',
      'in_escrow',
      'ip_transferred',
      'completed',
      'disputed',
      'cancelled'
    )
  ),
  noshop_activated_at timestamptz,
  noshop_expires_at timestamptz,
  voyage_manager_assigned boolean not null default false,
  voyage_manager_name text,
  voyage_manager_email text,
  loi_sent_at timestamptz,
  loi_accepted_at timestamptz,
  payment_made_at timestamptz,
  ip_transferred_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.deals enable row level security;

create policy "Buyers can view and update own deals"
on public.deals
for all
to authenticated
using (auth.uid() = buyer_id)
with check (auth.uid() = buyer_id);

create policy "Sellers can view and update own deals"
on public.deals
for all
to authenticated
using (auth.uid() = seller_id)
with check (auth.uid() = seller_id);

create policy "Admins can manage all deals"
on public.deals
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create index if not exists deals_listing_id_idx on public.deals(listing_id);
create index if not exists deals_buyer_id_idx on public.deals(buyer_id);
create index if not exists deals_seller_id_idx on public.deals(seller_id);
create index if not exists deals_status_idx on public.deals(status);
create index if not exists deals_stripe_payment_intent_id_idx on public.deals(stripe_payment_intent_id);

create trigger set_deals_updated_at
before update on public.deals
for each row
execute function public.set_updated_at();
