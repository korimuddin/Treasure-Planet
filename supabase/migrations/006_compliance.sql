alter table public.profiles
add column if not exists sanctions_flagged boolean not null default false,
add column if not exists suspended_at timestamptz;

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null check (entity_type in ('listing', 'nda_request', 'deal', 'user', 'admin')),
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  ip_address text,
  created_at timestamptz not null default now()
);

alter table public.audit_log enable row level security;

create policy "Admins can read audit log"
on public.audit_log
for select
to authenticated
using (public.is_admin(auth.uid()));

create policy "Admins can manage audit log"
on public.audit_log
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create index if not exists audit_log_user_id_idx on public.audit_log(user_id);
create index if not exists audit_log_action_idx on public.audit_log(action);
create index if not exists audit_log_entity_type_idx on public.audit_log(entity_type);
create index if not exists audit_log_created_at_idx on public.audit_log(created_at);

create table if not exists public.sar_flags (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid,
  flag_reason text not null,
  severity text not null default 'medium' check (severity in ('low', 'medium', 'high', 'critical')),
  reviewed boolean not null default false,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.sar_flags enable row level security;

create policy "Admins can read sar flags"
on public.sar_flags
for select
to authenticated
using (public.is_admin(auth.uid()));

create policy "Admins can manage sar flags"
on public.sar_flags
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create index if not exists sar_flags_severity_idx on public.sar_flags(severity);
create index if not exists sar_flags_reviewed_idx on public.sar_flags(reviewed);
create index if not exists sar_flags_created_at_idx on public.sar_flags(created_at);
