-- Explicit GRANTs required from May 30 2026 (new projects) / October 30 2026 (existing projects).
-- Without these, new tables in public schema are no longer auto-exposed to the Data API.

-- Alle tabellen zijn privé (RLS: auth.uid() = user_id) — alleen authenticated nodig
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.settings       TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.daily_metrics  TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.workouts       TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.milon_details  TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.manual_entries TO authenticated;
-- anon: geen toegang
