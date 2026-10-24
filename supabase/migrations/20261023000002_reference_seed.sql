-- Reference data so the app and tests have real history from day one.
-- Copied from the birikim build (sources checked 2026-10-22):
--   USD/TRY: TCMB monthly average forex buying rate, stored on the month's last day
--            (the rates-daily function backfills true daily values over these).
--   Gram gold: last trading day of each month. 2026-10-21: TCMB forex buying + gram gold close.
--   TÜFE (2003=100): TÜİK indices.
-- Gold pieces: grams of 24k gold per piece (gross weight x 0.916 for 22 ayar).

insert into public.gold_units (code, name_tr, name_en, fine_grams, sort) values
  ('gram_has', 'Gram altın (24 ayar)', 'Gram gold (24k)', 1.0000, 1),
  ('ceyrek',   'Çeyrek altın',         'Quarter coin',    1.6067, 2),
  ('yarim',    'Yarım altın',          'Half coin',       3.2133, 3),
  ('tam',      'Tam altın',            'Full coin',       6.4267, 4),
  ('ata',      'Cumhuriyet (Ata) altını', 'Republic coin', 6.6099, 5),
  ('gram_22',  '22 ayar bilezik (gram)', '22k bangle (gram)', 0.9160, 6),
  ('gram_18',  '18 ayar (gram)',       '18k (gram)',      0.7500, 7),
  ('gram_14',  '14 ayar (gram)',       '14k (gram)',      0.5850, 8)
on conflict (code) do update set name_tr = excluded.name_tr, name_en = excluded.name_en,
  fine_grams = excluded.fine_grams, sort = excluded.sort;

insert into public.fx_gold_daily (date, usd_try, eur_try, gold_gram_try, source) values
  ('2025-01-31', 35.4779, null, 3219.08, 'seed'),
  ('2025-02-28', 36.1249, null, 3357.66, 'seed'),
  ('2025-03-31', 37.0399, null, 3812.33, 'seed'),
  ('2025-04-30', 38.0519, null, 4055.51, 'seed'),
  ('2025-05-31', 38.7201, null, 4146.06, 'seed'),
  ('2025-06-30', 39.3926, null, 4241.12, 'seed'),
  ('2025-07-31', 40.1412, null, 4299.85, 'seed'),
  ('2025-08-31', 40.7488, null, 4560.78, 'seed'),
  ('2025-09-30', 41.2448, null, 5165.53, 'seed'),
  ('2025-10-31', 41.742, null, 5413.25, 'seed'),
  ('2025-11-30', 42.2023, null, 5771.28, 'seed'),
  ('2025-12-31', 42.6074, null, 5951.52, 'seed'),
  ('2026-01-31', 43.1361, null, 6804.38, 'seed'),
  ('2026-02-28', 43.6086, null, 7449.23, 'seed'),
  ('2026-03-31', 44.1006, null, 6711.61, 'seed'),
  ('2026-04-30', 44.677, null, 6716.29, 'seed'),
  ('2026-05-31', 45.3381, null, 6689.62, 'seed'),
  ('2026-06-30', 46.1782, null, 6009.48, 'seed'),
  ('2026-07-31', 46.9845, null, 6183.56, 'seed'),
  ('2026-08-31', 47.7783, null, 6891.06, 'seed'),
  ('2026-09-30', 48.553, null, 6540.09, 'seed'),
  ('2026-10-21', 49.5123, 55.5780, 6590.17, 'seed')
on conflict (date) do nothing;

insert into public.cpi_monthly (month, tufe_index, source) values
  ('2024-12-01', 2684.55, 'seed'),
  ('2025-01-01', 2819.65, 'seed'),
  ('2025-02-01', 2883.75, 'seed'),
  ('2025-03-01', 2954.69, 'seed'),
  ('2025-04-01', 3043.23, 'seed'),
  ('2025-05-01', 3089.74, 'seed'),
  ('2025-06-01', 3132.17, 'seed'),
  ('2025-07-01', 3196.66, 'seed'),
  ('2025-08-01', 3261.72, 'seed'),
  ('2025-09-01', 3367.22, 'seed'),
  ('2025-10-01', 3453.09, 'seed'),
  ('2025-11-01', 3482.96, 'seed'),
  ('2025-12-01', 3513.87, 'seed'),
  ('2026-01-01', 3683.83, 'seed'),
  ('2026-02-01', 3793.05, 'seed'),
  ('2026-03-01', 3866.74, 'seed'),
  ('2026-04-01', 4028.47, 'seed'),
  ('2026-05-01', 4097.55, 'seed'),
  ('2026-06-01', 4137.93, 'seed'),
  ('2026-07-01', 4211.58, 'seed'),
  ('2026-08-01', 4289.23, 'seed'),
  ('2026-09-01', 4368.35, 'seed')
on conflict (month) do nothing;
