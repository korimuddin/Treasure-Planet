alter table public.deals
add column if not exists loi_data jsonb not null default '{}'::jsonb,
add column if not exists loi_counter integer not null default 0;

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

create policy "Deal parties can read messages"
on public.messages
for select
to authenticated
using (
  exists (
    select 1
    from public.deals
    where deals.id = messages.deal_id
      and (deals.buyer_id = auth.uid() or deals.seller_id = auth.uid())
  )
);

create policy "Deal parties can write messages"
on public.messages
for insert
to authenticated
with check (
  sender_id = auth.uid()
  and exists (
    select 1
    from public.deals
    where deals.id = messages.deal_id
      and (deals.buyer_id = auth.uid() or deals.seller_id = auth.uid())
  )
);

create index if not exists messages_deal_id_created_at_idx on public.messages(deal_id, created_at);
create index if not exists messages_sender_id_idx on public.messages(sender_id);

do $$
begin
  alter publication supabase_realtime add table public.messages;
exception
  when duplicate_object then null;
end;
$$;
