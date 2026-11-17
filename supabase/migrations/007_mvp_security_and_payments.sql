-- 007_mvp_security_and_payments.sql
--
-- Locks the database down so that the browser (anon / authenticated keys) can
-- only READ what it is entitled to. Every state change now goes through the
-- server routes using the service-role key (lib/supabase/admin.ts).
--
-- Also adds the MVP schema: web/SaaS platforms, seller-optional NDA,
-- click-to-sign NDA evidence, and the Stripe Checkout hold-and-release fields.
--
-- BEFORE RUNNING IN PRODUCTION: check for accounts that used the old signup
-- hole to make themselves admin, and demote any you do not recognise:
--
--   select id, email, created_at from public.profiles where role = 'admin';
--   -- update public.profiles set role = 'buyer' where id = '<uuid>';

-- ---------------------------------------------------------------------------
-- 1. Signup can never create an admin
-- ---------------------------------------------------------------------------

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

  -- Admins are only ever created by hand in SQL.
  if requested_role not in ('buyer', 'seller') then
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

-- ---------------------------------------------------------------------------
-- 2. Profiles: users may edit only harmless columns on their own row
-- ---------------------------------------------------------------------------

revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (full_name, company, country, primary_platform) on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Listings: column-level read access, no client writes
-- ---------------------------------------------------------------------------

alter table public.listings
  add column if not exists requires_nda boolean not null default true,
  add column if not exists seller_nda_version text,
  add column if not exists seller_nda_accepted_at timestamptz;

alter table public.listings drop constraint if exists listings_platform_check;
alter table public.listings add constraint listings_platform_check check (
  platform in (
    'web',
    'saas',
    'ios',
    'android',
    'macos',
    'windows',
    'ios-gaming',
    'android-gaming',
    'pc-gaming'
  )
);

drop policy if exists "Sellers can manage own listings" on public.listings;

drop policy if exists "Sellers can view own listings" on public.listings;
create policy "Sellers can view own listings"
on public.listings
for select
to authenticated
using (auth.uid() = seller_id);

-- The row policy above and "Public can view live listings" decide WHICH rows
-- are visible. These grants decide WHICH COLUMNS. The private tier
-- (project_name, source_code_url, architecture_doc, revenue_data, roadmap,
-- seller_name) is never readable with a browser key; the server returns it
-- only after checking access.
revoke all on public.listings from anon, authenticated;

grant select (
  id,
  seller_id,
  platform,
  category_label,
  completion_pct,
  asking_price_gbp,
  deal_types,
  tech_stack,
  public_summary,
  status,
  is_anonymous,
  requires_nda,
  views_count,
  created_at,
  updated_at,
  listed_at,
  sold_at
) on public.listings to anon, authenticated;

grant select (
  dev_background,
  screenshots_urls,
  demo_video_url,
  tech_stack_detail,
  git_stats,
  dev_timeline
) on public.listings to authenticated;

revoke insert, update, delete on public.listing_nda_access from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. Access requests / NDA: read-only for participants, click-to-sign evidence
-- ---------------------------------------------------------------------------

alter table public.nda_requests
  add column if not exists nda_required boolean not null default true,
  add column if not exists signed_name text,
  add column if not exists signed_at timestamptz,
  add column if not exists signed_ip text,
  add column if not exists nda_version text,
  add column if not exists nda_text_sha256 text;

drop policy if exists "Buyers can manage their own requests" on public.nda_requests;
drop policy if exists "Sellers can update requests for their listings" on public.nda_requests;

drop policy if exists "Buyers can view their own requests" on public.nda_requests;
create policy "Buyers can view their own requests"
on public.nda_requests
for select
to authenticated
using (auth.uid() = buyer_id);

revoke insert, update, delete on public.nda_requests from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. Deals: read-only for participants, payment hold fields
-- ---------------------------------------------------------------------------

alter table public.deals
  add column if not exists stripe_checkout_session_id text,
  add column if not exists stripe_charge_id text,
  add column if not exists refunded_at timestamptz,
  add column if not exists disputed_at timestamptz,
  add column if not exists dispute_reason text;

drop policy if exists "Buyers can view and update own deals" on public.deals;
drop policy if exists "Sellers can view and update own deals" on public.deals;

drop policy if exists "Buyers can view own deals" on public.deals;
create policy "Buyers can view own deals"
on public.deals
for select
to authenticated
using (auth.uid() = buyer_id);

drop policy if exists "Sellers can view own deals" on public.deals;
create policy "Sellers can view own deals"
on public.deals
for select
to authenticated
using (auth.uid() = seller_id);

revoke insert, update, delete on public.deals from anon, authenticated;

-- One open deal per approved access request.
create unique index if not exists deals_one_open_per_request_idx
on public.deals (nda_request_id)
where status <> 'cancelled';

create index if not exists deals_stripe_checkout_session_id_idx
on public.deals (stripe_checkout_session_id);

-- ---------------------------------------------------------------------------
-- 6. Compliance tables: server only
-- ---------------------------------------------------------------------------

revoke insert, update, delete on public.audit_log from anon, authenticated;
revoke insert, update, delete on public.sar_flags from anon, authenticated;

-- Messages keep their existing policies: deal parties can read and insert
-- their own messages directly (needed for realtime chat).
revoke update, delete on public.messages from anon, authenticated;
