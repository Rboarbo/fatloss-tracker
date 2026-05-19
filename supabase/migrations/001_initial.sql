-- Fatloss Tracker v2.0 — initial schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── settings ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  user_id        uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  unit           text    NOT NULL DEFAULT 'kg',
  start_weight   numeric,
  goal_weight    numeric,
  height_cm      numeric DEFAULT 168,
  start_date     date,
  kcal_target    int     DEFAULT 1800,
  protein_target int     DEFAULT 140,
  hae_api_token  text
);
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own settings" ON settings
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─── daily_metrics ───────────────────────────────────────────────────────────
-- Auto-imported via Health Auto Export; one row per user per day
CREATE TABLE IF NOT EXISTS daily_metrics (
  date                  date    NOT NULL,
  user_id               uuid    REFERENCES auth.users ON DELETE CASCADE,
  weight_kg             numeric,
  body_fat_pct          numeric,
  lean_mass_kg          numeric,
  bmi                   numeric,
  resting_hr            int,
  walking_hr_avg        int,
  hrv_ms                numeric,
  vo2_max               numeric,
  step_count            int,
  walking_distance_km   numeric,
  flights_climbed       int,
  active_energy_kcal    numeric,
  exercise_minutes      int,
  time_in_daylight_min  int,
  blood_oxygen_pct      numeric,
  PRIMARY KEY (user_id, date)
);
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own daily_metrics" ON daily_metrics
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─── workouts ─────────────────────────────────────────────────────────────────
-- Auto-imported from Apple Health; sport is detected + stored per workout
CREATE TABLE IF NOT EXISTS workouts (
  id               uuid         PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          uuid         REFERENCES auth.users ON DELETE CASCADE,
  start            timestamptz  NOT NULL,
  "end"            timestamptz  NOT NULL,
  duration_sec     int          NOT NULL,
  apple_type       text         NOT NULL DEFAULT 'manual',
  sport            text         NOT NULL,
  sport_confidence text         NOT NULL DEFAULT 'high',
  kcal             numeric,
  avg_hr           numeric,
  max_hr           numeric,
  min_hr           numeric,
  distance_km      numeric,
  step_count       numeric,
  step_cadence     numeric,
  intensity_met    numeric,
  temperature_c    numeric,
  humidity_pct     numeric,
  raw_data         jsonb        NOT NULL DEFAULT '{}',
  imported_at      timestamptz  DEFAULT now()
);
CREATE INDEX ON workouts (user_id, start DESC);
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own workouts" ON workouts
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─── milon_details ────────────────────────────────────────────────────────────
-- Manually added after each Milon ME session; linked to a workout row
CREATE TABLE IF NOT EXISTS milon_details (
  workout_id   uuid    PRIMARY KEY REFERENCES workouts (id) ON DELETE CASCADE,
  user_id      uuid    REFERENCES auth.users ON DELETE CASCADE,
  kcal_kracht  numeric,
  kcal_cardio  numeric,
  kracht_score int,
  cardio_score int,
  top_pct      text,
  ton          numeric,
  reps         int,
  created_at   timestamptz DEFAULT now()
);
ALTER TABLE milon_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own milon_details" ON milon_details
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─── manual_entries ───────────────────────────────────────────────────────────
-- Manual measurements not available from Apple Health
CREATE TABLE IF NOT EXISTS manual_entries (
  date        date    NOT NULL,
  user_id     uuid    REFERENCES auth.users ON DELETE CASCADE,
  weight_kg   numeric,   -- fallback when scale not synced to HealthKit
  waist_cm    numeric,
  hips_cm     numeric,
  food_kcal   int,
  protein_g   int,
  notes       text,
  PRIMARY KEY (user_id, date)
);
ALTER TABLE manual_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own manual_entries" ON manual_entries
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
