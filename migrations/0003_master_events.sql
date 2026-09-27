-- =========================================================
-- PLATIS — EVENTOS DO MESTRE
-- =========================================================

create table if not exists master_events (
  id text primary key default gen_random_uuid()::text,

  campaign_id text not null
    references campaigns ("id")
    on delete cascade,

  created_by text
    references "user" ("id")
    on delete set null,

  type text not null,

  title text not null,

  description text not null default '',

  status text not null default 'rascunho',

  target_character_ids jsonb not null default '[]'::jsonb,

  timer_seconds integer,

  choices jsonb,

  puzzle_answer text,

  test_attribute text,

  test_difficulty integer,

  reward_xp integer not null default 0,

  reward_brasao integer not null default 0,

  created_at timestamptz not null default current_timestamp,

  updated_at timestamptz not null default current_timestamp,

  constraint master_events_type_check
    check (
      type in (
        'cte',
        'emboscada',
        'escolha',
        'puzzle',
        'teste',
        'narrativo'
      )
    ),

  constraint master_events_status_check
    check (
      status in (
        'rascunho',
        'ativo',
        'resolvido',
        'cancelado'
      )
    ),

  constraint master_events_timer_check
    check (timer_seconds is null or timer_seconds >= 0),

  constraint master_events_test_difficulty_check
    check (test_difficulty is null or test_difficulty >= 0),

  constraint master_events_reward_xp_check
    check (reward_xp >= 0),

  constraint master_events_reward_brasao_check
    check (reward_brasao >= 0)
);

create index if not exists master_events_campaign_idx
  on master_events (campaign_id);

create index if not exists master_events_status_idx
  on master_events (campaign_id, status);

create index if not exists master_events_created_at_idx
  on master_events (campaign_id, created_at);
