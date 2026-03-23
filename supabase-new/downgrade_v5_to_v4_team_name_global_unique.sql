-- ============================================================================
-- Downgrade: v5 -> v4
-- ============================================================================
-- Reverts:
--   1. Global normalized unique index on rallye_team.name
--   2. Name format check constraint (ASCII, 5..20)
--   3. NOT NULL on rallye_team.rallye_id
-- ============================================================================

BEGIN;

DROP INDEX IF EXISTS public.rallye_team_name_global_norm_uniq;

ALTER TABLE public.rallye_team
  DROP CONSTRAINT IF EXISTS rallye_team_name_ascii_len_check;

ALTER TABLE public.rallye_team
  ALTER COLUMN rallye_id DROP NOT NULL;

COMMIT;

-- ============================================================================
-- Downgrade v5 -> v4 completed
-- ============================================================================
