-- v2.4: geboortedatum voor leeftijdsspecifieke normen
ALTER TABLE settings ADD COLUMN IF NOT EXISTS birth_date date;

-- Expliciete UPDATE policy (extra zekerheid naast de FOR ALL policy)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'workouts' AND policyname = 'workouts_update_own'
  ) THEN
    EXECUTE 'CREATE POLICY workouts_update_own ON workouts FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id)';
  END IF;
END $$;
