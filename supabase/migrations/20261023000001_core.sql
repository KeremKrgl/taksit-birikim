-- Taksit & Birikim: core schema, phase 1.
-- Rules that hold for every table below:
--   * Money is bigint kuruş (columns end in _kurus). Never floats.
--   * Every user-owned table has user_id -> auth.users(id) on delete cascade,
--     so deleting the auth user wipes all of their data in one step.
--   * RLS is on for every table. User tables: owner only. Reference tables:
--     read for signed-in users, writes only through the service role.
--   * Child rows carry (parent_id, user_id) foreign keys, so a row can never
--     point at another user's parent even if a policy were wrong.

---------------------------------------------------------------------------
-- Helpers
---------------------------------------------------------------------------
create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

---------------------------------------------------------------------------
-- profiles
---------------------------------------------------------------------------
create table public.profiles (
  id                          uuid primary key references auth.users (id) on delete cascade,
  display_name                text check (char_length(display_name) <= 60),
  locale                      text not null default 'tr' check (locale in ('tr', 'en')),
  plan                        text not null default 'free' check (plan in ('free', 'premium')),
  premium_until               timestamptz,
  heavy_month_threshold_kurus bigint check (heavy_month_threshold_kurus > 0),
  referral_code               text not null unique
                                default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  referred_by                 uuid references public.profiles (id) on delete set null,
  -- Kept in sync from consent_events by a trigger; users cannot write these.
  kvkk_notice_version         text,
  abroad_transfer_version     text,
  analytics_consent           boolean not null default false,
  marketing_consent           boolean not null default false,
  push_consent                boolean not null default false,
  onboarded_at                timestamptz,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- A profile row for every new auth user.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, locale)
  values (
    new.id,
    case when new.raw_user_meta_data ->> 'locale' = 'en' then 'en' else 'tr' end
  );
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

---------------------------------------------------------------------------
-- consent_events: append-only proof of what was accepted, and when
---------------------------------------------------------------------------
create table public.consent_events (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  kind       text not null check (kind in ('kvkk_notice', 'abroad_transfer', 'analytics', 'marketing', 'push')),
  version    text not null check (char_length(version) between 1 and 20),
  granted    boolean not null,
  created_at timestamptz not null default now()
);
create index consent_events_user_idx on public.consent_events (user_id, kind, created_at desc);

create or replace function public.apply_consent_event() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles set
    kvkk_notice_version     = case when new.kind = 'kvkk_notice'
                                   then case when new.granted then new.version end
                                   else kvkk_notice_version end,
    abroad_transfer_version = case when new.kind = 'abroad_transfer'
                                   then case when new.granted then new.version end
                                   else abroad_transfer_version end,
    analytics_consent = case when new.kind = 'analytics' then new.granted else analytics_consent end,
    marketing_consent = case when new.kind = 'marketing' then new.granted else marketing_consent end,
    push_consent      = case when new.kind = 'push'      then new.granted else push_consent end
  where id = new.user_id;
  return new;
end $$;

create trigger consent_events_apply after insert on public.consent_events
  for each row execute function public.apply_consent_event();

---------------------------------------------------------------------------
-- cards: bank, nickname, last 4 digits. Never a full card number.
---------------------------------------------------------------------------
create table public.cards (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users (id) on delete cascade,
  bank_name          text not null check (char_length(bank_name) between 1 and 60 and bank_name !~ '[0-9]{6,}'),
  nickname           text not null check (char_length(nickname) between 1 and 40 and nickname !~ '[0-9]{6,}'),
  last4              text not null check (last4 ~ '^[0-9]{4}$'),
  statement_day      smallint not null check (statement_day between 1 and 31),
  due_day            smallint not null check (due_day between 1 and 31),
  credit_limit_kurus bigint check (credit_limit_kurus >= 0),
  color              text check (color ~ '^#[0-9a-fA-F]{6}$'),
  archived_at        timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (id, user_id)
);
create index cards_user_idx on public.cards (user_id);
create trigger cards_updated_at before update on public.cards
  for each row execute function public.set_updated_at();

---------------------------------------------------------------------------
-- statement_imports: one uploaded PDF, from upload to confirmed review
---------------------------------------------------------------------------
create table public.statement_imports (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  storage_path text,                       -- cleared as soon as the file is deleted
  status       text not null default 'uploaded'
                 check (status in ('uploaded', 'parsing', 'review', 'confirmed', 'failed')),
  bank         text,
  parsed       jsonb,                      -- cleared on confirm or after 24 hours
  error        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (id, user_id)
);
create index statement_imports_user_idx on public.statement_imports (user_id, created_at desc);
create trigger statement_imports_updated_at before update on public.statement_imports
  for each row execute function public.set_updated_at();

---------------------------------------------------------------------------
-- purchases and their generated installments
---------------------------------------------------------------------------
create table public.purchases (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  card_id           uuid not null,
  merchant          text not null check (char_length(merchant) between 1 and 120 and merchant !~ '[0-9]{12,}'),
  purchase_date     date not null,
  total_kurus       bigint not null check (total_kurus > 0),
  installment_count smallint not null check (installment_count between 1 and 36),
  first_due_month   date check (first_due_month = date_trunc('month', first_due_month)::date),
  source            text not null default 'manual' check (source in ('manual', 'pdf')),
  import_id         uuid,
  fingerprint       text,
  note              text check (char_length(note) <= 500),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (id, user_id),
  foreign key (card_id, user_id) references public.cards (id, user_id) on delete cascade,
  foreign key (import_id, user_id) references public.statement_imports (id, user_id) on delete set null (import_id)
);
create index purchases_user_card_idx on public.purchases (user_id, card_id, purchase_date desc);
create index purchases_fingerprint_idx on public.purchases (user_id, fingerprint);
create trigger purchases_updated_at before update on public.purchases
  for each row execute function public.set_updated_at();

create table public.installments (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  purchase_id    uuid not null,
  card_id        uuid not null,
  installment_no smallint not null check (installment_no between 1 and 36),
  amount_kurus   bigint not null check (amount_kurus > 0),
  statement_date date not null,
  due_date       date not null check (due_date >= statement_date),
  paid_at        timestamptz,
  created_at     timestamptz not null default now(),
  unique (purchase_id, installment_no),
  foreign key (purchase_id, user_id) references public.purchases (id, user_id) on delete cascade,
  foreign key (card_id, user_id) references public.cards (id, user_id) on delete cascade
);
create index installments_user_due_idx on public.installments (user_id, due_date);
create index installments_card_due_idx on public.installments (card_id, due_date);

---------------------------------------------------------------------------
-- savings_assets
---------------------------------------------------------------------------
create table public.savings_assets (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users (id) on delete cascade,
  type               text not null check (type in ('gold_gram', 'usd', 'eur', 'try_deposit', 'other')),
  label              text check (char_length(label) <= 60),
  quantity           numeric(20, 6) not null check (quantity >= 0),
  gold_unit          text,
  cost_basis_kurus   bigint not null check (cost_basis_kurus >= 0),
  acquired_at        date not null,
  deposit_rate_bp    integer check (deposit_rate_bp between 0 and 100000),   -- gross annual, 4500 = %45.00
  stopaj_bp          integer check (stopaj_bp between 0 and 10000),
  manual_value_kurus bigint check (manual_value_kurus >= 0),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  check ((type = 'gold_gram') = (gold_unit is not null)),
  check (type <> 'try_deposit' or deposit_rate_bp is not null)
);
create index savings_assets_user_idx on public.savings_assets (user_id);
create trigger savings_assets_updated_at before update on public.savings_assets
  for each row execute function public.set_updated_at();

---------------------------------------------------------------------------
-- notifications, push devices, referrals
---------------------------------------------------------------------------
create table public.notifications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  kind          text not null check (kind in ('due_reminder', 'monthly_summary')),
  channel       text not null check (channel in ('push', 'email')),
  scheduled_for timestamptz not null,
  sent_at       timestamptz,
  status        text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'cancelled')),
  dedupe_key    text not null unique,
  payload       jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);
create index notifications_due_idx on public.notifications (status, scheduled_for);
create index notifications_user_idx on public.notifications (user_id);

create table public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  user_agent text check (char_length(user_agent) <= 300),
  created_at timestamptz not null default now()
);
create index push_subscriptions_user_idx on public.push_subscriptions (user_id);

create table public.referrals (
  id          uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references auth.users (id) on delete cascade,
  referee_id  uuid not null unique references auth.users (id) on delete cascade,
  granted_at  timestamptz,
  created_at  timestamptz not null default now(),
  check (referrer_id <> referee_id)
);
create index referrals_referrer_idx on public.referrals (referrer_id);

---------------------------------------------------------------------------
-- Reference data (shared, read-only for users)
---------------------------------------------------------------------------
create table public.fx_gold_daily (
  date          date primary key,
  usd_try       numeric(18, 6),   -- TCMB forex buying rate
  eur_try       numeric(18, 6),   -- TCMB forex buying rate
  gold_gram_try numeric(18, 6),   -- gold exchange price, TL per gram of 24k
  source        text not null default 'evds',
  fetched_at    timestamptz not null default now()
);

create table public.cpi_monthly (
  month      date primary key check (month = date_trunc('month', month)::date),
  tufe_index numeric(12, 2) not null check (tufe_index > 0),   -- TÜİK TÜFE, 2003=100
  source     text not null default 'evds',
  fetched_at timestamptz not null default now()
);

create table public.gold_units (
  code       text primary key,
  name_tr    text not null,
  name_en    text not null,
  fine_grams numeric(10, 4) not null check (fine_grams > 0),   -- grams of 24k gold in one unit
  sort       smallint not null
);

create table public.holidays (
  date    date primary key,
  name_tr text not null,
  name_en text not null
);

alter table public.savings_assets
  add constraint savings_assets_gold_unit_fk foreign key (gold_unit) references public.gold_units (code);

---------------------------------------------------------------------------
-- Row Level Security
---------------------------------------------------------------------------
alter table public.profiles           enable row level security;
alter table public.consent_events     enable row level security;
alter table public.cards              enable row level security;
alter table public.statement_imports  enable row level security;
alter table public.purchases          enable row level security;
alter table public.installments       enable row level security;
alter table public.savings_assets     enable row level security;
alter table public.notifications      enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.referrals          enable row level security;
alter table public.fx_gold_daily      enable row level security;
alter table public.cpi_monthly        enable row level security;
alter table public.gold_units         enable row level security;
alter table public.holidays           enable row level security;

-- Nothing is visible to signed-out visitors.
revoke all on all tables in schema public from anon;

-- profiles: read and update your own row; only harmless columns are writable.
create policy profiles_select on public.profiles for select to authenticated
  using (id = (select auth.uid()));
create policy profiles_update on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
revoke insert, update, delete on public.profiles from authenticated;
grant update (display_name, locale, heavy_month_threshold_kurus, onboarded_at) on public.profiles to authenticated;

-- consent_events: read and append your own; never edit history.
create policy consent_events_select on public.consent_events for select to authenticated
  using (user_id = (select auth.uid()));
create policy consent_events_insert on public.consent_events for insert to authenticated
  with check (user_id = (select auth.uid()));
revoke update, delete on public.consent_events from authenticated;

-- Plain owner-only tables.
do $$
declare t text;
begin
  foreach t in array array['cards', 'statement_imports', 'purchases', 'installments', 'savings_assets']
  loop
    execute format('create policy %1$s_select on public.%1$s for select to authenticated using (user_id = (select auth.uid()))', t);
    execute format('create policy %1$s_insert on public.%1$s for insert to authenticated with check (user_id = (select auth.uid()))', t);
    execute format('create policy %1$s_update on public.%1$s for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);
    execute format('create policy %1$s_delete on public.%1$s for delete to authenticated using (user_id = (select auth.uid()))', t);
  end loop;
end $$;

-- notifications: users see and can cancel (delete) their own; the scheduler writes them.
create policy notifications_select on public.notifications for select to authenticated
  using (user_id = (select auth.uid()));
create policy notifications_delete on public.notifications for delete to authenticated
  using (user_id = (select auth.uid()));
revoke insert, update on public.notifications from authenticated;

-- push_subscriptions: register and remove your own devices.
create policy push_subscriptions_select on public.push_subscriptions for select to authenticated
  using (user_id = (select auth.uid()));
create policy push_subscriptions_insert on public.push_subscriptions for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy push_subscriptions_delete on public.push_subscriptions for delete to authenticated
  using (user_id = (select auth.uid()));
revoke update on public.push_subscriptions from authenticated;

-- referrals: both sides can see the row; only the server creates or grants them.
create policy referrals_select on public.referrals for select to authenticated
  using (referrer_id = (select auth.uid()) or referee_id = (select auth.uid()));
revoke insert, update, delete on public.referrals from authenticated;

-- Reference tables: read-only for signed-in users.
do $$
declare t text;
begin
  foreach t in array array['fx_gold_daily', 'cpi_monthly', 'gold_units', 'holidays']
  loop
    execute format('create policy %1$s_read on public.%1$s for select to authenticated using (true)', t);
    execute format('revoke insert, update, delete, truncate on public.%1$s from authenticated', t);
  end loop;
end $$;

-- No user may truncate anything.
revoke truncate on all tables in schema public from authenticated;
