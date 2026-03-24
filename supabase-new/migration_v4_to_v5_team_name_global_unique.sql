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
WITH sanitized AS (
  SELECT
    id,
    regexp_replace(
      regexp_replace(btrim(name), E'\\s+', ' ', 'g'),
      '[^A-Za-z0-9 _-]',
      '',
      'g'
    ) AS cleaned_name
  FROM public.rallye_team
),
prepared AS (
  SELECT
    id,
    CASE
      WHEN cleaned_name = '' THEN 'TeamX'
      WHEN length(cleaned_name) < 5 THEN rpad(cleaned_name, 5, 'X')
      ELSE cleaned_name
    END AS valid_name
  FROM sanitized
)
UPDATE public.rallye_team t
SET name = left(p.valid_name, 20)
FROM prepared p
WHERE t.id = p.id
  AND t.name IS DISTINCT FROM left(p.valid_name, 20);

-- Step 2: Resolve global duplicates deterministically.
DO $$
DECLARE
  rec RECORD;
  base_name text;
  candidate text;
  attempt integer;
  suffix text;
  max_base_len integer;
BEGIN
  FOR rec IN
    SELECT id, name
    FROM public.rallye_team
    ORDER BY id
  LOOP
    base_name := left(rec.name, 20);

    -- Keep the first team for each normalized name; rename later duplicates.
    IF EXISTS (
      SELECT 1
      FROM public.rallye_team t2
      WHERE t2.id < rec.id
        AND lower(regexp_replace(btrim(t2.name), E'\\s+', ' ', 'g')) =
          lower(regexp_replace(btrim(base_name), E'\\s+', ' ', 'g'))
    ) THEN
      attempt := 0;

      LOOP
        attempt := attempt + 1;

        IF attempt = 1 THEN
          suffix := '_' || rec.id::text;
        ELSE
          suffix := '_' || rec.id::text || '_' || attempt::text;
        END IF;

        max_base_len := 20 - length(suffix);
        IF max_base_len < 1 THEN
          candidate := 'T' || right(lpad(rec.id::text, 19, '0'), 19);
        ELSE
          candidate := left(base_name, max_base_len) || suffix;
        END IF;

        EXIT WHEN NOT EXISTS (
          SELECT 1
          FROM public.rallye_team t3
          WHERE t3.id <> rec.id
            AND lower(regexp_replace(btrim(t3.name), E'\\s+', ' ', 'g')) =
              lower(regexp_replace(btrim(candidate), E'\\s+', ' ', 'g'))
        );
      END LOOP;

      UPDATE public.rallye_team
      SET name = candidate
      WHERE id = rec.id;
    END IF;
  END LOOP;
END
$$;

-- Enforce global uniqueness for normalized team names.
CREATE UNIQUE INDEX IF NOT EXISTS rallye_team_name_global_norm_uniq
ON public.rallye_team (
  lower(regexp_replace(btrim(name), E'\\s+', ' ', 'g'))
);

-- Enforce ASCII-only names with 5..20 chars for new/updated rows.
ALTER TABLE public.rallye_team
  ADD CONSTRAINT rallye_team_name_ascii_len_check
  CHECK (name ~ '^[A-Za-z0-9 _-]{5,20}$');

COMMIT;

-- ============================================================================
-- Migration v4 -> v5 completed
-- ============================================================================
