-- =========================================================
-- PLATIS — MESA PRINCIPAL
-- =========================================================

create table if not exists campaigns (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  code text not null unique,
  master_user_id text references "user" ("id") on delete set null,
  created_at timestamptz not null default current_timestamp
);

create table if not exists campaign_members (
  id text primary key default gen_random_uuid()::text,
  campaign_id text not null references campaigns ("id") on delete cascade,
  user_id text not null references "user" ("id") on delete cascade,
  role text not null default 'player',
  slot integer,
  created_at timestamptz not null default current_timestamp,

  constraint campaign_members_role_check
    check (role in ('player', 'master')),

  constraint campaign_members_slot_check
    check (slot is null or slot between 1 and 8),

  constraint campaign_members_unique_user
    unique (campaign_id, user_id)
);

create unique index if not exists campaign_members_unique_slot
  on campaign_members (campaign_id, slot)
  where slot is not null;

create unique index if not exists campaign_members_one_master
  on campaign_members (campaign_id)
  where role = 'master';

create index if not exists campaign_members_campaign_idx
  on campaign_members (campaign_id);

create index if not exists campaign_members_user_idx
  on campaign_members (user_id);

-- =========================================================
-- MESA OFICIAL DE PLATIS
-- O master_user_id será associado ao usuário do Mestre
-- depois que a conta dele existir no Better Auth.
-- =========================================================

insert into campaigns (name, code)
select 'Platis', 'PLATIS-001'
where not exists (
  select 1
  from campaigns
  where code = 'PLATIS-001'
);
