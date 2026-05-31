-- v2.4.1: geslacht voor geslachtsspecifieke VO2 max normen
ALTER TABLE settings ADD COLUMN IF NOT EXISTS gender text DEFAULT 'male';
