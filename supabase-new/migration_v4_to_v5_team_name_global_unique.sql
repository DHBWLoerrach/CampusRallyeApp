-- ============================================================================
-- Migration: v4 -> v5
-- ============================================================================
-- Changes:
--   1. Enforce rallye_team.rallye_id as NOT NULL
--   2. Normalize existing names (trim + collapse internal whitespace)
--   3. Auto-rename normalized duplicates globally
--   4. Add global unique index on normalized team name
--   5. Add name format check for future writes (ASCII, 5..20)
-- ============================================================================

BEGIN;

-- Abort if legacy rows still have no rallye_id. We cannot infer the correct rallye.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.rallye_team
    WHERE rallye_id IS NULL
  ) THEN
    RAISE EXCEPTION
      'Migration aborted: public.rallye_team contains rows with rallye_id IS NULL. '
      'Please assign a rallye_id before applying v5.';
  END IF;
END
$$;

-- Enforce non-null rallye linkage going forward.
ALTER TABLE public.rallye_team
  ALTER COLUMN rallye_id SET NOT NULL;

-- Step 1: Normalize whitespace for all existing rows.
UPDATE public.rallye_team
SET name = regexp_replace(btrim(name), '\\s+', ' ', 'g')
WHERE name IS DISTINCT FROM regexp_replace(btrim(name), '\\s+', ' ', 'g');

-- Step 2: Resolve global duplicates based on normalized name.
WITH ranked AS (
  SELECT
    id,
    regexp_replace(btrim(name), '\\s+', ' ', 'g') AS cleaned_name,
    row_number() OVER (
      PARTITION BY lower(regexp_replace(btrim(name), '\\s+', ' ', 'g'))
      ORDER BY id
    ) AS rn
  FROM public.rallye_team
),
renamed AS (
  SELECT
    id,
    CASE
      WHEN rn = 1 THEN cleaned_name
      ELSE left(cleaned_name, 20 - length('_' || rn::text)) || '_' || rn::text
    END AS new_name
  FROM ranked
)
UPDATE public.rallye_team t
SET name = r.new_name
FROM renamed r
WHERE t.id = r.id
  AND t.name IS DISTINCT FROM r.new_name;

-- Enforce global uniqueness for normalized team names.
CREATE UNIQUE INDEX IF NOT EXISTS rallye_team_name_global_norm_uniq
ON public.rallye_team (
  lower(regexp_replace(btrim(name), '\\s+', ' ', 'g'))
);

-- Enforce ASCII-only names with 5..20 chars for new/updated rows.
ALTER TABLE public.rallye_team
  ADD CONSTRAINT rallye_team_name_ascii_len_check
  CHECK (name ~ '^[A-Za-z0-9 _-]{5,20}$')
  NOT VALID;

COMMIT;

-- ============================================================================
-- Migration v4 -> v5 completed
-- ============================================================================
