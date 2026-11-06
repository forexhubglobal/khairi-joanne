-- ============================================================
-- Jalankan skrip ini dalam Supabase > SQL Editor (sekali sahaja)
-- ============================================================

-- 1) Jadual RSVP (PRIVATE: tetamu boleh hantar, tapi TAK boleh baca no. telefon orang lain)
create table if not exists public.rsvp (
  id          bigint generated always as identity primary key,
  name        text    not null check (char_length(name) between 1 and 100),
  phone       text    not null check (char_length(phone) between 7 and 20),
  attending   boolean not null,
  pax         int     not null default 0 check (pax between 0 and 4),
  created_at  timestamptz not null default now()
);

alter table public.rsvp enable row level security;

drop policy if exists "Tetamu boleh hantar RSVP" on public.rsvp;
create policy "Tetamu boleh hantar RSVP"
  on public.rsvp for insert to anon
  with check (true);

-- 2) Jadual Ucapan (PUBLIC: dipaparkan secara live di kad)
create table if not exists public.wishes (
  id          bigint generated always as identity primary key,
  name        text not null check (char_length(name) between 1 and 100),
  message     text not null check (char_length(message) between 1 and 500),
  created_at  timestamptz not null default now()
);

alter table public.wishes enable row level security;

drop policy if exists "Semua boleh baca ucapan" on public.wishes;
create policy "Semua boleh baca ucapan"
  on public.wishes for select to anon
  using (true);

drop policy if exists "Tetamu boleh hantar ucapan" on public.wishes;
create policy "Tetamu boleh hantar ucapan"
  on public.wishes for insert to anon
  with check (true);

-- 3) Hidupkan Realtime untuk ucapan live
alter publication supabase_realtime add table public.wishes;

-- 4) (Pilihan) Paparan ringkasan untuk korang tengok dalam dashboard
create or replace view public.rsvp_summary
with (security_invoker = true) as
select
  count(*) filter (where attending)       as jumlah_hadir_rsvp,
  coalesce(sum(pax) filter (where attending), 0) as jumlah_pax,
  count(*) filter (where not attending)   as tidak_hadir
from public.rsvp;
