-- Phase 1: campaigns table + RLS
-- Run in Supabase SQL Editor or via supabase db push

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  client text not null default '',
  brand text not null default '',
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now()
);

create index if not exists campaigns_user_id_idx on public.campaigns (user_id);
create index if not exists campaigns_status_idx on public.campaigns (status);

alter table public.campaigns enable row level security;

create policy "users manage own campaigns"
on public.campaigns
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
