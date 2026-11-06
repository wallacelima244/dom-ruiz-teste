-- BARBEARIA DOM RUIZ • instalação inicial
-- Projeto separado do Mercado Souza. Horário: America/Sao_Paulo.
-- Execute exclusivamente no projeto "Barbearia Dom Ruiz".
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 2 and 90),
  description text not null default '',
  price numeric(10,2) not null check (price >= 0 and price <= 50000),
  duration_min integer not null check (duration_min between 5 and 240),
  image_path text not null default '',
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create table if not exists public.business_hours (
  weekday smallint primary key check (weekday between 0 and 6),
  open_at time not null default '10:00',
  close_at time not null default '19:00',
  is_open boolean not null default true,
  check (close_at > open_at)
);
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'booking' check(kind in ('booking','block')),
  status text not null default 'booked' check(status in ('booked','completed','cancelled','no_show','blocked')),
  customer_name text,
  customer_phone text,
  service_id uuid references public.services(id) on delete restrict,
  service_name text,
  service_price numeric(10,2),
  duration_min integer,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  notes text not null default '',
  source text not null default 'site',
  manage_token uuid not null unique default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at),
  check (
    (kind='booking' and status in ('booked','completed','cancelled','no_show')
     and customer_name is not null and customer_phone is not null and service_id is not null)
    or (kind='block' and status in ('blocked','cancelled'))
  ),
  constraint appointments_no_overlap exclude using gist (
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (status <> 'cancelled')
);
create index if not exists appointments_start_idx on public.appointments(starts_at);
create index if not exists appointments_phone_idx on public.appointments(customer_phone,created_at);
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create or replace function public.set_appointment_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end; $$;
drop trigger if exists appointment_update_stamp on public.appointments;
create trigger appointment_update_stamp before update on public.appointments
for each row execute function public.set_appointment_updated_at();

-- A API pública do site usa funções de servidor com service_role;
-- nenhuma tabela contém política pública para ler nomes e telefones.
alter table public.services enable row level security;
alter table public.business_hours enable row level security;
alter table public.appointments enable row level security;
alter table public.admin_users enable row level security;
revoke all on public.services,public.business_hours,public.appointments,public.admin_users from anon, authenticated;
grant all on public.services,public.business_hours,public.appointments,public.admin_users to service_role;

insert into public.services(name,description,price,duration_min,image_path,sort_order)
values
('Corte Social','Clássico, alinhado e pronto para qualquer ocasião.',30.00,25,'/assets/corte.social.jpg',1),
('Corte na Tesoura','Acabamento natural com técnica e controle.',40.00,40,'/assets/corte.na.tesoura.jpg',2),
('Corte Degradê','Transição suave, alinhamento limpo e estilo moderno.',35.00,35,'/assets/degrade.jpg',3),
('Barba','Modelagem, alinhamento e acabamento no detalhe.',30.00,20,'/assets/barba.jpg',4),
('Sobrancelha','Acerto rápido para destacar o visual.',10.00,5,'/assets/sobrancelha.jpg',5),
('Corte + Barba','O combo completo: cabelo e barba na régua.',60.00,55,'/assets/corte.barba.jpg',6)
on conflict(name) do nothing;
insert into public.business_hours(weekday,open_at,close_at,is_open)
values (0,'10:00','19:00',false),
(1,'13:00','19:00',true),(2,'13:00','19:00',true),
(3,'13:00','19:00',true),(4,'13:00','19:00',true),
(5,'10:00','19:00',true),(6,'10:00','19:00',true)
on conflict(weekday) do nothing;
