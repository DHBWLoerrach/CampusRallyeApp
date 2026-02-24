-- ============================================================================
-- Downgrade: v4 → v3
-- ============================================================================
-- Voraussetzung: Es dürfen KEINE Fragen mit type = 'geocaching' mehr
-- existieren. Das Skript prüft dies und bricht bei Verstoß ab.
-- ============================================================================

BEGIN;

-- 1. Sicherstellen, dass keine Geocaching-Fragen mehr existieren
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "public"."questions" WHERE "type" = 'geocaching'
  ) THEN
    RAISE EXCEPTION
      'Downgrade abgebrochen: Es existieren noch Fragen mit type = ''geocaching''. '
      'Bitte lösche oder ändere diese Fragen zuerst.';
  END IF;
END
$$;

-- 2. Constraints entfernen
ALTER TABLE "public"."questions"
    DROP CONSTRAINT IF EXISTS "questions_geocaching_columns_only_check";

ALTER TABLE "public"."questions"
    DROP CONSTRAINT IF EXISTS "questions_geocaching_input_type_check";

-- 3. Geocaching-Spalten entfernen
ALTER TABLE "public"."questions"
    DROP COLUMN IF EXISTS "geocaching_input_type";

ALTER TABLE "public"."questions"
    DROP COLUMN IF EXISTS "proximity_radius";

ALTER TABLE "public"."questions"
    DROP COLUMN IF EXISTS "target_longitude";

ALTER TABLE "public"."questions"
    DROP COLUMN IF EXISTS "target_latitude";

COMMIT;

-- ============================================================================
-- 4. ENUM-Wert 'geocaching' entfernen
-- ============================================================================
-- HINWEIS: PostgreSQL unterstützt kein ALTER TYPE ... REMOVE VALUE.
-- Stattdessen wird der Typ neu erstellt und die Spalte umgestellt.
-- Dies muss AUSSERHALB einer Transaktion laufen.
-- ============================================================================

-- Neuen Typ ohne 'geocaching' anlegen
CREATE TYPE "public"."question_type_v3" AS ENUM (
    'multiple_choice',
    'knowledge',
    'picture',
    'qr_code',
    'upload'
);

-- Spalte auf neuen Typ umstellen
ALTER TABLE "public"."questions"
    ALTER COLUMN "type" TYPE "public"."question_type_v3"
    USING "type"::text::"public"."question_type_v3";

-- Alten Typ löschen und neuen umbenennen
DROP TYPE "public"."question_type";
ALTER TYPE "public"."question_type_v3" RENAME TO "question_type";

-- ============================================================================
-- Downgrade v4 → v3 abgeschlossen
-- ============================================================================
